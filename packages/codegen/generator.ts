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

function parsePackageJsonContent(input: string): any {
  // Trim and remove BOM if present
  let txt = input.replace(/^\uFEFF/, '').trim()
  // Attempt direct parse first
  try {
    return JSON.parse(txt)
  } catch {}
  // Normalize common escape artifacts
  try {
    let normalized = txt
      // Replace escaped quotes and whitespace sequences to real characters
      .replace(/\\\"/g, '"')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
    return JSON.parse(normalized)
  } catch {}
  // Fallback: decode as JSON string then parse JSON text (escape before wrapping)
  try {
    const wrapped = '"' + txt
      .replace(/\\/g, '\\\\')
      .replace(/\"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t') + '"'
    const decoded = JSON.parse(wrapped)
    return JSON.parse(decoded)
  } catch {}
  // Last resort: extract the first balanced object substring and parse
  try {
    const start = txt.indexOf('{')
    const end = txt.lastIndexOf('}')
    if (start !== -1 && end !== -1 && end > start) {
      const obj = txt.slice(start, end + 1)
      return JSON.parse(obj)
    }
  } catch {}
  // Give up
  throw new Error('Unable to parse package.json content')
}

// Loosely extract file entries from an LLM response that failed strict JSON parsing
function extractFilesLoosely(input: string): GeneratedFile[] {
  try {
    // Remove fenced code blocks if present
    const withoutFences = input.replace(/```(?:json)?\s*[\s\S]*?```/g, (m) => m)
    const results: GeneratedFile[] = []
    const objectRegex = /\{[\s\S]*?"path"\s*:\s*"([^"]+)"[\s\S]*?"content"\s*:\s*("(?:\\.|[^"\\])*")[\s\S]*?\}/g
    let match: RegExpExecArray | null
    while ((match = objectRegex.exec(withoutFences)) !== null) {
      const path = match[1]
      const contentStringLiteral = match[2]
      try {
        const content = JSON.parse(contentStringLiteral)
        // best-effort language from extension
        const ext = path.split('.').pop() || ''
        const language = ext
        results.push({ path, content, language } as unknown as GeneratedFile)
      } catch {
        // skip malformed entry
      }
    }
    return results
  } catch {
    return []
  }
}

// Parse envelope format to avoid JSON escaping issues
// Format:
// <<<FILE path="src/App.tsx" language="typescript" >>>\n
// ...raw content...\n
// <<<END FILE>>>
function parseEnvelopeFiles(input: string): GeneratedFile[] {
  const files: GeneratedFile[] = []
  const fileStartRegex = /<<<FILE\s+path=\"([^\"]+)\"(?:\s+language=\"([^\"]+)\")?\s*>>>/g
  let match: RegExpExecArray | null
  while ((match = fileStartRegex.exec(input)) !== null) {
    const path = match[1]
    const language = match[2] || ''
    const startIdx = match.index + match[0].length
    const endMarker = '<<<END FILE>>>'
    const endIdx = input.indexOf(endMarker, startIdx)
    if (endIdx === -1) break
    const content = input.slice(startIdx, endIdx)
    files.push({ path, content, language } as unknown as GeneratedFile)
    fileStartRegex.lastIndex = endIdx + endMarker.length
  }
  return files
}

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
  
  systemPrompt += `
CRITICAL OUTPUT FORMAT:
You must return ONLY a valid JSON array. Nothing else. No explanation, no markdown, no code blocks.

The response must be a JSON array where each item has:
{
  "path": "string",     // File path like "package.json"
  "content": "string"   // File content as properly escaped JSON string
}

🚨 CRITICAL RULES:
1. Use ONLY double quotes (") - NEVER backticks (\`) or single quotes (')
2. The "content" field must be a properly escaped JSON string
3. For file content that contains {"name": "app"}, write: "{\\"name\\": \\"app\\"}"
4. Escape ALL special characters: newlines → \\\\n, quotes → \\\\", backslashes → \\\\\\\\
5. Return raw JSON array only - no \`\`\`json blocks, no explanations

Example of correct format:
[
  {
    "path": "package.json",
    "content": "{\\"name\\": \\"my-app\\",\\"version\\": \\"1.0.0\\",\\"scripts\\": {\\"dev\\": \\"vite\\"}}"
  },
  {
    "path": "src/App.tsx",
    "content": "import React from 'react'\\\\n\\\\nfunction App() {\\\\n  return <h1>Hello</h1>\\\\n}"
  }
]

Return ONLY the JSON array now.`
  
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
      maxTokens: 8000,
    })
    
    const content = response.content
    
    // Show the whole result
    console.log('########################################################')
    logger.debug('LLM response:', content)
    console.log('########################################################')
    
    // Try to parse JSON response
    let files: GeneratedFile[] = []
    let result = '' // Declare outside try block so it's available in catch
    
    try {
      // First, try to extract JSON from markdown code blocks
      let cleanContent = content
      
      // Remove markdown code blocks (```json ... ``` or ```... ```)
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (codeBlockMatch) {
        cleanContent = codeBlockMatch[1].trim()
        logger.debug('Extracted from code block')
      }
      
      // Look for JSON array in the cleaned response
      const jsonMatch = cleanContent.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        throw new Error('No JSON array found in response')
      }
      
      let jsonString = jsonMatch[0]
      
      // Fix common JSON issues from LLM responses
      result = jsonString

      // Fix over-escaped quotes: \\\\" -> \"
      result = result.replace(/\\\\\\\"/g, '\\"')
      
      // Fix over-escaped backslashes: \\\\ -> \\
      result = result.replace(/\\\\\\\\/g, '\\\\')

      // Replace template literals (backticks) with quoted strings
      // Pattern: `content` -> "content"
      result = result.replace(/`([^`]*)`/g, '"$1"')

      // Try to parse the cleaned JSON
      files = JSON.parse(result)
    } catch (parseError) {
      logger.error('Failed to parse LLM response as JSON:', parseError)
      logger.debug('Cleaned JSON string (first 500 chars):', result.substring(0, 500))
      logger.debug('Original LLM response (first 500 chars):', content.substring(0, 500))

      // Try one more time with more aggressive cleaning
      let finalResult = result
      try {
        // Remove any remaining template literals that might have been missed
        finalResult = finalResult.replace(/`([^`]*)`/g, '"$1"')

        // Fix common JSON syntax issues
        finalResult = finalResult.replace(/,\s*}/g, '}')  // Remove trailing commas
        finalResult = finalResult.replace(/,\s*]/g, ']')  // Remove trailing commas

        // The LLM is using \\\" which becomes \" after one pass, then we need to keep it as \"
        // Don't touch the backslashes anymore - they should be correct now

        // Try to balance braces and brackets
        const openBraces = (finalResult.match(/\{/g) || []).length
        const closeBraces = (finalResult.match(/\}/g) || []).length
        const openBrackets = (finalResult.match(/\[/g) || []).length
        const closeBrackets = (finalResult.match(/\]/g) || []).length

        // Add missing closing braces/brackets if needed
        if (closeBraces < openBraces) {
          logger.warn(`Adding ${openBraces - closeBraces} missing closing braces`)
          finalResult += '}'.repeat(openBraces - closeBraces)
        }
        if (closeBrackets < openBrackets) {
          logger.warn(`Adding ${openBrackets - closeBrackets} missing closing brackets`)
          finalResult += ']'.repeat(openBrackets - closeBrackets)
        }

        // Try to parse with better error handling
        try {
          files = JSON.parse(finalResult)
          logger.info('✅ Successfully parsed JSON after cleanup')
        } catch (jsonError) {
          // If still failing, try to extract just the array part
          const arrayMatch = finalResult.match(/\[[\s\S]*\]/)
          if (arrayMatch) {
            files = JSON.parse(arrayMatch[0])
            logger.info('✅ Successfully parsed JSON array after extracting from malformed JSON')
          } else {
            throw jsonError
          }
        }
      } catch (secondParseError) {
        logger.error('❌ Failed to parse even after cleanup:', secondParseError)
        logger.debug('Final cleanup result (first 500 chars):', finalResult?.substring(0, 500))

        // Fresh approach: parse envelope blocks
        const envelopeFiles = parseEnvelopeFiles(content)
        if (envelopeFiles.length > 0) {
          logger.warn(`Recovered ${envelopeFiles.length} files via envelope parsing`)
          files = envelopeFiles
        } else {
          // Last-resort: loose extraction
          const loose = extractFilesLoosely(content)
          if (loose.length > 0) {
            logger.warn(`Recovered ${loose.length} files via loose extraction`)
            files = loose
          } else {
            // Fallback: return a simple app
            logger.warn('⚠️  Using fallback app due to JSON parsing failure')
            return getFallbackApp(task)
          }
        }
      }
    }
    
    // Utility to robustly unescape LLM-provided string content
    function unescapeContent(input: string): string {
      try {
        // Wrap as JSON string escaping only quotes, so JSON.parse will turn \n, \t, \r into real characters
        const wrapped = '"' + input.replace(/\"/g, '\\"') + '"'
        return JSON.parse(wrapped)
      } catch {
        // Fallback manual replacements for common sequences
        return input
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\r/g, '\r')
          .replace(/\\\"/g, '"')
      }
    }

    // Post-process files to ensure correctness
    files = files.map(file => {
      const originalContent = file.content

      if (file.path === 'package.json') {
        try {
          const packageJson = parsePackageJsonContent(originalContent)

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
          logger.debug('Package.json content (first 200 chars):', originalContent.substring(0, 200))
          return {
            ...file,
            content: originalContent
          }
        }
      }

      // Ensure tsconfig.json has no 'references' field
      if (file.path === 'tsconfig.json') {
        try {
          const ts = JSON.parse(originalContent)
          if (ts.references) {
            delete ts.references
          }
          return { ...file, content: JSON.stringify(ts, null, 2) }
        } catch {
          // keep as is
        }
      }

      // Non-package files: apply robust unescape
      let cleanContent = originalContent
      const beforePreview = cleanContent.substring(0, 100)
      cleanContent = unescapeContent(cleanContent)
      const afterPreview = cleanContent.substring(0, 100)
      if (beforePreview !== afterPreview) {
        logger.debug(`Unescaped content for ${file.path} (first 100 chars changed)`) 
      }

      return {
        ...file,
        content: cleanContent
      }
    })

    // Guarantee index.html points to /src/main.tsx and file exists
    const hasMainTsx = files.some(f => f.path === 'src/main.tsx')
    const hasIndexHtml = files.find(f => f.path === 'index.html')
    if (hasIndexHtml) {
      const idx = files.findIndex(f => f.path === 'index.html')
      files[idx] = {
        ...files[idx],
        content: files[idx].content.replace(/src\s*=\s*"\/?src\/[^"]+"/i, 'src="/src/main.tsx"')
      }
    }
    if (!hasMainTsx) {
      files.push({
        path: 'src/main.tsx',
        content: "import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport App from './App.tsx'\nimport './index.css'\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n)\n",
        language: 'typescript'
      } as unknown as GeneratedFile)
    }
    
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
