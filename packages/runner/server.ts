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
    
    // Check for dev/start/serve script and Vite
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'))
    const devScript = packageJson.scripts?.dev || packageJson.scripts?.start || packageJson.scripts?.serve
    const isViteProject = packageJson.devDependencies?.vite || packageJson.dependencies?.vite

    logger.debug('Package.json analysis:', {
      hasDevScript: !!packageJson.scripts?.dev,
      hasStartScript: !!packageJson.scripts?.start,
      hasServeScript: !!packageJson.scripts?.serve,
      devScript,
      isViteProject,
      viteInDevDeps: !!packageJson.devDependencies?.vite,
      viteInDeps: !!packageJson.dependencies?.vite
    })

    if (!devScript) {
      errors.push('No dev, start, or serve script found in package.json')
      return { success: false, logs, errors }
    }
    
    // For Vite projects, run the dev server directly
    if (isViteProject) {
      logger.job(jobId, 'Starting Vite dev server...')

      // Install dependencies first
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

      // Start Vite dev server (use the detected script name)
      const port = 3000 + Math.floor(Math.random() * 1000)
      const url = `http://localhost:${port}`

      // Use the script name that was detected (dev, start, or serve)
      const scriptName = packageJson.scripts?.dev ? 'dev' :
                        packageJson.scripts?.start ? 'start' : 'serve'

      const devProcess = spawn('bun', ['run', scriptName, '--port', port.toString(), '--host', '0.0.0.0'], {
        cwd: sandboxPath,
        shell: true,
      })

      let serverReady = false
      let processExited = false
      let exitCode: number | null = null

      // Monitor process exit
      devProcess.on('close', (code) => {
        processExited = true
        exitCode = code
        if (code !== 0) {
          logs.push(`[DEV] Process exited with code ${code}`)
        }
      })

      devProcess.stdout?.on('data', (data) => {
        const output = data.toString()
        logs.push(`[DEV] ${output}`)
        // Vite is ready when it shows "Local:" or "ready in"
        if (output.includes('Local:') || output.includes('ready in') || output.includes('localhost')) {
          serverReady = true
        }
      })

      devProcess.stderr?.on('data', (data) => {
        const output = data.toString()
        logs.push(`[DEV] ${output}`)
        // Some Vite output goes to stderr
        if (output.includes('Local:') || output.includes('ready in') || output.includes('localhost')) {
          serverReady = true
        }
        // Check for import resolution errors in stderr
        if (output.includes('Failed to resolve import') || 
            output.includes('Could not resolve') ||
            output.includes('Module not found') ||
            output.includes('Cannot resolve module') ||
            output.includes('The following dependencies are imported but could not be resolved')) {
          // Don't set serverReady to true if there are import errors
          logs.push(`[DEV] Import error detected: ${output.trim()}`)
        }
      })

      // Wait for server to be ready
      const maxWaitTime = 20000 // 20 seconds max for dev server
      const startTime = Date.now()

      while (!serverReady && !processExited && (Date.now() - startTime) < maxWaitTime) {
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Check if process exited unexpectedly
        if (processExited && exitCode !== 0) {
          const errMsg = `Vite dev server process exited with code ${exitCode}`
          logger.error(errMsg)
          errors.push(errMsg)
          return {
            success: false,
            logs,
            errors,
          }
        }

        // Check for import errors in logs during wait
        const hasImportErrorsInLogs = logs.some(log => 
          log.includes('Failed to resolve import') ||
          log.includes('Could not resolve') ||
          log.includes('Module not found') ||
          log.includes('Cannot resolve module') ||
          log.includes('The following dependencies are imported but could not be resolved')
        )

        if (hasImportErrorsInLogs) {
          const errMsg = 'Vite dev server has import resolution errors (detected during startup)'
          logger.error(errMsg)
          errors.push(errMsg)
          try { 
            logger.warn('Killing dev process due to import errors during startup')
            devProcess.kill() } 
          catch {
            logger.warn('Failed to kill dev process')
          }
          return {
            success: false,
            logs,
            errors,
          }
        }

        // Try to connect to the port
        try {
          const response = await fetch(url, { signal: AbortSignal.timeout(1500), method: 'HEAD' })
          if (response.ok) {
            serverReady = true
            break
          }
        } catch (e) {
          // Server not ready yet, continue waiting
        }
      }

      if (!serverReady) {
        if (processExited) {
          const errMsg = `Vite dev server process exited before becoming ready (exit code: ${exitCode})`
          logger.error(errMsg)
          errors.push(errMsg)
          return {
            success: false,
            logs,
            errors,
          }
        } else {
          logger.warn(`Dev server may not be fully ready after ${maxWaitTime}ms, proceeding anyway`)
          logger.warn('Dev server logs:', logs.slice(-10)) // Show last 10 logs
        }
      }

      // Check for import errors in the logs before proceeding
      const hasImportErrorsInLogs = logs.some(log => 
        log.includes('Failed to resolve import') ||
        log.includes('Could not resolve') ||
        log.includes('Module not found') ||
        log.includes('Cannot resolve module') ||
        log.includes('The following dependencies are imported but could not be resolved')
      )

      if (hasImportErrorsInLogs) {
        const errMsg = 'Vite dev server has import resolution errors'
        logger.error(errMsg)
        errors.push(errMsg)
        try { 
          logger.warn('Killing dev process due to import errors in logs')
          devProcess.kill() } 
        catch {
          logger.warn('Failed to kill dev process')
        }
        return {
          success: false,
          logs,
          errors,
        }
      }

      // Post-start validation: ensure the app serves a valid entry without 500s
      const validateStart = Date.now()
      const validateTimeoutMs = 30000
      let validated = false
      let hasImportErrors = false
      
      while (!validated && (Date.now() - validateStart) < validateTimeoutMs) {
        try {
          const res = await fetch(url + '/', { signal: AbortSignal.timeout(1500) })
          if (!res.ok) {
            logs.push(`[CHECK] / -> ${res.status}`)
          } else {
            const html = await res.text()
            const m = html.match(/<script[^>]*type="module"[^>]*src="([^"]+)"/i)
            const scriptSrc = m?.[1]
            if (scriptSrc) {
              try {
                const scriptRes = await fetch(url + scriptSrc, { signal: AbortSignal.timeout(1500) })
                if (scriptRes.ok) {
                  const scriptContent = await scriptRes.text()
                  // Check for import resolution errors in the script content
                  if (scriptContent.includes('Failed to resolve import') || 
                      scriptContent.includes('Could not resolve') ||
                      scriptContent.includes('Module not found') ||
                      scriptContent.includes('Cannot resolve module')) {
                    logs.push(`[CHECK] Import errors detected in ${scriptSrc}`)
                    hasImportErrors = true
                    break
                  }
                  validated = true
                  break
                } else {
                  logs.push(`[CHECK] ${scriptSrc} -> ${scriptRes.status}`)
                }
              } catch (e) {
                logs.push(`[CHECK] ${scriptSrc} -> fetch error`)
              }
            } else {
              logs.push('[CHECK] No module script found in index.html, trying /src/main.tsx')
              try {
                const fallbackRes = await fetch(url + '/src/main.tsx', { signal: AbortSignal.timeout(1500) })
                if (fallbackRes.ok) {
                  const scriptContent = await fallbackRes.text()
                  // Check for import resolution errors in the script content
                  if (scriptContent.includes('Failed to resolve import') || 
                      scriptContent.includes('Could not resolve') ||
                      scriptContent.includes('Module not found') ||
                      scriptContent.includes('Cannot resolve module')) {
                    logs.push(`[CHECK] Import errors detected in /src/main.tsx`)
                    hasImportErrors = true
                    break
                  }
                  validated = true
                  break
                } else {
                  logs.push(`[CHECK] /src/main.tsx -> ${fallbackRes.status}`)
                }
              } catch (e) {
                logs.push('[CHECK] /src/main.tsx -> fetch error')
              }
            }
          }
        } catch (e) {
          logs.push('[CHECK] GET / failed')
        }
        if (!validated) await new Promise(r => setTimeout(r, 500))
      }

      // Check for Vite import errors in the logs
      const recentLogs = logs.slice(-20) // Check last 20 log entries
      const hasViteImportErrors = recentLogs.some(log => 
        log.includes('Failed to resolve import') ||
        log.includes('Could not resolve') ||
        log.includes('Module not found') ||
        log.includes('Cannot resolve module') ||
        log.includes('The following dependencies are imported but could not be resolved')
      )

      if (hasImportErrors || hasViteImportErrors) {
        const errMsg = 'Validation failed: Vite import resolution errors detected'
        logger.error(errMsg)
        errors.push(errMsg)
        try { 
          logger.warn('Killing dev process due to import errors')
          devProcess.kill() } 
        catch {
          logger.warn('Failed to kill dev process')
        }
        return {
          success: false,
          logs,
          errors,
        }
      }

      if (!validated) {
        // Check if this might be a dependency issue
        const hasDependencyErrors = logs.some(log => 
          log.includes('Failed to resolve dependency') ||
          log.includes('Could not resolve') ||
          log.includes('Module not found') ||
          log.includes('Cannot resolve module')
        )
        
        let errMsg = 'Validation failed: main entry not served (e.g., / and module script did not return 2xx)'
        if (hasDependencyErrors) {
          errMsg = 'Validation failed: Vite server cannot resolve dependencies (check package.json for missing dependencies)'
        }
        
        logger.error(errMsg)
        errors.push(errMsg)
        try { 
          logger.warn('Killing dev process')
          devProcess.kill() } 
        catch {
          logger.warn('Failed to kill dev process')
        }
        return {
          success: false,
          logs,
          errors,
        }
      }

      return {
        success: true,
        url,
        process: devProcess,
        logs,
        errors,
      }
    }

    // For non-Vite projects, build and serve static files
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

    // Build the app
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
      if (output.includes('Serving HTTP') || output.includes('port')) {
        serverReady = true
      }
    })

    serverProcess.stderr?.on('data', (data) => {
      const output = data.toString()
      logs.push(`[SERVER] ${output}`)
      if (output.includes('Serving HTTP') || output.includes('port')) {
        serverReady = true
      }
    })

    // Wait for server to be ready
    const maxWaitTime = 5000 // 5 seconds max for static server
    const startTime = Date.now()

    while (!serverReady && (Date.now() - startTime) < maxWaitTime) {
      await new Promise((resolve) => setTimeout(resolve, 200))

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
    logger.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    errors.push(errorMsg)
    return { success: false, logs, errors }
  }
}

