#!/usr/bin/env bun
/**
 * Setup Telegram Webhook with Cloudflared Tunnel
 * 
 * This script:
 * 1. Creates a cloudflared tunnel to expose localhost:3020/telegram
 * 2. Configures the Telegram webhook with the public URL
 */

import { spawn } from 'child_process'
import { config, logger } from './packages/shared'
import { setupWebhook } from './packages/telegram-gateway/telegram-client'

const SERVER_PORT = 3020
const WEBHOOK_PATH = '/telegram'

async function createCloudflaredTunnel(): Promise<string> {
  return new Promise((resolve, reject) => {
    logger.info('🌐 Creating cloudflared tunnel...')
    
    // Start cloudflared tunnel pointing to our webhook endpoint
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
    }, 15000)
    
    cfProcess.stderr?.on('data', (data) => {
      output += data.toString()
      console.log('[cloudflared]', data.toString().trim())
      
      // Look for the public URL
      const urlMatch = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i)
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
    
    // Keep the process running
    process.on('SIGINT', () => {
      cfProcess.kill()
      process.exit(0)
    })
  })
}

async function main() {
  try {
    // Check if bot token is configured
    if (!config.telegramBotToken) {
      logger.error('❌ TELEGRAM_BOT_TOKEN is not set in environment variables')
      logger.info('💡 Please set it in your .env file')
      process.exit(1)
    }
    
    logger.info('🚀 Setting up Telegram webhook...')
    logger.info(`📡 Server running on: http://localhost:${SERVER_PORT}`)
    
    // Create tunnel
    const publicUrl = await createCloudflaredTunnel()
    
    // Wait a moment for tunnel to stabilize
    logger.info('⏳ Waiting for tunnel to stabilize...')
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Configure webhook
    logger.info(`📡 Configuring Telegram webhook: ${publicUrl}`)
    const success = await setupWebhook(publicUrl)
    
    if (success) {
      logger.success('🎉 Telegram webhook configured successfully!')
      logger.info('')
      logger.info('📋 Setup complete!')
      logger.info(`   • Public URL: ${publicUrl}`)
      logger.info(`   • Webhook path: ${WEBHOOK_PATH}`)
      logger.info('')
      logger.info('💡 Keep this script running to maintain the tunnel')
      logger.info('   Press Ctrl+C to stop')
      logger.info('')
      logger.info('✅ You can now send messages to your Telegram bot!')
      
      // Keep the process alive
      await new Promise(() => {})
    } else {
      logger.error('❌ Failed to configure webhook')
      process.exit(1)
    }
  } catch (error) {
    logger.error('❌ Error setting up webhook:', error)
    process.exit(1)
  }
}

main()

