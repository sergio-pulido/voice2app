/**
 * Template Handler - Intelligent template detection and usage
 */

import { type Task, type GeneratedFile, logger } from '../shared'
import { createLLMProvider } from './providers'
import {
  FALLBACK_APP_HTML,
  EMAIL_TEMPLATE_HTML,
  LANDING_PAGE_HTML,
  ERROR_PAGE_HTML,
  LOADING_PAGE_HTML,
  HELLO_WORLD_HTML
} from '../shared/snippets'
import { readFile } from 'fs/promises'
import { join } from 'path'

interface TemplateConfig {
  name: string
  keywords: string[]
  snippet: string
  placeholders: string[]
  description: string
}

interface TemplateMetadata {
  domain: 'frontend' | 'backend' | 'fullstack' | 'console' | 'server' | 'mobile' | 'desktop'
  technologies: string[]
  complexity: 'simple' | 'medium' | 'complex' | 'super-complex'
  category: 'app' | 'game' | 'website' | 'landing' | 'email' | 'api' | 'cli' | 'dashboard'
  features: string[]
  platform: 'web' | 'mobile' | 'desktop' | 'terminal' | 'server'
  framework?: string
  language?: string
}

interface StructuredTemplate {
  name: string
  path: string
  description: string
  metadata: TemplateMetadata
  keywords: string[]
  confidence_threshold: number
}

interface AppBuildDetails {
  domain: 'frontend' | 'backend' | 'fullstack' | 'console' | 'server' | 'mobile' | 'desktop'
  technologies: string[]
  complexity: 'simple' | 'medium' | 'complex' | 'super-complex'
  category: 'app' | 'game' | 'website' | 'landing' | 'email' | 'api' | 'cli' | 'dashboard'
  features: string[]
  platform: 'web' | 'mobile' | 'desktop' | 'terminal' | 'server'
  framework?: string
  language?: string
}

const AVAILABLE_TEMPLATES: TemplateConfig[] = [
  {
    name: 'email',
    keywords: ['email template', 'newsletter', 'email campaign', 'marketing email', 'transactional email', 'welcome email'],
    snippet: EMAIL_TEMPLATE_HTML,
    placeholders: [
      '{{COMPANY_NAME}}',
      '{{EMAIL_TITLE}}',
      '{{RECIPIENT_NAME}}',
      '{{EMAIL_BODY}}',
      '{{CTA_TEXT}}',
      '{{CTA_URL}}',
      '{{COMPANY_ADDRESS}}',
      '{{COMPANY_WEBSITE}}',
      '{{UNSUBSCRIBE_URL}}',
      '{{PRIVACY_EMAIL}}',
      '{{CLOSING_MESSAGE}}'
    ],
    description: 'Professional email template with header, CTA, footer, and compliance sections'
  },
  {
    name: 'landing_page',
    keywords: ['landing page', 'product page', 'marketing page', 'sales page', 'promotional page'],
    snippet: LANDING_PAGE_HTML,
    placeholders: [
      '{{PAGE_TITLE}}',
      '{{HERO_TITLE}}',
      '{{HERO_SUBTITLE}}',
      '{{CTA_TEXT}}',
      '{{CTA_URL}}',
      '{{FEATURE_1_TITLE}}',
      '{{FEATURE_1_DESCRIPTION}}',
      '{{FEATURE_2_TITLE}}',
      '{{FEATURE_2_DESCRIPTION}}',
      '{{FEATURE_3_TITLE}}',
      '{{FEATURE_3_DESCRIPTION}}',
      '{{COMPANY_NAME}}'
    ],
    description: 'Complete landing page with hero section, features grid, and CTA'
  },
  {
    name: 'error_page',
    keywords: ['error page', '404 page', '500 page', 'not found page', 'error screen'],
    snippet: ERROR_PAGE_HTML,
    placeholders: [
      '{{ERROR_CODE}}',
      '{{ERROR_TITLE}}',
      '{{ERROR_MESSAGE}}',
      '{{HOME_URL}}'
    ],
    description: 'Custom error page with beautiful glassmorphism design'
  },
  {
    name: 'loading_page',
    keywords: ['loading page', 'loading screen', 'splash screen', 'loader'],
    snippet: LOADING_PAGE_HTML,
    placeholders: [],
    description: 'Animated loading screen with spinner'
  },
  {
    name: 'hello_world',
    keywords: ['hello world', 'welcome page', 'simple page', 'test page'],
    snippet: HELLO_WORLD_HTML,
    placeholders: [],
    description: 'Simple hello world page with beautiful design'
  }
]

