/**
 * fal.ai Fabric 1.0 Video Service
 * Image-to-video API that turns any image into a talking video
 * https://fal.ai/models/veed/fabric-1.0
 */

import { config } from '../../shared/config'
import { logger } from '../../shared/logger'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

interface FabricVideoOptions {
  imageUrl: string
  audioUrl: string
  resolution?: '480p' | '720p'
}

interface FabricVideoResponse {
  video: {
    url: string
    content_type: string
  }
}

/**
 * Generate a video using fal.ai Fabric 1.0 API
 * Requires an image URL and audio URL
 * Returns the local file path where the video was saved
 */
export async function generateVideoWithFabric(options: FabricVideoOptions): Promise<string> {
  try {
    const { imageUrl, audioUrl, resolution = '720p' } = options
    
    logger.info(`🎬 Generating video with fal.ai Fabric 1.0...`)
    logger.debug(`Image: ${imageUrl.substring(0, 50)}...`)
    logger.debug(`Audio: ${audioUrl.substring(0, 50)}...`)
    logger.debug(`Resolution: ${resolution}`)
    
    if (!config.falApiKey) {
      throw new Error('FAL_API_KEY not configured')
    }
    
    const endpoint = 'https://fal.run/fal-ai/veed/fabric-1.0'
    
    logger.debug('Calling fal.ai Fabric 1.0 API...')
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${config.falApiKey}`
      },
      body: JSON.stringify({
        image_url: imageUrl,
        audio_url: audioUrl,
        resolution: resolution
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      logger.error('fal.ai API error response:', errorText)
      throw new Error(`fal.ai API error (${response.status}): ${errorText}`)
    }
    
    const data: FabricVideoResponse = await response.json()
    
    // Extract video URL from response
    if (!data.video?.url) {
      logger.error('Unexpected fal.ai response format:', JSON.stringify(data, null, 2))
      throw new Error('Invalid response format from fal.ai API')
    }
    
    const videoUrl = data.video.url
    logger.info(`📹 Video generated, downloading from: ${videoUrl}`)
    
    // Download the video
    const videoResponse = await fetch(videoUrl)
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.status}`)
    }
    
    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer())
    
    // Save to artifacts directory
    const timestamp = Date.now()
    const filename = `video_${timestamp}.mp4`
    const artifactsDir = join(process.cwd(), 'artifacts')
    
    // Ensure artifacts directory exists
    await mkdir(artifactsDir, { recursive: true })
    
    const filepath = join(artifactsDir, filename)
    await writeFile(filepath, videoBuffer)
    
    logger.success(`✅ Video generated and saved: ${filename} (${Math.round(videoBuffer.length / 1024)}KB)`)
    
    return filepath
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Unknown error'
    
    logger.error('fal.ai video generation error:', errorMessage)
    
    // Create a more descriptive error
    const detailedError = new Error(
      errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('401') ?
        'Invalid fal.ai API key. Please check FAL_API_KEY in .env' :
      errorMessage.includes('QUOTA_EXCEEDED') || errorMessage.includes('429') ?
        'fal.ai API quota exceeded. Please wait a moment or check your billing.' :
      errorMessage.includes('PERMISSION_DENIED') || errorMessage.includes('403') ?
        'Permission denied. Make sure you have access to fal.ai Fabric 1.0 API.' :
      errorMessage.includes('MODEL_NOT_FOUND') || errorMessage.includes('404') ?
        'Fabric 1.0 model not found. Please check the API endpoint.' :
        `fal.ai API error: ${errorMessage}`
    )
    
    throw detailedError
  }
}

/**
 * Generate video with retry logic
 */
export async function generateVideoWithFabricRetry(
  options: FabricVideoOptions,
  maxRetries: number = 2
): Promise<string | null> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generateVideoWithFabric(options)
    } catch (error: any) {
      lastError = error
      const errorMsg = error?.message || 'Unknown error'
      logger.warn(`fal.ai video generation failed (attempt ${attempt}/${maxRetries}): ${errorMsg}`)
      
      if (attempt < maxRetries) {
        const delay = 5000 // 5 seconds (video generation may take longer)
        logger.info(`Retrying in ${delay / 1000}s...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  logger.error(`Failed to generate video with fal.ai after ${maxRetries} attempts`)
  logger.error(`Last error: ${lastError?.message}`)
  return null
}

