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
    
    // Install dependencies first
    logger.job(jobId, 'Installing dependencies...')
    const installProcess = spawn('bun', ['install'], {
      cwd: sandboxPath,
      shell: true,
    })
    
    let installSuccess = false
    await new Promise<void>((resolve, reject) => {
      installProcess.on('close', (code) => {
        if (code === 0) {
          installSuccess = true
          resolve()
        } else {
          reject(new Error(`Dependency installation failed with code ${code}`))
        }
      })
    })
    
    if (!installSuccess) {
      errors.push('Dependency installation failed')
      return { success: false, logs, errors }
    }
    
    // Build the app, then serve static files
    logger.job(jobId, 'Building app...')
    const buildProcess = spawn('bun', ['run', 'build'], {
      cwd: sandboxPath,
      shell: true,
    })
    
    let buildSuccess = false
    const buildLogs: string[] = []
    
    buildProcess.stdout?.on('data', (data) => {
      const output = data.toString()
      buildLogs.push(output)
      logs.push(`[BUILD] ${output}`)
    })
    
    buildProcess.stderr?.on('data', (data) => {
      const output = data.toString()
      buildLogs.push(output)
      logs.push(`[BUILD] ${output}`)
    })
    
    // Wait for build to complete
    await new Promise<void>((resolve, reject) => {
      buildProcess.on('close', (code) => {
        if (code === 0) {
          buildSuccess = true
          resolve()
        } else {
          reject(new Error(`Build failed with code ${code}`))
        }
      })
    })
    
    if (!buildSuccess) {
      errors.push('Build failed')
      return { success: false, logs, errors }
    }
    
    // Check if dist folder exists
    const distPath = join(sandboxPath, 'dist')
    try {
      await access(distPath)
    } catch {
      errors.push('Build completed but dist folder not found')
      return { success: false, logs, errors }
    }
    
    // Start static file server
    const port = 3000 + Math.floor(Math.random() * 1000)
    const url = `http://localhost:${port}`
    
    const serverProcess = spawn('python3', ['-m', 'http.server', port.toString(), '--bind', '0.0.0.0'], {
      cwd: distPath,
      shell: true,
    })
    
    let serverReady = false
    
    serverProcess.stdout?.on('data', (data) => {
      const output = data.toString()
      logs.push(`[SERVER] ${output}`)
      // Python http.server is ready when it starts listening
      if (output.includes('Serving HTTP') || output.includes('port')) {
        serverReady = true
      }
    })
    
    serverProcess.stderr?.on('data', (data) => {
      const output = data.toString()
      logs.push(`[SERVER] ${output}`)
      // Python http.server logs to stderr, but it's not an error
      if (output.includes('Serving HTTP') || output.includes('port')) {
        serverReady = true
      }
    })
    
    // Wait for server to be ready
    const maxWaitTime = 5000 // 5 seconds max for static server
    const startTime = Date.now()
    
    while (!serverReady && (Date.now() - startTime) < maxWaitTime) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      
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
      logger.warn(`Static server may not be fully ready after ${maxWaitTime}ms, proceeding anyway`)
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

