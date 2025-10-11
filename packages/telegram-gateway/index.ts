/**
 * Telegram Gateway: receives Telegram events and runs orchestrator
 */

import { Hono } from 'hono'
import { config, logger, type TelegramUpdate } from '../shared'
import { orchestrate } from './orchestrator'
import { downloadVoiceFile } from './telegram-client'

const app = new Hono()

app.post('/telegram', async (c) => {
  // Verify webhook secret if configured
  const secret = config.telegramWebhookSecret
  if (secret) {
    const headerSecret = c.req.header('x-telegram-bot-api-secret-token')
    if (headerSecret !== secret) {
      logger.warn('Invalid webhook secret')
      return c.text('Forbidden', 403)
    }
  }
  
  const update = await c.req.json<TelegramUpdate>()
  logger.debug('Received Telegram update:', JSON.stringify(update, null, 2))
  
  const chatId = update?.message?.chat?.id
  const message = update?.message
  
  if (!chatId || !message) {
    logger.warn('No chat ID or message in update')
    return c.json({ ok: true })
  }
  
  // Process message asynchronously (don't block response)
  processMessage(chatId, message).catch((error) => {
    logger.error('Error processing message:', error)
  })
  
  return c.json({ ok: true })
})

async function processMessage(chatId: number, message: any) {
  const messageId = message.message_id
  
  try {
    // Handle voice messages
    if (message.voice) {
      logger.info('🎤 Voice message detected')
      
      const fileId = message.voice.file_id
      const duration = message.voice.duration
      
      logger.info(`Voice duration: ${duration}s`)
      
      // Download voice file
      const voiceBuffer = await downloadVoiceFile(fileId)
      
      if (!voiceBuffer) {
        throw new Error('Failed to download voice file')
      }
      
      // Run orchestrator
      await orchestrate({
        chatId,
        messageId,
        voiceBuffer,
      })
    }
    // Handle text messages
    else if (message.text) {
      logger.info('📝 Text message detected:', message.text)
      
      // Run orchestrator
      await orchestrate({
        chatId,
        messageId,
        textMessage: message.text,
      })
    }
    // Handle unsupported types
    else {
      logger.info('❓ Unsupported message type')
      
      const { sendMessage } = await import('./telegram-client')
      await sendMessage(chatId, '🎤 Please send me a voice message or text to generate an app!')
    }
  } catch (error) {
    logger.error('Message processing error:', error)
    
    const { sendError } = await import('../notifier')
    await sendError(chatId, error instanceof Error ? error.message : 'Unknown error')
  }
}

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

export default app

