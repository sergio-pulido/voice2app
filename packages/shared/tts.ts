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
/**
 * Try ElevenLabs TTS with retry logic
 */
async function tryElevenLabsTTS(text: string, voiceId: string, modelId: string, maxRetries: number = 2): Promise<Buffer | null> {
  // Validate API key format first
  if (!config.elevenlabsApiKey || config.elevenlabsApiKey.length < 20) {
    logger.error('❌ Invalid ElevenLabs API key format')
    logger.error('💡 API key should be ~32 characters long')
    return null
  }

  logger.info(`🔑 Using ElevenLabs API key: ${config.elevenlabsApiKey.substring(0, 8)}...`)
  logger.info(`🎭 Using voice: ${voiceId}`)

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`
      logger.debug(`📡 ElevenLabs URL: ${url}`)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'xi-api-key': config.elevenlabsApiKey!,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            speed: 1.1,
          },
          output_format: 'mp3_44100_128'
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        const is500Error = response.status >= 500
        
        // Detailed error analysis
        if (response.status === 401) {
          logger.error('❌ ElevenLabs: Invalid API key (401 Unauthorized)')
          logger.error('💡 Check your ELEVENLABS_API_KEY in .env file')
          return null
        } else if (response.status === 403) {
          logger.error('❌ ElevenLabs: Access forbidden (403)')
          logger.error('💡 Check your subscription plan - some voices require Creator+ tier')
          return null
        } else if (response.status === 429) {
          logger.error('❌ ElevenLabs: Rate limit exceeded (429)')
          logger.error('💡 You have exceeded your monthly character quota')
          return null
        } else if (response.status === 422) {
          logger.error('❌ ElevenLabs: Invalid request (422)')
          logger.error('💡 Check voice ID or text length limits')
          logger.error(`📝 Text length: ${text.length} chars`)
          return null
        } else if (is500Error && attempt < maxRetries) {
          logger.warn(`⚠️ ElevenLabs server error (${response.status}), retrying (${attempt}/${maxRetries})...`)
          logger.warn(`🔍 Error details: ${errorText}`)
          await new Promise(resolve => setTimeout(resolve, 1000))
          continue
        }
        
        logger.error(`❌ ElevenLabs TTS error (${response.status}): ${errorText}`)
        
        // Try to parse error details
        try {
          const errorData = JSON.parse(errorText)
          if (errorData.detail?.message) {
            logger.error(`🔍 ElevenLabs says: ${errorData.detail.message}`)
          }
        } catch (e) {
          // Error text is not JSON, that's fine
        }
        
        return null
      }

      const audioBuffer = Buffer.from(await response.arrayBuffer())
      logger.success(`✅ ElevenLabs TTS: ${Math.round(audioBuffer.length / 1024)}KB`)
      return audioBuffer

    } catch (error) {
      if (attempt < maxRetries) {
        logger.warn(`⚠️ ElevenLabs error (attempt ${attempt}/${maxRetries}), retrying...`)
        logger.warn(`🔍 Error: ${error}`)
        await new Promise(resolve => setTimeout(resolve, 1000))
        continue
      }
      logger.error('❌ ElevenLabs TTS error:', error)
      return null
    }
  }
  
  return null
}

/**
 * Try OpenAI TTS as fallback
 */
async function tryOpenAITTS(text: string): Promise<Buffer | null> {
  try {
    if (!config.openaiApiKey || config.openaiApiKey.includes('YOUR_KEY')) {
      logger.warn('⚠️ OpenAI API key not configured properly - skipping OpenAI TTS')
      return null
    }

    logger.info('🎤 Trying OpenAI TTS as fallback...')

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: 'alloy',
        input: text,
        speed: 1.1
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error(`❌ OpenAI TTS error (${response.status}): ${errorText}`)
      return null
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer())
    logger.success(`✅ OpenAI TTS: ${Math.round(audioBuffer.length / 1024)}KB`)
    return audioBuffer

  } catch (error) {
    logger.error('❌ OpenAI TTS error:', error)
    return null
  }
}

/**
 * Try Google TTS (free, no API key needed)
 */
async function tryGoogleTTS(text: string): Promise<Buffer | null> {
  try {
    logger.info('🎤 Trying Google TTS (free fallback)...')

    // Use Google's free TTS API (no authentication required)
    const encodedText = encodeURIComponent(text.substring(0, 200)) // Limit to 200 chars for free tier
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=en&client=tw-ob`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      logger.error(`❌ Google TTS error (${response.status})`)
      return null
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer())
    logger.success(`✅ Google TTS: ${Math.round(audioBuffer.length / 1024)}KB`)
    return audioBuffer

  } catch (error) {
    logger.error('❌ Google TTS error:', error)
    return null
  }
}

export async function textToSpeech(options: TTSOptions): Promise<Buffer | null> {
  try {
    // Use a free voice that should work with any subscription
    const { text, voiceId = 'EXAVITQu4vr4xnSDxMaL', modelId = 'eleven_monolingual_v1' } = options

    logger.info(`🎤 Converting text to speech (${text.length} chars)...`)

    // Try ElevenLabs first (if configured)
    if (config.elevenlabsApiKey) {
      logger.info('🎤 Trying ElevenLabs TTS...')
      const elevenlabsAudio = await tryElevenLabsTTS(text, voiceId, modelId)
      if (elevenlabsAudio) {
        return elevenlabsAudio
      }
      logger.warn('⚠️ ElevenLabs TTS failed, trying OpenAI fallback...')
    }

    // Fallback to OpenAI TTS
    if (config.openaiApiKey) {
      const openaiAudio = await tryOpenAITTS(text)
      if (openaiAudio) {
        return openaiAudio
      }
    }

    // Final fallback to Google TTS (free, no API key needed)
    logger.warn('⚠️ All premium TTS providers failed, trying Google TTS...')
    const googleAudio = await tryGoogleTTS(text)
    if (googleAudio) {
      return googleAudio
    }

    logger.error('❌ All TTS providers failed')
    logger.error('💡 Configure ELEVENLABS_API_KEY or OPENAI_API_KEY in .env')
    logger.error('💡 Or check your internet connection for Google TTS')
    return null

  } catch (error) {
    logger.error('❌ TTS error:', error)
    return null
  }
}

