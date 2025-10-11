/**
 * Discord admin notifications via webhook
 */

import { config } from './config'
import { logger } from './logger'

export interface DiscordEmbed {
  title?: string
  description?: string
  color?: number
  fields?: Array<{
    name: string
    value: string
    inline?: boolean
  }>
  footer?: {
    text: string
  }
  timestamp?: string
}

export interface DiscordMessage {
  content?: string
  embeds?: DiscordEmbed[]
}

/**
 * Send a Discord message via webhook
 */
export async function sendDiscordAdminNotification(message: string | DiscordMessage): Promise<boolean> {
  try {
    if (!config.discordWebhookUrl) {
      logger.debug('Discord webhook URL not configured, skipping notification')
      return false
    }

    const payload: DiscordMessage = typeof message === 'string' 
      ? { content: message }
      : message

    logger.debug('📢 Sending Discord admin notification...')

    const response = await fetch(config.discordWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error(`Discord webhook error: ${response.status} - ${errorText}`)
      return false
    }

    logger.success('📢 Discord notification sent')
    return true
  } catch (error) {
    logger.error('Failed to send Discord notification:', error)
    return false
  }
}

/**
 * Create a rich Discord embed for admin notifications
 */
export function createAdminEmbed(data: {
  title: string
  description?: string
  fields: Array<{ name: string; value: string; inline?: boolean }>
  color?: 'success' | 'warning' | 'error' | 'info'
  status?: string
}): DiscordMessage {
  const colors = {
    success: 0x00ff00,  // Green
    warning: 0xffaa00,  // Orange
    error: 0xff0000,    // Red
    info: 0x0099ff      // Blue
  }

  const embed: DiscordEmbed = {
    title: data.title,
    description: data.description,
    color: colors[data.color || 'info'],
    fields: data.fields,
    timestamp: new Date().toISOString()
  }

  if (data.status) {
    embed.footer = { text: `Status: ${data.status}` }
  }

  return { embeds: [embed] }
}

