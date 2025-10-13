/**
 * Test script to verify Voice2App setup
 */

import { config, validateConfig, logger } from '../packages/shared'

async function testSetup() {
  logger.info('🧪 Testing Voice2App setup...\n')
  
  // Test 1: Config validation
  logger.info('1️⃣  Checking environment variables...')
  const configValid = validateConfig()
  
  if (configValid) {
    logger.success('✅ Configuration is valid')
    logger.info(`   - OpenAI API Key: ${config.openaiApiKey.substring(0, 10)}...`)
    logger.info(`   - Telegram Bot Token: ${config.telegramBotToken.substring(0, 15)}...`)
    logger.info(`   - Hookdeck URL: ${config.hookdeckUrl || 'Not set (optional)'}`)
  } else {
    logger.error('❌ Configuration is invalid')
    return false
  }
  
  console.log()
  
  // Test 2: OpenAI API
  logger.info('2️⃣  Testing OpenAI API...')
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${config.openaiApiKey}`,
      },
    })
    
    if (response.ok) {
      logger.success('✅ OpenAI API is accessible')
    } else {
      logger.error(`❌ OpenAI API error: ${response.status}`)
      return false
    }
  } catch (error) {
    logger.error('❌ OpenAI API test failed:', error)
    return false
  }
  
  console.log()
  
  // Test 3: Telegram API
  logger.info('3️⃣  Testing Telegram Bot API...')
  try {
    const response = await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/getMe`)
    const data = await response.json() as any
    
    if (data.ok) {
      logger.success('✅ Telegram Bot is valid')
      logger.info(`   - Bot name: @${data.result.username}`)
      logger.info(`   - Bot ID: ${data.result.id}`)
    } else {
      logger.error('❌ Telegram Bot API error:', data.description)
      return false
    }
  } catch (error) {
    logger.error('❌ Telegram API test failed:', error)
    return false
  }
  
  console.log()
  
  // Test 4: Directories
  logger.info('4️⃣  Checking directories...')
  const { access } = await import('fs/promises')
  
  const dirs = ['sandbox', 'artifacts', 'packages/shared', 'packages/telegram-gateway']
  
  for (const dir of dirs) {
    try {
      await access(dir)
      logger.success(`✅ ${dir}/ exists`)
    } catch {
      logger.error(`❌ ${dir}/ not found`)
      return false
    }
  }
  
  console.log()
  
  // Test 5: Playwright
  logger.info('5️⃣  Checking Playwright...')
  try {
    const { chromium } = await import('playwright')
    logger.success('✅ Playwright is installed')
    
    // Try to launch browser
    const browser = await chromium.launch({ headless: true })
    await browser.close()
    logger.success('✅ Chromium browser is ready')
  } catch (error) {
    logger.error('❌ Playwright test failed:', error)
    logger.warn('   Run: bunx playwright install chromium')
    return false
  }
  
  console.log()
  logger.success('🎉 All tests passed! Voice2App is ready to use.\n')
  logger.info('Start the server with: bun run dev')
  logger.info('Then send a message to your Telegram bot!\n')
  
  return true
}

// Run tests
testSetup().then((success) => {
  process.exit(success ? 0 : 1)
})

