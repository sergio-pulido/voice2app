/**
 * Notifier package: sends replies to Telegram
 */

import { config, logger, type NotificationPayload } from '../shared'
import { readFile } from 'fs/promises'

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot'

export async function sendNotification(payload: NotificationPayload): Promise<boolean> {
  logger.info(`Sending notification to chat ${payload.chatId}`)
  
  try {
    // Send text message
    await sendMessage(payload.chatId, payload.text)
    
    // Send screenshot if provided
    if (payload.screenshot) {
      await sendPhoto(payload.chatId, payload.screenshot)
    }
    
    // TODO: Optional voice reply (TTS)
    if (payload.voice) {
      // Future: generate TTS and send voice message
    }
    
    logger.success('Notification sent successfully')
    return true
  } catch (error) {
    logger.error('Notification error:', error)
    return false
  }
}

async function sendMessage(chatId: number, text: string): Promise<void> {
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

export async function sendAcknowledgment(chatId: number, messageType: 'voice' | 'text'): Promise<void> {
  const text = messageType === 'voice'
    ? '🎤 Got your voice message! Processing...'
    : '📝 Got your message! Processing...'
  
  await sendMessage(chatId, text)
}

export async function sendError(chatId: number, error: string): Promise<void> {
  const text = `❌ Sorry, something went wrong:\n\n${error}\n\nPlease try again!`
  await sendMessage(chatId, text)
}
