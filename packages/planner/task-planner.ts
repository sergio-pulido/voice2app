import { PLANNING_SYSTEM_PROMPT } from '../shared/prompts'
import { type Task, type TemplateId } from '../shared'
import { selectTemplate } from '../codegen/template-selector'

const DEFAULTS = {
  entryPoints: {
    'vite-react-canvas': ['src/game/engine.ts', 'src/App.tsx'],
    'vite-react-canvas-app': ['src/app/engine.ts', 'src/App.tsx'],
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
  // Use AI template selector for better template detection
  let templateSelection
  try {
    templateSelection = await selectTemplate(text)
  } catch (error) {
    // Fallback to heuristic if AI selector fails
    const isGame = /game|mario|scroll|jump|sprite|robot|birds|canvas/i.test(text)
    const isProductivity = /note|todo|task|productivity|tool|app|dashboard|canvas/i.test(text)
    
    let templateId: TemplateId = 'nextjs-basic-ui'
    if (isGame) {
      templateId = 'vite-react-canvas'
    } else if (isProductivity) {
      templateId = 'vite-react-canvas-app'
    }
    
    templateSelection = {
      templateId,
      confidence: 0.6,
      rationale: 'fallback heuristic',
      entryPoints: DEFAULTS.entryPoints[templateId],
      healthcheckPath: DEFAULTS.health
    }
  }

  const checks: string[] = []
  
  // Generate checks based on template type
  switch (templateSelection.templateId) {
    case 'vite-react-canvas':
      checks.push('side-scrolling','pixel art robot','jump controls','ground obstacles','flying birds','increasing difficulty')
      break
    case 'vite-react-canvas-app':
      checks.push('interactive elements','edit mode','canvas interface','productivity features')
      break
    case 'nextjs-basic-ui':
      checks.push('responsive design','user interface','navigation','modern styling')
      break
    default:
      checks.push('functional app','user interface')
  }

  // Determine project type based on template
  let project: 'canvas' | 'ui' | 'fullstack' | 'unknown' = 'ui'
  if (templateSelection.templateId.includes('canvas')) {
    project = 'canvas'
  } else if (templateSelection.templateId === 'nextjs-basic-ui') {
    project = 'ui'
  }

  const task: Task = {
    jobId,
    intent: 'create',
    project,
    context: text,
    checks,
    template: {
      id: templateSelection.templateId,
      confidence: templateSelection.confidence,
      rationale: templateSelection.rationale,
      entryPoints: templateSelection.entryPoints || DEFAULTS.entryPoints[templateSelection.templateId],
      healthcheckPath: templateSelection.healthcheckPath || DEFAULTS.health,
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