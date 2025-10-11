/**
 * ElevenLabs STT Provider
 */

import { config, logger, type ISTTProvider, type STTResult } from '../../shared'

export class ElevenLabsSTTProvider implements ISTTProvider {
  async transcribe(audioBuffer: Buffer): Promise<STTResult> {
    try {
      logger.debug('Using ElevenLabs STT')
      
      if (!audioBuffer || audioBuffer.length === 0) {
        throw new Error('Empty audio buffer provided')
      }
      
      logger.debug(`Audio buffer size: ${audioBuffer.length} bytes`)
      
      // Create form data - use Bun.file() or File constructor properly
      const formData = new FormData()
      
      // Create a proper File object with the audio buffer
      const audioFile = new File(
        [new Uint8Array(audioBuffer)], 
        'audio.oga', 
        { type: 'audio/ogg' }
      )
      
      formData.append('file', audioFile)  // ElevenLabs uses 'file' not 'audio'
      formData.append('model_id', 'scribe_v1')  // Use the correct ElevenLabs STT model
      
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