/**
 * Load structured templates from metadata file
 */
async function loadStructuredTemplates(): Promise<StructuredTemplate[]> {
  try {
    const metadataPath = join(process.cwd(), 'packages', 'shared', 'templates', 'template-metadata.json')
    const metadataContent = await readFile(metadataPath, 'utf-8')
    const metadata = JSON.parse(metadataContent)
    return metadata.templates
  } catch (error) {
    logger.error('Failed to load template metadata:', error)
    return []
  }
}

/**
 * Calculate match score between app details and template metadata
 */
function calculateMatchScore(appDetails: AppBuildDetails, template: StructuredTemplate): number {
  let score = 0
  let totalChecks = 0

  // Domain match (weight: 3)
  totalChecks += 3
  if (appDetails.domain === template.metadata.domain) {
    score += 3
  }

  // Category match (weight: 3)
  totalChecks += 3
  if (appDetails.category === template.metadata.category) {
    score += 3
  }

  // Technology match (weight: 2)
  totalChecks += 2
  const techMatches = appDetails.technologies.filter(tech => 
    template.metadata.technologies.some(templateTech => 
      templateTech.toLowerCase().includes(tech.toLowerCase()) || 
      tech.toLowerCase().includes(templateTech.toLowerCase())
    )
  ).length
  if (techMatches > 0) {
    score += Math.min(2, (techMatches / Math.max(appDetails.technologies.length, template.metadata.technologies.length)) * 2)
  }

  // Complexity match (weight: 2)
  totalChecks += 2
  if (appDetails.complexity === template.metadata.complexity) {
    score += 2
  } else if (
    (appDetails.complexity === 'simple' && template.metadata.complexity === 'medium') ||
    (appDetails.complexity === 'medium' && template.metadata.complexity === 'simple') ||
    (appDetails.complexity === 'complex' && template.metadata.complexity === 'medium') ||
    (appDetails.complexity === 'super-complex' && template.metadata.complexity === 'complex')
  ) {
    score += 1 // Partial match for adjacent complexity levels
  }

  // Platform match (weight: 1)
  totalChecks += 1
  if (appDetails.platform === template.metadata.platform) {
    score += 1
  }

  // Framework match (weight: 2)
  if (appDetails.framework && template.metadata.framework) {
    totalChecks += 2
    if (appDetails.framework.toLowerCase() === template.metadata.framework.toLowerCase()) {
      score += 2
    }
  }

  // Language match (weight: 1)
  if (appDetails.language && template.metadata.language) {
    totalChecks += 1
    if (appDetails.language.toLowerCase() === template.metadata.language.toLowerCase()) {
      score += 1
    }
  }

  return totalChecks > 0 ? score / totalChecks : 0
}

/**
 * Detect if a task matches a template using intelligent matching
 */
