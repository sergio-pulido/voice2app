/**
 * Image Generation Adapter - Multi-Provider Support
 * Supports: Google Gemini (Nano Banana / Imagen 3) and HuggingFace (Stable Diffusion XL)
 */

import { logger, config } from '../../shared'
import { generateImageWithRetry } from '../services/huggingface-service'
import { generateImageWithGeminiRetry } from '../services/gemini-image-service'
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
      
      // Generate image with selected provider
      let imagePath: string | null
      let modelName: string
      let modelId: string
      
      if (provider === 'gemini') {
        imagePath = await generateImageWithGeminiRetry(prompt)
        modelName = 'Google Gemini (Imagen 3)'
        modelId = 'imagen-3.0'
      } else {
        imagePath = await generateImageWithRetry(prompt)
        // Get model name from config and make it display-friendly
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
          // Fallback: extract last part of model ID
          const parts = fullModelId.split('/')
          modelName = parts[parts.length - 1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        }
      }
      
      if (!imagePath) {
        throw new Error('Failed to generate image after retries')
      }
      
      const processingTime = Date.now() - startTime
      
      // Build response message
      let response = 
        `**Done!**\n\n` +
        `Prompt: "${prompt}"\n\n` +
        `Generated with: ${modelName} • ${(processingTime / 1000).toFixed(1)}s`
      
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
      } else if (errorMessage.includes('rate limit')) {
        userMessage += `⏱️  API rate limit reached.\n\n`
        userMessage += `💡 **Please wait a few minutes and try again.**`
      } else if (errorMessage.includes('API key') || errorMessage.includes('401') || errorMessage.includes('403')) {
        userMessage += `🔑 API key issue.\n\n`
        userMessage += `💡 Please check HUGGINGFACE_API_KEY in your .env file.\n`
        userMessage += `Get a free key from: https://huggingface.co`
      } else {
        userMessage += `Error: ${errorMessage}\n\n`
        userMessage += `💡 Common solutions:\n`
        userMessage += `• Wait 30 seconds (model may be loading)\n`
        userMessage += `• Try a simpler prompt\n`
        userMessage += `• Check your HuggingFace API key\n`
        userMessage += `• Try again later if HF is having issues`
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

