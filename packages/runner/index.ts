/**
 * Runner package: builds, runs, tests and screenshots generated apps
 */

import { config, logger, type Task, type RunnerResult } from '../shared'
import { buildApp } from './builder'
import { testApp } from './tester'
import { serveApp } from './server'
import { captureScreenshot } from './screenshot'
import { createTunnel } from './tunnel'
import { join } from 'path'

export async function runApp(task: Task, sandboxPath: string): Promise<RunnerResult> {
  logger.job(task.jobId, 'Starting runner...')
  
  let serverProcess: any = null
  let url: string = ''
  
  try {
    // Step 1: Build the app (if needed) - only for non-Vite projects
    const buildResult = await buildApp(sandboxPath, task.jobId)

    if (!buildResult.success) {
      return {
        success: false,
        logs: buildResult.logs,
        errors: buildResult.errors,
      }
    }

    // Step 2: Serve the app (this will build Vite projects internally)
    const serveResult = await serveApp(sandboxPath, task.jobId)
    
    if (!serveResult.success || !serveResult.url) {
      return {
        success: false,
        logs: [...buildResult.logs, ...serveResult.logs],
        errors: serveResult.errors,
      }
    }
    
    serverProcess = serveResult.process
    url = serveResult.url
    
    logger.success(`App running at ${url}`)

    // Step 3: Basic tester validation before tunnels/screenshots
    const basicTest = await testApp(task, url, sandboxPath)
    console.log('basicTest', basicTest)
    if (!basicTest.success) {
      return {
        success: false,
        logs: [...buildResult.logs, ...serveResult.logs, ...basicTest.logs],
        errors: basicTest.errors,
      }
    }
    
    // Step 4: Create ngrok/cloudflared tunnel for public access
    let publicUrl: string | undefined
    const tunnelResult = await createTunnel(url, task.jobId)
    if (tunnelResult.success && tunnelResult.publicUrl) {
      publicUrl = tunnelResult.publicUrl
      logger.success(`🌐 Public URL created: ${publicUrl}`)
    } else {
      logger.warn(`Failed to create public URL: ${tunnelResult.error || 'Unknown error'}`)
    }
    
    // Step 5: Capture screenshot (if requested)
    let screenshot: string | undefined
    
    if (task.artifact.screenshot) {
      const screenshotPath = await captureScreenshot(url, task.jobId)
      if (screenshotPath) {
        screenshot = screenshotPath
        logger.success(`Screenshot saved: ${screenshotPath}`)
      }
    }
    
    // Step 6: Collect logs
    const logs = [...buildResult.logs, ...serveResult.logs]
    
    return {
      success: true,
      screenshot,
      logs,
      errors: [],
      url,
      publicUrl,
      buildLogs: buildResult.logs,
    }
  } catch (error) {
    logger.error(`Runner error for job ${task.jobId}:`, error)
    
    return {
      success: false,
      logs: [],
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    }
  } finally {
    // Note: We don't stop the server here anymore - it needs to stay running for interaction testing
    // The server will be cleaned up when the sandbox is cleaned up or when explicitly stopped
    logger.debug(`Server left running for job ${task.jobId} at ${url}`)
  }
}

export { buildApp } from './builder'
export { serveApp } from './server'
export { captureScreenshot } from './screenshot'
export { testApp } from './tester'
export { testAppWithInteraction } from './app-interactor'

