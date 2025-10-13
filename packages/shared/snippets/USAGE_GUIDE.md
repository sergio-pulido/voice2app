# Snippets & Templates Usage Guide

## How the Code Agent Uses Templates

The Voice2App code agent can leverage templates and snippets in several ways to generate high-quality, consistent code.

## 🎯 Current Usage

### 1. **Fallback App Template**

The agent currently uses the `FALLBACK_APP_HTML` snippet when code generation fails:

```typescript
// In packages/codegen/generator.ts
import { FALLBACK_APP_HTML } from '../shared/snippets'

function getFallbackApp(task: Task): GeneratedFile[] {
  return [
    {
      path: 'index.html',
      content: FALLBACK_APP_HTML
    }
  ]
}
```

### 2. **Email Template Usage**

When a user requests an email template, the agent can use the snippet:

```typescript
import { EMAIL_TEMPLATE_HTML } from '../shared/snippets'

// Detect email template request
if (task.context.toLowerCase().includes('email template')) {
  const emailHtml = EMAIL_TEMPLATE_HTML
    .replace('{{COMPANY_NAME}}', extractCompanyName(task.context))
    .replace('{{EMAIL_TITLE}}', extractTitle(task.context))
    .replace('{{RECIPIENT_NAME}}', '{{RECIPIENT_NAME}}') // Keep as placeholder
    .replace('{{EMAIL_BODY}}', extractBodyContent(task.context))
    .replace('{{CTA_TEXT}}', extractCTAText(task.context))
    .replace('{{CTA_URL}}', '{{CTA_URL}}') // Keep as placeholder
  
  return [{
    path: 'email-template.html',
    content: emailHtml
  }]
}
```

### 3. **Landing Page Template**

```typescript
import { LANDING_PAGE_HTML } from '../shared/snippets'

if (task.context.toLowerCase().includes('landing page')) {
  const landingPage = LANDING_PAGE_HTML
    .replace('{{PAGE_TITLE}}', extractTitle(task.context))
    .replace('{{HERO_TITLE}}', extractHeroTitle(task.context))
    .replace('{{HERO_SUBTITLE}}', extractHeroSubtitle(task.context))
  
  return [{
    path: 'index.html',
    content: landingPage
  }]
}
```

## 🚀 Enhanced Usage Patterns

### 1. **Template Detection in System Prompt**

The agent can detect template requests in the system prompt:

```typescript
function buildSystemPrompt(task: Task): string {
  let systemPrompt = CODEGEN_SYSTEM_PROMPT + '\n\n' + UI_UX_SYSTEM_PROMPT
  
  // Add email template guidance
  if (task.context.toLowerCase().includes('email')) {
    systemPrompt += `\n\n📧 EMAIL TEMPLATE AVAILABLE:
    
Use the EMAIL_TEMPLATE_HTML snippet with these placeholders:
- {{COMPANY_NAME}} - Company name
- {{EMAIL_TITLE}} - Email subject/title
- {{RECIPIENT_NAME}} - Recipient's name
- {{EMAIL_BODY}} - Main email content
- {{CTA_TEXT}} - Call-to-action button text
- {{CTA_URL}} - Call-to-action link
- {{COMPANY_ADDRESS}} - Company address
- {{PRIVACY_EMAIL}} - Privacy contact email

The template includes:
- Professional header with banner
- Responsive design
- CAN-SPAM and GDPR compliance
- Beautiful styling with gradients`
  }
  
  return systemPrompt
}
```

### 2. **CSS Snippets for Styling**

The agent can include CSS snippets in generated files:

```typescript
import { 
  GLASSMORPHISM_CSS, 
  GRADIENT_BACKGROUNDS_CSS, 
  MODERN_BUTTONS_CSS 
} from '../shared/snippets'

// Add to generated CSS files
const generatedCSS = `
/* Base styles */
${GRADIENT_BACKGROUNDS_CSS}

/* Glassmorphism effects */
${GLASSMORPHISM_CSS}

/* Button styles */
${MODERN_BUTTONS_CSS}

/* Custom app styles */
.my-custom-class {
  /* ... */
}
`
```

### 3. **JavaScript Utilities**

Include utility functions in generated apps:

