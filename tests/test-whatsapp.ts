/**
 * Quick WhatsApp Test Script
 * 
 * Tests WhatsApp messaging independently of the full system.
 * Useful for verifying Vonage credentials and WhatsApp setup.
 */

import { config, logger } from '../packages/shared'
import { sendWhatsAppMessage } from '../packages/shared/whatsapp'

async function testWhatsApp() {
  logger.info('🧪 WhatsApp Connection Test')
  logger.info('='.repeat(60))
  
  // Check configuration
  if (!config.vonageApiKey || !config.vonageApiSecret) {
    logger.error('❌ Missing Vonage credentials')
    logger.info('\n💡 Add to your .env file:')
    logger.info('   VONAGE_API_KEY=your_api_key')
    logger.info('   VONAGE_API_SECRET=your_api_secret')
    logger.info('   VONAGE_WHATSAPP_TO=34622035636  # Your WhatsApp number')
    return
  }
  
  if (!config.vonageWhatsAppTo) {
    logger.error('❌ Missing WhatsApp recipient number')
    logger.info('\n💡 Add to your .env file:')
    logger.info('   VONAGE_WHATSAPP_TO=34622035636  # Your WhatsApp number')
    return
  }
  
  logger.info('✅ Configuration found:')
  logger.info(`   API Key: ${config.vonageApiKey.substring(0, 8)}...`)
  logger.info(`   Recipient: ${config.vonageWhatsAppTo}`)
  logger.info('')
  
  // Send test message
  const testMessage = 
    `🧪 WhatsApp Test\n\n` +
    `This is a test message from voice2app.\n\n` +
    `Timestamp: ${new Date().toLocaleString()}\n` +
    `Status: Connection successful! ✅\n\n` +
    `If you received this, your WhatsApp integration is working correctly.`
  
  logger.info('📱 Sending test message...')
  
  const result = await sendWhatsAppMessage({
    to: config.vonageWhatsAppTo,
    text: testMessage
  })
  
  if (result) {
    logger.success('✅ Message sent successfully!')
    logger.info(`   Message UUID: ${result.message_uuid}`)
    logger.info(`   Status: ${result.status}`)
    logger.info('')
    logger.success('🎉 WhatsApp integration is working!')
    logger.info('   Check your WhatsApp to confirm receipt.')
  } else {
    logger.error('❌ Failed to send message')
    logger.info('\n🔍 Common issues:')
    logger.info('   1. Rate limits: Vonage sandbox allows 1 msg/10s')
    logger.info('   2. Number format: Must include country code (e.g., 34622035636)')
    logger.info('   3. Sandbox setup: Did you join the Vonage WhatsApp sandbox?')
    logger.info('   4. Credentials: Verify your API key and secret')
    logger.info('')
    logger.info('💡 To join WhatsApp sandbox:')
    logger.info('   1. Go to: https://dashboard.nexmo.com/messages/sandbox')
    logger.info('   2. Send "join ..." message to the sandbox number')
    logger.info('   3. Wait for confirmation')
  }
  
  logger.info('')
  logger.info('='.repeat(60))
}

testWhatsApp().catch(error => {
  logger.error('Test failed:', error)
  process.exit(1)
})

