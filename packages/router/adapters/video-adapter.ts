/**
 * Video Generation Adapter
 * Uses fal.ai Fabric 1.0 to create image-to-video animations
 */

import { logger, config } from '../../shared'
import { translate } from '../services/free-translation-service'
import { generateVideoWithFabricRetry } from '../services/fal-video-service'
import { generateImageWithGeminiRetry } from '../services/gemini-image-service'
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
      
      // For Fabric 1.0, we need both an image and audio
      // Since we typically get voice input, we'll generate an image from the prompt
      // and use the audio file if available
      
      // Step 1: Generate an image from the prompt
      logger.info('🎨 Generating image for video...')
      const imagePath = await generateImageWithGeminiRetry(prompt)
      
      if (!imagePath) {
        throw new Error('Failed to generate image for video')
      }
      
      // Step 2: Check if we have audio input
      // Note: You may need to store/provide the audio URL from the voice message
      // For now, we'll return a message explaining the limitation
      
      if (!input.audioUrl) {
        logger.warn('No audio URL provided - video generation requires audio')
        
        let response = 
          `🎬 **Video Generation**\n\n` +
          `I generated an image for your prompt: "${prompt}"\n\n` +
          `However, to create a talking video with fal.ai Fabric 1.0, I need:\n` +
          `• ✅ An image (generated)\n` +
          `• ❌ An audio file (not available)\n\n` +
          `💡 The image has been saved. In a future version, we'll combine your voice with the image!`
        
        // Translate if needed
        const targetLang = input.detectedLang || 'en'
        if (targetLang !== 'en') {
          response = await this.translateResponse(response, targetLang)
        }
        
        return {
          summaryText: response,
          ttsText: `I generated an image for your video prompt, but need audio to complete the video.`,
          imagePath,
          metadata: {
            category: 'video_gen',
            processingTime: Date.now() - startTime,
            status: 'partial',
            prompt,
            imagePath
          }
        }
      }
      
      // Step 3: Generate video with fal.ai Fabric 1.0
      logger.info('🎬 Generating video with fal.ai Fabric 1.0...')
      const videoPath = await generateVideoWithFabricRetry({
        imageUrl: imagePath,
        audioUrl: input.audioUrl,
        resolution: '720p'
      })
      
      if (!videoPath) {
        throw new Error('Failed to generate video with fal.ai')
      }
      
      // Success!
      let response = 
        `🎬 **Video Generated Successfully!**\n\n` +
        `Prompt: "${prompt}"\n\n` +
        `Your talking video has been created using fal.ai Fabric 1.0.\n` +
        `The video combines your generated image with audio to create an animated result.`
      
      // Translate if needed
      const targetLang = input.detectedLang || 'en'
      if (targetLang !== 'en') {
        response = await this.translateResponse(response, targetLang)
      }
      
      const processingTime = Date.now() - startTime
      
      return {
        summaryText: response,
        ttsText: `Your video has been generated successfully!`,
        imagePath,
        videoPath,
        metadata: {
          category: 'video_gen',
          processingTime,
          status: 'success',
          prompt,
          imagePath,
          videoPath
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