export async function detectTemplate(task: Task, appDetails?: AppBuildDetails): Promise<TemplateConfig | null> {
  // If we have structured app details, use intelligent matching
  if (appDetails) {
    logger.info('🔍 App details:', appDetails)
    logger.info('🧠 Using intelligent template matching...')
    const structuredTemplates = await loadStructuredTemplates()
    
    let bestMatch: { template: StructuredTemplate; score: number } | null = null
    
    for (const template of structuredTemplates) {
      const score = calculateMatchScore(appDetails, template)
      logger.debug(`📊 Template ${template.name} score: ${score.toFixed(2)} (threshold: ${template.confidence_threshold})`)
      
      if (score >= template.confidence_threshold && (!bestMatch || score > bestMatch.score)) {
        // Check if template files actually exist
        const templatePath = join(process.cwd(), 'packages', 'shared', 'templates', template.name, 'package.json')
        try {
          await readFile(templatePath, 'utf-8')
          bestMatch = { template, score }
        } catch (error) {
          logger.warn(`⚠️ Template ${template.name} has no files, skipping`)
          continue
        }
      }
    }
    
    if (bestMatch) {
      logger.success(`✅ Best template match: ${bestMatch.template.name} (score: ${bestMatch.score.toFixed(2)})`)
      
      // Convert structured template to legacy format for compatibility
      return {
        name: bestMatch.template.name,
        keywords: bestMatch.template.keywords,
        snippet: '', // Will be loaded from template files
        placeholders: [],
        description: bestMatch.template.description
      }
    } else {
      logger.info('❌ No template matches found with sufficient confidence')
      return null
    }
  }
  
  // Fallback to primitive keyword matching for backward compatibility
  logger.info('⚠️  Falling back to primitive keyword matching...')
  const context = task.context.toLowerCase()
  
  for (const template of AVAILABLE_TEMPLATES) {
    if (template.keywords.some(keyword => context.includes(keyword))) {
      logger.info(`📋 Detected template (fallback): ${template.name}`)
      return template
    }
  }
  
  return null
}

/**
 * Extract value from context for a specific field
 */
