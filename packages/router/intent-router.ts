/**
 * Intent Router: Classifies user requests into categories
 */

import { logger } from '../shared'

export type IntentCategory = 'qa' | 'app_code' | 'image_gen' | 'video_gen' | 'translate'

export interface IntentResult {
  category: IntentCategory
  confidence: number
  reasoning?: string
}

interface RouterInput {
  text: string
  userId: number
  lang?: string
}

/**
 * Fast keyword-based classification
 */
function fastClassify(text: string): IntentResult | null {
  const lowerText = text.toLowerCase()
  
  // Check for explanation/Q&A patterns FIRST (to avoid false positives)
  const qaSpecificPatterns = [
    'what is', 'qué es', 'cual es', 'which is',
    'explain', 'explica', 'what does', 'qué significa',
    'how does', 'cómo funciona', 'tell me about', 'dime sobre'
  ]
  
  for (const pattern of qaSpecificPatterns) {
    if (lowerText.includes(pattern)) {
      return { category: 'qa', confidence: 0.9 }
    }
  }
  
  // App/Code generation keywords
  const appKeywords = [
    'create app', 'build app', 'make app', 'genera app',
    'create page', 'build page', 'make page', 'genera página',
    'create website', 'build website', 'make website',
    'todo app', 'counter app', 'landing page',
    'create component', 'build component', 'make component',
    'crea una app', 'haz una app', 'construye',
    'hacer una página', 'crear página'
  ]
  
  // Image generation keywords (be very specific to avoid false positives)
  const imageKeywords = [
    'generate image', 'create image', 'make image',
    'generate a logo', 'create a logo', 'make a logo', 'design a logo',
    'generate illustration', 'create illustration',
    'crea imagen', 'genera imagen', 'diseña imagen',
    'draw a', 'dibuja un', 'dibuja una'
  ]
  
  // Video generation keywords
  const videoKeywords = [
    'create video', 'generate video', 'make video',
    'crea video', 'genera video', 'haz video',
    'vídeo corto', 'short video', 'clip'
  ]
  
  // Translation keywords
  const translateKeywords = [
    'translate', 'traduce', 'tradueix', 'traduir',
    'how do you say', 'cómo se dice', 'com es diu',
    'what is', 'qué es', 'què és',
    'in spanish', 'en español', 'en castellano',
    'in french', 'en français', 'en francés',
    'in english', 'en inglés', 'en anglès',
    'in italian', 'en italiano',
    'in german', 'en alemán', 'en alemany'
  ]
  
  // Additional Q&A keywords (for broader matching)
  const qaGeneralKeywords = [
    'how to', 'cómo', 'why', 'por qué',
    'capital', 'definition'
  ]
  
  // Check for translation (high priority)
  for (const keyword of translateKeywords) {
    if (lowerText.includes(keyword)) {
      return { category: 'translate', confidence: 0.9 }
    }
  }
  
  // Check for app/code generation (highest priority for this system)
  for (const keyword of appKeywords) {
    if (lowerText.includes(keyword)) {
      return { category: 'app_code', confidence: 0.9 }
    }
  }
  
  // Check for image generation
  for (const keyword of imageKeywords) {
    if (lowerText.includes(keyword)) {
      return { category: 'image_gen', confidence: 0.85 }
    }
  }
  
  // Check for video generation
  for (const keyword of videoKeywords) {
    if (lowerText.includes(keyword)) {
      return { category: 'video_gen', confidence: 0.85 }
    }
  }
  
  // Check for general Q&A keywords
  for (const keyword of qaGeneralKeywords) {
    if (lowerText.includes(keyword)) {
      return { category: 'qa', confidence: 0.8 }
    }
  }
  
  return null
}

/**
 * Keyword-based classification fallback (when Groq fails)
 */
async function llmClassify(text: string): Promise<IntentResult> {
  const lowerText = text.toLowerCase()
  
  // Image generation keywords
  const imageKeywords = [
    'image', 'imagen', 'picture', 'photo', 'foto',
    'generate', 'genera', 'create', 'crea',
    'logo', 'illustration', 'ilustración',
    'draw', 'dibuja', 'paint', 'sketch'
  ]
  
  // Check for image generation (high priority)
  const hasImageKeyword = imageKeywords.some(kw => lowerText.includes(kw))
  const wantsImage = lowerText.match(/\b(i want|quiero|dame|give me|generate|create).*(image|imagen|picture|logo|illustration)/i)
  
  if (hasImageKeyword || wantsImage) {
    return {
      category: 'image_gen',
      confidence: 0.8,
      reasoning: 'Image generation keywords detected (fallback)'
    }
  }
  
  // App building keywords
  const appKeywords = [
    'create app', 'build app', 'make app',
    'create page', 'build page', 'make page',
    'create component', 'build site', 'website',
    'landing page', 'todo', 'counter'
  ]
  
  if (appKeywords.some(kw => lowerText.includes(kw))) {
    return {
      category: 'app_code',
      confidence: 0.7,
      reasoning: 'App building keywords detected (fallback)'
    }
  }
  
  // Video generation keywords
  if (lowerText.match(/\b(video|clip|animation|animate)/i)) {
    return {
      category: 'video_gen',
      confidence: 0.7,
      reasoning: 'Video keywords detected (fallback)'
    }
  }
  
  // Default to Q&A (safest option)
  return {
    category: 'qa',
    confidence: 0.6,
    reasoning: 'Default to Q&A (fallback)'
  }
}

/**
 * Validate and sanitize input
 */
