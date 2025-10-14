
# 🧩 Application Templates — Voice-to-App / WalkCoder

This folder contains **3 ready-to-run app templates** optimized for AI-generated or voice-controlled development pipelines.  
Each template includes fixed ports, healthchecks, deterministic builds, and minimal dependencies.

---

## 📦 Templates Overview

| Template | Stack | Purpose | Port | Healthcheck |
|-----------|--------|----------|-------|--------------|
| **vite-react-canvas** | React + TypeScript + Vite | Visual & interactive prototypes (canvas-based games or UIs) | 5173 | `/healthz` |
| **nextjs-basic-ui** | Next.js (App Router + TS) | Full UI apps, APIs, dashboards, web pages | 5173 | `/healthz` route |
| **vanilla-ts-canvas** | TypeScript + Vite (no framework) | Fastest minimal template for 2D visual tasks | 5173 | `/healthz` |

---

## 🧠 When to Use Each Template

| Use Case | Recommended Template |
|-----------|----------------------|
| Need a **game or animation** | `vite-react-canvas` |
| Need a **web app with routing, API routes, or UI** | `nextjs-basic-ui` |
| Need a **lightweight canvas or visual-only** demo | `vanilla-ts-canvas` |

---

## ⚙️ Common Features

✅ Fixed port **5173** for predictable automation  
✅ `/healthz` endpoint or file for readiness checks  
✅ Works with `npm run dev` and `npm start`  
✅ No missing assets — self-contained builds  
✅ Supports screenshots, Playwright tests, or AI runner analysis  
✅ Lightweight and easy to extend

---

## 📂 Folder Structure Example

```
templates/
├── vite-react-canvas/
│   ├── package.json
│   ├── vite.config.ts
│   ├── src/
│   └── public/
├── nextjs-basic-ui/
│   ├── package.json
│   ├── next.config.mjs
│   ├── app/
│   └── public/
└── vanilla-ts-canvas/
    ├── package.json
    ├── vite.config.ts
    ├── src/
    └── public/
```

---

## 🏃 Run Any Template

```bash
cd templates/vite-react-canvas   # or nextjs-basic-ui, vanilla-ts-canvas
npm install
npm run dev          # http://localhost:5173
# or build + start
npm run build
npm start
```

---

## 🧩 Integration in App Generation Pipelines

In your code-generation system (e.g., WalkCoder, Voice-to-App, Alodai):

1. Detect intent & project type (UI, Game, Visual, API).  
2. Copy or unzip the corresponding template folder.  
3. Inject LLM-generated code into `/src/` or `/app/`.  
4. Run `npm run dev` and poll `/healthz` until ready.  
5. Capture screenshot, logs, or response.  

This ensures **reproducible, instant-running builds**.

---

## 🧱 Template Versions

| Template | Version | Node Target | Size |
|-----------|----------|-------------|------|
| vite-react-canvas | 1.0.0 | 18+ | ~160 KB |
| nextjs-basic-ui | 1.0.0 | 18+ | ~210 KB |
| vanilla-ts-canvas | 1.0.0 | 18+ | ~150 KB |

---

## 📄 License

MIT — Free to use, modify, and integrate.