function extractValue(context: string, field: string, defaultValue: string = ''): string {
  // Try to extract value using various patterns
  const patterns = [
    new RegExp(`${field}[:\\s]+["']?([^"'\\n]+)["']?`, 'i'),
    new RegExp(`${field}[:\\s]+([^,\\n]+)`, 'i'),
    new RegExp(`["']${field}["'][:\\s]+["']([^"']+)["']`, 'i')
  ]
  
  for (const pattern of patterns) {
    const match = context.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  
  return defaultValue
}

/**
 * Generate smart placeholder values based on context
 */
function generateSmartPlaceholders(task: Task, template: TemplateConfig): Record<string, string> {
  const context = task.context
  const placeholders: Record<string, string> = {}
  
  // Email template placeholders
  if (template.name === 'email') {
    placeholders['{{COMPANY_NAME}}'] = extractValue(context, 'company', 'My Company')
    placeholders['{{EMAIL_TITLE}}'] = extractValue(context, 'title|subject', 'Important Update')
    placeholders['{{RECIPIENT_NAME}}'] = '{{RECIPIENT_NAME}}' // Keep as placeholder
    placeholders['{{EMAIL_BODY}}'] = extractValue(context, 'message|body', 'Thank you for being a valued customer. We have some exciting news to share with you.')
    placeholders['{{CTA_TEXT}}'] = extractValue(context, 'cta|button', 'Learn More')
    placeholders['{{CTA_URL}}'] = '{{CTA_URL}}' // Keep as placeholder
    placeholders['{{COMPANY_ADDRESS}}'] = extractValue(context, 'address', '123 Main St, City, Country')
    placeholders['{{COMPANY_WEBSITE}}'] = extractValue(context, 'website', 'https://example.com')
    placeholders['{{UNSUBSCRIBE_URL}}'] = '{{UNSUBSCRIBE_URL}}' // Keep as placeholder
    placeholders['{{PRIVACY_EMAIL}}'] = extractValue(context, 'privacy email|contact', 'privacy@example.com')
    placeholders['{{CLOSING_MESSAGE}}'] = extractValue(context, 'closing|signature', 'Best regards,\nThe Team')
  }
  
  // Landing page placeholders
  else if (template.name === 'landing_page') {
    placeholders['{{PAGE_TITLE}}'] = extractValue(context, 'title|page title', 'Welcome')
    placeholders['{{HERO_TITLE}}'] = extractValue(context, 'hero title|main title', 'Transform Your Business')
    placeholders['{{HERO_SUBTITLE}}'] = extractValue(context, 'subtitle|tagline', 'The best solution for your needs')
    placeholders['{{CTA_TEXT}}'] = extractValue(context, 'cta|button', 'Get Started')
    placeholders['{{CTA_URL}}'] = extractValue(context, 'cta url|link', '#signup')
    placeholders['{{FEATURE_1_TITLE}}'] = extractValue(context, 'feature 1|first feature', 'Fast & Reliable')
    placeholders['{{FEATURE_1_DESCRIPTION}}'] = extractValue(context, 'feature 1 desc', 'Lightning-fast performance you can count on')
    placeholders['{{FEATURE_2_TITLE}}'] = extractValue(context, 'feature 2|second feature', 'Easy to Use')
    placeholders['{{FEATURE_2_DESCRIPTION}}'] = extractValue(context, 'feature 2 desc', 'Intuitive interface that anyone can master')
    placeholders['{{FEATURE_3_TITLE}}'] = extractValue(context, 'feature 3|third feature', 'Secure & Private')
    placeholders['{{FEATURE_3_DESCRIPTION}}'] = extractValue(context, 'feature 3 desc', 'Your data is always protected')
    placeholders['{{COMPANY_NAME}}'] = extractValue(context, 'company', 'My Company')
  }
  
  // Error page placeholders
  else if (template.name === 'error_page') {
    placeholders['{{ERROR_CODE}}'] = extractValue(context, 'error code|code', '404')
    placeholders['{{ERROR_TITLE}}'] = extractValue(context, 'error title|title', 'Page Not Found')
    placeholders['{{ERROR_MESSAGE}}'] = extractValue(context, 'message|description', 'The page you are looking for might have been removed or is temporarily unavailable.')
    placeholders['{{HOME_URL}}'] = extractValue(context, 'home url|home', '/')
  }
  
  return placeholders
}

/**
 * Replace placeholders in template
 */
function fillTemplate(template: string, placeholders: Record<string, string>): string {
  let filled = template
  
  for (const [placeholder, value] of Object.entries(placeholders)) {
    // Use global replace to handle multiple occurrences
    filled = filled.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value)
  }
  
  return filled
}

/**
 * Generate README for template usage
 */
function generateTemplateReadme(template: TemplateConfig, placeholders: Record<string, string>): string {
  const remainingPlaceholders = template.placeholders.filter(p => 
    placeholders[p] && placeholders[p] === p
  )
  
  let readme = `# ${template.name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Template

## Description

${template.description}

## Generated Files

- \`index.html\` - Main template file
- \`README.md\` - This file

## Customized Values

The following values have been automatically filled:

`
  
  for (const [placeholder, value] of Object.entries(placeholders)) {
    if (value !== placeholder) {
      readme += `- \`${placeholder}\` → "${value}"\n`
    }
  }
  
  if (remainingPlaceholders.length > 0) {
    readme += `\n## Remaining Placeholders

Please replace the following placeholders before using:

`
    remainingPlaceholders.forEach(p => {
      readme += `- \`${p}\` - ${getPlaceholderDescription(p)}\n`
    })
  }
  
  readme += `\n## Usage

1. Open \`index.html\` in a browser to preview
2. Replace remaining placeholders with actual values
3. Deploy to your web server

## Template Features

- ✅ Responsive design
- ✅ Modern styling with gradients
- ✅ Beautiful glassmorphism effects
- ✅ Cross-browser compatible
${template.name === 'email' ? '- ✅ CAN-SPAM and GDPR compliant\n- ✅ Email client optimized' : ''}

## Customization

You can customize the template by:
- Modifying colors in the CSS
- Adjusting layout and spacing
- Adding custom sections
- Changing fonts and typography

---

Generated by Voice2App Template System 🚀`
  
  return readme
}

