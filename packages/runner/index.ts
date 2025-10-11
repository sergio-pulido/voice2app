/**
 * Runner package: builds, runs, and screenshots generated apps
 */

import { config, logger, type Task, type RunnerResult } from '../shared'
import { buildApp } from './builder'
import { serveApp } from './server'
import { captureScreenshot } from './screenshot'
import { join } from 'path'

export async function runApp(task: Task, sandboxPath: string): Promise<RunnerResult> {
  logger.job(task.jobId, 'Starting runner...')
  
  let serverProcess: any = null
  let url: string = ''
  
  try {
    // Step 1: Build the app (if needed)
    const buildResult = await buildApp(sandboxPath, task.jobId)
    
    if (!buildResult.success) {
      return {
        success: false,
        logs: buildResult.logs,
        errors: buildResult.errors,
        buildLogs: buildResult.logs,
      }
    }
    
    // Step 2: Serve the app
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
    
    // Step 3: Capture screenshot (if requested)
    let screenshot: string | undefined
    
    if (task.artifact.screenshot) {
      const screenshotPath = await captureScreenshot(url, task.jobId)
      if (screenshotPath) {
        screenshot = screenshotPath
        logger.success(`Screenshot saved: ${screenshotPath}`)
      }
    }
    
    // Step 4: Collect logs
    const logs = [...buildResult.logs, ...serveResult.logs]
    
    return {
      success: true,
      screenshot,
      logs,
      errors: [],
      url,
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
    // Cleanup: stop server
    if (serverProcess) {
      try {
        serverProcess.kill()
        logger.debug(`Server stopped for job ${task.jobId}`)
      } catch (e) {
        logger.warn('Failed to stop server:', e)
      }
    }
  }
}

export { buildApp } from './builder'
export { serveApp } from './server'
export { captureScreenshot } from './screenshot'

