/**
 * Codegen-specific prompts and templates
 */

export const PACKAGE_JSON_TEMPLATE = `
🚨 PACKAGE.JSON TEMPLATE (CRITICAL - MUST include scripts section) 🚨:

\`\`\`json
{
  "name": "{{APP_NAME}}",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6",
    "typescript": "^5.2.2",
    "vite": "^5.0.8"{{LINGO_DEPENDENCY}}
  }
}
\`\`\`
`

export const VITE_CONFIG_TEMPLATE = `
Vite Config Template (vite.config.ts):

\`\`\`ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
{{LINGO_IMPORT}}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(){{LINGO_PLUGIN}}],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    cors: true,
    middlewareMode: false,
    allowedHosts: ['localhost', '.ngrok-free.dev', '.trycloudflare.com'],
    hmr: {
      overlay: false,
    },
    fs: {
      strict: false
    }
  }
})
\`\`\`
`

export const TSCONFIG_NODE_TEMPLATE = `
TypeScript Node Config Template (tsconfig.node.json):

\`\`\`json
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
\`\`\`
`

export const VITE_CONFIG_WITH_LINGO = `
Vite Config Template WITH Lingo (robust optional import):

\`\`\`ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(async () => {
  let lingoCompiler: any
  try {
    // Avoid static resolution by bundlers
    const dynamicImport = new Function('m', 'return import(m)') as (m: string) => Promise<any>
    const mod = await dynamicImport('lingo.dev')
    lingoCompiler = (mod as any)?.lingoCompiler
  } catch {
    // Lingo not available or resolution failed; continue without it
  }

  return {
    plugins: [
      react(),
      lingoCompiler?.next ? lingoCompiler.next() : undefined,
    ].filter(Boolean),
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: false,
      cors: true,
      middlewareMode: false,
      allowedHosts: ['localhost', '.ngrok-free.dev', '.trycloudflare.com'],
      hmr: {
        overlay: false,
      },
      fs: {
        strict: false
      }
    }
  }
})
\`\`\`
`

export const VITE_CONFIG_WITHOUT_LINGO = `
Vite Config Template WITHOUT Lingo (user requested no localization):

\`\`\`ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    cors: true,
    middlewareMode: false,
    allowedHosts: ['localhost', '.ngrok-free.dev', '.trycloudflare.com'],
    hmr: {
      overlay: false,
    },
    fs: {
      strict: false
    }
  }
})
\`\`\`
`

export const INDEX_HTML_TEMPLATE = `
Index.html Template (CRITICAL: Must have correct script src path):

\`\`\`html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{APP_TITLE}}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
\`\`\`
`

export const MAIN_TSX_TEMPLATE = `
Main.tsx Template (Lingo works at build time, no runtime provider needed):

\`\`\`tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
\`\`\`
`

export const APP_TSX_TEMPLATE = `
App.tsx Template with i18n (BEAUTIFUL STYLING):

\`\`\`tsx
"use i18n"
import React from 'react'

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            {{APP_TITLE}}
          </h1>
          <p className="text-white/70 text-lg">
            {{APP_DESCRIPTION}}
          </p>
        </div>
      </div>
    </div>
  )
}
\`\`\`
`

export const AUTH_TEMPLATE = `
Authentication Template (BEAUTIFUL STYLING - NO Lingo.dev to avoid build conflicts):

\`\`\`tsx
import React, { useState } from 'react'

export default function App() {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle authentication logic here
    console.log('Form submitted:', formData)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-white/70">
            {isLogin ? 'Sign in to your account' : 'Join us today'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Email address"
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              required
            />
          </div>

          <div>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Password"
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm password"
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-xl font-bold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-white/70 hover:text-white transition-colors duration-200"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  )
}
\`\`\`
`

export const POSTCSS_CONFIG_TEMPLATE = `
PostCSS Config Template (postcss.config.js):

\`\`\`js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
\`\`\`
`

export const TAILWIND_CONFIG_TEMPLATE = `
Tailwind Config Template (tailwind.config.js):

\`\`\`js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
\`\`\`
`

export const TSCONFIG_TEMPLATE = `
TSConfig Template (tsconfig.json - 🚨 NO "references" field):

\`\`\`json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
\`\`\`
`

export const INDEX_CSS_TEMPLATE = `
Index.css Template (Tailwind CSS):

\`\`\`css
@tailwind base;
@tailwind components;
@tailwind utilities;
\`\`\`
`
