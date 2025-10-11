/**
 * Image Generation Adapter - HuggingFace Integration
 */

import { logger, config } from '../../shared'
import { generateImageWithRetry } from '../services/huggingface-service'
import { translate } from '../services/free-translation-service'
import type { Adapter, AdapterInput, AdapterOutput } from '../types'

export class ImageAdapter implements Adapter {
  async run(input: AdapterInput): Promise<AdapterOutput> {
    logger.info('🎨 Running Image Generation adapter...')
    
    const startTime = Date.now()
    const prompt = String(input.transcription || input.text || '')
    
    try {
      // Check if HuggingFace is configured
      if (!config.huggingfaceApiKey) {
        return {
          summaryText: 
            `🎨 **Image Generation**\n\n` +
            `To generate images, you need to configure HuggingFace:\n\n` +
            `1. Get a free API key from huggingface.co\n` +
            `2. Add to .env: HUGGINGFACE_API_KEY=your_key\n` +
            `3. Restart the server\n\n` +
            `Then I'll be able to generate images from your descriptions!`,
          ttsText: `HuggingFace API key not configured. Add it to your environment to enable image generation.`,
          metadata: {
            category: 'image_gen',
            processingTime: Date.now() - startTime,
            status: 'partial'
          }
        }
      }
      
      logger.debug(`Image prompt: "${prompt}"`)
      
      // Generate image with HuggingFace
      const imagePath = await generateImageWithRetry(prompt)
      
      if (!imagePath) {
        throw new Error('Failed to generate image after retries')
      }
      
      const processingTime = Date.now() - startTime
      
      // Build response message
      let response = 
        `**Done!**\n\n` +
        `Prompt: "${prompt}"\n\n` +
        `Generated with: Stable Diffusion XL • ${(processingTime / 1000).toFixed(1)}s`
      
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
          model: 'stable-diffusion-xl-base-1.0'
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

