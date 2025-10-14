import { PLANNING_SYSTEM_PROMPT } from '../shared/prompts'
import { type Task, type TemplateId } from '../shared'

const DEFAULTS = {
  entryPoints: {
    'vite-react-canvas': ['src/game/engine.ts', 'src/App.tsx'],
    'vanilla-ts-canvas': ['src/engine.ts', 'src/styles.css'],
    'nextjs-basic-ui':   ['app/page.tsx', 'app/api/*'],
    'none': [] as string[],
  },
  health: '/healthz'
};

// New API: return a Task directly based on the new Task type
export async function planTask(
  text: string,
  jobId: string,
  chatId?: number,
  messageId?: number
): Promise<Task> {
  // Heuristic planner (no external LLM dependency to avoid runtime failures)
  const isGame = /game|mario|scroll|jump|sprite|robot|birds|canvas/i.test(text)
  const templateId: TemplateId = isGame ? 'vite-react-canvas' : 'nextjs-basic-ui'
  const checks: string[] = []
  if (isGame) {
    // infer common checks for side-scrolling game
    checks.push('side-scrolling','pixel art robot','jump controls','ground obstacles','flying birds','increasing difficulty')
  }

  const task: Task = {
    jobId,
    intent: 'create',
    project: isGame ? 'canvas' : 'ui',
    context: text,
    checks,
    template: {
      id: templateId,
      confidence: 0.6,
      rationale: 'keyword heuristic',
      entryPoints: DEFAULTS.entryPoints[templateId],
      healthcheckPath: DEFAULTS.health,
    },
    runtime: {
      port: 5173,
      mustKeepPort: true,
      mustKeepScripts: true,
      deterministic: true,
    },
    artifact: { screenshot: true, logs: true },
    chatId,
    messageId,
  }

  return task
}