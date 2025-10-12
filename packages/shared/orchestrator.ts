/**
 * Shared orchestrator: coordinates all packages with AI routing
 * Can be used by both Telegram and Discord gateways
 */

import { logger, config } from './index'
import { sendWhatsAppMessage } from './whatsapp'
import { sendDiscordAdminNotification, createAdminEmbed } from './discord-admin'
import { routeRequest, getCategoryName, getCategoryEmoji, type IntentCategory } from '../router'
import type { OrchestrateOptions } from './types'

/**
 * Send admin notification to configured channels (WhatsApp and/or Discord)
 */
async function sendAdminNotification(message: string, embed?: any): Promise<void> {
  // Send to WhatsApp if enabled
  if (config.enableWhatsAppAdmin && config.vonageWhatsAppTo) {
    await sendWhatsAppMessage({
      to: config.vonageWhatsAppTo,
      text: message
    })
  }
  
  // Send to Discord if enabled
  if (config.enableDiscordAdmin && config.discordWebhookUrl) {
    if (embed) {
      await sendDiscordAdminNotification(embed)
    } else {
      await sendDiscordAdminNotification(message)
    }
  }
  
  // If neither is enabled, just log
  if (!config.enableWhatsAppAdmin && !config.enableDiscordAdmin) {
    logger.debug('Admin notifications disabled. Message:', message)
  }
}

/**
 * Main orchestration function - routes and processes requests from any gateway
 */
export async function orchestrate(options: OrchestrateOptions): Promise<void> {
  const { chatId, messageId, voiceBuffer, textMessage, username, platform, discordToken } = options
  
  const startTime = Date.now()
  logger.info(`🚀 Starting orchestration with AI routing... (${platform})`)
  
  try {
    // Send acknowledgment based on platform
    const { sendAcknowledgment, sendNotification, sendError } = await getPlatformNotifier(platform)
    
    await sendAcknowledgment(chatId, voiceBuffer ? 'voice' : 'text', discordToken)
    
    // Prepare input for router
    const messageType = voiceBuffer ? 'voice' : 'text'
    const inputText = textMessage || (voiceBuffer ? 'Voice message' : 'No input')
    const inputPreview = textMessage || (voiceBuffer ? `[Voice: ${Math.round(voiceBuffer.length / 1024)}KB]` : '[No input]')
    
    // Send initial admin notification
    await sendAdminNotification(
      `🔔 NEW REQUEST\n` +
      `🌐 Platform: ${platform.toUpperCase()}\n` +
      `👤 User: ${username || 'Unknown'} (${chatId})\n` +
      `📱 Type: ${messageType === 'voice' ? '🎤 Voice' : '📝 Text'}\n` +
      `💬 Input: ${inputPreview.substring(0, 100)}${inputPreview.length > 100 ? '...' : ''}\n` +
      `⏰ Started: ${new Date().toLocaleTimeString()}\n` +
      `🔄 Status: Analyzing intent...`
    )
    
    // Route the request through the AI router
    logger.info('🧠 Routing request...')
    const result = await routeRequest({
      text: inputText,
      userId: typeof chatId === 'number' ? chatId : parseInt(chatId) || 0,
      username,
      transcription: undefined, // Will be set by router if voice message
      voiceBuffer
    })
    
    const category = result.metadata?.routedTo || 'app_code'
    const categoryName = getCategoryName(category as IntentCategory)
    const categoryEmoji = getCategoryEmoji(category as IntentCategory)
    
    logger.success(`${categoryEmoji} Routed to: ${categoryName}`)
    
    // Build customer notification message (bold category name)
    let customerMessage = `**${categoryName}**\n\n${result.summaryText}`
    
    // Send result to customer
    await sendNotification({
      chatId,
      text: customerMessage,
      screenshot: result.attachments?.[0], // First attachment if any
      voice: !!voiceBuffer,  // Send voice reply if input was voice
      discordToken
    })
    
    // Send detailed admin completion notification
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(1)
    const status = result.metadata?.status || 'success'
    const statusEmoji = status === 'success' ? '✅' : status === 'partial' ? '⚠️' : '❌'
    
    const adminMessage = 
      `${statusEmoji} REQUEST COMPLETED\n` +
      `🌐 Platform: ${platform.toUpperCase()}\n` +
      `👤 User: ${username || 'Unknown'} (${chatId})\n` +
      `🎯 Tool: ${categoryName}\n` +
      `📋 Task: ${inputPreview.substring(0, 80)}\n` +
      `⏱️  Time: ${processingTime}s\n` +
      `📊 Status: ${status.toUpperCase()}\n` +
      (result.metadata?.filesGenerated ? `📦 Files: ${result.metadata.filesGenerated} generated\n` : '') +
      (result.metadata?.project ? `🎯 Project: ${result.metadata.project}\n` : '') +
      (result.metadata?.intent ? `🔧 Intent: ${result.metadata.intent}\n` : '') +
      (result.metadata?.transcription ? `🎤 Transcription: "${result.metadata.transcription}"\n` : '') +
      `\n📝 Summary:\n${result.summaryText.substring(0, 200)}${result.summaryText.length > 200 ? '...' : ''}`
    
    // Create rich Discord embed if Discord is enabled
    const discordEmbed = config.enableDiscordAdmin ? createAdminEmbed({
      title: `${statusEmoji} Request Completed`,
      description: `Platform: ${platform.toUpperCase()} | Tool: ${categoryName}`,
      fields: [
        { name: '👤 User', value: `${username || 'Unknown'} (${chatId})`, inline: true },
        { name: '⏱️ Time', value: `${processingTime}s`, inline: true },
        { name: '📊 Status', value: status.toUpperCase(), inline: true },
        { name: '🎯 Tool', value: categoryName, inline: false },
        { name: '📋 Task', value: inputPreview.substring(0, 100), inline: false },
        ...(result.metadata?.filesGenerated ? [{ name: '📦 Files', value: `${result.metadata.filesGenerated} generated`, inline: true }] : []),
        ...(result.metadata?.transcription ? [{ name: '🎤 Transcription', value: result.metadata.transcription.substring(0, 100), inline: false }] : [])
      ],
      color: status === 'success' ? 'success' : status === 'partial' ? 'warning' : 'error',
      status: status.toUpperCase()
    }) : undefined
    
    await sendAdminNotification(adminMessage, discordEmbed)
    
    logger.success('🎉 Orchestration complete!')
  } catch (error) {
    logger.error('Orchestration error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(1)
    
    // Send error to customer
    const { sendError } = await getPlatformNotifier(platform)
    await sendError(chatId, errorMessage, discordToken)
    
    // Send detailed error notification to admin
    await sendAdminNotification(
      `❌ REQUEST FAILED\n` +
      `🌐 Platform: ${platform.toUpperCase()}\n` +
      `👤 User: ${username || 'Unknown'} (${chatId})\n` +
      `⏱️  Time: ${processingTime}s\n` +
      `💬 Input: ${textMessage?.substring(0, 100) || '[Voice message]'}\n` +
      `\n🔴 Error:\n${errorMessage}\n` +
      (errorStack ? `\n📋 Stack (first 200 chars):\n${errorStack.substring(0, 200)}...` : '') +
      `\n⏰ Failed at: ${new Date().toLocaleTimeString()}`
    )
  }
}

/**
 * Get platform-specific notifier functions
 */
async function getPlatformNotifier(platform: 'telegram' | 'discord') {
  if (platform === 'telegram') {
    return await import('../notifier')
  } else {
    return await import('../discord-gateway/discord-notifier')
  }
}

