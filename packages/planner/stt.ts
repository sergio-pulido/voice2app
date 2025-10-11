/**
 * Speech-to-Text using configured provider
 */

import { config, logger, type STTResult } from '../shared'
import { createSTTProvider } from './providers'

export async function transcribeAudio(audioBuffer: Buffer): Promise<STTResult> {
  try {
    logger.info(`Using STT provider: ${config.sttProvider}`)
    
    const provider = createSTTProvider()
    const result = await provider.transcribe(audioBuffer)
    
    logger.success(`Transcribed: "${result.text}"`)
    
    return result
  } catch (error) {
    logger.error('STT error:', error)
    throw error
  }
}

