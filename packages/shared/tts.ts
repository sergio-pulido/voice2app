/**
 * Text-to-Speech using ElevenLabs API
 */

import { config } from './config'
import { logger } from './logger'

export interface TTSOptions {
  text: string
  voiceId?: string
  modelId?: string
}

/**
 * Convert text to speech using ElevenLabs TTS
 * Returns an audio buffer that can be sent to Telegram
 */
export async function textToSpeech(options: TTSOptions): Promise<Buffer | null> {
  try {
    if (!config.elevenlabsApiKey) {
      logger.error('ElevenLabs API key not configured')
      return null
    }

    const { text, voiceId = 'pNInz6obpgDQGcFmaJgB', modelId = 'eleven_monolingual_v1' } = options

    logger.debug('Converting text to speech with ElevenLabs...')

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': config.elevenlabsApiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'  // ElevenLabs returns MP3
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          speed: 1.1,  // Slightly faster for summaries
        },
        output_format: 'mp3_44100_128'  // Compressed MP3 format
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error(`ElevenLabs TTS error (${response.status}): ${errorText}`)
      return null
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer())
    logger.success(`Generated audio: ${audioBuffer.length} bytes`)

    return audioBuffer

  } catch (error) {
    logger.error('TTS error:', error)
    return null
  }
}

