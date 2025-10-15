// ai/router/template-selector.ts
import { config } from '../shared'
// Use the model that supports JSON responses reliably in your stack.

export type TemplateId = 'vite-react-canvas' | 'vite-react-canvas-app' | 'nextjs-basic-ui' | 'vanilla-ts-canvas' | 'none';

export type TemplateSelection = {
  templateId: TemplateId;
  confidence: number;            // 0..1
  rationale: string;             // brief
  // Optional hints for codegen to integrate
  entryPoints?: string[];        // files the generator should modify
  healthcheckPath?: string;      // e.g. "/healthz"
};

const SYSTEM_PROMPT = `
You are a strict template selector. You MUST choose the best fit among the ALLOWED_TEMPLATES
for building a runnable app from the user's request. If none fits, return "none".

ALLOWED_TEMPLATES:
1) "vite-react-canvas" — React + TS + Vite. For games or interactive visuals using a Canvas, with UI HUD.
2) "vite-react-canvas-app" — React + TS + Vite. For productivity apps, tools, or interactive interfaces using Canvas.
3) "nextjs-basic-ui" — Next.js App Router + TS. For multipage apps, dashboards, simple APIs.
4) "vanilla-ts-canvas" — TS + Vite (no framework). For the lightest canvas visuals/games.

Rules:
- If the user mentions a game, side-scroller, canvas, animation, or real-time drawing → prefer a canvas template.
  - If some UI is helpful (HUD, overlays) → "vite-react-canvas".
  - If minimal footprint/no React desired → "vanilla-ts-canvas".
- If the user mentions productivity apps, tools, interactive interfaces, or canvas-based UI → "vite-react-canvas-app".
- If the user needs routes/pages/APIs/dashboard → "nextjs-basic-ui".
- If unclear or unsupported → "none".

Output STRICT JSON with keys: templateId, confidence (0..1), rationale, entryPoints, healthcheckPath.
`;

export async function selectTemplate(naturalRequest: string): Promise<TemplateSelection> {
  const user = `
USER_REQUEST:
${naturalRequest}

Return JSON only.
`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.groqApiKey}`,
    },
    body: JSON.stringify({
      model: config.llmModel || 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: user }
      ],
      temperature: 0.0,
    }),
  });

  if (!res.ok) {
    throw new Error(`Groq API error: ${res.status} - ${await res.text()}`)
  }

  const data = await res.json()

  const json = JSON.parse(data.choices[0].message.content ?? '{}');
  return {
    templateId: json.templateId ?? 'none',
    confidence: Math.max(0, Math.min(1, Number(json.confidence ?? 0))),
    rationale: String(json.rationale ?? ''),
    entryPoints: json.entryPoints ?? [],
    healthcheckPath: json.healthcheckPath ?? '/healthz'
  };
}