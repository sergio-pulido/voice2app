/**
 * WhatsApp message sender using Vonage API
 */

import { config } from './config'
import { logger } from './logger'

export interface WhatsAppMessage {
  to: string
  text: string
}

export interface VonageResponse {
  message_uuid: string
  status: string
}

/**
 * Send a WhatsApp message via Vonage API
 */
export async function sendWhatsAppMessage(message: WhatsAppMessage): Promise<VonageResponse | null> {
  try {
    if (!config.vonageApiKey || !config.vonageApiSecret) {
      logger.error('Vonage API credentials not configured')
      return null
    }

    const url = 'https://messages-sandbox.nexmo.com/v1/messages'
    
    const payload = {
      from: config.vonageWhatsAppFrom || '14157386102', // Default sandbox number
      to: message.to,
      message_type: 'text',
      text: message.text,
      channel: 'whatsapp'
    }

    logger.info(`📱 Sending WhatsApp message to ${message.to}`)
    logger.debug('WhatsApp payload:', JSON.stringify(payload, null, 2))

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${config.vonageApiKey}:${config.vonageApiSecret}`).toString('base64')}`
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error(`WhatsApp API error: ${response.status} ${response.statusText}`)
      logger.error('Error response:', errorText)
      return null
    }

    const result = await response.json() as VonageResponse
    logger.success(`📱 WhatsApp message sent successfully: ${result.message_uuid}`)
    
    return result
  } catch (error) {
    logger.error('Error sending WhatsApp message:', error)
    return null
  }
}

/**
 * Send WhatsApp message with retry logic
 */
export async function sendWhatsAppWithRetry(
  message: WhatsAppMessage, 
  maxRetries: number = 3
): Promise<VonageResponse | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await sendWhatsAppMessage(message)
    
    if (result) {
      return result
    }
    
    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt) * 1000 // Exponential backoff
      logger.warn(`WhatsApp send failed, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  logger.error(`Failed to send WhatsApp message after ${maxRetries} attempts`)
  return null
}
