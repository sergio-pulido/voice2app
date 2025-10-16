/**
 * App builder
 */

import { logger } from '../shared'
import { readFile, access } from 'fs/promises'
import { join } from 'path'
import { spawn } from 'child_process'

interface BuildResult {
  success: boolean
  logs: string[]
  errors: string[]
}

export async function buildApp(sandboxPath: string, jobId: string): Promise<BuildResult> {
  logger.job(jobId, 'Building app...')
  
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
      // No package.json, it's probably a static HTML app
      logger.debug('No package.json found, treating as static app')
    }
    
    if (!hasPackageJson) {
      logs.push('Static HTML app detected, no build needed')
      return { success: true, logs, errors }
    }
    
    // Read package.json to check for build script and Vite/Next.js
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'))
    const hasBuildScript = packageJson.scripts?.build
    const isViteProject = packageJson.devDependencies?.vite || packageJson.dependencies?.vite
    const isNextProject = packageJson.dependencies?.next || packageJson.devDependencies?.next
    
    if (!hasBuildScript) {
      logs.push('No build script found in package.json')
      return { success: true, logs, errors }
    }
    
    // For Vite/Next.js projects, skip building here - the server will handle it
    if (isViteProject) {
      logs.push('Vite project detected, build will be handled by server')
      return { success: true, logs, errors }
    }
    
    if (isNextProject) {
      logs.push('Next.js project detected, dev server will be used')
      return { success: true, logs, errors }
    }
    
    // Install dependencies
    logger.job(jobId, 'Installing dependencies...')
    const installResult = await runCommand('bun', ['install'], sandboxPath)
    logs.push(...installResult.logs)
    
    if (!installResult.success) {
      errors.push(...installResult.errors)
      return { success: false, logs, errors }
    }
    
    // Run build
    logger.job(jobId, 'Running build...')
    const buildResult = await runCommand('bun', ['run', 'build'], sandboxPath)
    logs.push(...buildResult.logs)
    
    if (!buildResult.success) {
      errors.push(...buildResult.errors)
      return { success: false, logs, errors }
    }
    
    logger.success('Build completed successfully')
    return { success: true, logs, errors }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown build error'
    logger.error('Build error:', errorMsg)
    errors.push(errorMsg)
    return { success: false, logs, errors }
  }
}

async function runCommand(
  command: string,
  args: string[],
  cwd: string
): Promise<{ success: boolean; logs: string[]; errors: string[] }> {
  return new Promise((resolve) => {
    const logs: string[] = []
    const errors: string[] = []
    
    const proc = spawn(command, args, {
      cwd,
      shell: true,
    })
    
    proc.stdout?.on('data', (data) => {
      logs.push(data.toString())
    })
    
    proc.stderr?.on('data', (data) => {
      errors.push(data.toString())
    })
    
    proc.on('close', (code) => {
      resolve({
        success: code === 0,
        logs,
        errors,
      })
    })
    
    proc.on('error', (error) => {
      errors.push(error.message)
      resolve({ success: false, logs, errors })
    })
  })
}

