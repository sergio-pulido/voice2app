/**
 * Router types and interfaces
 */

import type { IntentCategory } from './intent-router'
import type { STTResult } from '../shared'

export interface AdapterInput {
  text: string
  userId: number
  username?: string
  transcription?: string  // Transcribed text from voiceBuffer (STTResult.text)
  voiceBuffer?: Buffer
  originalText?: string   // Original text before normalization
  detectedLang?: string   // Detected language from Lingo
}

export interface AdapterOutput {
  summaryText: string
  ttsText?: string
  attachments?: string[]
  metadata?: {
    category: IntentCategory
    processingTime?: number
    filesGenerated?: number
    status?: 'success' | 'partial' | 'error'
    transcription?: string  // Original voice transcription
    detectedLang?: string   // Detected language
    originalText?: string   // Original text before normalization
    normalizedText?: string // Normalized text used for processing
    [key: string]: any
  }
}

export interface Adapter {
  run(input: AdapterInput): Promise<AdapterOutput>
}

