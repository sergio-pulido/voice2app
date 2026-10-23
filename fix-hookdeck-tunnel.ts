#!/usr/bin/env bun
/**
 * Fix Hookdeck Tunnel Connection
 * 
 * This script:
 * 1. Checks if Hookdeck is installed
 * 2. Installs it if missing
 * 3. Kills any stale tunnel processes
 * 4. Starts a new tunnel
 * 5. Verifies the connection
 */

import { spawn, exec } from 'child_process'
import { promisify } from 'util'
import { logger } from './packages/shared'

const execAsync = promisify(exec)

async function checkHookdeckInstalled(): Promise<boolean> {
  try {
    await execAsync('which hookdeck')
    return true
  } catch {
    return false
  }
}

async function installHookdeck(): Promise<boolean> {
  logger.info('📦 Installing Hookdeck CLI...')
  try {
    // Try npm first
    logger.info('   Trying npm install...')
    await execAsync('npm install -g hookdeck-cli')
    logger.success('✅ Hookdeck installed via npm')
    return true
  } catch (npmError) {
    try {
      // Try bun
      logger.info('   Trying bun install...')
      await execAsync('bunx hookdeck-cli --version')
      logger.success('✅ Hookdeck available via bunx')
      return true
    } catch (bunError) {
      logger.error('❌ Failed to install Hookdeck')
      logger.info('')
      logger.info('💡 Please install Hookdeck manually:')
      logger.info('   1. npm install -g hookdeck-cli')
      logger.info('   2. hookdeck login')
      logger.info('')
      logger.info('   OR use the cloudflared alternative:')
      logger.info('   bun run setup-telegram-webhook.ts')
      return false
    }
  }
}

async function killStaleTunnels(): Promise<void> {
  logger.info('🧹 Cleaning up stale tunnel processes...')
  try {
    // Kill any existing hookdeck processes for telegram
    await execAsync('pkill -f "hookdeck.*telegram" || true')
    await execAsync('pkill -f "hookdeck listen.*3020" || true')
    logger.success('✅ Cleaned up stale processes')
  } catch {
    // Ignore errors - processes might not exist
  }
}

async function checkServerRunning(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:3020/', { 
      signal: AbortSignal.timeout(2000) 
    })
    return response.ok
  } catch {
    return false
  }
}

async function startHookdeckTunnel(): Promise<string | null> {
  logger.info('🚀 Starting Hookdeck tunnel...')
  
  return new Promise((resolve, reject) => {
    // Use bunx to run hookdeck if not in PATH
    const command = 'bunx'
    const args = ['hookdeck-cli', 'listen', '3020', 'telegram-bot', '--path', '/telegram']
    
    logger.info(`   Running: ${command} ${args.join(' ')}`)
    
    const tunnelProcess = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: process.cwd()
    })
    
    let stdout = ''
    let stderr = ''
    const timeout = setTimeout(() => {
      tunnelProcess.kill()
      reject(new Error('Tunnel startup timeout'))
    }, 30000) // 30 second timeout
    
    tunnelProcess.stdout?.on('data', (data) => {
      const text = data.toString()
      stdout += text
      console.log('[hookdeck]', text.trim())
      
      // Look for the URL
      const urlMatch = text.match(/https:\/\/hkdk\.events\/[a-z0-9]+/i)
      if (urlMatch) {
        clearTimeout(timeout)
        resolve(urlMatch[0])
      }
    })
    
    tunnelProcess.stderr?.on('data', (data) => {
      const text = data.toString()
      stderr += text
      console.error('[hookdeck]', text.trim())
      
      // Look for URL in stderr too
      const urlMatch = text.match(/https:\/\/hkdk\.events\/[a-z0-9]+/i)
      if (urlMatch) {
        clearTimeout(timeout)
        resolve(urlMatch[0])
      }
    })
    
    tunnelProcess.on('error', (error) => {
      clearTimeout(timeout)
      reject(error)
    })
    
    tunnelProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        clearTimeout(timeout)
        reject(new Error(`Hookdeck process exited with code ${code}`))
      }
    })
    
    // Also check if we need to login
    setTimeout(() => {
      if (stderr.includes('not logged in') || stderr.includes('authentication')) {
        clearTimeout(timeout)
        reject(new Error('Hookdeck authentication required. Run: bunx hookdeck-cli login'))
      }
    }, 5000)
  })
}

