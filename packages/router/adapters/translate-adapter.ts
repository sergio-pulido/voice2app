/**
 * Translation Adapter: Handles explicit translation requests
 */

import { logger, config } from '../../shared'
import { translate, detectLanguage } from '../services/free-translation-service'
import type { Adapter, AdapterInput, AdapterOutput } from '../types'

export class TranslateAdapter implements Adapter {
  async run(input: AdapterInput): Promise<AdapterOutput> {
    logger.info('🌐 Running Translation adapter...')
    
    const startTime = Date.now()
    
    try {
      const prompt = String(input.transcription || input.text || '')
      
      // Using free translation service - no API key needed
      
      logger.debug(`Translation request: "${prompt}"`)
      
      // Extract source text and target language from the prompt
      const { sourceText, targetLang } = this.extractTranslationRequest(prompt)
      
      if (!sourceText || !targetLang) {
        return {
          summaryText: 
            `🌐 **Translation Help**\n\n` +
            `To translate text, use one of these formats:\n\n` +
            `• "Translate 'Hello world' to Spanish"\n` +
            `• "Traduce 'Hola mundo' al inglés"\n` +
            `• "How do you say 'Good morning' in French?"\n\n` +
            `I'll detect the language and translate for you!`,
          ttsText: `Please specify what text to translate and to which language.`,
          metadata: {
            category: 'translate',
            processingTime: Date.now() - startTime,
            status: 'partial'
          }
        }
      }
      
      // Detect source language if not specified
      logger.info(`🔍 Detecting source language...`)
      const detectedLang = await detectLanguage(sourceText)
      
      // Translate the text
      logger.info(`🌐 Translating from ${detectedLang} to ${targetLang}...`)
      const translatedText = await translate(sourceText, targetLang)
      
      const processingTime = Date.now() - startTime
      
      // Build response message
      let response = 
        `**Done!**\n\n` +
        `**Original (${detectedLang}):**\n"${sourceText}"\n\n` +
        `**Translated (${targetLang}):**\n"${translatedText}"\n\n` +
        `_Translated in ${(processingTime / 1000).toFixed(1)}s_`
      
      // Post-processing: Translate response back to original language if needed
      const originalLang = input.detectedLang || 'en'
      if (originalLang !== 'en' && response.trim().length > 0) {
        logger.info(`🌐 Translating response back to ${originalLang}...`)
        try {
          response = await translate(response, originalLang)
          logger.success(`✅ Translation response translated to ${originalLang}`)
        } catch (error) {
          logger.warn('Translation response translation failed, keeping English:', error)
        }
      }
      
      return {
        summaryText: response,
        ttsText: `Translated: ${translatedText}`,
        metadata: {
          category: 'translate',
          processingTime,
          status: 'success',
          sourceText,
          targetLang,
          detectedLang,
          translatedText
        }
      }
    } catch (error) {
      logger.error('Translation adapter error:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      let userMessage = `❌ **Translation Failed**\n\n`
      userMessage += `Error: ${errorMessage}\n\n`
      userMessage += `💡 Common solutions:\n`
      userMessage += `• Check your Lingo API key\n`
      userMessage += `• Try a simpler text to translate\n`
      userMessage += `• Make sure the target language is valid\n`
      userMessage += `• Try again if the service is temporarily unavailable`
      
      return {
        summaryText: userMessage,
        ttsText: `Translation failed. Please try again.`,
        metadata: {
          category: 'translate',
          processingTime: Date.now() - startTime,
          status: 'error',
          error: errorMessage
        }
      }
    }
  }
  
  /**
   * Extract source text and target language from translation request
   */
  private extractTranslationRequest(prompt: string): { sourceText: string; targetLang: string } {
    const lowerPrompt = prompt.toLowerCase()
    
    // Pattern 0: "Translate the next to language:" (followed by text to translate)
    const nextPattern = /translate\s+the\s+next\s+to\s+(\w+):\s*(.+)/is
    let match = prompt.match(nextPattern)
    if (match) {
      const textToTranslate = match[2].trim()
      if (textToTranslate.length > 10) { // Ensure there's substantial text
        return { sourceText: textToTranslate, targetLang: this.normalizeLanguage(match[1]) }
      }
    }
    
    // Pattern 1: "Translate 'text' to language"
    const translatePattern = /translate\s+['"]([^'"]+)['"]\s+to\s+(\w+)/i
    match = prompt.match(translatePattern)
    if (match) {
      return { sourceText: match[1].trim(), targetLang: this.normalizeLanguage(match[2]) }
    }
    
    // Pattern 2: "How do you say 'text' in language?"
    const howPattern = /how\s+do\s+you\s+say\s+['"]([^'"]+)['"]\s+in\s+(\w+)/i
    match = prompt.match(howPattern)
    if (match) {
      return { sourceText: match[1].trim(), targetLang: this.normalizeLanguage(match[2]) }
    }
    
    // Pattern 3: "Traduce 'text' al language" (Spanish)
    const traducePattern = /traduce\s+['"]([^'"]+)['"]\s+al?\s+(\w+)/i
    match = prompt.match(traducePattern)
    if (match) {
      return { sourceText: match[1].trim(), targetLang: this.normalizeLanguage(match[2]) }
    }
    
    // Pattern 4: "Translate text to language" (without quotes)
    const simplePattern = /translate\s+(.+?)\s+to\s+(\w+)/i
    match = prompt.match(simplePattern)
    if (match) {
      return { sourceText: match[1].trim(), targetLang: this.normalizeLanguage(match[2]) }
    }
    
    // Pattern 5: "What is 'text' in language?"
    const whatPattern = /what\s+is\s+['"]([^'"]+)['"]\s+in\s+(\w+)/i
    match = prompt.match(whatPattern)
    if (match) {
      return { sourceText: match[1].trim(), targetLang: this.normalizeLanguage(match[2]) }
    }
    
    // Pattern 6: "Translate this to language:" (followed by text)
    const thisPattern = /translate\s+this\s+to\s+(\w+):\s*(.+)/is
    match = prompt.match(thisPattern)
    if (match) {
      const textToTranslate = match[2].trim()
      if (textToTranslate.length > 10) {
        return { sourceText: textToTranslate, targetLang: this.normalizeLanguage(match[1]) }
      }
    }
    
    // Pattern 7: "Translate the following to language:" (followed by text)
    const followingPattern = /translate\s+the\s+following\s+to\s+(\w+):\s*(.+)/is
    match = prompt.match(followingPattern)
    if (match) {
      const textToTranslate = match[2].trim()
      if (textToTranslate.length > 10) {
        return { sourceText: textToTranslate, targetLang: this.normalizeLanguage(match[1]) }
      }
    }
    
    return { sourceText: '', targetLang: '' }
  }
  
  /**
   * Normalize language names to common codes
   */
  private normalizeLanguage(lang: string): string {
    const normalized = lang.toLowerCase().trim()
    
    const languageMap: Record<string, string> = {
      // English
      'english': 'en',
      'eng': 'en',
      
      // Spanish
      'spanish': 'es',
      'español': 'es',
      'espanol': 'es',
      
      // French
      'french': 'fr',
      'français': 'fr',
      'francais': 'fr',
      
      // German
      'german': 'de',
      'deutsch': 'de',
      
      // Italian
      'italian': 'it',
      'italiano': 'it',
      
      // Portuguese
      'portuguese': 'pt',
      'português': 'pt',
      'portugues': 'pt',
      
      // Catalan
      'catalan': 'ca',
      'català': 'ca',
      'catala': 'ca',
      
      // Chinese
      'chinese': 'zh',
      'mandarin': 'zh',
      
      // Japanese
      'japanese': 'ja',
      'nihongo': 'ja',
      
      // Korean
      'korean': 'ko',
      
      // Russian
      'russian': 'ru',
      'русский': 'ru',
      
      // Arabic
      'arabic': 'ar',
      'العربية': 'ar'
    }
    
    return languageMap[normalized] || normalized
  }
}

export const translateAdapter = new TranslateAdapter()
