/**
 * Video Generation Adapter
 * Uses fal.ai Fabric 1.0 to create image-to-video animations
 */

import { logger, config } from '../../shared'
import { translate } from '../services/free-translation-service'
import { startVideoSession } from '../../shared/video-state-manager'
import type { Adapter, AdapterInput, AdapterOutput } from '../types'

export class VideoAdapter implements Adapter {
  async run(input: AdapterInput): Promise<AdapterOutput> {
    logger.info('🎬 Running Video Generation adapter...')
    
    const startTime = Date.now()
    const prompt = String(input.transcription || input.text || '')
    
    try {
      // Check if fal.ai API key is configured
      if (!config.falApiKey) {
        logger.warn('FAL_API_KEY not configured')
        return this.getUnconfiguredResponse(startTime, prompt, input.detectedLang)
      }
      
      logger.debug(`Video prompt: "${prompt}"`)
      
      // Start a new video generation session (3-step conversational flow)
      logger.info(`🎬 Starting 3-step video generation for user ${input.userId}`)
      startVideoSession(input.userId, prompt)
      
      // Ask user for image (photo or text description)
      let response = 
        `🎬 **Let's Create a Video!** (3-Step Process)\n\n` +
        `📋 Your request: "${prompt}"\n\n` +
        `**Step 1/3:** Please provide an image for your video.\n\n` +
        `You can either:\n` +
        `• 📸 **Send a photo** - Upload an image from your gallery\n` +
        `• 📝 **Describe it** - Send a text description and I'll generate an image\n\n` +
        `💡 Example: "A professional presenter in a suit" or send a photo of yourself`
      
      // Translate if needed
      const targetLang = input.detectedLang || 'en'
      if (targetLang !== 'en') {
        response = await this.translateResponse(response, targetLang)
      }
      
      const processingTime = Date.now() - startTime
      
      return {
        summaryText: response,
        ttsText: `Let's create a video! First, send me a photo or describe the image you want.`,
        metadata: {
          category: 'video_gen',
          processingTime,
          status: 'partial',
          prompt
        }
      }
    } catch (error) {
      logger.error('Video adapter error:', error)
      
      return {
        summaryText: `❌ Video generation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: {
          category: 'video_gen',
          processingTime: Date.now() - startTime,
          status: 'error'
        }
      }
    }
  }
  
  private async translateResponse(text: string, targetLang: string): Promise<string> {
    logger.info(`🌐 Translating video response back to ${targetLang}...`)
    try {
      const translated = await translate(text, targetLang)
      logger.success(`✅ Video response translated to ${targetLang}`)
      return translated
    } catch (error) {
      logger.warn('Video response translation failed, keeping English:', error)
      return text
    }
  }
  
  private getUnconfiguredResponse(startTime: number, prompt: string, detectedLang?: string): AdapterOutput {
    let response = 
      `🎬 **Video Generation (Not Configured)**\n\n` +
      `To use fal.ai Fabric 1.0 video generation, you need to:\n\n` +
      `1. Sign up at https://fal.ai\n` +
      `2. Get your API key\n` +
      `3. Add FAL_API_KEY to your .env file\n\n` +
      `Fabric 1.0 creates talking videos by combining images with audio.\n` +
      `Pricing: 480p - $0.08/sec, 720p - $0.15/sec`
    
    return {
      summaryText: response,
      ttsText: `Video generation requires fal.ai API key to be configured.`,
      metadata: {
        category: 'video_gen',
        processingTime: Date.now() - startTime,
        status: 'unconfigured',
        prompt
      }
    }
  }
}

export const videoAdapter = new VideoAdapter()

