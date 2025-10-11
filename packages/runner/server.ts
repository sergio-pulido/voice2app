/**
 * App server
 */

import { logger } from '../shared'
import { spawn } from 'child_process'
import { readFile, access } from 'fs/promises'
import { join } from 'path'

interface ServeResult {
  success: boolean
  url?: string
  process?: any
  logs: string[]
  errors: string[]
}

export async function serveApp(sandboxPath: string, jobId: string): Promise<ServeResult> {
  logger.job(jobId, 'Starting server...')
  
  const logs: string[] = []
  const errors: string[] = []
  
  try {
    // Check if package.json exists
    const packageJsonPath = join(sandboxPath, 'package.json')
    let hasPackageJson = false
    
    try {
      await access(packageJsonPath)
      hasPackageJson = true
    } catch {
      // No package.json, serve static HTML
    }
    
    if (!hasPackageJson) {
      // Serve static HTML with Bun's built-in server
      const port = 3000 + Math.floor(Math.random() * 1000)
      const url = `http://localhost:${port}`
      
      const serverProcess = Bun.serve({
        port,
        fetch: async (req) => {
          const filePath = join(sandboxPath, 'index.html')
          const file = Bun.file(filePath)
          return new Response(file)
        },
      })
      
      logs.push(`Static server started on ${url}`)
      
      return {
        success: true,
        url,
        process: { kill: () => serverProcess.stop() },
        logs,
        errors,
      }
    }
    
    // Check for dev/start script
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'))
    const devScript = packageJson.scripts?.dev || packageJson.scripts?.start
    
    if (!devScript) {
      errors.push('No dev or start script found in package.json')
      return { success: false, logs, errors }
    }
    
    // Start dev server
    const port = 3000 + Math.floor(Math.random() * 1000)
    const env = { ...process.env, PORT: port.toString() }
    
    const serverProcess = spawn('bun', ['run', 'dev'], {
      cwd: sandboxPath,
      env,
      shell: true,
    })
    
    serverProcess.stdout?.on('data', (data) => {
      logs.push(data.toString())
    })
    
    serverProcess.stderr?.on('data', (data) => {
      errors.push(data.toString())
    })
    
    // Wait for server to be ready (simple timeout)
    await new Promise((resolve) => setTimeout(resolve, 3000))
    
    const url = `http://localhost:${port}`
    
    return {
      success: true,
      url,
      process: serverProcess,
      logs,
      errors,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown server error'
    logger.error('Server error:', errorMsg)
    errors.push(errorMsg)
    return { success: false, logs, errors }
  }
}

