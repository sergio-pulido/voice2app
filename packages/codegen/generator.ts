/**
 * Code generator using configured LLM provider
 */

import { config, logger, type Task, type GeneratedFile } from '../shared'
import { createLLMProvider } from './providers'
import { 
  CODEGEN_SYSTEM_PROMPT,
  UI_UX_SYSTEM_PROMPT,
  GAME_DEVELOPMENT_PROMPT,
  SNAKE_GAME_TEMPLATE,
  TETRIS_GAME_TEMPLATE,
  PONG_GAME_TEMPLATE,
  CALCULATOR_TEMPLATE,
  TODO_LIST_TEMPLATE,
  WEATHER_APP_TEMPLATE,
  PACKAGE_JSON_TEMPLATE,
  VITE_CONFIG_TEMPLATE,
  VITE_CONFIG_WITH_LINGO,
  VITE_CONFIG_WITHOUT_LINGO,
  INDEX_HTML_TEMPLATE,
  MAIN_TSX_TEMPLATE,
  APP_TSX_TEMPLATE,
  AUTH_TEMPLATE,
  POSTCSS_CONFIG_TEMPLATE,
  TAILWIND_CONFIG_TEMPLATE,
  TSCONFIG_TEMPLATE,
  INDEX_CSS_TEMPLATE
} from '../shared/prompts'
import { FALLBACK_APP_HTML } from '../shared/snippets'
import { tryGenerateFromTemplate, getTemplateHints } from './template-handler'

function buildSystemPrompt(task: Task): string {
  const shouldIncludeLingo = !task.context.toLowerCase().includes('no localization') && 
                            !task.context.toLowerCase().includes('authentication')
  
  const isTetrisRequest = task.context.toLowerCase().includes('tetris')
  const isSnakeRequest = task.context.toLowerCase().includes('snake')
  const isGameRequest = isTetrisRequest || isSnakeRequest || 
                       task.context.toLowerCase().includes('game') ||
                       task.context.toLowerCase().includes('pong')
  
  let systemPrompt = CODEGEN_SYSTEM_PROMPT + '\n\n' + UI_UX_SYSTEM_PROMPT
  
  if (isGameRequest) {
    systemPrompt += '\n\n' + GAME_DEVELOPMENT_PROMPT
  }
  
  // Add specific templates based on request type
  if (isSnakeRequest) {
    systemPrompt += '\n\n' + SNAKE_GAME_TEMPLATE
  }
  
  if (isTetrisRequest) {
    systemPrompt += '\n\n' + TETRIS_GAME_TEMPLATE
  }
  
  if (task.context.toLowerCase().includes('pong')) {
    systemPrompt += '\n\n' + PONG_GAME_TEMPLATE
  }
  
  if (task.context.toLowerCase().includes('calculator')) {
    systemPrompt += '\n\n' + CALCULATOR_TEMPLATE
  }
  
  if (task.context.toLowerCase().includes('todo')) {
    systemPrompt += '\n\n' + TODO_LIST_TEMPLATE
  }
  
  if (task.context.toLowerCase().includes('weather')) {
    systemPrompt += '\n\n' + WEATHER_APP_TEMPLATE
  }
  
  // Add configuration templates
  systemPrompt += '\n\n' + PACKAGE_JSON_TEMPLATE.replace('{{LINGO_DEPENDENCY}}', 
    shouldIncludeLingo ? ',\n    "lingo.dev": "^0.112.0"' : '')
  
  if (shouldIncludeLingo) {
    systemPrompt += '\n\n' + VITE_CONFIG_WITH_LINGO
  } else {
    systemPrompt += '\n\n' + VITE_CONFIG_WITHOUT_LINGO
  }
  
  systemPrompt += '\n\n' + INDEX_HTML_TEMPLATE
  systemPrompt += '\n\n' + MAIN_TSX_TEMPLATE
  
  if (task.context.toLowerCase().includes('authentication')) {
    systemPrompt += '\n\n' + AUTH_TEMPLATE
  } else {
    systemPrompt += '\n\n' + APP_TSX_TEMPLATE
  }
  
  systemPrompt += '\n\n' + POSTCSS_CONFIG_TEMPLATE
  systemPrompt += '\n\n' + TAILWIND_CONFIG_TEMPLATE
  systemPrompt += '\n\n' + TSCONFIG_TEMPLATE
  systemPrompt += '\n\n' + INDEX_CSS_TEMPLATE
  
  // Add template hints if available
  const templateHints = getTemplateHints(task)
  if (templateHints) {
    systemPrompt += '\n\n' + templateHints
  }
  
  systemPrompt += '\n\nReturn the JSON array of files.'
  
  return systemPrompt
}

function buildPrompt(task: Task): string {
  return `Generate a complete, production-ready web application based on this request:

${task.context}

Requirements:
- Create a modern, beautiful, and fully functional application
- Use React 18 with TypeScript, Vite, and Tailwind CSS
- Include all necessary configuration files
- Make it production-ready with proper error handling
- Ensure the UI is stunning and professional-looking
- Include all dependencies in package.json
- Make it fully responsive and accessible

The application should be complete and ready to run immediately.`
}

export async function generateCode(task: Task): Promise<GeneratedFile[]> {
  try {
    // Try template-first approach
    logger.job(task.jobId, 'Checking for template match...')
    const templateResult = tryGenerateFromTemplate(task)
    
    if (templateResult) {
      logger.success('✅ Generated from template!')
      return templateResult
    }
    
    // Fall back to LLM generation
    logger.job(task.jobId, 'Generating code with LLM...')
    
    const prompt = buildPrompt(task)
    const llm = createLLMProvider()
    
    const response = await llm.complete({
      messages: [
        { role: 'system', content: buildSystemPrompt(task) },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      maxTokens: 4000,
    })
    
    const content = response.content
    
    // Try to parse JSON response
    let files: GeneratedFile[] = []
    try {
      // Look for JSON array in the response
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        files = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON array found in response')
      }
    } catch (parseError) {
      logger.error('Failed to parse LLM response as JSON:', parseError)
      logger.debug('LLM response:', content)
      
      // Fallback: return a simple app
      return getFallbackApp(task)
    }
    
    // Post-process files to ensure correctness
    files = files.map(file => {
      if (file.path === 'package.json') {
        try {
          const packageJson = JSON.parse(file.content)
          
          // Ensure scripts section exists
          if (!packageJson.scripts) {
            packageJson.scripts = {
              "dev": "vite",
              "build": "vite build",
              "serve": "vite serve"
            }
            logger.warn('Added missing scripts section to package.json')
          }
          
          return {
            ...file,
            content: JSON.stringify(packageJson, null, 2)
          }
        } catch (error) {
          logger.error('Failed to parse package.json:', error)
          return file
        }
      }
      return file
    })
    
    logger.success(`Generated ${files.length} files`)
    return files
    
  } catch (error) {
    logger.error('Code generation failed:', error)
    return getFallbackApp(task)
  }
}

function getFallbackApp(task: Task): GeneratedFile[] {
  // Simple fallback HTML page using snippet
  return [
    {
      path: 'index.html',
      content: FALLBACK_APP_HTML
    }
  ]
}