/**
 * Get description for a placeholder
 */
function getPlaceholderDescription(placeholder: string): string {
  const descriptions: Record<string, string> = {
    '{{RECIPIENT_NAME}}': 'Recipient\'s name (e.g., "John Doe")',
    '{{CTA_URL}}': 'Call-to-action link URL',
    '{{UNSUBSCRIBE_URL}}': 'Unsubscribe link for email compliance',
    '{{USER_EMAIL}}': 'User email address',
    '{{HOME_URL}}': 'Homepage URL (e.g., "/")',
  }
  
  return descriptions[placeholder] || 'Custom value'
}

/**
 * Generate files from template
 */
export async function generateFromTemplate(task: Task, template: TemplateConfig): Promise<GeneratedFile[]> {
  logger.info(`🎨 Generating from template: ${template.name}`)
  
  // For structured templates, load the actual template files
  if (template.name !== 'email' && template.name !== 'landing_page' && template.name !== 'error_page' && template.name !== 'loading_page' && template.name !== 'hello_world') {
    return await generateFromStructuredTemplate(task, template)
  }
  
  // Generate smart placeholders for HTML snippets
  const placeholders = generateSmartPlaceholders(task, template)
  
  // Fill template
  const filledTemplate = fillTemplate(template.snippet, placeholders)
  
  // Generate README
  const readme = generateTemplateReadme(template, placeholders)
  
  return [
    {
      path: 'index.html',
      content: filledTemplate,
      language: 'html'
    },
    {
      path: 'README.md',
      content: readme,
      language: 'markdown'
    }
  ]
}

/**
 * Generate from structured template files
 */
async function generateFromStructuredTemplate(task: Task, template: TemplateConfig): Promise<GeneratedFile[]> {
  try {
    const templatePath = join(process.cwd(), 'packages', 'shared', 'templates', template.name)
    
    // Load all template files
    const templateFiles = await loadTemplateFiles(template.name)
    
    // Ask LLM to complete the template based on the task
    const completedFiles = await completeTemplateWithLLM(task, templateFiles, template.name)
    
    return completedFiles
  } catch (error) {
    logger.error(`Failed to generate from structured template ${template.name}:`, error)
    return []
  }
}

/**
 * Load template files from directory
 */
async function loadTemplateFiles(templateName: string): Promise<GeneratedFile[]> {
  const templatePath = join(process.cwd(), 'packages', 'shared', 'templates', templateName)
  const files: GeneratedFile[] = []
  
  try {
    // Read package.json first
    const packageJsonPath = join(templatePath, 'package.json')
    const packageJson = await readFile(packageJsonPath, 'utf-8')
    files.push({
      path: 'package.json',
      content: packageJson,
      language: 'json'
    })
    
    // Read other important files
    const filesToLoad = [
      'index.html',
      'vite.config.ts',
      'tsconfig.json',
      'tsconfig.node.json',
      'tailwind.config.js',
      'postcss.config.js',
      'src/main.tsx',
      'src/App.tsx',
      'src/index.css',
      'src/game/engine.ts',
      'src/game/types.ts',
      'src/styles.css'
    ]
    
    for (const fileName of filesToLoad) {
      try {
        const filePath = join(templatePath, fileName)
        const content = await readFile(filePath, 'utf-8')
        
        // Determine language from extension
        let language = 'text'
        if (fileName.endsWith('.tsx') || fileName.endsWith('.ts')) language = 'typescript'
        else if (fileName.endsWith('.js')) language = 'javascript'
        else if (fileName.endsWith('.json')) language = 'json'
        else if (fileName.endsWith('.html')) language = 'html'
        else if (fileName.endsWith('.css')) language = 'css'
        
        files.push({
          path: fileName,
          content: content,
          language: language
        })
      } catch (error) {
        // File doesn't exist, skip it
        continue
      }
    }
    
    return files
  } catch (error) {
    logger.error(`Failed to load template files for ${templateName}:`, error)
    return []
  }
}

