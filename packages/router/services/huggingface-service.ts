/**
 * HuggingFace Service: Image generation
 */

import { HfInference } from '@huggingface/inference'
import { config } from '../../shared/config'
import { logger } from '../../shared/logger'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

let hfClient: HfInference | null = null

/**
 * Get or create HuggingFace client
 */
function getClient(): HfInference {
  if (!hfClient) {
    if (!config.huggingfaceApiKey) {
      throw new Error('HUGGINGFACE_API_KEY not configured')
    }
    hfClient = new HfInference(config.huggingfaceApiKey)
  }
  return hfClient
}

/**
 * Generate an image from text prompt
 * Returns the file path where the image was saved
 */
export async function generateImage(prompt: string): Promise<string> {
  try {
    logger.info(`🎨 Generating image: "${prompt.substring(0, 50)}..."`)
    
    const client = getClient()
    
    // Use Stable Diffusion XL for high-quality images
    const model = 'stabilityai/stable-diffusion-xl-base-1.0'
    
    logger.debug(`Using model: ${model}`)
    
    const response = await client.textToImage({
      model,
      inputs: prompt,
      parameters: {
        negative_prompt: 'blurry, bad quality, distorted, ugly',
        num_inference_steps: 30,
        guidance_scale: 7.5
      }
    })
    
    // Convert blob to buffer
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Save to artifacts directory
    const timestamp = Date.now()
    const filename = `image_${timestamp}.png`
    const artifactsDir = join(process.cwd(), 'artifacts')
    
    // Ensure artifacts directory exists
    await mkdir(artifactsDir, { recursive: true })
    
    const filepath = join(artifactsDir, filename)
    await writeFile(filepath, buffer)
    
    logger.success(`Image generated and saved: ${filename} (${Math.round(buffer.length / 1024)}KB)`)
    
    return filepath
  } catch (error) {
    logger.error('HuggingFace image generation error:', error)
    throw error
  }
}

/**
 * Generate image with retry logic
 */
export async function generateImageWithRetry(
  prompt: string,
  maxRetries: number = 2
): Promise<string | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generateImage(prompt)
    } catch (error) {
      logger.warn(`Image generation failed (attempt ${attempt}/${maxRetries})`)
      
      if (attempt < maxRetries) {
        const delay = 2000 * attempt
        logger.info(`Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  logger.error(`Failed to generate image after ${maxRetries} attempts`)
  return null
}