function validateInput(text: string): { valid: boolean; reason?: string; cleaned: string } {
  // Remove extra whitespace
  const cleaned = text.trim().replace(/\s+/g, ' ')
  
  // Check minimum length (at least 2 words or 3 characters)
  if (cleaned.length < 3) {
    return { valid: false, reason: 'Input too short', cleaned }
  }
  
  // Check if it's just emojis or special characters
  if (!/[a-zA-Z0-9áéíóúñÁÉÍÓÚÑ]/.test(cleaned)) {
    return { valid: false, reason: 'No valid text content', cleaned }
  }
  
  // Check word count (at least 1 meaningful word)
  const words = cleaned.split(' ').filter(w => w.length > 0)
  if (words.length === 0) {
    return { valid: false, reason: 'No words found', cleaned }
  }
  
  return { valid: true, cleaned }
}

/**
 * Use Groq to intelligently classify the request
 */
async function groqClassify(text: string): Promise<IntentResult> {
  const apiKey = require('../shared/config').config.groqApiKey || require('../shared/config').config.openaiApiKey
  
  if (!apiKey) {
    logger.warn('No LLM API key for classification, using fallback')
    return llmClassify(text)
  }
  
  const isGroq = !!require('../shared/config').config.groqApiKey
  const url = isGroq 
    ? 'https://api.groq.com/openai/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions'
  
  const model = isGroq ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini'
  
  // Retry logic for Groq (up to 2 attempts)
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: `You are an intent classifier. Classify the user's request into ONE of these categories:

1. "qa" - Questions, explanations, information requests
   Examples: "What is X?", "Explain Y", "Tell me about Z", "How does X work?"

2. "app_code" - Building apps, websites, components, code
   Examples: "Create a counter app", "Build a landing page", "Make a todo list"

3. "image_gen" - Generating images, logos, illustrations
   Examples: "Generate a logo", "Create an image of X", "Draw a picture", "I want an image of X"

4. "video_gen" - Generating videos, clips, animations
   Examples: "Create a video", "Make a clip", "Generate video about X"

5. "translate" - Translation requests
   Examples: "Translate 'Hello' to Spanish", "How do you say 'Good morning' in French?", "What is 'cat' in German?"

Respond with ONLY ONE WORD: qa, app_code, image_gen, video_gen, or translate

Default to "qa" if uncertain.`
            },
            {
              role: 'user',
              content: text
            }
          ],
          temperature: 0.3,
          max_tokens: 10
        })
      })
      
      if (!response.ok) {
        const is500 = response.status === 500
        if (is500 && attempt < 2) {
          logger.warn(`Groq classification failed (${response.status}), retrying...`)
          await new Promise(resolve => setTimeout(resolve, 1000))
          continue
        }
        logger.warn('Groq classification failed, using fallback')
        return llmClassify(text)
      }
    
      const data: any = await response.json()
      const result = data.choices[0]?.message?.content?.trim().toLowerCase() || 'qa'
      
      // Validate the response
      const validCategories: IntentCategory[] = ['qa', 'app_code', 'image_gen', 'video_gen', 'translate']
      const category = validCategories.includes(result as IntentCategory) 
        ? result as IntentCategory 
        : 'qa'
      
      return {
        category,
        confidence: 0.95,
        reasoning: 'Groq LLM classification'
      }
    } catch (error: any) {
      lastError = error
      const is500 = error?.message?.includes('500')
      if (is500 && attempt < 2) {
        logger.warn(`Groq classification error (attempt ${attempt}), retrying...`)
        await new Promise(resolve => setTimeout(resolve, 1000))
        continue
      }
      logger.warn('Groq classification error, using fallback:', error)
      return llmClassify(text)
    }
  }
  
  // If we get here, all retries failed
  logger.warn('All Groq classification attempts failed, using fallback')
  return llmClassify(text)
}

/**
 * Main intent detection function
 */
export async function detectIntent(input: RouterInput): Promise<IntentResult> {
  const textToLog = typeof input.text === 'string' ? input.text.substring(0, 50) : String(input.text).substring(0, 50)
  logger.debug(`🧠 Detecting intent for: "${textToLog}..."`)
  
  // Step 1: Validate and sanitize input
  const textToValidate = typeof input.text === 'string' ? input.text : String(input.text)
  const validation = validateInput(textToValidate)
  
  if (!validation.valid) {
    logger.warn(`⚠️  Invalid input: ${validation.reason}`)
    // Return Q&A as safe default for invalid input
    return {
      category: 'qa',
      confidence: 0.5,
      reasoning: `Invalid input: ${validation.reason}`
    }
  }
  
  const cleanedText = validation.cleaned
  
  // Step 2: Use Groq for intelligent classification
  logger.info('🤖 Using Groq for intelligent intent classification...')
  const groqResult = await groqClassify(cleanedText)
  
  logger.info(`🎯 Groq classified as: ${groqResult.category} (confidence: ${groqResult.confidence})`)
  
  return groqResult
}

/**
 * Get human-readable category name
 */
export function getCategoryName(category: IntentCategory): string {
  const names: Record<IntentCategory, string> = {
    'qa': '💬 Q&A',
    'app_code': '💻 App Builder',
    'image_gen': '🎨 Image Generator',
    'video_gen': '🎬 Video Generator',
    'translate': '🌐 Translator'
  }
  return names[category]
}

/**
 * Get category emoji
 */
export function getCategoryEmoji(category: IntentCategory): string {
  const emojis: Record<IntentCategory, string> = {
    'qa': '💬',
    'app_code': '💻',
    'image_gen': '🎨',
    'video_gen': '🎬',
    'translate': '🌐'
  }
  return emojis[category]
}

