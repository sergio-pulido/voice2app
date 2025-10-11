/**
 * Free Translation Service - Using MyMemory API (reliable & free)
 */

import { logger } from '../../shared/logger'

const MYMEMORY_BASE = 'https://api.mymemory.translated.net'

/**
 * Detect language using simple heuristics + MyMemory
 */
export async function detectLanguage(text: string): Promise<string> {
  try {
    logger.debug(`🔍 Detecting language for: "${text.substring(0, 50)}..."`)
    
    // Simple heuristic detection for common languages
    const sample = text.toLowerCase().substring(0, 200)
    
    // German indicators
    if (sample.match(/\b(der|die|das|und|ist|nicht|zu|den|ein|eine|ich|sie|er)\b/)) {
      logger.debug(`🌍 Detected language: de (German)`)
      return 'de'
    }
    
    // Spanish indicators
    if (sample.match(/\b(el|la|los|las|de|que|es|en|por|para|con|una|uno)\b/)) {
      logger.debug(`🌍 Detected language: es (Spanish)`)
      return 'es'
    }
    
    // French indicators
    if (sample.match(/\b(le|la|les|de|un|une|est|dans|pour|avec|ce|qui)\b/)) {
      logger.debug(`🌍 Detected language: fr (French)`)
      return 'fr'
    }
    
    // Italian indicators
    if (sample.match(/\b(il|lo|la|di|che|un|una|per|con|come|sono)\b/)) {
      logger.debug(`🌍 Detected language: it (Italian)`)
      return 'it'
    }
    
    // Portuguese indicators
    if (sample.match(/\b(o|a|os|as|de|que|um|uma|para|com|não|são)\b/)) {
      logger.debug(`🌍 Detected language: pt (Portuguese)`)
      return 'pt'
    }
    
    // Default to English
    logger.debug(`🌍 Detected language: en (English - default)`)
    return 'en'
  } catch (error) {
    logger.warn('Language detection failed, defaulting to English:', error)
    return 'en'
  }
}

/**
 * Translate text using MyMemory API
 */
export async function translate(text: string, targetLang: string): Promise<string> {
  try {
    logger.debug(`🌐 Translating to ${targetLang}: "${text.substring(0, 50)}..."`)
    
    // Auto-detect source language
    const sourceLang = await detectLanguage(text)
    
    // Don't translate if same language
    if (sourceLang === targetLang) {
      logger.debug(`✅ Same language, skipping translation`)
      return text
    }
    
    // Split long text into chunks (MyMemory has 500 char limit)
    const chunks = splitIntoChunks(text, 400)
    const translations: string[] = []
    
    for (const chunk of chunks) {
      const encodedText = encodeURIComponent(chunk)
      const url = `${MYMEMORY_BASE}/get?q=${encodedText}&langpair=${sourceLang}|${targetLang}`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`MyMemory API error: ${response.status}`)
      }
      
      const data: any = await response.json()
      
      if (data.responseData && data.responseData.translatedText) {
        translations.push(data.responseData.translatedText)
      } else {
        throw new Error('Invalid response from MyMemory API')
      }
      
      // Small delay between requests to avoid rate limiting
      if (chunks.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    }
    
    const translated = translations.join(' ')
    logger.debug(`✅ Translation result: "${translated.substring(0, 50)}..."`)
    return translated
  } catch (error) {
    logger.warn('Translation failed, returning original text:', error)
    return text
  }
}

/**
 * Split text into chunks
 */
function splitIntoChunks(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) {
    return [text]
  }
  
  const chunks: string[] = []
  const sentences = text.split(/([.!?]\s+)/)
  let currentChunk = ''
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= maxLength) {
      currentChunk += sentence
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim())
      }
      currentChunk = sentence
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim())
  }
  
  return chunks
}

/**
 * Normalize input (detect and translate to English if needed)
 */
export async function normalizeInput(text: string, target = 'en') {
  try {
    const lang = await detectLanguage(text)
    if (lang.toLowerCase() === target.toLowerCase()) {
      return { detectedLang: lang, translatedText: text }
    }
    const translatedText = await translate(text, target)
    return { detectedLang: lang, translatedText }
  } catch (error) {
    logger.warn('Input normalization failed, using original text:', error)
    return { detectedLang: 'en', translatedText: text }
  }
}
