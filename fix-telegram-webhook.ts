#!/usr/bin/env bun
/**
 * Complete Telegram Webhook Fix
 * 
 * This script:
 * 1. Checks if server is running
 * 2. Creates cloudflared tunnel
 * 3. Configures Telegram webhook
 * 4. Keeps tunnel running
 */

import { spawn } from 'child_process'
import { config, logger } from './packages/shared'
import { setupWebhook } from './packages/telegram-gateway/telegram-client'

const SERVER_PORT = 3020
const WEBHOOK_PATH = '/telegram'

async function checkServerRunning(): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:${SERVER_PORT}/`, { 
      signal: AbortSignal.timeout(2000) 
    })
    return response.ok
  } catch {
    return false
  }
}

async function createCloudflaredTunnel(): Promise<string> {
  return new Promise((resolve, reject) => {
    logger.info('🌐 Creating cloudflared tunnel...')
    
    const cfProcess = spawn('cloudflared', [
      'tunnel',
      '--url', `http://localhost:${SERVER_PORT}${WEBHOOK_PATH}`,
      '--no-autoupdate'
    ], {
      stdio: ['ignore', 'pipe', 'pipe']
    })
    
    let output = ''
    const timeout = setTimeout(() => {
      cfProcess.kill()
      reject(new Error('Cloudflared tunnel creation timeout'))
    }, 20000)
    
    cfProcess.stderr?.on('data', (data) => {
      const text = data.toString()
      output += text
      console.log('[cloudflared]', text.trim())
      
      // Look for the public URL
      const urlMatch = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i)
      if (urlMatch) {
        clearTimeout(timeout)
        logger.success(`✅ Tunnel created: ${urlMatch[0]}`)
        resolve(urlMatch[0])
      }
    })
    
    cfProcess.on('error', (error) => {
      clearTimeout(timeout)
      reject(error)
    })
    
    // Keep process reference for cleanup
    process.on('SIGINT', () => {
      cfProcess.kill()
      process.exit(0)
    })
    
    process.on('SIGTERM', () => {
      cfProcess.kill()
      process.exit(0)
    })
  })
}

async function main() {
  try {
    logger.info('🔧 Fixing Telegram Webhook Connection')
    logger.info('=====================================')
    logger.info('')
    
    // Step 1: Check server
    logger.info('1️⃣ Checking if server is running...')
    const serverRunning = await checkServerRunning()
    if (!serverRunning) {
      logger.error(`❌ Server is not running on localhost:${SERVER_PORT}`)
      logger.info('')
      logger.info('💡 Please start the server first:')
      logger.info('   bun run server.ts')
      logger.info('')
      logger.info('   OR in another terminal:')
      logger.info('   make server')
      logger.info('')
      process.exit(1)
    }
    logger.success(`✅ Server is running on port ${SERVER_PORT}`)
    logger.info('')
    
    // Step 2: Check bot token
    logger.info('2️⃣ Checking Telegram bot configuration...')
    if (!config.telegramBotToken) {
      logger.error('❌ TELEGRAM_BOT_TOKEN is not set')
      logger.info('')
      logger.info('💡 Please set it in your .env file:')
      logger.info('   TELEGRAM_BOT_TOKEN=your_bot_token_here')
      logger.info('')
      process.exit(1)
    }
    logger.success('✅ Telegram bot token configured')
    logger.info('')
    
    // Step 3: Create tunnel
    logger.info('3️⃣ Creating cloudflared tunnel...')
    const publicUrl = await createCloudflaredTunnel()
    logger.info('')
    
    // Step 4: Wait for tunnel to stabilize
    logger.info('4️⃣ Waiting for tunnel to stabilize...')
    await new Promise(resolve => setTimeout(resolve, 3000))
    logger.info('')
    
    // Step 5: Configure webhook
    logger.info('5️⃣ Configuring Telegram webhook...')
    logger.info(`   URL: ${publicUrl}`)
    const success = await setupWebhook(publicUrl)
    logger.info('')
    
    if (success) {
      logger.success('🎉 Telegram webhook configured successfully!')
      logger.info('')
      logger.info('📋 Configuration:')
      logger.info(`   • Public URL: ${publicUrl}`)
      logger.info(`   • Webhook path: ${WEBHOOK_PATH}`)
      logger.info(`   • Server: http://localhost:${SERVER_PORT}`)
      logger.info('')
      logger.info('✅ Everything is ready!')
      logger.info('')
      logger.info('💡 You can now send messages to your Telegram bot!')
      logger.info('')
      logger.info('⚠️  Keep this script running to maintain the tunnel')
      logger.info('   Press Ctrl+C to stop')
      logger.info('')
      
      // Keep process alive
      await new Promise(() => {})
    } else {
      logger.error('❌ Failed to configure webhook')
      logger.info('')
      logger.info('💡 You can try setting it manually:')
      logger.info(`   curl "https://api.telegram.org/bot${config.telegramBotToken}/setWebhook?url=${publicUrl}"`)
      process.exit(1)
    }
  } catch (error: any) {
    logger.error('❌ Error:', error.message)
    logger.info('')
    logger.info('💡 Troubleshooting:')
    logger.info('   1. Make sure server is running: bun run server.ts')
    logger.info('   2. Check your .env file has TELEGRAM_BOT_TOKEN')
    logger.info('   3. Make sure cloudflared is installed: brew install cloudflared')
    process.exit(1)
  }
}

main()

