/**
 * Set up Telegram webhook with Hookdeck URL
 */

import { config } from './packages/shared'

async function setupWebhook() {
  const TELEGRAM_BOT_TOKEN = config.telegramBotToken
  
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN not found in .env')
    process.exit(1)
  }

  // Read the Hookdeck URL from the tunnel log
  const fs = require('fs')
  let webhookUrl = ''
  
  try {
    const logContent = fs.readFileSync('telegram-tunnel.log', 'utf-8')
    const urlMatch = logContent.match(/telegram-bot URL: (https:\/\/hkdk\.events\/[a-z0-9]+)/)
    
    if (urlMatch) {
      webhookUrl = urlMatch[1]
    } else {
      console.error('❌ Could not find Hookdeck URL in telegram-tunnel.log')
      console.error('   Make sure you run "make tunnels" first!')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Could not read telegram-tunnel.log')
    console.error('   Make sure you run "make tunnels" first!')
    process.exit(1)
  }

  console.log(`📡 Setting up Telegram webhook...`)
  console.log(`   Bot Token: ${TELEGRAM_BOT_TOKEN.substring(0, 10)}...`)
  console.log(`   Webhook URL: ${webhookUrl}`)

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`
  
  const response = await fetch(`${url}?url=${encodeURIComponent(webhookUrl)}`, {
    method: 'POST'
  })

  const result = await response.json()

  if (result.ok) {
    console.log('✅ Telegram webhook configured successfully!')
    console.log(`   Webhook URL: ${webhookUrl}`)
  } else {
    console.error('❌ Failed to set webhook:', result)
  }
}

setupWebhook()

