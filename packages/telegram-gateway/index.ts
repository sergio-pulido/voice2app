/**
 * Telegram Gateway: receives Telegram events and runs orchestrator
 */

import { Hono } from 'hono'
import { config, logger, orchestrate, type TelegramUpdate } from '../shared'
import { downloadVoiceFile, downloadPhotoFile, sendMessage } from './telegram-client'
import { 
  getVideoSession, 
  setVideoSessionImage, 
  setVideoSessionAudio,
  completeVideoSession 
} from '../shared/video-state-manager'
import { generateVideoWithFabricRetry } from '../router/services/fal-video-service'
import { generateImageWithRetry } from '../router/services/huggingface-service'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

const app = new Hono()

app.post('/telegram', async (c) => {
  // Verify webhook secret if configured
  const secret = config.telegramWebhookSecret
  if (secret) {
    const headerSecret = c.req.header('x-telegram-bot-api-secret-token')
    if (headerSecret !== secret) {
      logger.warn('Invalid webhook secret')
      return c.text('Forbidden', 403)
    }
  }
  
  const update = await c.req.json<TelegramUpdate>()
  logger.debug('Received Telegram update:', JSON.stringify(update, null, 2))
  
  const chatId = update?.message?.chat?.id
  const message = update?.message
  
  if (!chatId || !message) {
    logger.warn('No chat ID or message in update')
    return c.json({ ok: true })
  }
  
  // Process message asynchronously (don't block response)
  processMessage(chatId, message).catch((error) => {
    logger.error('Error processing message:', error)
  })
  
  return c.json({ ok: true })
})

// Vonage webhook endpoint for WhatsApp - handle both GET and POST
app.all('/vonage', async (c) => {
  const method = c.req.method
  logger.info(`📱 Vonage webhook received: ${method} request`)
  
  try {
    // Handle GET requests (webhook verification)
    if (method === 'GET') {
      logger.info('📱 Vonage webhook verification request')
      return c.text('OK')
    }
    
    // Handle POST requests (actual webhook data)
    if (method === 'POST') {
      const webhookData = await c.req.json()
      logger.info('📱 Received Vonage webhook data:', JSON.stringify(webhookData, null, 2))
      
      // Handle inbound messages
      if (webhookData.type === 'message' && webhookData.message) {
        const message = webhookData.message
        
        // Log the received WhatsApp message
        logger.info(`📱 WhatsApp message from ${message.from}: ${message.content?.text || '[non-text message]'}`)
        
        // You can process the WhatsApp message here if needed
        // For now, we'll just acknowledge receipt
      }
      
      // Handle status updates
      if (webhookData.type === 'status') {
        const status = webhookData.status
        logger.info(`📱 WhatsApp message status: ${status.status} for message ${status.message_uuid}`)
      }
      
      return c.json({ ok: true })
    }
    
    // Handle other methods
    logger.warn(`📱 Unsupported HTTP method: ${method}`)
    return c.text('Method not allowed', 405)
    
  } catch (error) {
    logger.error('Error processing Vonage webhook:', error)
    return c.json({ error: 'Invalid webhook data' }, 400)
  }
})

async function processMessage(chatId: number, message: any) {
  const messageId = message.message_id
  const username = message.from?.first_name || message.from?.username || 'Unknown'
  
  try {
    // Check if user has an active video generation session
    const videoSession = getVideoSession(chatId)
    
    if (videoSession) {
      await handleVideoSessionMessage(chatId, message, videoSession)
      return
    }
    
    // Handle voice messages
    if (message.voice) {
      logger.info('🎤 Voice message detected')
      
      const fileId = message.voice.file_id
      const duration = message.voice.duration
      
      logger.info(`Voice duration: ${duration}s`)
      
      // Download voice file
      const voiceBuffer = await downloadVoiceFile(fileId)
      
      if (!voiceBuffer) {
        throw new Error('Failed to download voice file')
      }
      
      // Run orchestrator
      await orchestrate({
        chatId,
        messageId,
        voiceBuffer,
        username,
        platform: 'telegram',
      })
    }
    // Handle text messages
    else if (message.text) {
      logger.info('📝 Text message detected:', message.text)
      
      // Run orchestrator
      await orchestrate({
        chatId,
        messageId,
        textMessage: message.text,
        username,
        platform: 'telegram',
      })
    }
    // Handle photo messages (if not in video session, just acknowledge)
    else if (message.photo) {
      logger.info('📸 Photo detected but no active video session')
      await sendMessage(chatId, '📸 I received your photo! To create a video, please ask me to "generate a video" first.')
    }
    // Handle document messages (like .webp files)
    else if (message.document) {
      logger.info('📄 Document detected but no active video session')
      await sendMessage(chatId, '📄 I received your file! To create a video, please ask me to "generate a video" first.')
    }
    // Handle unsupported types
    else {
      logger.info('❓ Unsupported message type')
      await sendMessage(chatId, '🎤 Please send me a voice message or text to generate an app!')
    }
  } catch (error) {
    logger.error('Message processing error:', error)
    
    const { sendError } = await import('../notifier')
    await sendError(chatId, error instanceof Error ? error.message : 'Unknown error')
  }
}

