/**
 * Router package: Intent detection and request routing
 */

import { logger, config } from '../shared'
import { detectIntent, getCategoryName, getCategoryEmoji, type IntentCategory } from './intent-router'
import { qaAdapter, appCodeAdapter, imageAdapter, videoAdapter, translateAdapter } from './adapters'
import type { AdapterInput, AdapterOutput } from './types'

// Import STT functionality
import { transcribeAudio } from '../planner'
// Import Lingo translation
import { normalizeInput } from './services/lingo-service'

/**
 * Main routing function
 */
export async function routeRequest(input: AdapterInput): Promise<AdapterOutput> {
  const startTime = Date.now()
  
  // Handle voice transcription if needed
  let textToProcess: string = input.text || ''
  let transcription = input.transcription
  
  if (input.voiceBuffer && !input.transcription) {
    logger.info('🎤 Transcribing voice message...')
    try {
      const sttResult = await transcribeAudio(input.voiceBuffer)
      transcription = sttResult.text
      textToProcess = transcription || ''
      logger.success(`✅ Transcription: "${transcription}"`)
    } catch (error) {
      logger.error('❌ Voice transcription failed:', error)
      textToProcess = input.text || 'Voice message transcription failed'
    }
  }
  
  // Ensure textToProcess is always a string
  if (typeof textToProcess !== 'string') {
    textToProcess = String(textToProcess)
  }
  
  // Step: Language detection and normalization (if Lingo is configured)
  let detectedLang = 'en'
  let normalizedText = textToProcess
  
  if (config.lingoApiKey && textToProcess.trim().length > 0) {
    logger.info('🌍 Detecting language and normalizing input...')
    try {
      const lingoResult = await normalizeInput(textToProcess)
      detectedLang = lingoResult.detectedLang
      normalizedText = lingoResult.translatedText
      logger.success(`🌍 Language: ${detectedLang} → Normalized: "${normalizedText}"`)
    } catch (error) {
      logger.warn('Language normalization failed, using original text:', error)
    }
  }
  
  // Detect intent using normalized text
  const intent = await detectIntent({
    text: normalizedText,
    userId: input.userId,
    lang: detectedLang
  })
  
  const categoryName = getCategoryName(intent.category)
  const categoryEmoji = getCategoryEmoji(intent.category)
  
  logger.info(`${categoryEmoji} Routing to: ${categoryName} (confidence: ${intent.confidence})`)
  
  // Route to appropriate adapter
  let result: AdapterOutput
  
  // Update input with transcription and language info for adapters
  const adapterInput = {
    ...input,
    text: normalizedText, // Use normalized text for processing
    transcription,
    originalText: textToProcess, // Keep original for reference
    detectedLang
  }
  
  switch (intent.category) {
    case 'qa':
      result = await qaAdapter.run(adapterInput)
      break
      
    case 'app_code':
      result = await appCodeAdapter.run(adapterInput)
      break
      
    case 'image_gen':
      result = await imageAdapter.run(adapterInput)
      break
      
    case 'video_gen':
      result = await videoAdapter.run(adapterInput)
      break
      
    case 'translate':
      result = await translateAdapter.run(adapterInput)
      break
      
    default:
      // Fallback to app code
      logger.warn(`Unknown category: ${intent.category}, falling back to app_code`)
      result = await appCodeAdapter.run(adapterInput)
  }
  
  // Add routing metadata
  result.metadata = {
    ...result.metadata,
    routedTo: intent.category,
    routingConfidence: intent.confidence,
    transcription,
    detectedLang,
    originalText: textToProcess,
    normalizedText,
    totalTime: Date.now() - startTime
  }
  
  return result
}

// Re-export types and utilities
export type { IntentCategory, IntentResult } from './intent-router'
export type { AdapterInput, AdapterOutput, Adapter } from './types'
export { getCategoryName, getCategoryEmoji }

