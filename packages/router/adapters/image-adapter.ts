/**
 * Image Generation Adapter - HuggingFace Integration
 */

import { logger, config } from '../../shared'
import { generateImageWithRetry } from '../services/huggingface-service'
import type { Adapter, AdapterInput, AdapterOutput } from '../types'

export class ImageAdapter implements Adapter {
  async run(input: AdapterInput): Promise<AdapterOutput> {
    logger.info('🎨 Running Image Generation adapter...')
    
    const startTime = Date.now()
    const prompt = input.transcription || input.text
    
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
      const response = 
        `🎨 **Image Generated!**\n\n` +
        `Prompt: "${prompt}"\n\n` +
        `Your AI-generated image is ready! ✨\n\n` +
        `Generated with: Stable Diffusion XL\n` +
        `Time: ${(processingTime / 1000).toFixed(1)}s`
      
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
      
      return {
        summaryText: 
          `❌ **Image Generation Failed**\n\n` +
          `Prompt: "${prompt}"\n\n` +
          `Error: ${errorMessage}\n\n` +
          `💡 This might be due to:\n` +
          `• HuggingFace API rate limits\n` +
          `• Model loading (try again in 30 seconds)\n` +
          `• Invalid prompt\n\n` +
          `Please try again or try a different prompt!`,
        metadata: {
          category: 'image_gen',
          processingTime: Date.now() - startTime,
          status: 'error'
        }
      }
    }
  }
}

export const imageAdapter = new ImageAdapter()

