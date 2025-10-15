/**
 * Code generator using configured LLM provider
 */

import { config, logger, type Task, type GeneratedFile } from '../shared'
import { createLLMProvider } from './providers'
import { 
  FRONTEND_DEV_SYSTEM_PROMPT,
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
import { loadTemplateFiles, templateExists } from './template-loader'

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

export function buildSystemPrompt({ templateId, healthcheckPath, entryPoints }: {
  templateId: 'vite-react-canvas'|'vite-react-canvas-app'|'nextjs-basic-ui'|'vanilla-ts-canvas'|'none',
  healthcheckPath?: string,
  entryPoints?: string[]
}) {
  const COMMON = `
You are a code generator. You must return a JSON array of files to write:
[{ "path": "...", "content": "..." }, ...]
All files MUST be relative to project root. Do not include explanations outside JSON.
NEVER remove package scripts or change port 5173. Preserve /healthz readiness.

CRITICAL JSON RULES:
- All string literals must be properly escaped and on single lines
- Never split string literals across multiple lines
- Use \\n for newlines, not actual line breaks in strings
- Escape all quotes within strings with backslashes
- Ensure all JSON is valid and parseable

IMPORTANT: If you receive template context, customize the existing template files to match the user's requirements. 
Do not just return the template as-is - modify it to implement the specific functionality requested.

Allowed file targets:
- Only modify listed entry points and new files under /src or /app if needed.
- Avoid touching package.json scripts and configs unless explicitly requested.
- When customizing templates, preserve the template's architecture and add new functionality.
`;

  const PER_TEMPLATE: Record<string, string> = {
    'vite-react-canvas': `
Project scaffold: Vite + React + TS (already present).
Healthcheck path: ${healthcheckPath ?? '/healthz'}
Primary entry points you may modify: ${entryPoints?.join(', ') ?? 'src/game/engine.ts, src/App.tsx'}

Hard rules:
- Implement game logic in canvas without calling React state inside requestAnimationFrame.
- Keep port fixed at 5173. Do not add external assets; draw with canvas or inline.
- Provide jump with ↑/Space/tap, obstacles & birds, collisions -> game over -> restart.
`,
         'vite-react-canvas-app': `
Project scaffold: Vite + React + TS (already present).
Healthcheck path: ${healthcheckPath ?? '/healthz'}
Primary entry points you may modify: ${entryPoints?.join(', ') ?? 'src/app/engine.ts, src/App.tsx'}

Hard rules:
- Implement productivity app logic using canvas-based UI elements.
- Keep port fixed at 5173. Use canvas for interactive elements and custom UI.
- Provide edit/interact modes, element management, and clean productivity interface.
- Focus on tools, utilities, and interactive productivity features.

CRITICAL FOR NOTE-TAKING APPS:
- If implementing PDF export functionality, MUST include "jspdf": "^2.5.1" in dependencies
- For file downloads, MUST include "file-saver": "^2.0.5" in dependencies
- For any external library imports, ensure they are added to package.json
`,
    'nextjs-basic-ui': `
Project scaffold: Next.js (App Router + TS) (already present).
Healthcheck route: ${healthcheckPath ?? '/healthz'}
Primary entry points you may modify: ${entryPoints?.join(', ') ?? 'app/page.tsx, app/api/*'}

Hard rules:
- Keep dev/start on port 5173 as configured.
- Add UI components/pages and minimal API routes as needed.
- Do not add heavy deps; prioritize built-in Next features.
`,
    'vanilla-ts-canvas': `
Project scaffold: Vite + TypeScript (no framework) (already present).
Healthcheck path: ${healthcheckPath ?? '/healthz'}
Primary entry points you may modify: ${entryPoints?.join(', ') ?? 'src/engine.ts, src/styles.css'}

Hard rules:
- Use canvas only. No external assets.
- Implement game loop, physics, spawn, collisions, scoring, restart.
- Keep port fixed at 5173.
`,
    'none': `
No scaffold exists. You must generate a runnable project that:
- Uses Vite + TS OR Next.js depending on the app (choose the minimal that satisfies the request).
- Fixed port 5173, healthcheck at /healthz.
- Output the ENTIRE project structure.
`
  };

  return COMMON + '\n' + PER_TEMPLATE[templateId];
}

function buildPrompt(task: Task, templateFiles: GeneratedFile[] = []): string {
  const templateContext = templateFiles.length > 0 ? `

📁 TEMPLATE CONTEXT:
You are starting with a ${task.template.id} template that includes these files:
${templateFiles.map(f => `- ${f.path} (${f.language})`).join('\n')}

${templateFiles.slice(0, 3).map(f => `
File: ${f.path}
\`\`\`${f.language}
${f.content.substring(0, 500)}${f.content.length > 500 ? '...' : ''}
\`\`\`
`).join('\n')}

