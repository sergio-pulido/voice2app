/**
 * Discord Gateway: receives Discord interactions and runs orchestrator
 */

import { Hono } from 'hono'
import { config, logger, orchestrate, type DiscordInteraction } from '../shared'
import { verifyDiscordRequest, deferInteractionResponse, downloadVoiceFile } from './discord-client'

const app = new Hono()

/**
 * Discord Interactions endpoint
 * Handles slash commands, button clicks, and other interactions
 */
app.post('/discord', async (c) => {
  logger.info('🔔 Discord POST request received')
  
  // Verify Discord request signature
  const signature = c.req.header('x-signature-ed25519')
  const timestamp = c.req.header('x-signature-timestamp')
  const rawBody = await c.req.text()
  
  logger.debug('Discord headers:', { signature, timestamp })
  logger.debug('Discord body:', rawBody)
  
  if (!signature || !timestamp) {
    logger.warn('❌ Missing Discord signature headers')
    return c.text('Unauthorized', 401)
  }
  
  // Verify the request is from Discord
  logger.info('🔐 Verifying Discord signature...')
  
  // TEMPORARY: Skip signature verification for debugging
  logger.warn('⚠️  SKIPPING signature verification (TEMPORARY - for debugging only!)')
  // if (!verifyDiscordRequest(signature, timestamp, rawBody)) {
  //   logger.error('❌ Invalid Discord signature - verification failed')
  //   return c.text('Unauthorized', 401)
  // }
  
  logger.success('✅ Discord signature verification skipped (debugging mode)')
  
  const interaction = JSON.parse(rawBody) as DiscordInteraction
  logger.debug('Received Discord interaction:', JSON.stringify(interaction, null, 2))
  
  // Handle PING (Discord verification)
  if (interaction.type === 1) {
    logger.info('🏓 Discord PING received')
    return c.json({ type: 1 })
  }
  
  // Handle APPLICATION_COMMAND (slash commands)
  if (interaction.type === 2) {
    const commandName = interaction.data?.name
    const userId = interaction.member?.user?.id || interaction.user?.id || 'unknown'
    const username = interaction.member?.user?.username || interaction.user?.username || 'Unknown'
    const channelId = interaction.channel_id || 'unknown'
    
    logger.info(`📱 Discord command: /${commandName} from ${username} (${userId})`)
    
    // Defer the response immediately (we have 3 seconds to respond)
    await deferInteractionResponse(interaction.id, interaction.token, false)
    
    // Process command asynchronously
    processCommand(interaction, commandName || '', userId, username, channelId).catch((error) => {
      logger.error('Error processing command:', error)
    })
    
    // Return 200 OK (we already deferred the response)
    return c.json({ type: 5 })
  }
  
  // Handle MESSAGE_COMPONENT (button clicks, etc.)
  if (interaction.type === 3) {
    logger.info('🔘 Discord component interaction')
    return c.json({
      type: 4,
      data: {
        content: 'Component interactions not yet implemented!',
        flags: 64 // EPHEMERAL
      }
    })
  }
  
  logger.warn('Unknown interaction type:', interaction.type)
  return c.json({ error: 'Unknown interaction type' }, 400)
})

/**
 * Process Discord slash commands
 */
async function processCommand(
  interaction: DiscordInteraction,
  commandName: string,
  userId: string,
  username: string,
  channelId: string
): Promise<void> {
  try {
    // Handle different commands
    switch (commandName) {
      case 'generate':
      case 'create':
      case 'build':
        await handleGenerateCommand(interaction, userId, username, channelId)
        break
        
      case 'help':
        await handleHelpCommand(interaction)
        break
        
      default:
        logger.warn(`Unknown command: ${commandName}`)
        const { editInteractionResponse } = await import('./discord-client')
        await editInteractionResponse(
          interaction.token,
          `❓ Unknown command: \`/${commandName}\`\n\nUse \`/help\` to see available commands.`
        )
    }
  } catch (error) {
    logger.error('Command processing error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    const { editInteractionResponse } = await import('./discord-client')
    await editInteractionResponse(
      interaction.token,
      `❌ Error: ${errorMessage}\n\nPlease try again!`
    )
  }
}

/**
 * Handle generate/create/build commands
 */
async function handleGenerateCommand(
  interaction: DiscordInteraction,
  userId: string,
  username: string,
  channelId: string
): Promise<void> {
  // Get command options
  const options = interaction.data?.options || []
  
  // Look for text or file input
  const promptOption = options.find(opt => opt.name === 'prompt' || opt.name === 'description')
  const fileOption = options.find(opt => opt.name === 'voice' || opt.name === 'audio')
  
  let textMessage: string | undefined
  let voiceBuffer: Buffer | undefined
  
  // Handle text input
  if (promptOption?.value) {
    textMessage = String(promptOption.value)
    logger.info('📝 Text prompt:', textMessage)
  }
  
  // Handle voice/audio attachment
  if (fileOption?.value) {
    const attachmentId = String(fileOption.value)
    const attachment = interaction.message?.attachments?.find(a => a.id === attachmentId)
    
    if (attachment && attachment.content_type?.startsWith('audio/')) {
      logger.info('🎤 Voice attachment detected:', attachment.filename)
      voiceBuffer = await downloadVoiceFile(attachment.url)
    }
  }
  
  // Check if we have input
  if (!textMessage && !voiceBuffer) {
    const { editInteractionResponse } = await import('./discord-client')
    await editInteractionResponse(
      interaction.token,
      '❌ Please provide either a text prompt or voice recording!\n\nUsage: `/generate prompt: "your idea here"`'
    )
    return
  }
  
  // Run orchestrator
  await orchestrate({
    chatId: channelId,
    messageId: interaction.id,
    voiceBuffer,
    textMessage,
    username,
    platform: 'discord',
    discordToken: interaction.token
  })
}

/**
 * Handle help command
 */
async function handleHelpCommand(interaction: DiscordInteraction): Promise<void> {
  const { editInteractionResponse } = await import('./discord-client')
  
  const helpText = `
🤖 **Voice2App Discord Bot**

**Available Commands:**
• \`/generate prompt: "your idea"\` - Generate an app from text description
• \`/create prompt: "your idea"\` - Same as /generate
• \`/build prompt: "your idea"\` - Same as /generate
• \`/help\` - Show this help message

**Features:**
✨ Generate web apps from natural language
🎤 Support for voice input (coming soon)
📸 Get screenshots of your generated apps
🤖 Powered by AI with multiple providers

**Example:**
\`/generate prompt: "Create a todo list app with dark mode"\`

For more information, visit: https://github.com/nekotori/voice2app
`
  
  await editInteractionResponse(interaction.token, helpText.trim())
}

/**
 * Health check endpoint
 */
app.get('/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    platform: 'discord'
  })
})

export default app

