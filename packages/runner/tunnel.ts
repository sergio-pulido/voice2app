/**
 * Ngrok Tunnel Manager
 * Creates public URLs for localhost apps
 */

import { spawn, type ChildProcess } from 'child_process'
import { logger } from '../shared'

interface TunnelResult {
  success: boolean
  publicUrl?: string
  process?: ChildProcess
  error?: string
}

const activeTunnels = new Map<string, { url: string; process: ChildProcess }>()

/**
 * Create a cloudflared tunnel (no auth required!)
 */
async function createCloudflaredTunnel(port: string, jobId: string): Promise<TunnelResult> {
  try {
    logger.job(jobId, `Creating cloudflared tunnel for port ${port}...`)
    
    const cfProcess = spawn('cloudflared', ['tunnel', '--url', `http://localhost:${port}`, '--no-autoupdate'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false, // Keep the process attached to prevent it from closing
      killSignal: 'SIGTERM' // Use SIGTERM instead of SIGKILL for graceful shutdown
    })
    
    // Add process error handling
    cfProcess.on('error', (error) => {
      logger.error(`Cloudflared process error:`, error)
    })
    
    cfProcess.on('exit', (code, signal) => {
      logger.warn(`Cloudflared process exited with code ${code}, signal ${signal}`)
      activeTunnels.delete(jobId)
    })
    
    // Wait for cloudflared to provide the public URL
    const publicUrl = await new Promise<string>((resolve, reject) => {
      let output = ''
      const timeout = setTimeout(() => {
        reject(new Error('Cloudflared tunnel creation timeout'))
      }, 15000) // 15 second timeout
      
      cfProcess.stderr?.on('data', (data) => {
        output += data.toString()
        
        // Look for the public URL in cloudflared output
        // Format: "https://xxxx.trycloudflare.com"
        const urlMatch = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i)
        
        if (urlMatch) {
          clearTimeout(timeout)
          resolve(urlMatch[0])
        }
      })
      
      cfProcess.on('error', (error) => {
        clearTimeout(timeout)
        reject(error)
      })
    })
    
    activeTunnels.set(jobId, { url: publicUrl, process: cfProcess })
    logger.success(`🌐 Public URL: ${publicUrl}`)
    
    // Give tunnel time to stabilize
    logger.job(jobId, 'Waiting for tunnel to stabilize...')
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Verify tunnel is working by testing the public URL
    logger.job(jobId, 'Verifying tunnel connectivity...')
    try {
      const response = await fetch(publicUrl, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })
      
      if (response.ok || response.status === 200) {
        logger.success(`✅ Tunnel verified and working`)
        return {
          success: true,
          publicUrl,
          process: cfProcess
        }
      } else {
        logger.warn(`⚠️ Tunnel created but returned status ${response.status}`)
        return {
          success: true, // Still return success as tunnel was created
          publicUrl,
          process: cfProcess
        }
      }
    } catch (error) {
      logger.warn(`⚠️ Tunnel created but verification failed: ${error}`)
      // Still return success as tunnel was created, but log the warning
      return {
        success: true,
        publicUrl,
        process: cfProcess
      }
    }
  } catch (error: any) {
    logger.error(`Failed to create cloudflared tunnel:`, error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Create an ngrok tunnel for a localhost URL
 */
async function createNgrokTunnel(port: string, jobId: string): Promise<TunnelResult> {
  try {
    logger.job(jobId, `Creating ngrok tunnel for port ${port}...`)
    
    const ngrokProcess = spawn('ngrok', ['http', port, '--log=stdout', '--region=us'], {
      stdio: ['ignore', 'pipe', 'pipe']
    })
    
    // Wait for ngrok to start, then get URL from API
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        ngrokProcess.kill()
        reject(new Error('Ngrok tunnel creation timeout'))
      }, 15000) // 15 second timeout
      
      ngrokProcess.stderr?.on('data', (data) => {
        const error = data.toString()
        if (error.includes('ERR_NGROK_4018') || error.includes('authtoken')) {
          clearTimeout(timeout)
          ngrokProcess.kill()
          reject(new Error(`Ngrok authentication required`))
        } else if (error.includes('ERR_NGROK_334') || error.includes('already online')) {
          clearTimeout(timeout)
          ngrokProcess.kill()
          reject(new Error(`Ngrok endpoint already online - using cloudflared`))
        }
      })
      
      // Wait for ngrok to be ready
      setTimeout(() => {
        clearTimeout(timeout)
        resolve()
      }, 3000) // Give ngrok 3 seconds to start
      
      ngrokProcess.on('error', (error) => {
        clearTimeout(timeout)
        reject(error)
      })
      
      ngrokProcess.on('exit', (code) => {
        if (code !== 0) {
          clearTimeout(timeout)
          reject(new Error(`Ngrok process exited with code ${code}`))
        }
      })
    })
    
    // Get the public URL from ngrok API
    const publicUrl = await new Promise<string>((resolve, reject) => {
      const apiTimeout = setTimeout(() => {
        reject(new Error('Failed to get ngrok URL from API'))
      }, 5000)
      
      // Try to get URL from ngrok API
      const checkApi = async () => {
        try {
          const response = await fetch('http://localhost:4040/api/tunnels')
          if (response.ok) {
            const data = await response.json()
            const tunnels = data.tunnels || []
            const httpsTunnel = tunnels.find((t: any) => t.proto === 'https')
            if (httpsTunnel && httpsTunnel.public_url) {
              clearTimeout(apiTimeout)
              resolve(httpsTunnel.public_url)
              return
            }
          }
        } catch (error) {
          // API not ready yet, try again
        }
        
        // Retry after 500ms
        setTimeout(checkApi, 500)
      }
      
      checkApi()
    })
    
    activeTunnels.set(jobId, { url: publicUrl, process: ngrokProcess })
    logger.success(`🌐 Public URL: ${publicUrl}`)
    
    return {
      success: true,
      publicUrl,
      process: ngrokProcess
    }
  } catch (error: any) {
    logger.warn(`Ngrok failed:`, error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Create a public tunnel (tries ngrok first, falls back to cloudflared)
 */
export async function createTunnel(localUrl: string, jobId: string): Promise<TunnelResult> {
  try {
    // Extract port from URL
    const port = new URL(localUrl).port
    
    if (!port) {
      return { success: false, error: 'No port found in URL' }
    }
    
    // Try ngrok first (if configured)
    const ngrokResult = await createNgrokTunnel(port, jobId)
    if (ngrokResult.success) {
      return ngrokResult
    }
    
    // Fall back to cloudflared (no auth needed)
    logger.info(`Falling back to cloudflared tunnel...`)
    const cfResult = await createCloudflaredTunnel(port, jobId)
    if (cfResult.success) {
      return cfResult
    }
    
    return {
      success: false,
      error: 'All tunnel methods failed'
    }
    
  } catch (error: any) {
    logger.error(`Failed to create tunnel:`, error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Stop a tunnel
 */
export function stopTunnel(jobId: string): boolean {
  const tunnel = activeTunnels.get(jobId)
  
  if (tunnel) {
    try {
      tunnel.process.kill('SIGTERM')
      // Give process time to exit gracefully
      setTimeout(() => {
        if (!tunnel.process.killed) {
          tunnel.process.kill('SIGKILL')
        }
      }, 5000)
      activeTunnels.delete(jobId)
      logger.info(`Stopped tunnel for job ${jobId}`)
      return true
    } catch (error) {
      logger.error(`Failed to stop tunnel for job ${jobId}:`, error)
      return false
    }
  }
  
  return false
}

/**
 * Clean up all active tunnels
 */
export function cleanupAllTunnels(): void {
  logger.info(`Cleaning up ${activeTunnels.size} active tunnels...`)
  for (const [jobId, tunnel] of activeTunnels.entries()) {
    try {
      tunnel.process.kill('SIGTERM')
    } catch (error) {
      logger.debug(`Error killing tunnel ${jobId}:`, error)
    }
  }
  activeTunnels.clear()
}

/**
 * Get active tunnel URL
 */
export function getTunnelUrl(jobId: string): string | undefined {
  return activeTunnels.get(jobId)?.url
}

/**
 * Stop all active tunnels
 */
export function stopAllTunnels(): void {
  for (const [jobId] of activeTunnels) {
    stopTunnel(jobId)
  }
}

