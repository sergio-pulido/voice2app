#!/usr/bin/env bun

/**
 * Test script for improved image generation with fallbacks
 */

import { config } from '../packages/shared'
import { generateImageWithModelFallbacks } from '../packages/router/services/huggingface-service'
import { generateImageWithGeminiRetry } from '../packages/router/services/gemini-image-service'

async function testImageGeneration() {
  console.log('🎨 Testing Image Generation with Fallbacks\n')
  
  // Test prompt
  const prompt = "A beautiful sunset over mountains with a lake reflection"
  
  console.log(`📝 Prompt: "${prompt}"`)
  console.log(`🔧 Current provider: ${config.imageProvider}`)
  console.log(`🤖 Current model: ${config.imageModel}`)
  console.log(`🔑 HuggingFace API key: ${config.huggingfaceApiKey ? '✅ Configured' : '❌ Missing'}`)
  console.log(`🔑 Gemini API key: ${config.geminiApiKey ? '✅ Configured' : '❌ Missing'}\n`)
  
  try {
    console.log('🚀 Testing HuggingFace with model fallbacks...')
    const hfResult = await generateImageWithModelFallbacks(prompt, 1)
    
    if (hfResult) {
      console.log(`✅ HuggingFace success: ${hfResult}`)
    } else {
      console.log('❌ HuggingFace failed with all models')
    }
  } catch (error) {
    console.log(`❌ HuggingFace error: ${error}`)
  }
  
  if (config.geminiApiKey) {
    try {
      console.log('\n🚀 Testing Gemini fallback...')
      const geminiResult = await generateImageWithGeminiRetry(prompt, 1)
      
      if (geminiResult) {
        console.log(`✅ Gemini success: ${geminiResult}`)
      } else {
        console.log('❌ Gemini failed')
      }
    } catch (error) {
      console.log(`❌ Gemini error: ${error}`)
    }
  }
  
  console.log('\n🎯 Test completed!')
}

// Run the test
testImageGeneration().catch(console.error)
