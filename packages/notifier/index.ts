/**
 * Notifier package: sends replies to Telegram
 */

import { config, logger, type NotificationPayload, splitMessageForChannel } from '../shared'
import { textToSpeech } from '../shared/tts'
import { readFile } from 'fs/promises'

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot'

/**
 * Send a message with automatic splitting for channel limits
 */
async function sendMessageWithSplitting(chatId: number, text: string, channel: string = 'telegram'): Promise<void> {
  try {
    const splitResult = await splitMessageForChannel(text, channel)
    
    if (splitResult.needsSplitting) {
      logger.info(`📝 Message split into ${splitResult.messages.length} parts for ${splitResult.channel}`)
      
      // Send each message part with a small delay between them
      for (let i = 0; i < splitResult.messages.length; i++) {
        const message = splitResult.messages[i]
        logger.debug(`📤 Sending message part ${i + 1}/${splitResult.messages.length} (${message.length} chars)`)
        
        await sendMessage(chatId, message)
        
        // Small delay between messages to avoid rate limiting
        if (i < splitResult.messages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
    } else {
      // Single message, send normally
      await sendMessage(chatId, text)
    }
  } catch (error) {
    logger.error('Message splitting failed, sending original message:', error)
    // Fallback: try to send the original message
    await sendMessage(chatId, text)
  }
}

export async function sendNotification(payload: NotificationPayload): Promise<boolean> {
  logger.info(`📤 Sending notification to chat ${payload.chatId}`)
  logger.info(`🎤 Voice flag: ${payload.voice}`)
  
  try {
    // If voice reply is requested, send BOTH voice and text
    if (payload.voice) {
      logger.info('🎤 Voice response requested - will send BOTH voice and text!')
      logger.info('🎤 Generating voice reply with TTS...')
      
      // Create a clean version of the text for TTS (no markdown, no emojis)
      let cleanText = payload.text
        .replace(/\*/g, '')  // Remove markdown bold
        .replace(/_/g, '')   // Remove markdown italic
        .replace(/`/g, '')   // Remove code blocks
        .replace(/[✅❌⚠️🎉💡📊🏃💻📋🎤📝📸🔧🤖💬🎨🎬🌐❓]/g, '')  // Remove emojis
        .replace(/\n{3,}/g, '\n\n')  // Remove excessive newlines
        .trim()
      
      // Truncate very long text (TTS has limits and creates huge files)
      const MAX_TTS_LENGTH = 500  // chars
      if (cleanText.length > MAX_TTS_LENGTH) {
        cleanText = cleanText.substring(0, MAX_TTS_LENGTH) + '... See the full details in the text message.'
        logger.info(`📝 Text truncated for TTS: ${cleanText.length} chars`)
      }
      
      logger.info(`🎤 TTS input (${cleanText.length} chars): "${cleanText.substring(0, 100)}..."`)
      
      const audioBuffer = await textToSpeech({ text: cleanText })
      
      if (audioBuffer) {
        logger.success(`✅ TTS generated audio buffer: ${Math.round(audioBuffer.length / 1024)}KB`)
        try {
          logger.info('📤 Sending voice message...')
          await sendVoice(payload.chatId, audioBuffer)
          logger.success('✅ Voice message sent!')
          
          // Also send the full text version for reference
          logger.info('📤 Sending text message (full version)...')
          await sendMessageWithSplitting(payload.chatId, payload.text, payload.channel || 'telegram')
          logger.success('✅ Text message sent!')
        } catch (voiceError) {
          logger.error('❌ Voice sending failed, using text only:', voiceError)
          await sendMessageWithSplitting(payload.chatId, payload.text, payload.channel || 'telegram')
        }
      } else {
        logger.error('❌ TTS returned null/empty buffer - using text only')
        await sendMessageWithSplitting(payload.chatId, payload.text, payload.channel || 'telegram')
      }
    } else {
      // Send text message only
      logger.info('📝 Text-only response (no voice)')
      await sendMessageWithSplitting(payload.chatId, payload.text, payload.channel || 'telegram')
    }
    
    // Send screenshot if provided
    if (payload.screenshot) {
      await sendPhoto(payload.chatId, payload.screenshot)
    }
    
    // Send screen recording (video) if provided
    if (payload.screenrecording) {
      await sendVideo(payload.chatId, payload.screenrecording)
    }
    
    logger.success('Notification sent successfully')
    return true
  } catch (error) {
    logger.error('Notification error:', error)
    return false
  }
}

async function sendMessage(chatId: number, text: string): Promise<void> {
  // Safety check: if message is too long, truncate it
  const TELEGRAM_MAX_LENGTH = 4096
  if (text.length > TELEGRAM_MAX_LENGTH) {
    logger.warn(`Message too long (${text.length} chars), truncating to ${TELEGRAM_MAX_LENGTH} chars`)
    text = text.substring(0, TELEGRAM_MAX_LENGTH - 100) + '\n\n... (message truncated)'
  }
  
  const url = `${TELEGRAM_API_BASE}${config.telegramBotToken}/sendMessage`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
    }),
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    
    // If markdown parsing failed, try sending without markdown
    if (errorText.includes("can't parse entities")) {
      logger.warn('Markdown parsing failed, retrying without markdown...')
      
      const retryResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          // No parse_mode - send as plain text
        }),
      })
      
      if (!retryResponse.ok) {
        const retryError = await retryResponse.text()
        throw new Error(`Telegram API error (${retryResponse.status}): ${retryError}`)
      }
      
      logger.debug('Message sent (plain text)')
      return
    }
    
    throw new Error(`Telegram API error (${response.status}): ${errorText}`)
  }
  
  logger.debug('Message sent')
}

async function sendPhoto(chatId: number, photoPath: string): Promise<void> {
  const url = `${TELEGRAM_API_BASE}${config.telegramBotToken}/sendPhoto`
  
  try {
    // Read photo file
    const photoBuffer = await readFile(photoPath)
    
    // Create form data
    const formData = new FormData()
    formData.append('chat_id', chatId.toString())
    formData.append('photo', new Blob([photoBuffer], { type: 'image/png' }), 'screenshot.png')
    formData.append('caption', '📸 Screenshot of your generated app')
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Telegram API error (${response.status}): ${errorText}`)
    }
    
    logger.debug('Photo sent')
  } catch (error) {
    logger.error('Failed to send photo:', error)
    // Don't throw - continue even if photo fails
  }
}

async function sendVideo(chatId: number, videoPath: string): Promise<void> {
  const url = `${TELEGRAM_API_BASE}${config.telegramBotToken}/sendVideo`
  
  try {
    // Read video file
    const videoBuffer = await readFile(videoPath)
    
    // Create form data
    const formData = new FormData()
    formData.append('chat_id', chatId.toString())
    
    // Determine MIME type based on file extension
    const mimeType = videoPath.endsWith('.mp4') ? 'video/mp4' : 'video/webm'
    const filename = videoPath.endsWith('.mp4') ? 'interaction.mp4' : 'interaction.webm'
    
    formData.append('video', new Blob([videoBuffer], { type: mimeType }), filename)
    formData.append('caption', '🎥 Video of your app interaction')
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Telegram API error (${response.status}): ${errorText}`)
    }
    
    logger.debug('Video sent successfully')
  } catch (error) {
    logger.error('Failed to send video:', error)
    // Don't throw - continue even if video fails
  }
}

async function sendVoice(chatId: number, audioBuffer: Buffer): Promise<void> {
  const url = `${TELEGRAM_API_BASE}${config.telegramBotToken}/sendVoice`
  
  try {
    logger.debug(`Sending voice message: ${audioBuffer.length} bytes`)
    
    // Create form data
    const formData = new FormData()
    formData.append('chat_id', chatId.toString())
    
    // Create voice file from buffer - Telegram accepts MP3, OGG, etc
    const voiceFile = new File(
      [new Uint8Array(audioBuffer)],
      'reply.mp3',
      { type: 'audio/mpeg' }
    )
    
    formData.append('voice', voiceFile)
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      logger.error(`Telegram sendVoice error (${response.status}): ${errorText}`)
      throw new Error(`Telegram API error (${response.status}): ${errorText}`)
    }
    
    const result = await response.json()
    logger.debug('Voice message sent successfully:', result)
  } catch (error) {
    logger.error('Failed to send voice:', error)
    throw error
  }
}

export async function sendAcknowledgment(chatId: number, messageType: 'voice' | 'text'): Promise<void> {
  const text = messageType === 'voice'
    ? '🎤 Got your voice message! Processing...'
    : '📝 Got your message! Processing...'
  
  // Always send acknowledgment as TEXT (no voice)
  // User will get voice response only for the final result
  logger.info('📝 Sending text acknowledgment...')
  await sendMessage(chatId, text)
}

export async function sendError(chatId: number, error: string): Promise<void> {
  const text = `❌ Sorry, something went wrong:\n\n${error}\n\nPlease try again!`
  await sendMessage(chatId, text)
}
