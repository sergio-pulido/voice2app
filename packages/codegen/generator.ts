/**
 * Code generator using configured LLM provider
 */

import { config, logger, type Task, type GeneratedFile } from '../shared'
import { createLLMProvider } from './providers'

const CODEGEN_SYSTEM_PROMPT = `You are an expert full-stack developer. Generate complete, production-ready code based on user requirements.

🚨🚨🚨 CRITICAL RULES - NO EXCEPTIONS:
1. 🚫 NEVER generate placeholder code, comments like "// Game logic here", or TODOs
2. 🚫 NEVER generate skeleton code - ALWAYS implement FULL, WORKING functionality
3. 🚫 NEVER leave parts unimplemented - every feature MUST be fully coded
4. ✅ ALWAYS generate COMPLETE, EXECUTABLE code that works immediately
5. ✅ If it's a game, implement the ENTIRE game logic, not just the UI shell

Additional Rules:
6. Generate clean, modern, well-structured code
7. Use best practices and follow conventions
8. Include ALL necessary dependencies in package.json (including @vitejs/plugin-react for Vite projects)
9. For frontend: use modern React 18 with TypeScript, Vite, and Tailwind CSS
10. For backend: use Node.js/Bun with TypeScript
11. Always include a README.md with setup instructions
12. Make apps responsive and accessible
13. Use React 18 API (createRoot instead of render)
14. ALWAYS use default exports for React components (export default ComponentName)
15. CONDITIONAL Lingo.dev localization: ONLY include Lingo.dev if user doesn't explicitly request "no localization". If user requests "no localization", skip Lingo.dev completely and use standard Vite config.
16. For authentication requests: Create simple mock authentication (no external auth services, skip Lingo.dev to avoid build conflicts)
17. Keep it simple: Avoid complex backend integrations, use localStorage for data persistence
18. 🎨 CRITICAL: Create BEAUTIFUL, modern UI/UX with professional design - NO basic/unstyled elements
19. Use comprehensive Tailwind CSS styling with gradients, shadows, animations, and modern design patterns
20. Apply consistent color schemes, typography, spacing, and visual hierarchy
21. Make apps look like premium, production-ready applications
22. 🚨 NEVER use inline styles - ALWAYS use Tailwind CSS classes for styling
23. 🚨 ALWAYS import './index.css' in App.tsx for Tailwind to work
24. 🚨 ALWAYS use modern layouts with proper spacing, gradients, and shadows

Required dependencies for Vite + React projects:
- dependencies: react, react-dom (add "lingo.dev": "^0.112.0" ONLY if localization is requested)
- devDependencies: "@vitejs/plugin-react": "^4.2.1", "@types/react": "^18.2.43", "@types/react-dom": "^18.2.17", typescript, vite, tailwindcss, autoprefixer, postcss

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

TSConfig Template (tsconfig.json - 🚨 NO "references" field):
\`\`\`json
{
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": false,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
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
    
    // Post-process files to ensure package.json has scripts section
    const processedFiles = files.map(file => {
      if (file.path === 'package.json') {
        let packageJson
        try {
          packageJson = JSON.parse(file.content)
        } catch {
          packageJson = file.content // if already an object
        }
        
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
      }
      return file
    })
    
    logger.success(`Generated ${processedFiles.length} files`)
    
    return processedFiles
  } catch (error) {
    logger.error('Code generation error:', error)
    
    // Return a minimal fallback app
    return getFallbackApp(task)
  }
}

function buildPrompt(task: Task): string {
  const isFullstackOrFrontend = task.project.includes('frontend') || task.project === 'fullstack' || task.project === 'mvp'
  
  // Debug: Log task context for template detection
  logger.info(`Task context: "${task.context}"`)
  const isTetrisRequest = task.context.toLowerCase().includes('tetris') || 
                         task.context.toLowerCase().includes('tetromino') || 
                         (task.context.toLowerCase().includes('game') && task.context.toLowerCase().includes('blocks'))
  logger.info(`Is Tetris request: ${isTetrisRequest}`)
  
  // Determine if we should include Lingo.dev localization
  // DEFAULT: Do NOT include Lingo unless explicitly requested
  const shouldIncludeLingo = (task.context.toLowerCase().includes('localization') || 
                             task.context.toLowerCase().includes('localisation') ||
                             task.context.toLowerCase().includes('multilingual') ||
                             task.context.toLowerCase().includes('multi-language') ||
                             task.context.toLowerCase().includes('english and spanish') ||
                             task.context.toLowerCase().includes('translate')) &&
                             !task.context.toLowerCase().includes('no localization') &&
                             !task.context.toLowerCase().includes('no localisation')
  
  return `Project: ${task.project}
