/**
 * fal.ai Image Generation Service
 * Using FLUX models for high-quality image generation
 */

import { logger, config } from '../../shared'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Generate image using fal.ai FLUX model
 */
export async function generateImageWithFal(prompt: string): Promise<string> {
  try {
    logger.info(`🎨 Generating image with fal.ai FLUX: "${prompt.substring(0, 50)}..."`)
    
    if (!config.falApiKey) {
      throw new Error('FAL_API_KEY not configured')
    }
    
    // Use FLUX.1 schnell for fast generation
    const endpoint = 'https://queue.fal.run/fal-ai/flux/schnell'
    
    logger.debug('Calling fal.ai API for image generation...')
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${config.falApiKey}`
      },
      body: JSON.stringify({
        prompt: prompt,
        image_size: 'square_hd', // 1024x1024
        num_inference_steps: 4, // Fast generation
        num_images: 1,
        enable_safety_checker: true
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      logger.error('fal.ai API error response:', errorText)
      throw new Error(`fal.ai API error (${response.status}): ${errorText}`)
    }
    
    const data = await response.json()
    
    // Check if we got an image URL in the response
    if (!data.images || data.images.length === 0) {
      throw new Error('No image returned from fal.ai')
    }
    
    const imageUrl = data.images[0].url
    
    // Download the image
    logger.info(`📥 Downloading image from fal.ai...`)
    const imageResponse = await fetch(imageUrl)
    
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.statusText}`)
    }
    
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())
    
    // Save to artifacts folder
    const artifactsDir = config.artifactsRoot || './artifacts'
    if (!fs.existsSync(artifactsDir)) {
      fs.mkdirSync(artifactsDir, { recursive: true })
    }
    
    const filename = `image_${Date.now()}.png`
    const filepath = path.join(artifactsDir, filename)
    
    fs.writeFileSync(filepath, imageBuffer)
    logger.success(`✅ Image saved: ${filepath} (${(imageBuffer.length / 1024).toFixed(1)} KB)`)
    
    return filepath
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Unknown error'
    
    logger.error('fal.ai image generation error:', errorMessage)
    
    // Create a more descriptive error
    const detailedError = new Error(
      errorMessage.includes('API_KEY') || errorMessage.includes('401') || errorMessage.includes('invalid_api_key') ?
        'Invalid fal.ai API key. Get one from https://fal.ai' :
      errorMessage.includes('QUOTA_EXCEEDED') || errorMessage.includes('429') || errorMessage.includes('quota') ?
        'fal.ai API quota exceeded. Please wait a moment or check your billing.' :
      errorMessage.includes('403') ?
        'Permission denied. Make sure your fal.ai API key has proper permissions.' :
        `fal.ai API error: ${errorMessage}`
    )
    
    throw detailedError
  }
}

/**
 * Generate image with retry logic
 */
export async function generateImageWithFalRetry(
  prompt: string,
  maxRetries: number = 2
): Promise<string | null> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generateImageWithFal(prompt)
    } catch (error: any) {
      lastError = error
      const errorMsg = error?.message || 'Unknown error'
      logger.warn(`fal.ai image generation failed (attempt ${attempt}/${maxRetries}): ${errorMsg}`)
      
      // Don't retry if it's a quota/credit error
      if (errorMsg.includes('quota') || errorMsg.includes('credits') || errorMsg.includes('exceeded')) {
        logger.warn('⚠️  fal.ai quota error detected - skipping retries')
        break
      }
      
      if (attempt < maxRetries) {
        const delay = 3000 // 3 seconds
        logger.info(`Retrying in ${delay / 1000}s...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  logger.error(`Failed to generate image with fal.ai after ${maxRetries} attempts`)
  logger.error(`Last error: ${lastError?.message}`)
  return null
}

