/**
 * Test Voice Flow: Complete end-to-end test for voice input/output
 * 
 * Tests:
 * 1. Voice input from Telegram
 * 2. Voice output to Telegram
 * 3. WhatsApp notifications
 * 4. Full orchestration flow
 */

import { config, logger } from '../packages/shared'
import { textToSpeech } from '../packages/shared/tts'
import { sendWhatsAppMessage } from '../packages/shared/whatsapp'
import { orchestrate } from '../packages/telegram-gateway/orchestrator'
import { readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'

// Test configuration
const TEST_CHAT_ID = parseInt(process.env.TEST_CHAT_ID || '0')
const TEST_WHATSAPP = process.env.TEST_WHATSAPP || config.vonageWhatsAppTo

interface TestResult {
  name: string
  passed: boolean
  error?: string
  duration?: number
}

const results: TestResult[] = []

function logTest(name: string, passed: boolean, error?: string, duration?: number) {
  results.push({ name, passed, error, duration })
  const icon = passed ? '✅' : '❌'
  const durationStr = duration ? ` (${duration}ms)` : ''
  logger.info(`${icon} ${name}${durationStr}`)
  if (error) {
    logger.error(`   Error: ${error}`)
  }
}

async function testTTS() {
  logger.info('\n🎤 Testing Text-to-Speech (TTS)...')
  
  const start = Date.now()
  try {
    const testText = 'Hello! This is a test of the text to speech system. Can you hear me?'
    const audioBuffer = await textToSpeech({ text: testText })
    
    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error('TTS returned empty buffer')
    }
    
    // Save test audio file
    const testAudioPath = join(process.cwd(), 'test-voice.mp3')
    await writeFile(testAudioPath, audioBuffer)
    
    const duration = Date.now() - start
    logTest('TTS Generation', true, undefined, duration)
    logger.info(`   Generated ${audioBuffer.length} bytes of audio`)
    logger.info(`   Saved to: ${testAudioPath}`)
    
    return audioBuffer
  } catch (error) {
    const duration = Date.now() - start
    logTest('TTS Generation', false, error instanceof Error ? error.message : String(error), duration)
    return null
  }
}

async function testWhatsApp() {
  logger.info('\n📱 Testing WhatsApp Messaging...')
  
  if (!TEST_WHATSAPP) {
    logTest('WhatsApp Setup', false, 'TEST_WHATSAPP not configured')
    return false
  }
  
  const start = Date.now()
  try {
    const testMessage = `🧪 Voice Flow Test\n\n` +
      `This is a test message from the voice2app system.\n` +
      `Timestamp: ${new Date().toLocaleString()}\n\n` +
      `Testing WhatsApp notification delivery...`
    
    const result = await sendWhatsAppMessage({
      to: TEST_WHATSAPP,
      text: testMessage
    })
    
    if (!result) {
      throw new Error('WhatsApp API returned null (check rate limits)')
    }
    
    const duration = Date.now() - start
    logTest('WhatsApp Messaging', true, undefined, duration)
    logger.info(`   Message UUID: ${result.message_uuid}`)
    logger.info(`   Status: ${result.status}`)
    return true
  } catch (error) {
    const duration = Date.now() - start
    logTest('WhatsApp Messaging', false, error instanceof Error ? error.message : String(error), duration)
    return false
  }
}

