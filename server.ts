import { Hono } from 'hono'
import telegramGateway from './packages/telegram-gateway'
import discordGateway from './packages/discord-gateway'
import { logger, showStartupBanner, showMainBanner, showColorizedBanner, showSuccessBanner, showShutdownBanner } from './packages/shared'

// Load environment variables from .env file
import { config } from 'dotenv'
config()

const PORT = 3020

// Show startup banner
showColorizedBanner()

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

// Show success banner with server info
showSuccessBanner(server.port)

// Add graceful shutdown handling
process.on('SIGINT', () => {
  console.log('\n')
  showShutdownBanner()
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n')
  showShutdownBanner()
  process.exit(0)
})
