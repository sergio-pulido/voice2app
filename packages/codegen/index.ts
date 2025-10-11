/**
 * Codegen package: LLM-based code writer
 */

import { config, logger, type Task, type CodegenResult } from '../shared'
import { generateCode } from './generator'
import { writeFiles } from './file-writer'
import { join } from 'path'

export async function generateApp(task: Task): Promise<CodegenResult> {
  logger.job(task.jobId, 'Starting code generation...')
  
  try {
    // Generate code based on task
    const files = await generateCode(task)
    
    if (files.length === 0) {
      throw new Error('No files generated')
    }
    
    // Determine sandbox path
    const sandboxPath = join(process.cwd(), config.sandboxRoot, task.jobId)
    
    // Write files to sandbox
    await writeFiles(sandboxPath, files)
    
    logger.success(`Generated ${files.length} files in ${sandboxPath}`)
    
    return {
      success: true,
      files,
      sandboxPath,
    }
  } catch (error) {
    logger.error(`Codegen error for job ${task.jobId}:`, error)
    
    return {
      success: false,
      files: [],
      sandboxPath: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export { generateCode } from './generator'
export { writeFiles } from './file-writer'

