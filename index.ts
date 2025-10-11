// index.ts
import { Hono } from 'hono'

const app = new Hono()

// Optional: set the same secret when you call setWebhook
const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || ''

// Hookdeck configuration
const HOOKDECK_URL = process.env.HOOKDECK_URL || 'https://hkdk.events/k6dddf8z54fd7q'

// Lovable API configuration
const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY
const LOVABLE_API_URL = 'https://api.lovable.dev' // Update with actual API URL

// Helper function to download voice file from Telegram
async function downloadVoiceFile(fileId: string): Promise<Buffer | null> {
  try {
    // Get file path from Telegram
    const fileResponse = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`)
    const fileData = await fileResponse.json() as { ok: boolean; result?: { file_path: string } }
    
    if (!fileData.ok || !fileData.result?.file_path) {
      console.error('❌ Failed to get file path:', fileData)
      return null
    }

    // Download the actual file
    const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${fileData.result.file_path}`
    console.log('📥 Downloading voice file from:', fileUrl)
    
    const downloadResponse = await fetch(fileUrl)
    if (!downloadResponse.ok) {
      console.error('❌ Failed to download file:', downloadResponse.status)
      return null
    }

    const buffer = Buffer.from(await downloadResponse.arrayBuffer())
    console.log(`✅ Downloaded voice file: ${buffer.length} bytes`)
    return buffer
    
  } catch (error) {
    console.error('❌ Error downloading voice file:', error)
    return null
  }
}

// Helper function to process voice with Lovable API
async function processVoiceWithLovable(voiceBuffer: Buffer): Promise<string | null> {
  if (!LOVABLE_API_KEY) {
    console.error('❌ LOVABLE_API_KEY not found in environment variables')
    return null
  }

  try {
    console.log('🤖 Sending voice to Lovable API...')
    
    // Create FormData for multipart upload
    const formData = new FormData()
    formData.append('audio', new Blob([voiceBuffer], { type: 'audio/ogg' }), 'voice.ogg')
    formData.append('prompt', 'Convert this voice message to code. Generate clean, well-commented code based on what the user is describing.')
    
    const response = await fetch(`${LOVABLE_API_URL}/voice-to-code`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        // Don't set Content-Type for FormData - let browser set it with boundary
      },
      body: formData
    })

    if (!response.ok) {
      console.error('❌ Lovable API error:', response.status, await response.text())
      return null
    }

    const result = await response.json() as { code?: string; error?: string }
    
    if (result.error) {
      console.error('❌ Lovable API returned error:', result.error)
      return null
    }

    console.log('✅ Lovable API processing complete!')
    return result.code || 'No code generated'
    
  } catch (error) {
    console.error('❌ Error processing voice with Lovable API:', error)
    return null
  }
}

app.post('/telegram', async (c) => {
  // Basic verification (Telegram sends this header if you set secret_token)
  const ok = !SECRET || c.req.header('x-telegram-bot-api-secret-token') === SECRET
  if (!ok) return c.text('forbidden', 403)

  const update = await c.req.json<any>()
  console.log('📨 Received Telegram update:', JSON.stringify(update, null, 2))

  const chatId = update?.message?.chat?.id
  const message = update?.message

  if (!chatId || !message) {
    console.log('❌ No chat ID or message found in update')
    return c.json({ ok: true })
  }

  // Handle voice messages
  if (message.voice) {
    console.log('🎤 Voice message detected!')
    const voice = message.voice
    const fileId = voice.file_id
    const duration = voice.duration
    
    console.log(`📊 Voice info: duration=${duration}s, file_id=${fileId}`)
    
    // Send acknowledgment
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ 
        chat_id: chatId, 
        text: `😍 Thanks for your message! 🎤 Processing your ${duration}s voice message...` 
      })
    })

    // Download and process voice file
    const voiceBuffer = await downloadVoiceFile(fileId)
    if (!voiceBuffer) {
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ 
          chat_id: chatId, 
          text: `❌ Failed to download your voice message. Please try again.` 
        })
      })
      return c.json({ ok: true })
    }

    // Process voice with Lovable API
    const generatedCode = await processVoiceWithLovable(voiceBuffer)
    
    if (generatedCode) {
      // Send the generated code back to user
      const codeMessage = `🎉 **Code Generated Successfully!**\n\n\`\`\`\n${generatedCode}\n\`\`\`\n\n💡 _Generated from your voice message using Lovable AI_`
      
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ 
          chat_id: chatId, 
          text: codeMessage,
          parse_mode: 'Markdown'
        })
      })
    } else {
      // Handle API error
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ 
          chat_id: chatId, 
          text: `❌ Sorry, I couldn't process your voice message.\n\n🔧 Please make sure:\n• The voice is clear and audible\n• You're describing code requirements\n• Try again in a moment` 
        })
      })
    }
    
  } else if (message.text) {
    // Handle text messages
    console.log('📝 Text message detected:', message.text)
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ 
        chat_id: chatId, 
        text: `📝 You said: "${message.text}"\n\n🎤 Send me a voice message to generate code with Lovable!` 
      })
    })
  } else {
    // Handle other message types
    console.log('❓ Unsupported message type')
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ 
        chat_id: chatId, 
        text: `🎤 Please send me a voice message to generate code with Lovable!` 
      })
    })
  }

  return c.json({ ok: true })
})

// Utility function to set up Telegram webhook with Hookdeck
export async function setupTelegramWebhook() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN is required')
    return
  }

  const webhookUrl = HOOKDECK_URL
  const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET

  try {
    const url = new URL('https://api.telegram.org/bot' + botToken + '/setWebhook')
    url.searchParams.set('url', webhookUrl)
    if (secretToken) {
      url.searchParams.set('secret_token', secretToken)
    }

    const response = await fetch(url.toString())
    const result = await response.json() as { ok: boolean; description?: string }

    if (result.ok) {
      console.log('✅ Telegram webhook set successfully!')
      console.log(`📡 Webhook URL: ${webhookUrl}`)
      console.log('🔗 Hookdeck Dashboard: https://dashboard.hookdeck.com/')
    } else {
      console.error('❌ Failed to set webhook:', result)
    }
  } catch (error) {
    console.error('❌ Error setting webhook:', error)
  }
}

export default app

