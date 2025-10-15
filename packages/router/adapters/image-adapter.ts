/**
 * Image Generation Adapter - Multi-Provider Support
 * Supports: Google Gemini (Nano Banana / Imagen 3) and HuggingFace (Stable Diffusion XL)
 */

import { logger, config } from '../../shared'
import { generateImageWithRetry, generateImageWithModelFallbacks } from '../services/huggingface-service'
import { generateImageWithGeminiRetry } from '../services/gemini-image-service'
import { generateImageWithFalRetry } from '../services/fal-image-service'
import { generateImageWithOpenAIRetry } from '../services/openai-image-service'
import { translate } from '../services/free-translation-service'
import type { Adapter, AdapterInput, AdapterOutput } from '../types'

export class ImageAdapter implements Adapter {
  async run(input: AdapterInput): Promise<AdapterOutput> {
    logger.info('🎨 Running Image Generation adapter...')
    
    const startTime = Date.now()
    const prompt = String(input.transcription || input.text || '')
    const provider = config.imageProvider
    
    try {
      // Check if the selected provider is configured
      if (provider === 'gemini' && !config.geminiApiKey) {
        return {
          summaryText: 
            `🎨 **Image Generation**\n\n` +
            `To generate images with Google Gemini (Nano Banana), you need to:\n\n` +
            `1. Get a free API key from ai.google.dev\n` +
            `2. Add to .env: GEMINI_API_KEY=your_key\n` +
            `3. Restart the server\n\n` +
            `Alternatively, set IMAGE_PROVIDER=huggingface to use Stable Diffusion XL.`,
          ttsText: `Gemini API key not configured. Add it to your environment to enable image generation.`,
          metadata: {
            category: 'image_gen',
            processingTime: Date.now() - startTime,
            status: 'partial'
          }
        }
      }
      
      if (provider === 'huggingface' && !config.huggingfaceApiKey) {
        return {
          summaryText: 
            `🎨 **Image Generation**\n\n` +
            `To generate images with HuggingFace, you need to:\n\n` +
            `1. Get a free API key from huggingface.co\n` +
            `2. Add to .env: HUGGINGFACE_API_KEY=your_key\n` +
            `3. Restart the server\n\n` +
            `Alternatively, set IMAGE_PROVIDER=gemini to use Google's Nano Banana.`,
          ttsText: `HuggingFace API key not configured. Add it to your environment to enable image generation.`,
          metadata: {
            category: 'image_gen',
            processingTime: Date.now() - startTime,
            status: 'partial'
          }
        }
      }
      
      logger.debug(`Image prompt: "${prompt}"`)
      logger.info(`Using image provider: ${provider}`)
      
      // Smart fallback chain: HuggingFace → fal.ai → OpenAI → Gemini
      let imagePath: string | null = null
      let modelName: string = ''
      let modelId: string = ''
      let usedProvider = provider
      let fallbackUsed = false
      
      // Try primary provider first
      if (provider === 'gemini') {
        logger.info(`🎨 Trying primary: Google Gemini...`)
        imagePath = await generateImageWithGeminiRetry(prompt)
        if (imagePath) {
          modelName = 'Google Gemini (Imagen 3)'
          modelId = 'imagen-3.0'
        }
      } else {
        logger.info(`🎨 Trying primary: HuggingFace...`)
        imagePath = await generateImageWithModelFallbacks(prompt)
        if (imagePath) {
          const fullModelId = config.imageModel
          modelId = fullModelId
          
          // Extract friendly name from model ID
          if (fullModelId.includes('playground-v2.5')) {
            modelName = 'Playground v2.5'
          } else if (fullModelId.includes('flux')) {
            modelName = 'Flux.1'
          } else if (fullModelId.includes('sd3') || fullModelId.includes('stable-diffusion-3')) {
            modelName = 'Stable Diffusion 3'
          } else if (fullModelId.includes('sdxl') || fullModelId.includes('stable-diffusion-xl')) {
            modelName = 'Stable Diffusion XL'
          } else {
            const parts = fullModelId.split('/')
            modelName = parts[parts.length - 1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          }
        }
      }
      
      // Fallback chain: fal.ai → OpenAI → Gemini → HuggingFace
      if (!imagePath && config.falApiKey) {
        logger.info(`🔄 Primary failed, trying fal.ai...`)
        usedProvider = 'fal' as any
        fallbackUsed = true
        imagePath = await generateImageWithFalRetry(prompt)
        if (imagePath) {
          modelName = 'FLUX.1 Schnell (fal.ai)'
          modelId = 'flux-schnell-fal'
        }
      }
      
      if (!imagePath && config.openaiApiKey) {
        logger.info(`🔄 fal.ai failed, trying OpenAI DALL-E...`)
        usedProvider = 'openai' as any
        fallbackUsed = true
        imagePath = await generateImageWithOpenAIRetry(prompt)
        if (imagePath) {
          modelName = 'DALL-E 3 (OpenAI)'
          modelId = 'dall-e-3'
        }
      }
      
      if (!imagePath && config.geminiApiKey && provider !== 'gemini') {
        logger.info(`🔄 OpenAI failed, trying Gemini...`)
        usedProvider = 'gemini' as any
        fallbackUsed = true
        imagePath = await generateImageWithGeminiRetry(prompt)
        if (imagePath) {
          modelName = 'Google Gemini (Imagen 3)'
          modelId = 'imagen-3.0'
        }
      }
      
      if (!imagePath && config.huggingfaceApiKey && provider !== 'huggingface') {
        logger.info(`🔄 Gemini failed, trying HuggingFace as last resort...`)
        usedProvider = 'huggingface' as any
        fallbackUsed = true
        imagePath = await generateImageWithModelFallbacks(prompt)
        if (imagePath) {
          const fullModelId = config.imageModel
          modelId = fullModelId
          
          if (fullModelId.includes('playground-v2.5')) {
            modelName = 'Playground v2.5'
          } else if (fullModelId.includes('flux')) {
            modelName = 'Flux.1'
          } else if (fullModelId.includes('sd3') || fullModelId.includes('stable-diffusion-3')) {
            modelName = 'Stable Diffusion 3'
          } else if (fullModelId.includes('sdxl') || fullModelId.includes('stable-diffusion-xl')) {
            modelName = 'Stable Diffusion XL'
          } else {
            const parts = fullModelId.split('/')
            modelName = parts[parts.length - 1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          }
        }
      }
      
      if (!imagePath) {
        throw new Error('Failed to generate image after trying all available providers')
      }
      
      const processingTime = Date.now() - startTime
      
      // Build response message
      let response = 
        `**Done!**\n\n` +
        `Prompt: "${prompt}"\n\n` +
        `Generated with: ${modelName} • ${(processingTime / 1000).toFixed(1)}s`
      
      // Add fallback information if used
      if (fallbackUsed) {
        response += `\n\n🔄 *Used fallback provider due to primary provider issues*`
      }
      
      // Post-processing: Translate back to original language if needed
      const targetLang = input.detectedLang || 'en'
      if (targetLang !== 'en' && response.trim().length > 0) {
        logger.info(`🌐 Translating image response back to ${targetLang}...`)
        try {
          response = await translate(response, targetLang)
          logger.success(`✅ Image response translated to ${targetLang}`)
        } catch (error) {
          logger.warn('Image response translation failed, keeping English:', error)
        }
      }
      
      return {
        summaryText: response,
        ttsText: `Image generated successfully for: ${prompt.substring(0, 50)}`,
        attachments: [imagePath],
        metadata: {
          category: 'image_gen',
          processingTime,
          status: 'success',
          prompt,
          provider,
          model: modelId
        }
      }
    } catch (error) {
      logger.error('Image adapter error:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      let userMessage = `❌ **Image Generation Failed**\n\n`
      userMessage += `Prompt: "${prompt}"\n\n`
      
      // Provide specific guidance based on error type
      if (errorMessage.includes('model is loading') || errorMessage.includes('Model')) {
        userMessage += `⏳ The AI model is warming up (cold start).\n\n`
        userMessage += `💡 **Please wait 20-30 seconds and try again.**\n\n`
        userMessage += `This happens when the model hasn't been used recently.`
      } else if (errorMessage.includes('rate limit') || errorMessage.includes('quota') || errorMessage.includes('credits')) {
        userMessage += `⏱️  API rate limit or quota exceeded.\n\n`
        userMessage += `💡 **Solutions:**\n`
        userMessage += `• Wait a few minutes and try again\n`
        userMessage += `• Try switching providers (set IMAGE_PROVIDER=gemini or huggingface)\n`
        userMessage += `• Check your API key limits\n`
        if (errorMessage.includes('HuggingFace')) {
          userMessage += `• Get more HuggingFace credits: https://huggingface.co/settings/billing`
        }
      } else if (errorMessage.includes('API key') || errorMessage.includes('401') || errorMessage.includes('403')) {
        userMessage += `🔑 API key issue.\n\n`
        userMessage += `💡 **Check your API keys:**\n`
        if (provider === 'huggingface') {
          userMessage += `• HUGGINGFACE_API_KEY in .env file\n`
          userMessage += `• Get free key: https://huggingface.co/settings/tokens`
        } else {
          userMessage += `• GEMINI_API_KEY in .env file\n`
          userMessage += `• Get free key: https://ai.google.dev`
        }
      } else if (errorMessage.includes('all available providers')) {
        userMessage += `🔄 All image generation providers failed.\n\n`
        userMessage += `💡 **Try these solutions:**\n`
        userMessage += `• Wait 5-10 minutes and try again\n`
        userMessage += `• Check your API keys are valid\n`
        userMessage += `• Try a simpler prompt\n`
        userMessage += `• Both providers may be experiencing issues`
      } else {
        userMessage += `Error: ${errorMessage}\n\n`
        userMessage += `💡 **Common solutions:**\n`
        userMessage += `• Wait 30 seconds (model may be loading)\n`
        userMessage += `• Try a simpler prompt\n`
        userMessage += `• Check your API keys\n`
        userMessage += `• Try switching providers\n`
        userMessage += `• Try again later if services are down`
      }
      
      return {
        summaryText: userMessage,
        ttsText: `Image generation failed. ${errorMessage.includes('loading') ? 'Model is loading, try again in 30 seconds' : 'Please try again'}`,
        metadata: {
          category: 'image_gen',
          processingTime: Date.now() - startTime,
          status: 'error',
          error: errorMessage
        }
      }
    }
  }
}

export const imageAdapter = new ImageAdapter()

