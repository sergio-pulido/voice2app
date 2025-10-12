/**
 * Test fal.ai to find the correct Fabric model name
 */

import { config } from '../packages/shared/config'

async function testFalModels() {
  console.log('🔍 Searching for Fabric 1.0 model on fal.ai...')
  
  // Common model name patterns for Fabric/video generation
  const modelNames = [
    'fabric',
    'fabric-1.0',
    'fabric-video',
    'fabric-1-0',
    'veed/fabric',
    'fabric/1.0',
    'livepeer/fabric',
    'image-to-video',
    'talking-head',
    'video-generation'
  ]
  
  for (const model of modelNames) {
    const endpoint = `https://fal.run/fal-ai/${model}`
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Key ${config.falApiKey}`
        },
        body: JSON.stringify({
          image_url: 'https://example.com/test.jpg',
          audio_url: 'https://example.com/test.mp3'
        })
      })
      
      console.log(`${model.padEnd(25)} → ${response.status} ${response.statusText}`)
      
      if (response.status !== 404) {
        const text = await response.text()
        console.log(`   ✅ Found model! Response: ${text.substring(0, 200)}`)
      }
    } catch (error) {
      console.log(`${model.padEnd(25)} → Error`)
    }
  }
}

testFalModels()

