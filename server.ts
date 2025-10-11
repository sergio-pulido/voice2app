import app from './packages/telegram-gateway'
import { logger } from './packages/shared'

const PORT = 3020

const server = Bun.serve({
  port: PORT,
  fetch: app.fetch,
})

logger.success(`🚀 Voice2App Gateway started on http://localhost:${server.port}`)
logger.info('📡 Waiting for Telegram messages...')