```typescript
import { 
  DEBOUNCE_FUNCTION, 
  LOCAL_STORAGE_UTILS,
  FORM_VALIDATION 
} from '../shared/snippets'

// Add to generated utils.js file
const generatedUtils = `
${DEBOUNCE_FUNCTION}

${LOCAL_STORAGE_UTILS}

${FORM_VALIDATION}

// App-specific utilities
// ...
`
```

### 4. **React Components**

Include React components and hooks:

```typescript
import { 
  USE_LOCAL_STORAGE_HOOK,
  LOADING_SPINNER_COMPONENT,
  MODAL_COMPONENT 
} from '../shared/snippets'

// Generate separate component files
return [
  {
    path: 'src/hooks/useLocalStorage.ts',
    content: USE_LOCAL_STORAGE_HOOK
  },
  {
    path: 'src/components/LoadingSpinner.tsx',
    content: LOADING_SPINNER_COMPONENT
  },
  {
    path: 'src/components/Modal.tsx',
    content: MODAL_COMPONENT
  }
]
```

## 🔧 Implementation Strategies

### Strategy 1: Template-First Generation

```typescript
// Detect template request and use snippet directly
function generateWithTemplates(task: Task): GeneratedFile[] | null {
  const context = task.context.toLowerCase()
  
  // Email template
  if (context.includes('email template') || context.includes('newsletter')) {
    return generateEmailFromTemplate(task)
  }
  
  // Landing page
  if (context.includes('landing page') || context.includes('landing')) {
    return generateLandingPageFromTemplate(task)
  }
  
  // Error page
  if (context.includes('error page') || context.includes('404')) {
    return generateErrorPageFromTemplate(task)
  }
  
  // Not a template request
  return null
}

export async function generateCode(task: Task): Promise<GeneratedFile[]> {
  try {
    // Try template-first approach
    const templateResult = generateWithTemplates(task)
    if (templateResult) {
      logger.success('Generated from template')
      return templateResult
    }
    
    // Fall back to LLM generation
    return await generateWithLLM(task)
  } catch (error) {
    return getFallbackApp(task)
  }
}
```

### Strategy 2: LLM with Template Hints

```typescript
function buildSystemPrompt(task: Task): string {
  let systemPrompt = CODEGEN_SYSTEM_PROMPT
  
  // Add template hints based on request
  const availableTemplates = detectAvailableTemplates(task.context)
  
  if (availableTemplates.length > 0) {
    systemPrompt += `\n\n🎨 AVAILABLE TEMPLATES:\n\n`
    
    availableTemplates.forEach(template => {
      systemPrompt += `${template.description}\n`
      systemPrompt += `Placeholders: ${template.placeholders.join(', ')}\n\n`
    })
    
    systemPrompt += `You can use these templates by including the appropriate HTML/CSS/JS snippets.`
  }
  
  return systemPrompt
}
```

### Strategy 3: Hybrid Approach

```typescript
// Combine templates with LLM customization
async function generateHybrid(task: Task): Promise<GeneratedFile[]> {
  // 1. Detect base template
  const baseTemplate = detectBaseTemplate(task.context)
  
  // 2. Extract customization requirements
  const customizations = extractCustomizations(task.context)
  
  // 3. Ask LLM to customize the template
  const customizedContent = await llm.complete({
    messages: [
      {
        role: 'system',
        content: `Customize this template based on user requirements.
        
Base Template:
${baseTemplate.content}

Keep the structure but customize:
- Text content
- Colors and styling
- Specific features
        `
      },
      {
        role: 'user',
        content: `Customize for: ${customizations}`
      }
    ]
  })
  
  return parseCustomizedFiles(customizedContent)
}
```

## 📋 Template Detection Rules

### Email Template Detection
```typescript
function isEmailTemplateRequest(context: string): boolean {
  const emailKeywords = [
    'email template',
    'newsletter',
    'email campaign',
    'marketing email',
    'transactional email',
    'welcome email'
  ]
  
  return emailKeywords.some(keyword => 
    context.toLowerCase().includes(keyword)
  )
}
```

### Landing Page Detection
```typescript
function isLandingPageRequest(context: string): boolean {
  const landingKeywords = [
    'landing page',
    'product page',
    'marketing page',
    'sales page',
    'promotional page'
  ]
  
  return landingKeywords.some(keyword => 
    context.toLowerCase().includes(keyword)
  )
}
```