Intent: ${task.intent}
Requirements: ${task.context}

${task.checks.length > 0 ? `Must include: ${task.checks.join(', ')}` : ''}

Generate a complete, working application with all necessary files.

${isFullstackOrFrontend ? `
Include these files:
- package.json (🚨 CRITICAL: MUST include "scripts" section with "dev": "vite", "build": "vite build", "serve": "vite serve" 🚨. Include ALL required dependencies: react, react-dom, AND devDependencies: @vitejs/plugin-react, @types/react, @types/react-dom, typescript, vite, tailwindcss, autoprefixer, postcss. Add "type": "module" to package.json.${shouldIncludeLingo ? ' Include "lingo.dev": "^0.112.0" for localization.' : ' DO NOT include lingo.dev - user requested no localization.'})
- vite.config.ts (import react from '@vitejs/plugin-react'${shouldIncludeLingo ? ', import lingoCompiler from \'lingo.dev/compiler\' and use lingoCompiler.next() wrapper' : ' - use standard Vite config without Lingo'})
- tsconfig.json (🚨 DO NOT include "references" field - no tsconfig.node.json needed)
- postcss.config.cjs (use CommonJS format with module.exports) OR postcss.config.js (use ES module format with export default)
- tailwind.config.js (use ES module format with export default)
- index.html (MUST have correct script src="src/main.tsx" path)
- src/main.tsx (use React 18 createRoot API from 'react-dom/client')
- src/App.tsx (MUST have export default App${shouldIncludeLingo ? ', include "use i18n" directive at top for localization' : ' - NO "use i18n" directive needed, user requested no localization'})
- src/index.css (with Tailwind directives: @tailwind base; @tailwind components; @tailwind utilities;)
` : ''}
${task.project === 'backend' ? 'Include: package.json, tsconfig.json, src/index.ts' : ''}

${shouldIncludeLingo ? `LINGO.DEV LOCALIZATION SETUP (INCLUDE):
- Use Lingo.dev for English-Spanish translation
1. In vite.config.ts: Use lingoCompiler.next() helper for auto-translation to Spanish
2. In src/App.tsx: Add "use i18n" directive at the very top of the file
3. Write text naturally in English - Lingo.dev automatically detects and translates to Spanish` : `🚨 NO LOCALIZATION (USER REQUESTED):
🚨 CRITICAL: User explicitly requested "no localization" - DO NOT include Lingo.dev
🚨 1. Use standard Vite config WITHOUT lingoCompiler
🚨 2. NO "use i18n" directive in App.tsx
🚨 3. NO "lingo.dev" dependency in package.json
🚨 4. Write text in English only`}

${shouldIncludeLingo ? `Vite Config Template WITH Lingo:
\`\`\`typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import lingoCompiler from 'lingo.dev/compiler'

export default lingoCompiler.next({
  sourceLocale: 'en',
  targetLocales: ['es']
})(defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    allowedHosts: 'all',
    cors: true
  }
}))
\`\`\`` : `Vite Config Template WITHOUT Lingo (user requested no localization):
\`\`\`typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    allowedHosts: 'all',
    hmr: {
      port: 24678
    },
    cors: true
  },
  preview: {
    host: '0.0.0.0'
  }
})
\`\`\``}

