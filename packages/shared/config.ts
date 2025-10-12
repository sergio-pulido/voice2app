/**
 * Shared configuration
 */

import type { STTProvider, LLMProvider, TTSProvider, ImageProvider } from './providers'

export const config = {
  // API Keys
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  groqApiKey: process.env.GROQ_API_KEY || '',
  elevenlabsApiKey: process.env.ELEVENLABS_API_KEY || '',
  linkupApiKey: process.env.LINKUP_API_KEY || '',
  huggingfaceApiKey: process.env.HUGGINGFACE_API_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  lingoApiKey: process.env.LINGODEV_API_KEY || '',
  falApiKey: process.env.FAL_API_KEY || '',
  
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramAdminChatId: process.env.TELEGRAM_ADMIN_CHAT_ID || '',
  hookdeckSecret: process.env.HOOKDECK_SECRET || '',
  telegramWebhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || '',
  hookdeckUrl: process.env.HOOKDECK_TELEGRAM_URL || '',
  hookdeckVonageUrl: process.env.HOOKDECK_VONAGE_URL || '',
  
  // Vonage WhatsApp
  vonageApiKey: process.env.VONAGE_API_KEY || '',
  vonageApiSecret: process.env.VONAGE_API_SECRET || '',
  vonageWhatsAppFrom: process.env.VONAGE_WHATSAPP_FROM || '14157386102', // Default sandbox number
  vonageWhatsAppTo: process.env.VONAGE_WHATSAPP_TO || '',
  
  // Admin Notifications
  enableWhatsAppAdmin: process.env.ENABLE_WHATSAPP_ADMIN === 'true',
  enableDiscordAdmin: process.env.ENABLE_DISCORD_ADMIN === 'true',
  
  // Discord Admin
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL || '',
  
  // Discord Bot Gateway
  discordBotToken: process.env.DISCORD_BOT_TOKEN || '',
  discordApplicationId: process.env.DISCORD_APPLICATION_ID || '',
  discordPublicKey: process.env.DISCORD_PUBLIC_KEY || '',
  
  // Provider Selection
  sttProvider: (process.env.STT_PROVIDER || 'openai') as STTProvider,
  llmProvider: (process.env.LLM_PROVIDER || 'openai') as LLMProvider,
  ttsProvider: (process.env.TTS_PROVIDER || 'openai') as TTSProvider,
  imageProvider: (process.env.IMAGE_PROVIDER || 'huggingface') as ImageProvider,
  
  // Ports
  gatewayPort: parseInt(process.env.PORT_GATEWAY || '3020'),
  
  // Paths
  sandboxRoot: './sandbox',
  artifactsRoot: './artifacts',
  
  // Model Settings
  llmModel: process.env.LLM_MODEL || 'gpt-4o',
  llmTemperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
  imageModel: process.env.IMAGE_MODEL || 'playgroundai/playground-v2.5-1024px-aesthetic',
  
  // Runner Settings
  runnerTimeout: parseInt(process.env.RUNNER_TIMEOUT || '30000'), // 30s
  screenshotDelay: parseInt(process.env.SCREENSHOT_DELAY || '2000'), // 2s
  
  // Lingo Translation Settings
  lingoDefaultTarget: process.env.LINGO_DEFAULT_TARGET || 'en',
  lingoStyle: process.env.LINGO_STYLE || 'friendly',
} as const

export function validateConfig(): boolean {
  // Check that we have at least one valid provider configured
  const sttValid = 
    (config.sttProvider === 'openai' && config.openaiApiKey) ||
    (config.sttProvider === 'elevenlabs' && config.elevenlabsApiKey)
  
  const llmValid =
    (config.llmProvider === 'openai' && config.openaiApiKey) ||
    (config.llmProvider === 'anthropic' && config.anthropicApiKey) ||
    (config.llmProvider === 'groq' && config.groqApiKey)
  
  if (!config.telegramBotToken) {
    console.error('❌ Missing required: TELEGRAM_BOT_TOKEN')
    return false
  }
  
  if (!sttValid) {
    console.error(`❌ Missing API key for STT provider: ${config.sttProvider}`)
    return false
  }
  
  if (!llmValid) {
    console.error(`❌ Missing API key for LLM provider: ${config.llmProvider}`)
    return false
  }
  
  return true
}