CUSTOMIZE THE TEMPLATE:
- Modify the existing template files to match the user's requirements
- Keep the template structure but customize the functionality
- Add new files if needed for specific features
- Preserve the template's architecture and patterns

` : ''

  return `Generate a complete, production-ready web application based on this request:

${task.context}
${templateContext}
Requirements:
- Create a modern, beautiful, and fully functional application
- Use React 18 with TypeScript, Vite, and Tailwind CSS
- Include all necessary configuration files
- Make it production-ready with proper error handling
- Ensure the UI is stunning and professional-looking
- Include all dependencies in package.json
- Make it fully responsive and accessible

🚨 CRITICAL - REQUIRED FILES (app will fail without these):
1. index.html - MUST be in project root with:
   <!DOCTYPE html>
   <html lang="en">
     <head>
       <meta charset="UTF-8" />
       <meta name="viewport" content="width=device-width, initial-scale=1.0" />
       <title>App Title</title>
     </head>
     <body>
       <div id="root"></div>
       <script type="module" src="/src/main.tsx"></script>
     </body>
   </html>

2. package.json MUST include ALL dependencies used in your code:
   
   REQUIRED CORE DEPENDENCIES:
   dependencies: {
     "react": "^18.0.0",
     "react-dom": "^18.0.0"
   }
   devDependencies: {
     "@vitejs/plugin-react": "^4.2.1", (REQUIRED for vite.config.ts)
     "vite": "^5.0.8",
     "typescript": "^5.2.2",
     "@types/react": "^18.2.43",
     "@types/react-dom": "^18.2.17",
     "tailwindcss": "^3.3.6",
     "autoprefixer": "^10.4.16",
     "postcss": "^8.4.32"
   }
   
   FEATURE-SPECIFIC DEPENDENCIES (add to dependencies if you use them):
   - PDF Generation: "jspdf": "^2.5.1"
   - Charts/Graphs: "chart.js": "^4.4.0", "react-chartjs-2": "^5.2.0"
   - Date/Time: "date-fns": "^2.30.0"
   - Icons: "lucide-react": "^0.263.1"
   - Animations: "framer-motion": "^10.16.4"
   - File handling: "file-saver": "^2.0.5"
   - HTTP requests: "axios": "^1.5.0"
   - State management: "zustand": "^4.4.1"
   - Forms: "react-hook-form": "^7.45.4"
   - UI Components: "react-router-dom": "^6.15.0"
   
   ⚠️ CRITICAL: If you import any package in your code, it MUST be in package.json!

3. vite.config.ts MUST import from '@vitejs/plugin-react' AND include server config:
   import { defineConfig } from 'vite';
   import react from '@vitejs/plugin-react';

   export default defineConfig({
     plugins: [react()],
     server: {
       host: '0.0.0.0',
       port: 5173,
       strictPort: false,
       allowedHosts: ['localhost', '.ngrok-free.dev', '.trycloudflare.com']
     }
   });

4. tsconfig.json MUST be included for proper TypeScript compilation:
   {
     "compilerOptions": {
       "target": "ES2020",
       "useDefineForClassFields": true,
       "lib": ["ES2020", "DOM", "DOM.Iterable"],
       "module": "ESNext",
       "skipLibCheck": true,
       "moduleResolution": "bundler",
       "allowImportingTsExtensions": true,
       "resolveJsonModule": true,
       "isolatedModules": true,
       "noEmit": true,
       "jsx": "react-jsx",
       "strict": true,
       "noUnusedLocals": true,
       "noUnusedParameters": true,
       "noFallthroughCasesInSwitch": true
     },
     "include": ["src"],
     "references": [{ "path": "./tsconfig.node.json" }]
   }

