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
    [key: string]: any
  }
}

export interface Adapter {
  run(input: AdapterInput): Promise<AdapterOutput>
}

