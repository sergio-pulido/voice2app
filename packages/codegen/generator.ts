/**
 * Code generator using configured LLM provider
 */

import { config, logger, type Task, type GeneratedFile } from '../shared'
import { createLLMProvider } from './providers'

const CODEGEN_SYSTEM_PROMPT = `You are an expert full-stack developer. Generate complete, production-ready code based on user requirements.

Rules:
1. Generate clean, modern, well-structured code
2. Use best practices and follow conventions
3. Include ALL necessary dependencies in package.json (including @vitejs/plugin-react for Vite projects)
4. For frontend: use modern React 18 with TypeScript, Vite, and Tailwind CSS
5. For backend: use Node.js/Bun with TypeScript
6. Always include a README.md with setup instructions
7. Make apps responsive and accessible
8. Use React 18 API (createRoot instead of render)
9. ALWAYS use default exports for React components (export default ComponentName)

Required dependencies for Vite + React projects:
- dependencies: react, react-dom
- devDependencies: @vitejs/plugin-react, @types/react, @types/react-dom, typescript, vite, tailwindcss, autoprefixer, postcss

React Component Template (ALWAYS include default export):
\`\`\`typescript
import React from 'react'

function App() {
  return <div>Content</div>
}

export default App
\`\`\`

PostCSS Config Template (postcss.config.js):
\`\`\`javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
\`\`\`

Tailwind Config Template (tailwind.config.js):
\`\`\`javascript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
\`\`\`

Output format: Return a JSON array of files:
[
  {
    "path": "relative/path/to/file.ext",
    "content": "file content here",
    "language": "typescript" | "javascript" | "html" | "css" | "json" | "markdown"
  }
]

IMPORTANT: Output ONLY the JSON array, no markdown code blocks or explanations.`

export async function generateCode(task: Task): Promise<GeneratedFile[]> {
  logger.job(task.jobId, `Generating code for: ${task.context}`)
  logger.info(`Using LLM provider: ${config.llmProvider}`)
  
  try {
    const prompt = buildPrompt(task)
    const llm = createLLMProvider()
    
    const response = await llm.complete({
      messages: [
        { role: 'system', content: CODEGEN_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      maxTokens: 4000,
    })
    
    const content = response.content
    
    // Clean up content (remove markdown code blocks if present)
    let cleanContent = content.trim()
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\n/, '').replace(/\n```$/, '')
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\n/, '').replace(/\n```$/, '')
    }
    
    // Parse JSON
    const files = JSON.parse(cleanContent) as GeneratedFile[]
    
    logger.success(`Generated ${files.length} files`)
    
    return files
  } catch (error) {
    logger.error('Code generation error:', error)
    
    // Return a minimal fallback app
    return getFallbackApp(task)
  }
}

function buildPrompt(task: Task): string {
  const isFullstackOrFrontend = task.project.includes('frontend') || task.project === 'fullstack' || task.project === 'mvp'
  
  return `Project: ${task.project}
Intent: ${task.intent}
Requirements: ${task.context}

${task.checks.length > 0 ? `Must include: ${task.checks.join(', ')}` : ''}

Generate a complete, working application with all necessary files.
${isFullstackOrFrontend ? `
Include these files:
- package.json (with ALL required dependencies: react, react-dom, AND devDependencies: @vitejs/plugin-react, @types/react, @types/react-dom, typescript, vite, tailwindcss, autoprefixer, postcss. Add "type": "module" to package.json)
- vite.config.ts (import react from '@vitejs/plugin-react')
- tsconfig.json
- postcss.config.cjs (use CommonJS format with module.exports) OR postcss.config.js (use ES module format with export default)
- tailwind.config.js (use ES module format with export default)
- index.html
- src/main.tsx (use React 18 createRoot API from 'react-dom/client')
- src/App.tsx (MUST have export default App)
- src/index.css (with Tailwind directives: @tailwind base; @tailwind components; @tailwind utilities;)
` : ''}
${task.project === 'backend' ? 'Include: package.json, tsconfig.json, src/index.ts' : ''}

Return the JSON array of files.`
}

function getFallbackApp(task: Task): GeneratedFile[] {
  // Simple fallback HTML page
  return [
    {
      path: 'index.html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>App</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .container {
      text-align: center;
      color: white;
      padding: 2rem;
    }
    h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 ${task.context}</h1>
    <p>Generated by Voice2App</p>
  </div>
</body>
</html>`,
      language: 'html',
    },
    {
      path: 'README.md',
      content: `# ${task.context}\n\nGenerated app for: ${task.context}\n\n## Setup\n\nOpen index.html in a browser.`,
      language: 'markdown',
    },
  ]
}

