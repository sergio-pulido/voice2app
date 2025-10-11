/**
 * Telegram API client utilities
 */

import { config, logger } from '../shared'

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot'

export async function downloadVoiceFile(fileId: string): Promise<Buffer | null> {
  try {
    // Get file path from Telegram
    const fileUrl = `${TELEGRAM_API_BASE}${config.telegramBotToken}/getFile?file_id=${fileId}`
    const fileResponse = await fetch(fileUrl)
    const fileData = await fileResponse.json() as {
      ok: boolean
      result?: { file_path: string }
    }
    
    if (!fileData.ok || !fileData.result?.file_path) {
      logger.error('Failed to get file path:', fileData)
      return null
    }
    
    // Download the actual file
    const downloadUrl = `https://api.telegram.org/file/bot${config.telegramBotToken}/${fileData.result.file_path}`
    logger.debug('Downloading voice file from:', downloadUrl)
    
    const downloadResponse = await fetch(downloadUrl)
    if (!downloadResponse.ok) {
      logger.error('Failed to download file:', downloadResponse.status)
      return null
    }
    
    const buffer = Buffer.from(await downloadResponse.arrayBuffer())
    logger.success(`Downloaded voice file: ${buffer.length} bytes`)
    
    return buffer
  } catch (error) {
    logger.error('Error downloading voice file:', error)
    return null
  }
}

export async function sendMessage(chatId: number, text: string): Promise<void> {
  const url = `${TELEGRAM_API_BASE}${config.telegramBotToken}/sendMessage`
  
  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
    }),
  })
}

export async function setupWebhook(webhookUrl: string): Promise<boolean> {
  try {
    const url = `${TELEGRAM_API_BASE}${config.telegramBotToken}/setWebhook`
    
    const params = new URLSearchParams({
      url: webhookUrl,
    })
    
    if (config.telegramWebhookSecret) {
      params.append('secret_token', config.telegramWebhookSecret)
    }
    
    const response = await fetch(`${url}?${params.toString()}`)
    const result = await response.json() as { ok: boolean; description?: string }
    
    if (result.ok) {
      logger.success('✅ Telegram webhook set successfully!')
      logger.info(`📡 Webhook URL: ${webhookUrl}`)
      return true
    } else {
      logger.error('❌ Failed to set webhook:', result.description)
      return false
    }
  } catch (error) {
    logger.error('❌ Error setting webhook:', error)
    return false
  }
}