5. tsconfig.node.json MUST be included for Vite config:
   {
     "compilerOptions": {
       "composite": true,
       "skipLibCheck": true,
       "module": "ESNext",
       "moduleResolution": "bundler",
       "allowSyntheticDefaultImports": true
     },
     "include": ["vite.config.ts"]
   }

WITHOUT index.html THE APP WILL RETURN 404 AND COMPLETELY FAIL!
WITHOUT proper server config, ngrok tunnels will be blocked!
WITHOUT TypeScript configs, compilation may fail and dev server won't start!
WITHOUT dependencies in package.json, imports will fail!

🎯 COMMON FUNCTIONALITY PATTERNS:
- Note-taking with PDF: MUST include "jspdf": "^2.5.1" in dependencies
- Drawing/Canvas apps: No additional deps needed (use HTML5 Canvas)
- Charts/Graphs: MUST include "chart.js": "^4.4.0", "react-chartjs-2": "^5.2.0"
- File downloads: MUST include "file-saver": "^2.0.5"
- Date handling: MUST include "date-fns": "^2.30.0"
- HTTP requests: MUST include "axios": "^1.5.0"

The application should be complete and ready to run immediately.`
}

// Dependency mapping for common imports
const DEPENDENCY_MAP: Record<string, string> = {
  'jspdf': '^2.5.1',
  'chart.js': '^4.4.0',
  'react-chartjs-2': '^5.2.0',
  'date-fns': '^2.30.0',
  'lucide-react': '^0.263.1',
  'framer-motion': '^10.16.4',
  'file-saver': '^2.0.5',
  'axios': '^1.5.0',
  'zustand': '^4.4.1',
  'react-hook-form': '^7.45.4',
  'react-router-dom': '^6.15.0'
}

function validateAndFixDependencies(files: GeneratedFile[]): GeneratedFile[] {
  // Find package.json and all source files
  const packageJsonFile = files.find(f => f.path === 'package.json')
  const sourceFiles = files.filter(f => f.path.startsWith('src/') && (f.path.endsWith('.tsx') || f.path.endsWith('.ts')))
  
  if (!packageJsonFile || sourceFiles.length === 0) {
    return files
  }

  try {
    const packageJson = JSON.parse(packageJsonFile.content)
    const existingDeps = { ...packageJson.dependencies, ...packageJson.devDependencies }
    let needsUpdate = false

    // Check each source file for imports
    for (const sourceFile of sourceFiles) {
      const content = sourceFile.content
      
      // Find import statements
      const importMatches = content.match(/import\s+.*\s+from\s+['"]([^'"]+)['"]/g)
      if (importMatches) {
        for (const importMatch of importMatches) {
          const depMatch = importMatch.match(/from\s+['"]([^'"]+)['"]/)
          if (depMatch) {
            const depName = depMatch[1]
            if (DEPENDENCY_MAP[depName] && !existingDeps[depName]) {
              // Add missing dependency
              if (!packageJson.dependencies) packageJson.dependencies = {}
              packageJson.dependencies[depName] = DEPENDENCY_MAP[depName]
              needsUpdate = true
            }
          }
        }
      }
    }

    if (needsUpdate) {
      // Update the package.json file
      packageJsonFile.content = JSON.stringify(packageJson, null, 2)
      logger.info('🔧 Auto-added missing dependencies to package.json')
    }

  } catch (error) {
    logger.warn('Could not validate package.json dependencies:', error)
  }

  return files
}

export async function generateCode(task: Task): Promise<GeneratedFile[]> {
  try {
    // Try simple template-first approach (for HTML snippets)
    logger.job(task.jobId, 'Checking for simple template match...')
    const simpleTemplateResult = tryGenerateFromTemplate(task)
    
    if (simpleTemplateResult) {
      logger.success('✅ Generated from simple template!')
      return validateAndFixDependencies(simpleTemplateResult)
    }

    // Try complex template approach (for full project templates)
    logger.job(task.jobId, 'Checking for complex template...')
    let templateFiles: GeneratedFile[] = []
    if (await templateExists(task.template.id)) {
      logger.info(`📁 Loading template files from: ${task.template.id}`)
      templateFiles = await loadTemplateFiles(task.template.id)
      
      if (templateFiles.length > 0) {
        logger.success(`✅ Loaded ${templateFiles.length} files from template: ${task.template.id}`)
        logger.info('🎨 Customizing template with LLM...')
      }
    }
    
    if (templateFiles.length === 0) {
      logger.warn('❌ No template match found, doing it from scratch')
    }
    
    // Fall back to LLM generation
    logger.job(task.jobId, 'Generating code with LLM...')
    
    // Build system and user prompts
    const systemPrompt = buildSystemPrompt({
      templateId: task.template.id,
      healthcheckPath: task.template.healthcheckPath,
      entryPoints: task.template.entryPoints
    })
    const userPrompt = buildPrompt(task, templateFiles)

    // Create LLM provider
    const llm = createLLMProvider()
    
    // Complete
    const response = await llm.complete({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      maxTokens: 8000,
    })
    
    // Get response content
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

      // Fix unescaped quotes in HTML content that break JSON
      finalResult = finalResult.replace(/"content":\s*"([^"]*<[^"]*"[^"]*>[^"]*)"/g, (match, content) => {
        // Escape quotes within HTML content
        const escapedContent = content.replace(/"/g, '\\"')
        return `"content": "${escapedContent}"`
      })

      // Fix broken string literals (quotes on separate lines)
      finalResult = finalResult.replace(/'([^']*)\n([^']*)'/g, "'$1$2'")
      finalResult = finalResult.replace(/"([^"]*)\n([^"]*)"/g, '"$1$2"')

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
    
    // Validate and fix missing dependencies
    files = validateAndFixDependencies(files)
    
    return files
    
  } catch (error) {
    logger.error('Code generation failed:', error)
    return getFallbackApp(task)
  }
}

function getFallbackApp(task: Task): GeneratedFile[] {
  // Simple fallback HTML page with essential configs
  return [
    {
      path: 'index.html',
      content: FALLBACK_APP_HTML,
      language: 'html'
    },
    {
      path: 'package.json',
      content: JSON.stringify({
        "name": "fallback-app",
        "version": "1.0.0",
        "type": "module",
        "scripts": {
          "dev": "vite",
          "build": "vite build",
          "preview": "vite preview"
        },
        "dependencies": {
          "react": "^18.0.0",
          "react-dom": "^18.0.0"
        },
        "devDependencies": {
          "@types/react": "^18.0.0",
          "@types/react-dom": "^18.0.0",
          "@vitejs/plugin-react": "^4.0.0",
          "typescript": "^5.0.0",
          "vite": "^5.0.0"
        }
      }, null, 2),
      language: 'json'
    },
    {
      path: 'vite.config.ts',
      content: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: ['localhost', '.ngrok-free.dev', '.trycloudflare.com']
  }
})`,
      language: 'typescript'
    },
    {
      path: 'tsconfig.json',
      content: JSON.stringify({
        "compilerOptions": {
          "target": "ES2020",
          "useDefineForClassFields": true,
          "lib": ["ES2020", "DOM", "DOM.Iterable"],
          "module": "ESNext",
          "skipLibCheck": true,
          "moduleResolution": "bundler",
          "allowImportingTsExtensions": true,
          "resolveJsonModule": true,
          "isolatedModules": true,
          "noEmit": true,
          "jsx": "react-jsx",
          "strict": true,
          "noUnusedLocals": true,
          "noUnusedParameters": true,
          "noFallthroughCasesInSwitch": true
        },
        "include": ["src"],
        "references": [{ "path": "./tsconfig.node.json" }]
      }, null, 2),
      language: 'json'
    },
    {
      path: 'tsconfig.node.json',
      content: JSON.stringify({
        "compilerOptions": {
          "composite": true,
          "skipLibCheck": true,
          "module": "ESNext",
          "moduleResolution": "bundler",
          "allowSyntheticDefaultImports": true
        },
        "include": ["vite.config.ts"]
      }, null, 2),
      language: 'json'
    }
  ]
}