async function testTelegramVoiceSend() {
  logger.info('\n📤 Testing Telegram Voice Message Send...')
  
  if (!TEST_CHAT_ID) {
    logTest('Telegram Voice Send', false, 'TEST_CHAT_ID not configured')
    return false
  }
  
  // Use the TTS-generated audio
  const testAudioPath = join(process.cwd(), 'test-voice.mp3')
  
  if (!existsSync(testAudioPath)) {
    logTest('Telegram Voice Send', false, 'Test audio file not found (run TTS test first)')
    return false
  }
  
  const start = Date.now()
  try {
    const audioBuffer = await readFile(testAudioPath)
    const url = `https://api.telegram.org/bot${config.telegramBotToken}/sendVoice`
    
    const formData = new FormData()
    formData.append('chat_id', TEST_CHAT_ID.toString())
    
    const voiceFile = new File(
      [new Uint8Array(audioBuffer)],
      'test-voice.mp3',
      { type: 'audio/mpeg' }
    )
    
    formData.append('voice', voiceFile)
    formData.append('caption', '🧪 Test voice message from voice2app system')
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Telegram API error (${response.status}): ${errorText}`)
    }
    
    const result = await response.json()
    const duration = Date.now() - start
    logTest('Telegram Voice Send', true, undefined, duration)
    logger.info(`   Message ID: ${result.result.message_id}`)
    return true
  } catch (error) {
    const duration = Date.now() - start
    logTest('Telegram Voice Send', false, error instanceof Error ? error.message : String(error), duration)
    return false
  }
}

async function testFullOrchestration() {
  logger.info('\n🎭 Testing Full Orchestration Flow...')
  
  if (!TEST_CHAT_ID) {
    logTest('Full Orchestration', false, 'TEST_CHAT_ID not configured')
    return false
  }
  
  const start = Date.now()
  try {
    // Create a test voice buffer (simulating a voice message)
    const testText = 'Create a simple hello world app with a button that says click me'
    const voiceBuffer = await textToSpeech({ text: testText })
    
    if (!voiceBuffer) {
      throw new Error('Failed to generate test voice')
    }
    
    logger.info('   Simulating voice message input...')
    logger.info(`   Text: "${testText}"`)
    
    // Run the full orchestration
    await orchestrate({
      chatId: TEST_CHAT_ID,
      messageId: Math.floor(Date.now() / 1000), // Fake message ID
      voiceBuffer,
      username: 'TestUser',
      platform: 'telegram'
    })
    
    const duration = Date.now() - start
    logTest('Full Orchestration', true, undefined, duration)
    logger.info('   Check Telegram for voice response!')
    if (config.enableWhatsAppAdmin && TEST_WHATSAPP) {
      logger.info('   Check WhatsApp for admin notification!')
    }
    return true
  } catch (error) {
    const duration = Date.now() - start
    logTest('Full Orchestration', false, error instanceof Error ? error.message : String(error), duration)
    return false
  }
}

async function testConfiguration() {
  logger.info('\n⚙️  Testing Configuration...')
  
  const checks = [
    { name: 'Telegram Bot Token', value: config.telegramBotToken, required: true },
    { name: 'ElevenLabs API Key', value: config.elevenlabsApiKey, required: true },
    { name: 'Vonage API Key', value: config.vonageApiKey, required: false },
    { name: 'Vonage API Secret', value: config.vonageApiSecret, required: false },
    { name: 'WhatsApp To Number', value: config.vonageWhatsAppTo, required: false },
    { name: 'WhatsApp Admin Enabled', value: config.enableWhatsAppAdmin.toString(), required: false },
    { name: 'Discord Admin Enabled', value: config.enableDiscordAdmin.toString(), required: false },
    { name: 'TEST_CHAT_ID', value: TEST_CHAT_ID.toString(), required: true },
    { name: 'TEST_WHATSAPP', value: TEST_WHATSAPP, required: false },
  ]
  
  let allPassed = true
  
  for (const check of checks) {
    const passed = !check.required || (check.value && check.value !== '0' && check.value !== 'false')
    const status = passed ? '✅' : (check.required ? '❌' : '⚠️ ')
    logger.info(`   ${status} ${check.name}: ${check.value ? '✓' : '✗'}`)
    
    if (check.required && !passed) {
      allPassed = false
    }
  }
  
  logTest('Configuration Check', allPassed)
  return allPassed
}

async function printSummary() {
  logger.info('\n' + '='.repeat(60))
  logger.info('📊 TEST SUMMARY')
  logger.info('='.repeat(60))
  
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const total = results.length
  
  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌'
    const durationStr = result.duration ? ` (${result.duration}ms)` : ''
    logger.info(`${icon} ${result.name}${durationStr}`)
    if (result.error) {
      logger.info(`   └─ ${result.error}`)
    }
  })
  
  logger.info('\n' + '-'.repeat(60))
  logger.info(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`)
  logger.info('='.repeat(60))
  
  if (failed === 0) {
    logger.success('\n🎉 All tests passed!')
  } else {
    logger.error(`\n❌ ${failed} test(s) failed`)
  }
}

async function main() {
  logger.info('🧪 Voice Flow Integration Test')
  logger.info('='.repeat(60))
  logger.info('This script tests the complete voice input/output flow:')
  logger.info('  1. Text-to-Speech generation')
  logger.info('  2. WhatsApp messaging')
  logger.info('  3. Telegram voice messaging')
  logger.info('  4. Full orchestration flow')
  logger.info('='.repeat(60))
  
  // Check configuration first
  const configOk = await testConfiguration()
  if (!configOk) {
    logger.error('\n❌ Configuration check failed. Please fix required settings:')
    logger.error('   - Set TEST_CHAT_ID in your .env file (your Telegram chat ID)')
    logger.error('   - Ensure TELEGRAM_BOT_TOKEN is set')
    logger.error('   - Ensure ELEVENLABS_API_KEY is set (for TTS)')
    logger.info('\n💡 To get your Telegram chat ID:')
    logger.info('   1. Message your bot on Telegram')
    logger.info('   2. Check server logs for the chat ID')
    logger.info('   3. Add TEST_CHAT_ID=<your_chat_id> to .env')
    return
  }
  
  // Run tests sequentially
  await testTTS()
  await testWhatsApp()
  await testTelegramVoiceSend()
  
  // Ask before running full orchestration (it's heavy)
  logger.info('\n⚠️  The full orchestration test will:')
  logger.info('   - Generate a complete app')
  logger.info('   - Send voice response to Telegram')
  logger.info('   - Send admin notifications to WhatsApp/Discord')
  logger.info('   - Take 30-60 seconds to complete')
  
  // Run full orchestration test
  logger.info('\n🚀 Running full orchestration test...')
  await testFullOrchestration()
  
  // Print summary
  await printSummary()
  
  logger.info('\n💡 Next steps:')
  logger.info('   1. Check your Telegram for voice messages')
  logger.info('   2. Check WhatsApp for admin notifications (if enabled)')
  logger.info('   3. Try sending a real voice message to your bot')
  logger.info('   4. Check logs/server.log for detailed output')
}

main().catch(error => {
  logger.error('Test suite failed:', error)
  process.exit(1)
})

