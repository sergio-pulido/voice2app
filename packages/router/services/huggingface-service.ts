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
    // Use HuggingFace's public inference API (works with your updated token)
    hfClient = new HfInference(config.huggingfaceApiKey)
  }
  return hfClient
}

/**
 * Generate an image from text prompt
 * Returns the file path where the image was saved
 */
export async function generateImage(prompt: string, model?: string): Promise<string> {
  try {
    logger.info(`🎨 Generating image: "${prompt.substring(0, 50)}..."`)
    
    const client = getClient()
    
    // Use provided model or fall back to config
    const modelToUse = model || config.imageModel
    
    logger.info(`Using HuggingFace model: ${modelToUse}`)
    
    const response = await client.textToImage({
      model: modelToUse,
      inputs: prompt,
      parameters: {
        negative_prompt: 'blurry, bad quality, distorted, ugly, watermark, text',
        num_inference_steps: 30,
        guidance_scale: 7.5
      }
    })
    
    // Convert response to buffer
    const buffer = typeof response === 'string' 
      ? Buffer.from(response, 'base64')
      : Buffer.from(await (response as Blob).arrayBuffer())
    
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
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Unknown error'
    const errorDetails = error?.response?.data || error?.data || ''
    
    logger.error('HuggingFace image generation error:', errorMessage)
    if (errorDetails) {
      logger.error('Error details:', errorDetails)
    }
    
    // Create a more descriptive error
    const detailedError = new Error(
      errorMessage.includes('Model') ? 
        'HuggingFace model is loading. Please try again in 20-30 seconds.' :
      errorMessage.includes('rate limit') || errorMessage.includes('429') ?
        'HuggingFace API rate limit reached. Please wait a moment.' :
      errorMessage.includes('401') || errorMessage.includes('403') ?
        'Invalid HuggingFace API key. Please check HUGGINGFACE_API_KEY in .env' :
        `HuggingFace API error: ${errorMessage}`
    )
    
    throw detailedError
  }
}

/**
 * Generate image with retry logic (smart retry - skips retries for quota errors)
 */
export async function generateImageWithRetry(
  prompt: string,
  maxRetries: number = 3,
  model?: string
): Promise<string | null> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generateImage(prompt, model)
    } catch (error: any) {
      lastError = error
      const errorMsg = error?.message || 'Unknown error'
      logger.warn(`Image generation failed (attempt ${attempt}/${maxRetries}): ${errorMsg}`)
      
      // Don't retry if it's a quota/credit error - fail fast
      if (errorMsg.includes('quota') || errorMsg.includes('credits') || errorMsg.includes('exceeded')) {
        logger.warn('⚠️  Quota/credit error detected - skipping retries')
        break
      }
      
      if (attempt < maxRetries) {
        // Longer delays for model loading
        const delay = attempt === 1 ? 5000 : 10000 // 5s, 10s, 15s
        logger.info(`Retrying in ${delay / 1000}s...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  logger.error(`Failed to generate image after attempts`)
  logger.error(`Last error: ${lastError?.message}`)
  return null
}

/**
 * Generate image with multiple model fallbacks (smart fallback - detects quota errors)
 */
export async function generateImageWithModelFallbacks(
  prompt: string,
  maxRetries: number = 2
): Promise<string | null> {
  // List of models to try in order of preference
  const fallbackModels = [
    config.imageModel, // Primary model from config
    'stabilityai/stable-diffusion-xl-base-1.0', // Reliable fallback
    'stabilityai/stable-diffusion-3-medium-diffusers', // Newer model
    'black-forest-labs/FLUX.1-dev' // High quality alternative
  ]
  
  // Remove duplicates while preserving order
  const uniqueModels = [...new Set(fallbackModels)]
  
  let quotaError = false
  
  for (const model of uniqueModels) {
    logger.info(`🎨 Trying model: ${model}`)
    
    try {
      const result = await generateImageWithRetry(prompt, maxRetries, model)
      if (result) {
        logger.success(`✅ Success with model: ${model}`)
        return result
      }
    } catch (error: any) {
      const errorMsg = error?.message || ''
      logger.warn(`❌ Model ${model} failed: ${errorMsg}`)
      
      // If it's a quota error, no point trying other models - they'll all fail
      if (errorMsg.includes('quota') || errorMsg.includes('credits') || errorMsg.includes('exceeded')) {
        logger.warn('⚠️  Quota error detected - skipping remaining HuggingFace models')
        quotaError = true
        break
      }
    }
  }
  
  if (quotaError) {
    logger.error(`❌ HuggingFace quota exceeded for prompt: ${prompt}`)
  } else {
    logger.error(`❌ All HuggingFace models failed for prompt: ${prompt}`)
  }
  return null
}

