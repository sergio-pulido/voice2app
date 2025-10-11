/**
 * File writer: writes generated files to sandbox
 */

import { mkdir, writeFile } from 'fs/promises'
import { join, dirname } from 'path'
import { logger, type GeneratedFile } from '../shared'

export async function writeFiles(sandboxPath: string, files: GeneratedFile[]): Promise<void> {
  logger.debug(`Writing ${files.length} files to ${sandboxPath}`)
  
  try {
    // Create sandbox directory
    await mkdir(sandboxPath, { recursive: true })
    
    // Write each file
    for (const file of files) {
      const filePath = join(sandboxPath, file.path)
      const fileDir = dirname(filePath)
      
      // Ensure directory exists
      await mkdir(fileDir, { recursive: true })
      
      // Write file
      await writeFile(filePath, file.content, 'utf-8')
      
      logger.debug(`  ✓ ${file.path}`)
    }
    
    logger.success(`Wrote ${files.length} files to sandbox`)
  } catch (error) {
    logger.error('File writing error:', error)
    throw error
  }
}