### Error Page Detection
```typescript
function isErrorPageRequest(context: string): boolean {
  const errorKeywords = [
    'error page',
    '404 page',
    '500 page',
    'not found page',
    'error screen'
  ]
  
  return errorKeywords.some(keyword => 
    context.toLowerCase().includes(keyword)
  )
}
```

## 🎨 Example: Complete Email Template Generation

```typescript
function generateEmailFromTemplate(task: Task): GeneratedFile[] {
  // Extract information from task context
  const companyName = extractValue(task.context, 'company', 'My Company')
  const emailTitle = extractValue(task.context, 'title', 'Welcome!')
  const ctaText = extractValue(task.context, 'cta', 'Get Started')
  
  // Customize email template
  const emailContent = EMAIL_TEMPLATE_HTML
    .replace(/\{\{COMPANY_NAME\}\}/g, companyName)
    .replace(/\{\{EMAIL_TITLE\}\}/g, emailTitle)
    .replace(/\{\{RECIPIENT_NAME\}\}/g, '{{RECIPIENT_NAME}}')
    .replace(/\{\{EMAIL_BODY\}\}/g, generateEmailBody(task.context))
    .replace(/\{\{CTA_TEXT\}\}/g, ctaText)
    .replace(/\{\{CTA_URL\}\}/g, '{{CTA_URL}}')
    .replace(/\{\{COMPANY_ADDRESS\}\}/g, '123 Main St, City, Country')
    .replace(/\{\{COMPANY_WEBSITE\}\}/g, 'https://example.com')
    .replace(/\{\{UNSUBSCRIBE_URL\}\}/g, '{{UNSUBSCRIBE_URL}}')
    .replace(/\{\{PRIVACY_EMAIL\}\}/g, 'privacy@example.com')
    .replace(/\{\{CLOSING_MESSAGE\}\}/g, 'Thank you for your time!')
  
  return [
    {
      path: 'email-template.html',
      content: emailContent
    },
    {
      path: 'README.md',
      content: `# Email Template

## Usage

Replace the following placeholders before sending:
- {{RECIPIENT_NAME}} - Recipient's name
- {{CTA_URL}} - Your call-to-action link
- {{UNSUBSCRIBE_URL}} - Unsubscribe link

## Compliance

This template includes:
- CAN-SPAM Act compliance
- GDPR compliance sections
- Unsubscribe mechanism

## Customization

You can customize:
- Colors in the header gradient
- Button styles
- Footer information`
    }
  ]
}
```

## 🔑 Best Practices

### 1. **Always Provide Placeholders**
```typescript
// Good: Keep dynamic values as placeholders
.replace('{{USER_EMAIL}}', '{{USER_EMAIL}}')

// Bad: Replace with dummy data
.replace('{{USER_EMAIL}}', 'user@example.com')
```

### 2. **Include Documentation**
```typescript
// Always include README with placeholder explanations
return [
  { path: 'template.html', content: templateContent },
  { path: 'README.md', content: documentationContent }
]
```

### 3. **Maintain Template Integrity**
```typescript
// Don't modify template structure, only customize content
const customized = TEMPLATE
  .replace('{{TITLE}}', userTitle)  // OK
  .replace('<header>', '<div>')     // BAD - breaks structure
```

### 4. **Provide Multiple Variants**
```typescript
// Offer template variations
function getEmailTemplate(variant: 'marketing' | 'transactional' | 'newsletter') {
  switch (variant) {
    case 'marketing':
      return EMAIL_TEMPLATE_HTML
    case 'transactional':
      return EMAIL_TRANSACTIONAL_HTML
    case 'newsletter':
      return EMAIL_NEWSLETTER_HTML
  }
}
```

## 🚀 Future Enhancements

### 1. **Template Marketplace**
- User-contributed templates
- Template ratings and reviews
- Template categories and tags

### 2. **AI-Powered Customization**
- LLM understands template structure
- Intelligent placeholder filling
- Style adaptation

### 3. **Template Composition**
- Combine multiple templates
- Modular template sections
- Dynamic template assembly

### 4. **Visual Template Editor**
- Preview templates before generation
- Drag-and-drop customization
- Real-time preview

---

This guide shows how the code agent can effectively leverage templates and snippets to generate high-quality, consistent code faster and more reliably! 🎯✨
