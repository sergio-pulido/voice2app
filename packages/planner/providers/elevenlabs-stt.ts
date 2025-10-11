/**
 * ElevenLabs STT Provider
 */

import { config, logger, type ISTTProvider, type STTResult } from '../../shared'

export class ElevenLabsSTTProvider implements ISTTProvider {
  async transcribe(audioBuffer: Buffer): Promise<STTResult> {
    try {
      logger.debug('Using ElevenLabs STT')
      
      // Create form data
      const formData = new FormData()
      const audioBlob = new Blob([audioBuffer], { type: 'audio/ogg' })
      formData.append('audio', audioBlob, 'audio.ogg')
      formData.append('model_id', 'eleven_multilingual_v2')
      
      // Call ElevenLabs Speech-to-Text API
      const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: {
          'xi-api-key': config.elevenlabsApiKey,
        },
        body: formData,
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`ElevenLabs API error (${response.status}): ${errorText}`)
      }
      
      const result = await response.json() as { 
        text: string
        duration_seconds?: number
        language?: string
      }
      
      return {
        text: result.text,
        duration: result.duration_seconds || 0,
        language: result.language,
      }
    } catch (error) {
      logger.error('ElevenLabs STT error:', error)
      throw error
    }
  }
}

