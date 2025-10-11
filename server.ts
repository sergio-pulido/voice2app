/**
 * Main server entry point
 */

import app from './packages/telegram-gateway'
import { config, validateConfig, logger } from './packages/shared'
import { setupWebhook } from './packages/telegram-gateway/telegram-client'

// Validate configuration
if (!validateConfig()) {
  logger.error('Invalid configuration. Please check your environment variables.')
  process.exit(1)
}

const PORT = config.gatewayPort

const server = Bun.serve({
  port: PORT,
  fetch: app.fetch,
})

logger.success(`🚀 Voice2App Gateway started on http://localhost:${server.port}`)
logger.info('📡 Waiting for Telegram messages...')

// Set up Telegram webhook (if Hookdeck URL is configured)
if (config.hookdeckUrl) {
  logger.info('🔧 Setting up Telegram webhook with Hookdeck...')
  setupWebhook(config.hookdeckUrl).then((success) => {
    if (success) {
      logger.success('Webhook configured successfully')
      logger.info('🔗 Hookdeck Dashboard: https://dashboard.hookdeck.com/')
    } else {
      logger.warn('Webhook setup failed - check your configuration')
    }
  })
} else {
  logger.warn('⚠️  HOOKDECK_TELEGRAM_URL not configured. Set it to enable webhook setup.')
}

export default server
