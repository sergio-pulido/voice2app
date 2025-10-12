/**
 * Discord API client utilities
 */

import { config, logger } from '../shared'

const DISCORD_API_BASE = 'https://discord.com/api/v10'

/**
 * Download voice attachment from Discord
 */
export async function downloadVoiceFile(url: string): Promise<Buffer | null> {
  try {
    logger.debug('Downloading voice file from:', url)
    
    const response = await fetch(url)
    if (!response.ok) {
      logger.error('Failed to download file:', response.status)
      return null
    }
    
    const buffer = Buffer.from(await response.arrayBuffer())
    logger.success(`Downloaded voice file: ${buffer.length} bytes`)
    
    return buffer
  } catch (error) {
    logger.error('Error downloading voice file:', error)
    return null
  }
}

/**
 * Send a message to a Discord channel
 */
export async function sendMessage(channelId: string, content: string): Promise<void> {
  const url = `${DISCORD_API_BASE}/channels/${channelId}/messages`
  
  await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bot ${config.discordBotToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content,
    }),
  })
}

/**
 * Send a file to a Discord channel
 */
export async function sendFile(
  channelId: string,
  file: Buffer,
  filename: string,
  content?: string
): Promise<void> {
  const url = `${DISCORD_API_BASE}/channels/${channelId}/messages`
  
  const formData = new FormData()
  const blob = new Blob([file])
  formData.append('files[0]', blob, filename)
  
  if (content) {
    formData.append('payload_json', JSON.stringify({ content }))
  }
  
  await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bot ${config.discordBotToken}`,
    },
    body: formData,
  })
}

/**
 * Reply to an interaction (for slash commands)
 */
export async function replyToInteraction(
  interactionId: string,
  interactionToken: string,
  content: string,
  ephemeral: boolean = false
): Promise<void> {
  const url = `${DISCORD_API_BASE}/interactions/${interactionId}/${interactionToken}/callback`
  
  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
      data: {
        content,
        flags: ephemeral ? 64 : 0, // 64 = EPHEMERAL
      },
    }),
  })
}

/**
 * Send a deferred response to an interaction
 */
export async function deferInteractionResponse(
  interactionId: string,
  interactionToken: string,
  ephemeral: boolean = false
): Promise<void> {
  const url = `${DISCORD_API_BASE}/interactions/${interactionId}/${interactionToken}/callback`
  
  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 5, // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
      data: {
        flags: ephemeral ? 64 : 0,
      },
    }),
  })
}

/**
 * Edit a deferred interaction response
 */
export async function editInteractionResponse(
  interactionToken: string,
  content: string,
  file?: { buffer: Buffer; filename: string }
): Promise<void> {
  const url = `${DISCORD_API_BASE}/webhooks/${config.discordApplicationId}/${interactionToken}/messages/@original`
  
  if (file) {
    const formData = new FormData()
    const blob = new Blob([file.buffer])
    formData.append('files[0]', blob, file.filename)
    formData.append('payload_json', JSON.stringify({ content }))
    
    await fetch(url, {
      method: 'PATCH',
      body: formData,
    })
  } else {
    await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
      }),
    })
  }
}

/**
 * Verify Discord request signature
 */
export function verifyDiscordRequest(
  signature: string,
  timestamp: string,
  body: string
): boolean {
  try {
    const crypto = require('crypto')
    const publicKey = config.discordPublicKey
    
    if (!publicKey) {
      logger.warn('Discord public key not configured')
      return false
    }
    
    // Create signature from timestamp + body
    const message = timestamp + body
    
    // Verify using Ed25519
    const isValid = crypto.verify(
      null,
      Buffer.from(message),
      {
        key: Buffer.from(publicKey, 'hex'),
        format: 'raw',
      },
      Buffer.from(signature, 'hex')
    )
    
    return isValid
  } catch (error) {
    logger.error('Error verifying Discord request:', error)
    return false
  }
}