/**
 * Complete template with LLM based on task requirements
 */
async function completeTemplateWithLLM(task: Task, templateFiles: GeneratedFile[], templateName: string): Promise<GeneratedFile[]> {
  try {
    const llm = createLLMProvider()
    
    const systemPrompt = `You are an expert game developer. You have been given a ${templateName} template and need to complete it based on the user's requirements.

Template files provided:
${templateFiles.map(f => `- ${f.path}: ${f.content.substring(0, 200)}...`).join('\n')}

User requirements: ${task.context}

Your task:
1. Complete the game implementation based on the user's requirements
2. Ensure the game has proper Mario-style mechanics (jumping, coin collection, platformer gameplay)
3. Make it mobile-responsive with touch controls
4. Add proper game logic, collision detection, and character movement
5. Use the existing template structure but complete the missing game logic

CRITICAL: You MUST include ALL essential files for a Vite+React project:
- package.json (with all dependencies)
- index.html (entry point)
- vite.config.ts (Vite configuration)
- tsconfig.json (TypeScript configuration)
- src/main.tsx (React entry point)
- src/App.tsx (main component)
- src/index.css (global styles)
- All game-related files (engine, types, etc.)

Return ONLY a JSON array of files with this exact structure:
[
  {
    "path": "filename.ext",
    "content": "complete file content here",
    "language": "typescript|javascript|json|html|css"
  }
]

Include ALL necessary files to make the game work properly. Do not skip any essential files.`

    const response = await llm.complete({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Complete the ${templateName} template for: ${task.context}` }
      ],
      temperature: 0.3,
      maxTokens: 8000
    })

    // Parse LLM response
    let cleanResponse = response.content?.trim() || ''
    
    // Remove markdown code blocks
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    // Extract JSON
    const jsonMatch = cleanResponse.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const files = JSON.parse(jsonMatch[0])
      logger.success(`✅ LLM completed ${files.length} files for ${templateName} template`)
      return files
    }
    
    logger.warn('Failed to parse LLM response, returning template files as-is')
    return templateFiles
    
  } catch (error) {
    logger.error('LLM completion failed:', error)
    return templateFiles
  }
}

/**
 * Get template hints for LLM system prompt
 */
export function getTemplateHints(task: Task): string {
  const availableTemplates = AVAILABLE_TEMPLATES.filter(template =>
    template.keywords.some(keyword => task.context.toLowerCase().includes(keyword.split(' ')[0]))
  )
  
  if (availableTemplates.length === 0) {
    return ''
  }
  
  let hints = `\n\n📋 AVAILABLE TEMPLATES:\n\n`
  
  availableTemplates.forEach(template => {
    hints += `**${template.name.toUpperCase()}**\n`
    hints += `${template.description}\n`
    hints += `Placeholders: ${template.placeholders.slice(0, 5).join(', ')}${template.placeholders.length > 5 ? ', ...' : ''}\n\n`
  })
  
  hints += `💡 You can reference these templates in your code generation or use them as inspiration for structure and styling.`
  
  return hints
}

/**
 * Main template generation function
 */
export async function tryGenerateFromTemplate(task: Task, appDetails?: AppBuildDetails): Promise<GeneratedFile[] | null> {
  const template = await detectTemplate(task, appDetails)
  
  if (!template) {
    return null
  }
  
  try {
    const files = await generateFromTemplate(task, template)
    logger.success(`✅ Generated ${files.length} files from ${template.name} template`)
    return files
  } catch (error) {
    logger.error(`Failed to generate from template:`, error)
    return null
  }
}
