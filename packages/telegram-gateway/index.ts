/**
 * Telegram Gateway: receives Telegram events and runs orchestrator
 */

import { Hono } from 'hono'
import { config, logger, orchestrate, type TelegramUpdate } from '../shared'
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

// Vonage webhook endpoint for WhatsApp - handle both GET and POST
app.all('/vonage', async (c) => {
  const method = c.req.method
  logger.info(`📱 Vonage webhook received: ${method} request`)
  
  try {
    // Handle GET requests (webhook verification)
    if (method === 'GET') {
      logger.info('📱 Vonage webhook verification request')
      return c.text('OK')
    }
    
    // Handle POST requests (actual webhook data)
    if (method === 'POST') {
      const webhookData = await c.req.json()
      logger.info('📱 Received Vonage webhook data:', JSON.stringify(webhookData, null, 2))
      
      // Handle inbound messages
      if (webhookData.type === 'message' && webhookData.message) {
        const message = webhookData.message
        
        // Log the received WhatsApp message
        logger.info(`📱 WhatsApp message from ${message.from}: ${message.content?.text || '[non-text message]'}`)
        
        // You can process the WhatsApp message here if needed
        // For now, we'll just acknowledge receipt
      }
      
      // Handle status updates
      if (webhookData.type === 'status') {
        const status = webhookData.status
        logger.info(`📱 WhatsApp message status: ${status.status} for message ${status.message_uuid}`)
      }
      
      return c.json({ ok: true })
    }
    
    // Handle other methods
    logger.warn(`📱 Unsupported HTTP method: ${method}`)
    return c.text('Method not allowed', 405)
    
  } catch (error) {
    logger.error('Error processing Vonage webhook:', error)
    return c.json({ error: 'Invalid webhook data' }, 400)
  }
})

async function processMessage(chatId: number, message: any) {
  const messageId = message.message_id
  const username = message.from?.first_name || message.from?.username || 'Unknown'
  
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
        username,
        platform: 'telegram',
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
        username,
        platform: 'telegram',
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

