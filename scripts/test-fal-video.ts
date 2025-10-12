/**
 * Test fal.ai Fabric 1.0 video generation with defaults
 */

import { config } from '../packages/shared/config'

async function testFalVideo() {
  console.log('🎬 Testing fal.ai Fabric 1.0 API...')
  
  if (!config.falApiKey) {
    console.error('❌ FAL_API_KEY not configured')
    process.exit(1)
  }
  
  console.log('✅ FAL_API_KEY found')
  
  // Use default test image and audio URLs
  const testImageUrl = 'https://storage.googleapis.com/falserverless/model_tests/fabric/image.jpg'
  const testAudioUrl = 'https://storage.googleapis.com/falserverless/model_tests/fabric/audio.mp3'
  
  // Try different endpoint formats
  const endpoints = [
    'https://queue.fal.run/fal-ai/veed/fabric-1.0',
    'https://fal.run/fal-ai/veed/fabric-1.0',
    'https://queue.fal.run/fal-ai/veed-fabric-1-0',
    'https://fal.run/fal-ai/veed-fabric-1-0'
  ]
  
  for (const endpoint of endpoints) {
    console.log(`\n🔍 Testing endpoint: ${endpoint}`)
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Key ${config.falApiKey}`
        },
        body: JSON.stringify({
          image_url: testImageUrl,
          audio_url: testAudioUrl,
          resolution: '720p'
        })
      })
      
      console.log(`   Status: ${response.status} ${response.statusText}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('   ✅ SUCCESS! Response:', JSON.stringify(data, null, 2))
        process.exit(0)
      } else {
        const error = await response.text()
        console.log(`   ❌ Error: ${error}`)
      }
    } catch (error) {
      console.log(`   ❌ Exception:`, error)
    }
  }
  
  console.log('\n❌ All endpoints failed')
}

testFalVideo()