async function testWebhookUrl(url: string): Promise<boolean> {
  logger.info(`🧪 Testing webhook URL: ${url}`)
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true }),
      signal: AbortSignal.timeout(5000)
    })
    
    const text = await response.text()
    logger.debug(`   Response: ${response.status} - ${text.substring(0, 100)}`)
    
    return response.ok || response.status === 405 // 405 is OK, means endpoint exists
  } catch (error: any) {
    logger.warn(`   Test failed: ${error.message}`)
    return false
  }
}

async function main() {
  try {
    logger.info('🔍 Diagnosing Hookdeck tunnel issues...')
    logger.info('')
    
    // Check if server is running
    logger.info('1️⃣ Checking if server is running...')
    const serverRunning = await checkServerRunning()
    if (!serverRunning) {
      logger.error('❌ Server is not running on localhost:3020')
      logger.info('')
      logger.info('💡 Please start the server first:')
      logger.info('   bun run server.ts')
      logger.info('')
      process.exit(1)
    }
    logger.success('✅ Server is running')
    logger.info('')
    
    // Check Hookdeck installation
    logger.info('2️⃣ Checking Hookdeck installation...')
    let hookdeckInstalled = await checkHookdeckInstalled()
    
    if (!hookdeckInstalled) {
      logger.warn('⚠️  Hookdeck CLI not found')
      const installed = await installHookdeck()
      if (!installed) {
        process.exit(1)
      }
      hookdeckInstalled = true
    } else {
      logger.success('✅ Hookdeck CLI is installed')
    }
    logger.info('')
    
    // Clean up stale processes
    logger.info('3️⃣ Cleaning up stale processes...')
    await killStaleTunnels()
    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait for cleanup
    logger.info('')
    
    // Start tunnel
    logger.info('4️⃣ Starting new Hookdeck tunnel...')
    const tunnelUrl = await startHookdeckTunnel()
    
    if (!tunnelUrl) {
      logger.error('❌ Failed to get tunnel URL')
      logger.info('')
      logger.info('💡 Try running manually:')
      logger.info('   bunx hookdeck-cli listen 3020 telegram-bot --path /telegram')
      logger.info('')
      process.exit(1)
    }
    
    logger.success(`✅ Tunnel URL: ${tunnelUrl}`)
    logger.info('')
    
    // Test the URL
    logger.info('5️⃣ Testing tunnel connection...')
    const urlWorks = await testWebhookUrl(tunnelUrl)
    
    if (urlWorks) {
      logger.success('✅ Tunnel is working!')
    } else {
      logger.warn('⚠️  Tunnel URL test failed, but tunnel might still be starting...')
    }
    logger.info('')
    
    logger.info('🎉 Hookdeck tunnel is ready!')
    logger.info('')
    logger.info('📋 Next steps:')
    logger.info(`   1. Configure webhook: bun run setup-telegram-webhook.ts`)
    logger.info(`   2. Or set webhook manually with URL: ${tunnelUrl}`)
    logger.info('')
    logger.info('💡 Keep this process running to maintain the tunnel')
    logger.info('   Press Ctrl+C to stop')
    logger.info('')
    
    // Keep process alive
    await new Promise(() => {})
    
  } catch (error: any) {
    logger.error('❌ Error:', error.message)
    logger.info('')
    logger.info('💡 Alternative: Use cloudflared instead:')
    logger.info('   bun run setup-telegram-webhook.ts')
    process.exit(1)
  }
}

main()

