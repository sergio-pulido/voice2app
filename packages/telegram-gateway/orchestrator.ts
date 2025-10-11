/**
 * Main orchestrator: coordinates all packages with AI routing
 */

import { logger, config } from '../shared'
import { sendWhatsAppMessage } from '../shared/whatsapp'
import { sendDiscordAdminNotification, createAdminEmbed } from '../shared/discord-admin'
import { sendNotification, sendAcknowledgment, sendError } from '../notifier'
import { routeRequest, getCategoryName, getCategoryEmoji, type IntentCategory } from '../router'

interface OrchestrateOptions {
  chatId: number
  messageId: number
  voiceBuffer?: Buffer
  textMessage?: string
  username?: string
}

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

export async function orchestrate(options: OrchestrateOptions): Promise<void> {
  const { chatId, messageId, voiceBuffer, textMessage, username } = options
  
  const startTime = Date.now()
  logger.info('🚀 Starting orchestration with AI routing...')
  
  try {
    // Send acknowledgment to Telegram
    await sendAcknowledgment(chatId, voiceBuffer ? 'voice' : 'text')
    
    // Prepare input for router
    const messageType = voiceBuffer ? 'voice' : 'text'
    const inputText = textMessage || '[Voice message - will be transcribed]'
    const inputPreview = textMessage || (voiceBuffer ? `[Voice: ${Math.round(voiceBuffer.length / 1024)}KB]` : '[No input]')
    
    // Send initial admin notification
    await sendAdminNotification(
      `🔔 NEW REQUEST\n` +
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
      userId: chatId,
      username,
      transcription: undefined, // Will be set by adapter if needed
      voiceBuffer
    })
    
    const category = result.metadata?.routedTo || 'app_code'
    const categoryName = getCategoryName(category as IntentCategory)
    const categoryEmoji = getCategoryEmoji(category as IntentCategory)
    
    logger.success(`${categoryEmoji} Routed to: ${categoryName}`)
    
    // Build customer notification message
    let customerMessage = `${categoryEmoji} **${categoryName}**\n\n${result.summaryText}`
    
    // Send result to customer (Telegram)
    await sendNotification({
      chatId,
      text: customerMessage,
      screenshot: result.attachments?.[0], // First attachment if any
      voice: !!voiceBuffer,  // Send voice reply if input was voice
    })
    
    // Send detailed admin completion notification
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(1)
    const status = result.metadata?.status || 'success'
    const statusEmoji = status === 'success' ? '✅' : status === 'partial' ? '⚠️' : '❌'
    
    const adminMessage = 
      `${statusEmoji} REQUEST COMPLETED\n` +
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
      description: `Tool: ${categoryName}`,
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
    
    // Send error to Telegram (customer)
    await sendError(chatId, errorMessage)
    
    // Send detailed error notification to WhatsApp (admin)
    await sendAdminNotification(
      `❌ REQUEST FAILED\n` +
      `👤 User: ${username || 'Unknown'} (${chatId})\n` +
      `⏱️  Time: ${processingTime}s\n` +
      `💬 Input: ${textMessage?.substring(0, 100) || '[Voice message]'}\n` +
      `\n🔴 Error:\n${errorMessage}\n` +
      (errorStack ? `\n📋 Stack (first 200 chars):\n${errorStack.substring(0, 200)}...` : '') +
      `\n⏰ Failed at: ${new Date().toLocaleTimeString()}`
    )
  }
}