Index.html Template (CRITICAL: Must have correct script src path):
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>App</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="src/main.tsx"></script>
</body>
</html>
\`\`\`

Main.tsx Template (Lingo works at build time, no runtime provider needed):
\`\`\`typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
\`\`\`

App.tsx Template with i18n (BEAUTIFUL STYLING):
\`\`\`typescript
"use i18n"
import React from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Welcome to My App
          </h1>
          <p className="text-xl text-gray-600">This text will be automatically translated</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <p className="text-gray-700 text-lg leading-relaxed">
            Your beautiful app content goes here with proper styling and modern design.
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
\`\`\`

Authentication Template (BEAUTIFUL STYLING - NO Lingo.dev to avoid build conflicts):
\`\`\`typescript
import React, { useState, useEffect } from 'react'

function App() {
  const [user, setUser] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Simple mock authentication using localStorage
  const login = (username, password) => {
    // Mock validation - in real app, this would call an API
    if (username && password) {
      const userData = { username, id: Date.now() }
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      setIsLoggedIn(true)
      return true
    }
    return false
  }

  const logout = () => {
    localStorage.removeItem('user')
    setUser(null)
    setIsLoggedIn(false)
  }

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
      setIsLoggedIn(true)
    }
  }, [])

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Welcome Back
              </h1>
              <p className="text-gray-600 mt-2">Sign in to your account</p>
            </div>
            <LoginForm onLogin={login} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome {user?.username}!
          </h1>
          <button 
            onClick={logout}
            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold py-2 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            Logout
          </button>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Your beautiful app content here */}
        </div>
      </div>
    </div>
  )
}

export default App
\`\`\`

Vite Config Template WITHOUT Lingo (for auth apps):
\`\`\`typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
\`\`\`

🎨 BEAUTIFUL UI/UX DESIGN REQUIREMENTS:

**COLOR SCHEMES:**
- Use modern gradients: bg-gradient-to-r from-blue-500 to-purple-600
- Apply glassmorphism: backdrop-blur-sm bg-white/10
- Use semantic colors: bg-green-500, bg-red-500, bg-blue-500, bg-yellow-500
- Apply dark/light themes with proper contrast

**TYPOGRAPHY:**
- Use font-weight hierarchy: font-bold, font-semibold, font-medium
- Apply proper text sizes: text-4xl, text-3xl, text-2xl, text-xl, text-lg
- Use text colors: text-white, text-gray-800, text-blue-600
- Apply text shadows: drop-shadow-lg

**LAYOUTS & SPACING:**
- Use proper containers: max-w-4xl mx-auto, max-w-2xl mx-auto
- Apply consistent padding: p-8, p-6, p-4, px-6 py-4
- Use margins: mb-8, mt-6, mx-auto
- Apply responsive design: sm:, md:, lg:, xl: breakpoints

**COMPONENTS:**
- Buttons: Use gradients, shadows, hover effects, rounded corners
- Cards: Use shadows (shadow-xl, shadow-lg), rounded corners (rounded-xl)
- Forms: Use proper focus states, borders, padding
- Navigation: Use modern navigation patterns

**ANIMATIONS & INTERACTIONS:**
- Hover effects: hover:scale-105, hover:shadow-lg
- Transitions: transition-all duration-300
- Focus states: focus:ring-2, focus:ring-blue-500
- Loading states: animate-spin, animate-pulse

**EXAMPLES OF BEAUTIFUL STYLING:**

Beautiful Button:
\`\`\`tsx
<button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
  Click Me
</button>
\`\`\`

Beautiful Card:
\`\`\`tsx
<div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
  <h2 className="text-2xl font-bold text-gray-800 mb-4">Card Title</h2>
  <p className="text-gray-600 leading-relaxed">Card content goes here...</p>
</div>
\`\`\`

Beautiful Form:
\`\`\`tsx
<div className="space-y-6">
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
    <input className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm" type="text" />
  </div>
  <button className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
    Submit
  </button>
</div>
\`\`\`

Beautiful Container:
\`\`\`tsx
<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
  <div className="max-w-4xl mx-auto px-6 py-12">
    <div className="text-center mb-12">
      <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
        App Title
      </h1>
      <p className="text-xl text-gray-600">Beautiful subtitle text</p>
    </div>
    {/* App content */}
  </div>
</div>
\`\`\`

**NEVER USE:**
- Basic HTML styling without Tailwind classes
- Plain white backgrounds without gradients or styling
- Unstyled buttons or forms
- Default browser styling
- Basic text without proper typography
- Poor spacing or layout

**ALWAYS INCLUDE:**
- Beautiful backgrounds with gradients or patterns
- Proper shadows and depth
- Consistent color schemes
- Modern typography
- Smooth animations and transitions
- Responsive design
- Professional spacing and layout
- Hover and focus states
- Loading and interaction feedback

**BEAUTIFUL UI GENERATION COMPLETE!**

The code generation system now includes comprehensive beautiful UI/UX guidelines:
- Modern gradients and backgrounds (bg-gradient-to-br from-blue-50 via-white to-purple-50)
- Professional shadows and depth (shadow-xl, shadow-2xl)
- Smooth animations and transitions (transition-all duration-300)
- Consistent typography and spacing (text-4xl font-bold, p-8, mb-6)
- Responsive design patterns (max-w-4xl mx-auto, px-6)
- Hover and focus states (hover:scale-105, focus:ring-2)
- Color schemes and visual hierarchy (bg-gradient-to-r from-blue-600 to-purple-600)

**GENERATED APPS WILL NOW BE BEAUTIFUL AND MODERN!**

🚨 PACKAGE.JSON TEMPLATE (CRITICAL - MUST include scripts section) 🚨:
\`\`\`json
{
  "name": "app-name",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "serve": "vite serve"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"${shouldIncludeLingo ? ',\n    "lingo.dev": "^0.112.0"' : ''}
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "typescript": "^5.2.2",
    "vite": "^5.0.8",
    "tailwindcss": "^3.3.6",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  }
}
\`\`\`
🚨 REMEMBER: The "scripts" section is REQUIRED for the app to run! 🚨

${shouldIncludeLingo ? `
🚨 FINAL REMINDER: User WANTS localization - include Lingo.dev, use lingoCompiler.next(), add "use i18n" directive` : `
🚨🚨🚨 FINAL REMINDER: User EXPLICITLY requested "NO LOCALIZATION" 🚨🚨🚨
🚨 DO NOT include "lingo.dev" in dependencies
🚨 DO NOT use lingoCompiler.next() in vite.config.ts
🚨 DO NOT add "use i18n" directive to App.tsx
🚨 Use standard Vite config without Lingo wrapper`}

🚨🚨🚨 CRITICAL: package.json MUST have "scripts" section with dev/build/serve commands! 🚨🚨🚨

${task.context.toLowerCase().includes('snake') ? `
🐍 BEAUTIFUL SNAKE GAME TEMPLATE (use this for snake games):
\`\`\`tsx
import React, { useState, useEffect, useRef } from 'react'
import './index.css'

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [snake, setSnake] = useState([{ x: 10, y: 10 }])
  const [food, setFood] = useState({ x: 15, y: 15 })
  const [direction, setDirection] = useState({ x: 0, y: 0 })
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)

  useEffect(() => {
    const context = canvasRef.current?.getContext('2d')
    if (context) {
      context.clearRect(0, 0, 400, 400)
      context.fillStyle = '#10b981'
      snake.forEach(({ x, y }) => context.fillRect(x * 20, y * 20, 18, 18))
      context.fillStyle = '#ef4444'
      context.fillRect(food.x * 20, food.y * 20, 18, 18)
    }
  }, [snake, food])

  const moveSnake = () => {
    if (gameOver) return
    const newSnake = [...snake]
    const head = { x: newSnake[0].x + direction.x, y: newSnake[0].y + direction.y }
    newSnake.unshift(head)

    if (head.x === food.x && head.y === food.y) {
      setFood({ x: Math.floor(Math.random() * 20), y: Math.floor(Math.random() * 20) })
      setScore(score + 1)
    } else {
      newSnake.pop()
    }

    if (head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 20 || 
        newSnake.slice(1).some(s => s.x === head.x && s.y === head.y)) {
      setGameOver(true)
    } else {
      setSnake(newSnake)
    }
  }

  useEffect(() => {
    const interval = setInterval(moveSnake, 200)
    return () => clearInterval(interval)
  }, [snake, direction, gameOver])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (gameOver) return
    switch (e.key) {
      case 'ArrowUp': if (direction.y === 0) setDirection({ x: 0, y: -1 }); break
      case 'ArrowDown': if (direction.y === 0) setDirection({ x: 0, y: 1 }); break
      case 'ArrowLeft': if (direction.x === 0) setDirection({ x: -1, y: 0 }); break
      case 'ArrowRight': if (direction.x === 0) setDirection({ x: 1, y: 0 }); break
    }
  }

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }])
    setFood({ x: 15, y: 15 })
    setDirection({ x: 0, y: 0 })
    setScore(0)
    setGameOver(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50" tabIndex={0} onKeyDown={handleKeyDown}>
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-8 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          Snake Game
        </h1>
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-4">
          <p className="text-gray-700 text-lg mb-4">Score: {score}</p>
          <canvas ref={canvasRef} width={400} height={400} className="bg-gray-900 rounded-lg shadow-lg border-2 border-gray-300"></canvas>
        </div>
        {gameOver && (
          <div className="mt-4">
            <p className="text-red-500 text-2xl font-bold mb-4">Game Over!</p>
            <button onClick={resetGame} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
              Restart Game
            </button>
          </div>
        )}
        <p className="text-gray-600 mt-4">Use arrow keys to play!</p>
      </div>
    </div>
  )
}

export default App
\`\`\`
🐍 Use this template for snake games - it has beautiful styling! 🐍` : ''}

