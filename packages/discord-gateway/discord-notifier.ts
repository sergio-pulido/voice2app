/**
 * Discord Notifier: sends replies to Discord
 */

import { config, logger, splitMessageForChannel } from '../shared'
import { textToSpeech } from '../shared/tts'
import { readFile } from 'fs/promises'
import { editInteractionResponse } from './discord-client'

/**
 * Send a message with automatic splitting for Discord limits
 */
async function sendDiscordMessageWithSplitting(token: string, text: string): Promise<void> {
  try {
    const splitResult = await splitMessageForChannel(text, 'discord')
    
    if (splitResult.needsSplitting) {
      logger.info(`📝 Discord message split into ${splitResult.messages.length} parts`)
      
      // Send each message part
      for (let i = 0; i < splitResult.messages.length; i++) {
        const message = splitResult.messages[i]
        logger.debug(`📤 Sending Discord message part ${i + 1}/${splitResult.messages.length} (${message.length} chars)`)
        
        await editInteractionResponse(token, message)
        
        // Small delay between messages to avoid rate limiting
        if (i < splitResult.messages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    } else {
      // Single message, send normally
      await editInteractionResponse(token, text)
    }
  } catch (error) {
    logger.error('Discord message splitting failed, sending original message:', error)
    // Fallback: try to send the original message
    await editInteractionResponse(token, text)
  }
}

interface DiscordNotificationPayload {
  chatId: number | string
  text: string
  screenshot?: string
  voice?: boolean
  channel?: string
  discordToken?: string
}

export async function sendNotification(payload: DiscordNotificationPayload): Promise<boolean> {
  logger.info(`Sending Discord notification to ${payload.chatId}`)
  
  try {
    const { chatId, text, screenshot, voice, discordToken } = payload
    
    if (!discordToken) {
      logger.error('Discord token required for sending notifications')
      return false
    }
    
    // For Discord, convert markdown bold from ** to ** (already compatible)
    let formattedText = text
    
    // If voice reply is requested, send voice message
    if (voice) {
      logger.info('🎤 Generating voice reply with TTS...')
      
      // Create a clean version of the text for TTS
      let cleanText = text
        .replace(/\*/g, '')  // Remove markdown bold
        .replace(/_/g, '')   // Remove markdown italic
        .replace(/`/g, '')   // Remove code blocks
        .replace(/[✅❌⚠️🎉💡📊🏃💻📋🎤📝📸🔧]/g, '')  // Remove emojis
        .replace(/\n{3,}/g, '\n\n')  // Remove excessive newlines
        .trim()
      
      // Truncate very long text
      const MAX_TTS_LENGTH = 500
      if (cleanText.length > MAX_TTS_LENGTH) {
        cleanText = cleanText.substring(0, MAX_TTS_LENGTH) + '... See the full details in the text message.'
        logger.info(`Text truncated for TTS: ${cleanText.length} chars`)
      }
      
      const audioBuffer = await textToSpeech({ text: cleanText })
      
      if (audioBuffer) {
        try {
          // Send as attachment with text
          await editInteractionResponse(
            discordToken,
            formattedText,
            { buffer: audioBuffer, filename: 'reply.mp3' }
          )
          logger.success('Voice message sent')
          return true
        } catch (voiceError) {
          logger.warn('Voice sending failed, using text only:', voiceError)
          await sendDiscordMessageWithSplitting(discordToken, formattedText)
        }
      } else {
        logger.warn('TTS failed, using text only')
        await sendDiscordMessageWithSplitting(discordToken, formattedText)
      }
    } else {
      // Send text message
      if (screenshot) {
        // Send with screenshot
        try {
          const screenshotBuffer = await readFile(screenshot)
          await editInteractionResponse(
            discordToken,
            formattedText + '\n\n📸 Screenshot:',
            { buffer: screenshotBuffer, filename: 'screenshot.png' }
          )
        } catch (error) {
          logger.error('Failed to send screenshot:', error)
          // Send without screenshot
          await sendDiscordMessageWithSplitting(discordToken, formattedText)
        }
      } else {
        await sendDiscordMessageWithSplitting(discordToken, formattedText)
      }
    }
    
    logger.success('Discord notification sent successfully')
    return true
  } catch (error) {
    logger.error('Discord notification error:', error)
    return false
  }
}

export async function sendAcknowledgment(
  chatId: number | string,
  messageType: 'voice' | 'text',
  discordToken?: string
): Promise<void> {
  if (!discordToken) {
    logger.warn('No Discord token provided for acknowledgment')
    return
  }
  
  const text = messageType === 'voice'
    ? '🎤 Got your voice message! Processing...'
    : '📝 Got your message! Processing...'
  
  try {
    await editInteractionResponse(discordToken, text)
  } catch (error) {
    logger.error('Failed to send acknowledgment:', error)
  }
}

export async function sendError(
  chatId: number | string,
  error: string,
  discordToken?: string
): Promise<void> {
  if (!discordToken) {
    logger.error('No Discord token provided for error message')
    return
  }
  
  const text = `❌ Sorry, something went wrong:\n\n${error}\n\nPlease try again!`
  
  try {
    await editInteractionResponse(discordToken, text)
  } catch (err) {
    logger.error('Failed to send error message:', err)
  }
}

