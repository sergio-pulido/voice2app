/**
 * Router types and interfaces
 */

import type { IntentCategory } from './intent-router'

export interface AdapterInput {
  text: string
  userId: number
  username?: string
  transcription?: string
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
    [key: string]: any
  }
}

export interface Adapter {
  run(input: AdapterInput): Promise<AdapterOutput>
}

