/**
 * OpenAI Whisper STT Provider
 */

import { config, logger, type ISTTProvider, type STTResult } from '../../shared'
import { writeFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

export class OpenAISTTProvider implements ISTTProvider {
  async transcribe(audioBuffer: Buffer): Promise<STTResult> {
    try {
      // Save buffer to temp file (Whisper API needs a file)
      const tempPath = join(tmpdir(), `voice_${Date.now()}.ogg`)
      await writeFile(tempPath, audioBuffer)
      
      logger.debug(`Saved audio to temp file: ${tempPath}`)
      
      // Create form data for Whisper API
      const formData = new FormData()
      const audioBlob = new Blob([audioBuffer], { type: 'audio/ogg' })
      formData.append('file', audioBlob, 'audio.ogg')
      formData.append('model', 'whisper-1')
      formData.append('language', 'en')
      
      // Call OpenAI Whisper API
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.openaiApiKey}`,
        },
        body: formData,
      })
      
      // Clean up temp file
      try {
        await unlink(tempPath)
      } catch (e) {
        logger.warn('Failed to delete temp file:', tempPath)
      }
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`OpenAI Whisper API error (${response.status}): ${errorText}`)
      }
      
      const result = await response.json() as { text: string; duration?: number; language?: string }
      
      return {
        text: result.text,
        duration: result.duration || 0,
        language: result.language,
      }
    } catch (error) {
      logger.error('OpenAI STT error:', error)
      throw error
    }
  }
}

