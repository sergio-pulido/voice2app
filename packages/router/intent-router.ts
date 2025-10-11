/**
 * Intent Router: Classifies user requests into categories
 */

import { logger } from '../shared'

export type IntentCategory = 'qa' | 'app_code' | 'image_gen' | 'video_gen'

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
  
  // Image generation keywords
  const imageKeywords = [
    'create image', 'generate image', 'make image', 'create an image',
    'crea imagen', 'genera imagen', 'diseña imagen',
    'logo', 'icon', 'illustration', 'ilustración',
    'draw', 'dibuja', 'picture', 'foto', 'of a mountain', 'of a'
  ]
  
  // Video generation keywords
  const videoKeywords = [
    'create video', 'generate video', 'make video',
    'crea video', 'genera video', 'haz video',
    'vídeo corto', 'short video', 'clip'
  ]
  
  // Additional Q&A keywords (for broader matching)
  const qaGeneralKeywords = [
    'how to', 'cómo', 'why', 'por qué',
    'capital', 'definition'
  ]
  
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
 * LLM-based classification fallback
 */
async function llmClassify(text: string): Promise<IntentResult> {
  // For now, use a simple heuristic
  // TODO: Implement actual LLM classification
  
  // If text is short and looks like a question, assume Q&A
  if (text.length < 100 && (text.includes('?') || text.match(/^(what|which|where|when|who|how|why|qué|cuál|dónde|cuándo|quién|cómo|por qué)/i))) {
    return {
      category: 'qa',
      confidence: 0.7,
      reasoning: 'Short question detected'
    }
  }
  
  // Default to app_code (this is our main use case)
  return {
    category: 'app_code',
    confidence: 0.6,
    reasoning: 'Default to app building'
  }
}

/**
 * Main intent detection function
 */
export async function detectIntent(input: RouterInput): Promise<IntentResult> {
  logger.debug(`🧠 Detecting intent for: "${input.text.substring(0, 50)}..."`)
  
  // Try fast classification first
  const fastResult = fastClassify(input.text)
  
  if (fastResult && fastResult.confidence >= 0.8) {
    logger.info(`🎯 Fast classification: ${fastResult.category} (confidence: ${fastResult.confidence})`)
    return fastResult
  }
  
  // Fallback to LLM classification
  logger.debug('🤔 Using LLM classification...')
  const llmResult = await llmClassify(input.text)
  
  logger.info(`🎯 LLM classification: ${llmResult.category} (confidence: ${llmResult.confidence})`)
  
  // If confidence is too low, ask for clarification
  if (llmResult.confidence < 0.6) {
    logger.warn('⚠️  Low confidence, may need clarification')
  }
  
  return llmResult
}

/**
 * Get human-readable category name
 */
export function getCategoryName(category: IntentCategory): string {
  const names: Record<IntentCategory, string> = {
    'qa': '💬 Q&A',
    'app_code': '💻 App Builder',
    'image_gen': '🎨 Image Generator',
    'video_gen': '🎬 Video Generator'
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
    'video_gen': '🎬'
  }
  return emojis[category]
}

