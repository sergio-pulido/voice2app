/**
 * Template Handler - Intelligent template detection and usage
 */

import { type Task, type GeneratedFile, logger } from '../shared'
import {
  FALLBACK_APP_HTML,
  EMAIL_TEMPLATE_HTML,
  LANDING_PAGE_HTML,
  ERROR_PAGE_HTML,
  LOADING_PAGE_HTML,
  HELLO_WORLD_HTML
} from '../shared/snippets'

interface TemplateConfig {
  name: string
  keywords: string[]
  snippet: string
  placeholders: string[]
  description: string
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
 * Detect if a task matches a template
 */
export function detectTemplate(task: Task): TemplateConfig | null {
  const context = task.context.toLowerCase()
  
  for (const template of AVAILABLE_TEMPLATES) {
    if (template.keywords.some(keyword => context.includes(keyword))) {
      logger.info(`📋 Detected template: ${template.name}`)
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
export function generateFromTemplate(task: Task, template: TemplateConfig): GeneratedFile[] {
  logger.info(`🎨 Generating from template: ${template.name}`)
  
  // Generate smart placeholders
  const placeholders = generateSmartPlaceholders(task, template)
  
  // Fill template
  const filledTemplate = fillTemplate(template.snippet, placeholders)
  
  // Generate README
  const readme = generateTemplateReadme(template, placeholders)
  
  return [
    {
      path: 'index.html',
      content: filledTemplate
    },
    {
      path: 'README.md',
      content: readme
    }
  ]
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
export function tryGenerateFromTemplate(task: Task): GeneratedFile[] | null {
  const template = detectTemplate(task)
  
  if (!template) {
    return null
  }
  
  try {
    const files = generateFromTemplate(task, template)
    logger.success(`✅ Generated ${files.length} files from ${template.name} template`)
    return files
  } catch (error) {
    logger.error(`Failed to generate from template:`, error)
    return null
  }
}
