import { Hono } from 'hono'
import telegramGateway from './packages/telegram-gateway'
import discordGateway from './packages/discord-gateway'
import { logger } from './packages/shared'

const PORT = 3020

// Create main app and mount both gateways
const app = new Hono()

// Mount gateways
app.route('/', telegramGateway)
app.route('/', discordGateway)

// Main health check
app.get('/', (c) => {
  return c.json({ 
    status: 'ok',
    service: 'Voice2App Gateway',
    platforms: ['telegram', 'discord'],
    timestamp: new Date().toISOString()
  })
})

const server = Bun.serve({
  port: PORT,
  fetch: app.fetch,
})

logger.success(`🚀 Voice2App Gateway started on http://localhost:${server.port}`)
logger.info('📡 Waiting for messages from Telegram and Discord...')
logger.info('   • Telegram: POST /telegram')
logger.info('   • Discord: POST /discord')
logger.info('   • Health: GET /health')