async function handleVideoSessionMessage(chatId: number, message: any, session: any) {
  try {
    // State 1: Awaiting image
    if (session.state === 'awaiting_image') {
      // User can send photo, document, OR text description
      if (message.photo) {
        logger.info('📸 Photo received for video generation')
        
        // Get the largest photo size
        const photo = message.photo[message.photo.length - 1]
        const photoBuffer = await downloadPhotoFile(photo.file_id)
        
        if (!photoBuffer) {
          throw new Error('Failed to download photo')
        }
        
        // Save photo to artifacts
        const timestamp = Date.now()
        const filename = `video_image_${timestamp}.jpg`
        const artifactsDir = join(process.cwd(), 'artifacts')
        await mkdir(artifactsDir, { recursive: true })
        const imagePath = join(artifactsDir, filename)
        await writeFile(imagePath, photoBuffer)
        
        logger.success(`📸 Photo saved: ${imagePath}`)
        
        // Update session
        setVideoSessionImage(chatId, imagePath)
        
        // Ask for audio
        await sendMessage(
          chatId,
          '✅ **Image received!**\n\n' +
          '🎤 **Step 2/3:** Now please send me a **voice message** with the audio for your video.\n\n' +
          'This will be the audio that plays in the video (e.g., narration, speech, etc.)'
        )
      }
      else if (message.document) {
        logger.info('📄 Document received for video generation')
        
        // Check if it's an image file
        const mimeType = message.document.mime_type || ''
        if (!mimeType.startsWith('image/')) {
          await sendMessage(
            chatId,
            '❌ Please send an image file (JPG, PNG, WebP, etc.) or describe the image you want me to generate.'
          )
          return
        }
        
        // Download document
        const documentBuffer = await downloadPhotoFile(message.document.file_id)
        
        if (!documentBuffer) {
          throw new Error('Failed to download document')
        }
        
        // Save document to artifacts
        const timestamp = Date.now()
        const extension = mimeType.includes('png') ? 'png' : 
                         mimeType.includes('webp') ? 'webp' : 'jpg'
        const filename = `video_image_${timestamp}.${extension}`
        const artifactsDir = join(process.cwd(), 'artifacts')
        await mkdir(artifactsDir, { recursive: true })
        const imagePath = join(artifactsDir, filename)
        await writeFile(imagePath, documentBuffer)
        
        logger.success(`📄 Document saved: ${imagePath}`)
        
        // Update session
        setVideoSessionImage(chatId, imagePath)
        
        // Ask for audio
        await sendMessage(
          chatId,
          '✅ **Image received!**\n\n' +
          '🎤 **Step 2/3:** Now please send me a **voice message** with the audio for your video.\n\n' +
          'This will be the audio that plays in the video (e.g., narration, speech, etc.)'
        )
      }
      else if (message.text) {
        logger.info('📝 Text description received for image generation')
        
        await sendMessage(chatId, '🎨 Generating image from your description...')
        
        // Generate image from text using HuggingFace
        const imagePath = await generateImageWithRetry(message.text)
        
        if (!imagePath) {
          throw new Error('Failed to generate image')
        }
        
        logger.success(`🎨 Image generated: ${imagePath}`)
        
        // Update session
        setVideoSessionImage(chatId, imagePath)
        
        // Send image preview
        await sendPhotoMessage(chatId, imagePath)
        
        // Ask for audio
        await sendMessage(
          chatId,
          '✅ **Image generated!**\n\n' +
          '🎤 **Step 2/3:** Now please send me a **voice message** with the audio for your video.\n\n' +
          'This will be the audio that plays in the video (e.g., narration, speech, etc.)'
        )
      }
      else {
        await sendMessage(
          chatId,
          '❓ Please send either:\n' +
          '• 📸 A **photo** to use in the video\n' +
          '• 📝 A **text description** and I\'ll generate an image for you'
        )
      }
    }
    // State 2: Awaiting audio
    else if (session.state === 'awaiting_audio') {
      if (message.voice) {
        logger.info('🎤 Voice message received for video generation')
        
        await sendMessage(chatId, '🎬 Generating your video... This may take 3-4 minutes.')
        
        // Download voice file
        const voiceBuffer = await downloadVoiceFile(message.voice.file_id)
        
        if (!voiceBuffer) {
          throw new Error('Failed to download voice file')
        }
        
        // Save audio to artifacts
        const timestamp = Date.now()
        const filename = `video_audio_${timestamp}.ogg`
        const artifactsDir = join(process.cwd(), 'artifacts')
        await mkdir(artifactsDir, { recursive: true })
        const audioPath = join(artifactsDir, filename)
        await writeFile(audioPath, voiceBuffer)
        
        logger.success(`🎤 Audio saved: ${audioPath}`)
        
        // Update session
        setVideoSessionAudio(chatId, audioPath)
        
        // Generate video!
        logger.info('🎬 Starting talking video generation with fal.ai Fabric 1.0... This may take 3-4 minutes.')
        const videoPath = await generateVideoWithFabricRetry({
          imageUrl: session.imagePath!,
          audioUrl: audioPath,
          resolution: '720p'
        })
        
        if (!videoPath) {
          throw new Error('Failed to generate video')
        }
        
        logger.success(`🎬 Video generated: ${videoPath}`)
        
        // Send success message
        await sendMessage(
          chatId,
          '🎉 **Video Generated Successfully!**\n\n' +
          `📋 Prompt: "${session.prompt}"\n\n` +
          '✅ Your talking video has been created using fal.ai Fabric 1.0!\n' +
          '🎬 The video combines your image with your audio for a talking effect.\n\n' +
          '📹 Sending video...'
        )
        
        // Send video
        await sendVideoMessage(chatId, videoPath)
        
        // Complete session
        completeVideoSession(chatId)
        
        await sendMessage(
          chatId,
          '✨ Video generation complete! Want to create another video? Just ask!'
        )
      }
      else {
        await sendMessage(
          chatId,
          '🎤 Please send a **voice message** with the audio for your video.\n\n' +
          'Press and hold the microphone button to record your audio.'
        )
      }
    }
  } catch (error) {
    logger.error('Video session error:', error)
    completeVideoSession(chatId)
    
    await sendMessage(
      chatId,
      `❌ Video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}\n\n` +
      'Please try again by asking me to "generate a video"'
    )
  }
}

async function sendPhotoMessage(chatId: number, imagePath: string): Promise<void> {
  const url = `https://api.telegram.org/bot${config.telegramBotToken}/sendPhoto`
  
  const formData = new FormData()
  formData.append('chat_id', chatId.toString())
  
  // Read file and create blob
  const fs = await import('fs/promises')
  const imageBuffer = await fs.readFile(imagePath)
  const blob = new Blob([imageBuffer], { type: 'image/jpeg' })
  formData.append('photo', blob, 'image.jpg')
  
  await fetch(url, {
    method: 'POST',
    body: formData,
  })
}

async function sendVideoMessage(chatId: number, videoPath: string): Promise<void> {
  const url = `https://api.telegram.org/bot${config.telegramBotToken}/sendVideo`
  
  const formData = new FormData()
  formData.append('chat_id', chatId.toString())
  
  // Read file and create blob
  const fs = await import('fs/promises')
  const videoBuffer = await fs.readFile(videoPath)
  const blob = new Blob([videoBuffer], { type: 'video/mp4' })
  formData.append('video', blob, 'video.mp4')
  
  await fetch(url, {
    method: 'POST',
    body: formData,
  })
}

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

export default app

