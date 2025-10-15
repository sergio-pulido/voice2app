/**
 * Google Gemini Image Service (Imagen 3)
 * Uses Google's Imagen 3 model via Vertex AI for high-quality image generation
 * 
 * Note: This uses the Vertex AI API which requires:
 * 1. A Google Cloud Project with Vertex AI API enabled
 * 2. A service account with Vertex AI permissions OR an API key
 * 
 * For simplicity, we support both:
 * - Simple API key auth (if available in your region)
 * - OAuth2 / Service Account (more complex but more reliable)
 */

import { config } from '../../shared/config'
import { logger } from '../../shared/logger'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

/**
 * Generate an image using Google's Imagen 3 model
 * Returns the file path where the image was saved
 */
export async function generateImageWithGemini(prompt: string): Promise<string> {
  try {
    logger.info(`🎨 Generating image with Google Imagen 3: "${prompt.substring(0, 50)}..."`)
    
    if (!config.geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }
    
    // Try using the Gemini Flash model's image generation capability
    // This uses the standard Gemini API which is simpler than Vertex AI
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${config.geminiApiKey}`
    
    logger.debug('Calling Gemini API for image generation...')
    
    // Gemini 2.0 Flash can generate images through the generateContent endpoint
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Generate a high-quality image based on this description: ${prompt}`
          }]
        }],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 2048
        }
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      logger.error('Gemini API error response:', errorText)
      
      // Check if it's because image generation is not supported
      if (errorText.includes('image') || errorText.includes('multimodal') || errorText.includes('not supported')) {
        throw new Error('IMAGE_GEN_NOT_SUPPORTED: Gemini API does not support direct image generation yet. Please use IMAGE_PROVIDER=huggingface as an alternative.')
      }
      
      throw new Error(`Gemini API error (${response.status}): ${errorText}`)
    }
    
    const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ inline_data?: { mime_type?: string; data?: string } }> } }> }
    
    // Check if we got an image in the response
    if (data.candidates && data.candidates[0]?.content?.parts) {
      const parts = data.candidates[0].content.parts
      
      // Look for inline_data with image mime type
      for (const part of parts) {
        if (part.inline_data && part.inline_data.mime_type?.startsWith('image/')) {
          const imageData = part.inline_data.data
          const buffer = Buffer.from(imageData || '', 'base64')
          
          // Save to artifacts directory
          const timestamp = Date.now()
          const ext = part.inline_data.mime_type.split('/')[1] || 'png'
          const filename = `image_${timestamp}.${ext}`
          const artifactsDir = join(process.cwd(), 'artifacts')
          
          await mkdir(artifactsDir, { recursive: true })
          
          const filepath = join(artifactsDir, filename)
          await writeFile(filepath, buffer)
          
          logger.success(`✅ Image generated with Gemini and saved: ${filename} (${Math.round(buffer.length / 1024)}KB)`)
          
          return filepath
        }
      }
    }
    
    logger.error('Unexpected Gemini response format:', JSON.stringify(data, null, 2))
    throw new Error('IMAGE_GEN_NOT_SUPPORTED: Gemini API response did not contain image data. This feature may not be available yet. Please use IMAGE_PROVIDER=huggingface as an alternative.')
    
  } catch (error: any) {
    const errorMessage = error?.message || error?.toString() || 'Unknown error'
    
    logger.error('Gemini image generation error:', errorMessage)
    
    // If image generation is not supported, provide helpful message
    if (errorMessage.includes('IMAGE_GEN_NOT_SUPPORTED')) {
      throw error // Re-throw with the same message
    }
    
    // Create a more descriptive error
    const detailedError = new Error(
      errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('401') || errorMessage.includes('invalid_api_key') ?
        'Invalid Gemini API key. Get one from https://ai.google.dev' :
      errorMessage.includes('QUOTA_EXCEEDED') || errorMessage.includes('429') || errorMessage.includes('quota') ?
        'Gemini API quota exceeded. Please wait a moment or check your billing.' :
      errorMessage.includes('PERMISSION_DENIED') || errorMessage.includes('403') ?
        'Permission denied. Make sure your API key has proper permissions.' :
        `Gemini API error: ${errorMessage}`
    )
    
    throw detailedError
  }
}

/**
 * Generate image with retry logic
 */
export async function generateImageWithGeminiRetry(
  prompt: string,
  maxRetries: number = 2
): Promise<string | null> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generateImageWithGemini(prompt)
    } catch (error: any) {
      lastError = error
      const errorMsg = error?.message || 'Unknown error'
      logger.warn(`Gemini image generation failed (attempt ${attempt}/${maxRetries}): ${errorMsg}`)
      
      if (attempt < maxRetries) {
        const delay = 3000 // 3 seconds
        logger.info(`Retrying in ${delay / 1000}s...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  logger.error(`Failed to generate image with Gemini after ${maxRetries} attempts`)
  logger.error(`Last error: ${lastError?.message}`)
  return null
}

