/**
 * Template Loader - Loads actual template files from packages/shared/templates
 */

import { readFile, readdir, stat } from 'fs/promises'
import { join } from 'path'
import { logger, type GeneratedFile, type TemplateId } from '../shared'

const TEMPLATE_DIR = join(process.cwd(), 'packages/shared/templates')

/**
 * Load all files from a template directory
 */
export async function loadTemplateFiles(templateId: TemplateId): Promise<GeneratedFile[]> {
  if (templateId === 'none') {
    return []
  }

  const templatePath = join(TEMPLATE_DIR, templateId)
  const files: GeneratedFile[] = []

  try {
    await loadDirectory(templatePath, '', files)
    logger.info(`📁 Loaded ${files.length} files from template: ${templateId}`)
    return files
  } catch (error) {
    logger.error(`Failed to load template ${templateId}:`, error)
    return []
  }
}

/**
 * Recursively load files from a directory
 */
async function loadDirectory(dirPath: string, relativePath: string, files: GeneratedFile[]): Promise<void> {
  const entries = await readdir(dirPath)
  
  for (const entry of entries) {
    const fullPath = join(dirPath, entry)
    const entryRelativePath = relativePath ? join(relativePath, entry) : entry
    const stats = await stat(fullPath)
    
    if (stats.isDirectory()) {
      // Skip node_modules and other common directories
      if (!['node_modules', '.git', '.DS_Store', 'dist', 'build'].includes(entry)) {
        await loadDirectory(fullPath, entryRelativePath, files)
      }
    } else {
      // Skip certain file types
      if (!['.log', '.tmp', '.cache'].some(ext => entry.endsWith(ext))) {
        const content = await readFile(fullPath, 'utf-8')
        const language = getLanguageFromExtension(entry)
        
        files.push({
          path: entryRelativePath,
          content,
          language
        })
      }
    }
  }
}

/**
 * Determine file language from extension
 */
function getLanguageFromExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  
  const languageMap: Record<string, string> = {
    'ts': 'typescript',
    'tsx': 'typescript',
    'js': 'javascript',
    'jsx': 'javascript',
    'json': 'json',
    'html': 'html',
    'css': 'css',
    'md': 'markdown',
    'txt': 'text',
    'yml': 'yaml',
    'yaml': 'yaml',
    'xml': 'xml',
    'svg': 'xml'
  }
  
  return languageMap[ext || ''] || 'text'
}

/**
 * Check if a template exists
 */
export async function templateExists(templateId: TemplateId): Promise<boolean> {
  if (templateId === 'none') {
    return false
  }
  
  try {
    const templatePath = join(TEMPLATE_DIR, templateId)
    await stat(templatePath)
    return true
  } catch {
    return false
  }
}
