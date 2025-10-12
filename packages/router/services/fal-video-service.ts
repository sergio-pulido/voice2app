/**
 * fal.ai Fabric 1.0 Video Service
 * Image-to-video API that turns any image into a talking video
 * https://fal.ai/models/veed/fabric-1.0
 */

import { fal } from '@fal-ai/client'
import { config } from '../../shared/config'
import { logger } from '../../shared/logger'
import { writeFile, mkdir, readFile } from 'fs/promises'
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
    
    logger.info(`🎬 Generating talking video with fal.ai Fabric 1.0...`)
    logger.debug(`Image: ${imageUrl.substring(0, 50)}...`)
    logger.debug(`Audio: ${audioUrl.substring(0, 50)}...`)
    logger.debug(`Resolution: ${resolution}`)
    
    if (!config.falApiKey) {
      throw new Error('FAL_API_KEY not configured')
    }
    
    // Configure fal.ai client
    fal.config({
      credentials: config.falApiKey
    })
    
    logger.debug('Submitting to fal.ai Fabric 1.0 model...')
    
    // For local files, we need to upload them first to fal storage (URLs are required)
    let imageUrlToUse = imageUrl
    let audioUrlToUse = audioUrl

    if (!imageUrl.startsWith('http')) {
      logger.debug('Uploading local image file to fal storage...')
      const imageBuffer = await readFile(imageUrl)
      const mimeType = imageUrl.endsWith('.png') ? 'image/png'
        : imageUrl.endsWith('.webp') ? 'image/webp'
        : 'image/jpeg'
      const imageBlob = new Blob([imageBuffer], { type: mimeType })
      imageUrlToUse = await fal.storage.upload(imageBlob)
      logger.debug(`Image uploaded to: ${imageUrlToUse}`)
    }

    if (!audioUrl.startsWith('http')) {
      logger.debug('Uploading local audio file to fal storage...')
      const audioBuffer = await readFile(audioUrl)
      const mimeType = audioUrl.endsWith('.mp3') ? 'audio/mpeg'
        : audioUrl.endsWith('.wav') ? 'audio/wav'
        : 'audio/ogg'
      const audioBlob = new Blob([audioBuffer], { type: mimeType })
      audioUrlToUse = await fal.storage.upload(audioBlob)
      logger.debug(`Audio uploaded to: ${audioUrlToUse}`)
    }

    const falVideoModel = 'veed/fabric-1.0'  // Talking video with audio support
    
    // Submit the job to fal.ai using Fabric 1.0 model (talking video)
    const result = await fal.subscribe(falVideoModel, {
      input: {
        image_url: imageUrlToUse,
        audio_url: audioUrlToUse,
        resolution: resolution
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          logger.info(`📹 Video generation in progress...`)
        }
      }
    })
    
    logger.debug('fal.ai response:', JSON.stringify(result, null, 2))
    
    // Extract video URL from response
    if (!result.data?.video?.url) {
      logger.error('Unexpected fal.ai response format:', JSON.stringify(result, null, 2))
      throw new Error('Invalid response format from fal.ai API')
    }
    
    const videoUrl = result.data.video.url
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

