# mcp-service (Bun + Hono) — Dynamic MCP Bridge

Convert your Voice‑to‑App **Marketplace** into a **Dynamic MCP Provider**. Every generated app is exposed as an MCP-compatible tool with a manifest and a `/run` endpoint.

---

## ✨ Objectives

- **Auto‑publish** each generated app as an MCP tool.
- **Discoverability** via per‑app **MCP manifest** (`/.well-known/mcp.json` or `/mcp/:appId/manifest.json`).
- **Invocation** via `/mcp/:appId/run` with typed inputs/outputs.
- **Versioning** (`appId@semver`) and **visibility** (public/private).
- **Security** with HMAC or API keys + per‑app scopes.

---

## 🗂 Folder Structure

```
services/mcp-service/
├─ package.json
├─ tsconfig.json
├─ .env
├─ src/
│  ├─ index.ts                # Hono app bootstrap
│  ├─ routes/
│  │   ├─ health.ts
│  │   ├─ manifest.ts         # GET /mcp/:appId/manifest.json
│  │   ├─ discovery.ts        # GET /.well-known/mcp.json
│  │   ├─ run.ts              # POST /mcp/:appId/run
│  │   └─ apps.ts             # GET /apps/:appId, list, etc. (optional)
│  ├─ services/
│  │   ├─ registry.ts         # read/write app metadata from Marketplace DB
│  │   ├─ runner.ts           # invoke sandbox/runner and map IO
│  │   └─ auth.ts             # API key/HMAC verification
│  ├─ db/
│  │   ├─ drizzle.ts          # Drizzle init (PostgreSQL)
│  │   └─ schema.ts           # apps, app_versions, app_api_keys
│  ├─ types.ts                # AppDefinition, McpManifest, McpRunRequest/Response
│  └─ utils/
│      ├─ env.ts
│      └─ logger.ts
└─ README.md
```

---

## 📦 package.json (Bun + Hono)

```json
{
  "name": "mcp-service",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "bun run src/index.ts",
    "build": "tsc -p .",
    "start": "NODE_ENV=production bun run dist/index.js"
  },
  "dependencies": {
    "hono": "^4.6.7",
    "drizzle-orm": "^0.33.0",
    "pg": "^8.11.5",
    "zod": "^3.23.8",
    "jose": "^5.2.4"
  },
  "devDependencies": {
    "typescript": "^5.4.5",
    "@types/node": "^20.11.30"
  }
}
```

---

## 🧱 Drizzle schema (db/schema.ts)

```ts
import { pgTable, text, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";

export const apps = pgTable("apps", {
  id: text("id").primaryKey(),            // "expense-tracker"
  name: text("name").notNull(),
  description: text("description"),
  visibility: text("visibility").notNull().default("private"), // "public" | "private"
  ownerId: text("owner_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const appVersions = pgTable("app_versions", {
  id: text("id").primaryKey(),            // `${appId}@${semver}`
  appId: text("app_id").notNull(),
  version: text("version").notNull(),     // semver
  inputs: jsonb("inputs").$type<any[]>(), // [{ name, type, required }]
  output: jsonb("output").$type<any>(),   // { type, schema }
  runnerSpec: jsonb("runner_spec").$type<any>(), // { type: "http"|"local", url, cmd,... }
  manifestExtras: jsonb("manifest_extras").$type<any>(),
  createdAt: timestamp("created_at").defaultNow(),
  isLatest: boolean("is_latest").default(true)
});

export const appApiKeys = pgTable("app_api_keys", {
  id: text("id").primaryKey(),
  appId: text("app_id").notNull(),
  keyHash: text("key_hash").notNull(),
  active: boolean("active").default(true)
});
```

---

## 🧩 Types (types.ts)

```ts
import { z } from "zod";

export const InputDef = z.object({
  name: z.string(),
  type: z.enum(["string","number","boolean","json","csv","image","file","url"]),
  required: z.boolean().default(true),
  description: z.string().optional()
});

export const OutputDef = z.object({
  type: z.enum(["text","json","image","audio","file","multi"]),
  schema: z.any().optional()
});

export const AppDefinition = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  version: z.string(),
  visibility: z.enum(["public","private"]).default("private"),
  inputs: z.array(InputDef),
  output: OutputDef,
  runnerSpec: z.object({
    type: z.enum(["http","local"]).default("http"),
    url: z.string().url().optional(),
    method: z.enum(["POST","GET"]).default("POST"),
    timeoutMs: z.number().default(60000)
  })
});

export type TAppDefinition = z.infer<typeof AppDefinition>;

export type McpManifest = {
  schema_version: string;                  // e.g. "1.0"
  name: string;                            // app name
  description?: string;
  version: string;                         // semver
  tools: Array<{
    name: string;                          // same as app id
    description?: string;
    input_schema: any;                     // JSON Schema for inputs
    output_schema?: any;                   // JSON Schema for outputs
    endpoint: string;                      // POST /mcp/:appId/run
    auth: "none" | "apikey" | "hmac";
  }>;
};

export type McpRunRequest = {
  inputs: Record<string, unknown>;
};

export type McpRunResponse = {
  ok: boolean;
  output: unknown;
  logs?: string[];
  artifacts?: Array<{ type: string; url?: string; dataUri?: string }>; // images, audio, files
};
```

---

## 🌐 Bootstrap (src/index.ts)

```ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { manifestRoute } from "./routes/manifest";
import { discoveryRoute } from "./routes/discovery";
import { runRoute } from "./routes/run";
import { healthRoute } from "./routes/health";

const app = new Hono();
app.use("*", cors());

app.route("/health", healthRoute());
app.route("/.well-known", discoveryRoute());
app.route("/mcp", manifestRoute());   // GET /mcp/:appId/manifest.json
app.route("/mcp", runRoute());        // POST /mcp/:appId/run

export default {
  port: Number(process.env.PORT || 4310),
  fetch: app.fetch
};
```

---

## 🔎 Discovery (src/routes/discovery.ts)

```ts
import { Hono } from "hono";

export const discoveryRoute = () => {
  const r = new Hono();
  r.get("/mcp.json", (c) => {
    // Optional global discovery (list or pointer)
    return c.json({
      provider: "walkcoder",
      registry: `${new URL(c.req.url).origin}/mcp` // base path for manifests
    });
  });
  return r;
};
```

---

## 📜 Manifest per App (src/routes/manifest.ts)

```ts
import { Hono } from "hono";
import { getAppDefinition } from "../services/registry";

export const manifestRoute = () => {
  const r = new Hono();

  r.get("/:appId/manifest.json", async (c) => {
    const appId = c.req.param("appId");
    const def = await getAppDefinition(appId); // latest version by default
    if (!def) return c.json({ error: "not_found" }, 404);

    const inputSchema = {
      type: "object",
      required: def.inputs.filter(i => i.required).map(i => i.name),
      properties: Object.fromEntries(
        def.inputs.map(i => [i.name, { type: i.type === "json" ? ["object","array","string"] : i.type }])
      )
    };

    const manifest = {
      schema_version: "1.0",
      name: def.name,
      description: def.description,
      version: def.version,
      tools: [{
        name: def.id,
        description: def.description,
        input_schema: inputSchema,
        output_schema: { type: "object" },
        endpoint: `${new URL(c.req.url).origin}/mcp/${def.id}/run`,
        auth: process.env.MCP_AUTH?.toLowerCase() === "none" ? "none" : "apikey"
      }]
    };

    return c.json(manifest);
  });

  return r;
};
```

---

## ▶️ Run (src/routes/run.ts)

```ts
import { Hono } from "hono";
import { getAppDefinition } from "../services/registry";
import { verifyRequest } from "../services/auth";
import { invokeRunner } from "../services/runner";

export const runRoute = () => {
  const r = new Hono();

  r.post("/:appId/run", async (c) => {
    const appId = c.req.param("appId");

    // Auth (optional for public apps)
    const ok = await verifyRequest(c, appId);
    if (!ok) return c.json({ error: "unauthorized" }, 401);

    const payload = await c.req.json().catch(() => ({}));
    const inputs = payload?.inputs ?? {};

    const def = await getAppDefinition(appId);
    if (!def) return c.json({ error: "not_found" }, 404);

    // Basic input validation (types omitted for brevity)
    for (const inp of def.inputs) {
      if (inp.required && !(inp.name in inputs)) {
        return c.json({ error: `missing_input:${inp.name}` }, 400);
      }
    }

    const res = await invokeRunner(def, inputs);
    return c.json(res);
  });

  return r;
};
```

---

## 🧰 Registry (src/services/registry.ts)

```ts
import { eq } from "drizzle-orm";
import { db } from "../db/drizzle";
import { apps, appVersions } from "../db/schema";

export async function getAppDefinition(appId: string) {
  const rows = await db.select().from(appVersions).where(eq(appVersions.appId, appId)).orderBy(appVersions.createdAt);
  const latest = rows.find(r => r.isLatest) ?? rows.at(-1);
  if (!latest) return null;
  return {
    id: appId,
    name: (await db.select().from(apps).where(eq(apps.id, appId))).at(0)?.name ?? appId,
    description: (await db.select().from(apps).where(eq(apps.id, appId))).at(0)?.description,
    version: latest.version,
    inputs: latest.inputs ?? [],
    output: latest.output ?? { type: "text" },
    runnerSpec: latest.runnerSpec ?? { type: "http" }
  };
}
```

---

## 🚚 Runner (src/services/runner.ts)

```ts
import type { TAppDefinition, McpRunResponse } from "../types";

export async function invokeRunner(def: TAppDefinition, inputs: Record<string, unknown>): Promise<McpRunResponse> {
  if (def.runnerSpec.type === "http" && def.runnerSpec.url) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), def.runnerSpec.timeoutMs ?? 60000);
    try {
      const resp = await fetch(def.runnerSpec.url, {
        method: def.runnerSpec.method ?? "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ inputs })
      });
      clearTimeout(timer);
      if (!resp.ok) return { ok: false, output: { error: `runner_http_${resp.status}` } };
      const data = await resp.json();
      return { ok: true, output: data.output ?? data, logs: data.logs, artifacts: data.artifacts };
    } catch (e) {
      return { ok: false, output: { error: "runner_timeout_or_network", detail: String(e) } };
    }
  }
  // Local runner type could spawn a process / call internal function
  return { ok: false, output: { error: "runner_type_not_supported" } };
}
```

---

## 🔐 Auth (src/services/auth.ts)

```ts
import { Context } from "hono";

export async function verifyRequest(c: Context, appId: string) {
  // Public apps: allow without key
  const isPublic = c.req.query("public") === "1" || process.env.DEFAULT_PUBLIC === "1";
  if (isPublic) return true;

  const key = c.re
```
