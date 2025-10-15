/**
 * OpenAI DALL-E Image Generation Service
 */

import { logger, config } from '../../shared'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Generate image using OpenAI DALL-E 3
 */
export async function generateImageWithOpenAI(prompt: string): Promise<string> {
  try {
    logger.info(`🎨 Generating image with OpenAI DALL-E 3: "${prompt.substring(0, 50)}..."`)
    
    if (!config.openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured')
    }
    
    const endpoint = 'https://api.openai.com/v1/images/generations'
    
    logger.debug('Calling OpenAI API for image generation...')
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard', // or 'hd' for higher quality (more expensive)
        response_format: 'url'
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      logger.error('OpenAI API error response:', errorText)
      throw new Error(`OpenAI API error (${response.status}): ${errorText}`)
    }
    
    const data = await response.json() as { data?: Array<{ url?: string }> }
    
    // Check if we got an image URL in the response
    if (!data.data || data.data.length === 0) {
      throw new Error('No image returned from OpenAI DALL-E')
    }
    
    const imageUrl = data.data[0].url
    
    // Download the image
    logger.info(`📥 Downloading image from OpenAI...`)
    const imageResponse = await fetch(imageUrl || '')
    
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
    
    logger.error('OpenAI image generation error:', errorMessage)
    
    // Create a more descriptive error
    const detailedError = new Error(
      errorMessage.includes('API_KEY') || errorMessage.includes('401') || errorMessage.includes('invalid_api_key') || errorMessage.includes('Incorrect API key') ?
        'Invalid OpenAI API key. Get one from https://platform.openai.com/api-keys' :
      errorMessage.includes('quota') || errorMessage.includes('429') || errorMessage.includes('rate_limit') ?
        'OpenAI API quota exceeded. Please wait a moment or check your billing.' :
      errorMessage.includes('403') || errorMessage.includes('billing') ?
        'OpenAI billing issue. Make sure you have credits available.' :
        `OpenAI API error: ${errorMessage}`
    )
    
    throw detailedError
  }
}

/**
 * Generate image with retry logic
 */
export async function generateImageWithOpenAIRetry(
  prompt: string,
  maxRetries: number = 2
): Promise<string | null> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generateImageWithOpenAI(prompt)
    } catch (error: any) {
      lastError = error
      const errorMsg = error?.message || 'Unknown error'
      logger.warn(`OpenAI image generation failed (attempt ${attempt}/${maxRetries}): ${errorMsg}`)
      
      // Don't retry if it's a quota/credit error
      if (errorMsg.includes('quota') || errorMsg.includes('credits') || errorMsg.includes('exceeded') || errorMsg.includes('billing')) {
        logger.warn('⚠️  OpenAI quota/billing error detected - skipping retries')
        break
      }
      
      if (attempt < maxRetries) {
        const delay = 3000 // 3 seconds
        logger.info(`Retrying in ${delay / 1000}s...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  logger.error(`Failed to generate image with OpenAI after ${maxRetries} attempts`)
  logger.error(`Last error: ${lastError?.message}`)
  return null
}

