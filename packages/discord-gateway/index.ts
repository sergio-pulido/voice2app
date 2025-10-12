/**
 * Discord Gateway: receives Discord interactions and runs orchestrator
 * MINIMAL VERSION FOR VERIFICATION
 */

import { Hono } from 'hono'
import { logger } from '../shared'

const app = new Hono()

/**
 * Discord Interactions endpoint - MINIMAL VERSION
 * Just responds to PING for verification
 */
app.post('/discord', async (c) => {
  logger.info('🔔 Discord request received')
  
  try {
    const rawBody = await c.req.text()
    logger.info('Body:', rawBody)
    
    const interaction = JSON.parse(rawBody)
    
    // Respond to PING (type 1) immediately
    if (interaction.type === 1) {
      logger.info('🏓 PING - sending PONG')
      return c.json({ type: 1 })
    }
    
    // For other requests, just acknowledge
    logger.info(`Request type: ${interaction.type}`)
    return c.json({ type: 4, data: { content: 'Bot is online but not fully configured yet!' } })
    
  } catch (error) {
    logger.error('Error:', error)
    // If anything fails, try to send PONG anyway
    return c.json({ type: 1 })
  }
})

/**
 * Health check endpoint
 */
app.get('/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    platform: 'discord'
  })
})

export default app
