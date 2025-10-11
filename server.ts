import app, { setupTelegramWebhook } from './index'

const PORT = process.env.PORT_GATEWAY || 3020

const server = Bun.serve({
  port: PORT,
  fetch: app.fetch,
})

console.log(`🚀 Telegram Gateway started on http://localhost:${server.port}`)

// Set up Telegram webhook with Hookdeck when server starts
if (process.env.NODE_ENV !== 'production') {
  console.log('🔧 Setting up Telegram webhook with Hookdeck...')
  setupTelegramWebhook()
}

