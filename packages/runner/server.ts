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
    
    // Start dev server with Vite
    // Vite uses port 5173 by default, or we can configure it
    const port = 3000 + Math.floor(Math.random() * 1000)
    
    const serverProcess = spawn('bun', ['run', 'dev', '--port', port.toString(), '--host', 'localhost'], {
      cwd: sandboxPath,
      shell: true,
    })
    
    let serverReady = false
    const url = `http://localhost:${port}`
    
    serverProcess.stdout?.on('data', (data) => {
      const output = data.toString()
      logs.push(output)
      // Detect when Vite is ready
      if (output.includes('Local:') || output.includes('localhost') || output.includes('ready in')) {
        serverReady = true
      }
    })
    
    serverProcess.stderr?.on('data', (data) => {
      errors.push(data.toString())
    })
    
    // Wait for server to be ready with exponential backoff
    const maxWaitTime = 15000 // 15 seconds max
    const startTime = Date.now()
    
    while (!serverReady && (Date.now() - startTime) < maxWaitTime) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      
      // Also try to connect to the port
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(1000) })
        if (response.ok || response.status === 200) {
          serverReady = true
          break
        }
      } catch (e) {
        // Server not ready yet, continue waiting
      }
    }
    
    if (!serverReady) {
      logger.warn(`Server may not be fully ready after ${maxWaitTime}ms, proceeding anyway`)
    }
    
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

