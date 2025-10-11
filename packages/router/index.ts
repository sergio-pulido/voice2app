/**
 * Router package: Intent detection and request routing
 */

import { logger } from '../shared'
import { detectIntent, getCategoryName, getCategoryEmoji, type IntentCategory } from './intent-router'
import { qaAdapter, appCodeAdapter, imageAdapter, videoAdapter } from './adapters'
import type { AdapterInput, AdapterOutput } from './types'

/**
 * Main routing function
 */
export async function routeRequest(input: AdapterInput): Promise<AdapterOutput> {
  const startTime = Date.now()
  
  // Detect intent
  const intent = await detectIntent({
    text: input.text,
    userId: input.userId,
    lang: 'auto'
  })
  
  const categoryName = getCategoryName(intent.category)
  const categoryEmoji = getCategoryEmoji(intent.category)
  
  logger.info(`${categoryEmoji} Routing to: ${categoryName} (confidence: ${intent.confidence})`)
  
  // Route to appropriate adapter
  let result: AdapterOutput
  
  switch (intent.category) {
    case 'qa':
      result = await qaAdapter.run(input)
      break
      
    case 'app_code':
      result = await appCodeAdapter.run(input)
      break
      
    case 'image_gen':
      result = await imageAdapter.run(input)
      break
      
    case 'video_gen':
      result = await videoAdapter.run(input)
      break
      
    default:
      // Fallback to app code
      logger.warn(`Unknown category: ${intent.category}, falling back to app_code`)
      result = await appCodeAdapter.run(input)
  }
  
  // Add routing metadata
  result.metadata = {
    ...result.metadata,
    routedTo: intent.category,
    routingConfidence: intent.confidence,
    totalTime: Date.now() - startTime
  }
  
  return result
}

// Re-export types and utilities
export type { IntentCategory, IntentResult } from './intent-router'
export type { AdapterInput, AdapterOutput, Adapter } from './types'
export { getCategoryName, getCategoryEmoji }

