#!/usr/bin/env bun

// Test script to verify webhook flow through Hookdeck
import { setupTelegramWebhook } from './index'

console.log('🧪 Testing webhook setup...')
console.log('📋 Make sure you have the following environment variables set:')
console.log('   - TELEGRAM_BOT_TOKEN')
console.log('   - TELEGRAM_WEBHOOK_SECRET (optional)')
console.log('   - HOOKDECK_TELEGRAM_URL (defaults to https://hkdk.events/t77zmlms4o5hnl)')
console.log('')

await setupTelegramWebhook()

console.log('')
console.log('🔍 Next steps:')
console.log('1. Check your Hookdeck dashboard: https://dashboard.hookdeck.com/')
console.log('2. Send a message to your Telegram bot')
console.log('3. Watch the requests flow through Hookdeck')
console.log('4. Verify your local server receives the requests')