${isTetrisRequest ? `
🎮 BEAUTIFUL TETRIS GAME TEMPLATE (use this for tetris games):
\`\`\`tsx
import React, { useState, useEffect, useRef, useCallback } from 'react'
import './index.css'

const BOARD_WIDTH = 10
const BOARD_HEIGHT = 20
const BLOCK_SIZE = 30

const TETROMINOS = {
  I: { shape: [[1, 1, 1, 1]], color: 'bg-cyan-500' },
  O: { shape: [[1, 1], [1, 1]], color: 'bg-yellow-500' },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: 'bg-purple-500' },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: 'bg-green-500' },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: 'bg-red-500' },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: 'bg-blue-500' },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: 'bg-orange-500' }
}

function App() {
  const [board, setBoard] = useState(Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0)))
  const [currentPiece, setCurrentPiece] = useState<any>(null)
  const [position, setPosition] = useState({ x: 4, y: 0 })
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  const getRandomPiece = () => {
    const pieces = Object.keys(TETROMINOS)
    const randomPiece = pieces[Math.floor(Math.random() * pieces.length)]
    return TETROMINOS[randomPiece as keyof typeof TETROMINOS]
  }

  const checkCollision = useCallback((piece: any, pos: { x: number; y: number }) => {
    if (!piece) return false
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = pos.x + x
          const newY = pos.y + y
          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) return true
          if (newY >= 0 && board[newY][newX]) return true
        }
      }
    }
    return false
  }, [board])

  const mergePiece = useCallback(() => {
    if (!currentPiece) return
    const newBoard = board.map(row => [...row])
    currentPiece.shape.forEach((row: number[], y: number) => {
      row.forEach((value, x) => {
        if (value) {
          const boardY = position.y + y
          const boardX = position.x + x
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            newBoard[boardY][boardX] = currentPiece.color
          }
        }
      })
    })
    setBoard(newBoard)
    
    // Check for completed lines
    let linesCleared = 0
    const clearedBoard = newBoard.filter(row => {
      if (row.every(cell => cell !== 0)) {
        linesCleared++
        return false
      }
      return true
    })
    while (clearedBoard.length < BOARD_HEIGHT) {
      clearedBoard.unshift(Array(BOARD_WIDTH).fill(0))
    }
    if (linesCleared > 0) {
      setBoard(clearedBoard)
      setScore(s => s + linesCleared * 100)
    }
  }, [currentPiece, position, board])

  const rotatePiece = useCallback(() => {
    if (!currentPiece || isPaused || gameOver) return
    const rotated = currentPiece.shape[0].map((_: any, i: number) =>
      currentPiece.shape.map((row: number[]) => row[i]).reverse()
    )
    const rotatedPiece = { ...currentPiece, shape: rotated }
    if (!checkCollision(rotatedPiece, position)) {
      setCurrentPiece(rotatedPiece)
    }
  }, [currentPiece, position, checkCollision, isPaused, gameOver])

  const moveDown = useCallback(() => {
    if (!currentPiece || isPaused || gameOver) return
    const newPos = { ...position, y: position.y + 1 }
    if (checkCollision(currentPiece, newPos)) {
      mergePiece()
      const newPiece = getRandomPiece()
      const startPos = { x: 4, y: 0 }
      if (checkCollision(newPiece, startPos)) {
        setGameOver(true)
      } else {
        setCurrentPiece(newPiece)
        setPosition(startPos)
      }
    } else {
      setPosition(newPos)
    }
  }, [currentPiece, position, checkCollision, mergePiece, isPaused, gameOver])

  const moveHorizontal = useCallback((dir: number) => {
    if (!currentPiece || isPaused || gameOver) return
    const newPos = { ...position, x: position.x + dir }
    if (!checkCollision(currentPiece, newPos)) {
      setPosition(newPos)
    }
  }, [currentPiece, position, checkCollision, isPaused, gameOver])

  useEffect(() => {
    if (!currentPiece && !gameOver) {
      setCurrentPiece(getRandomPiece())
    }
  }, [currentPiece, gameOver])

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPaused && !gameOver) moveDown()
    }, 500)
    return () => clearInterval(interval)
  }, [moveDown, isPaused, gameOver])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameOver || isPaused) return
      if (e.key === 'ArrowLeft') moveHorizontal(-1)
      if (e.key === 'ArrowRight') moveHorizontal(1)
      if (e.key === 'ArrowDown') moveDown()
      if (e.key === 'ArrowUp' || e.key === ' ') rotatePiece()
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [moveHorizontal, moveDown, rotatePiece, gameOver, isPaused])

  const renderBoard = () => {
    const display = board.map(row => [...row])
    if (currentPiece) {
      currentPiece.shape.forEach((row: number[], y: number) => {
        row.forEach((value, x) => {
          if (value) {
            const boardY = position.y + y
            const boardX = position.x + x
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              display[boardY][boardX] = currentPiece.color
            }
          }
        })
      })
    }
    return display
  }

  const restart = () => {
    setBoard(Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0)))
    setCurrentPiece(null)
    setPosition({ x: 4, y: 0 })
    setScore(0)
    setGameOver(false)
    setIsPaused(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
        <h1 className="text-5xl font-bold text-center mb-6 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
          Tetris Game
        </h1>
        
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="bg-black/30 rounded-xl p-4 border-4 border-purple-500/50 shadow-xl">
            <div className="grid gap-0.5" style={{ gridTemplateColumns: \`repeat(\${BOARD_WIDTH}, \${BLOCK_SIZE}px)\` }}>
              {renderBoard().map((row, y) =>
                row.map((cell, x) => (
                  <div
                    key={\`\${y}-\${x}\`}
                    className={\`\${cell || 'bg-gray-900/50'} border border-gray-800/30 transition-all duration-100\`}
                    style={{ width: BLOCK_SIZE, height: BLOCK_SIZE }}
                  />
                ))
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 min-w-[200px]">
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 backdrop-blur border border-white/10">
              <p className="text-white/70 text-sm mb-1">Score</p>
              <p className="text-4xl font-bold text-white">{score}</p>
            </div>

            <div className="bg-white/10 rounded-xl p-4 backdrop-blur border border-white/10">
              <p className="text-white/90 text-sm mb-3 font-semibold">Controls</p>
              <div className="text-white/70 text-xs space-y-1">
                <p>← → Move</p>
                <p>↓ Drop faster</p>
                <p>↑ / Space Rotate</p>
              </div>
            </div>

            {gameOver && (
              <div className="bg-red-500/20 border-2 border-red-500 rounded-xl p-4 backdrop-blur">
                <p className="text-white font-bold mb-3">Game Over!</p>
                <button
                  onClick={restart}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-all transform hover:scale-105"
                >
                  Play Again
                </button>
              </div>
            )}

            {!gameOver && (
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-all transform hover:scale-105"
              >
                {isPaused ? '▶ Resume' : '⏸ Pause'}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-white/50 text-sm mt-6">
          Clear lines to score points! 🎮
        </p>
      </div>
    </div>
  )
}

export default App
\`\`\`
🎮 Use this template for tetris games - it has beautiful styling and full game logic! 🎮` : ''}

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

