/**
 * Test fal-ai/film/video specifically
 */

import { config } from '../packages/shared/config'

async function testFilmVideo() {
  console.log('🎬 Testing fal-ai/film/video...')
  
  if (!config.falApiKey) {
    console.error('❌ FAL_API_KEY not configured')
    process.exit(1)
  }
  
  console.log('✅ FAL_API_KEY found')
  
  // Test the exact endpoint format you know works
  const endpoints = [
    'https://queue.fal.run/fal-ai/film/video',
    'https://fal.run/fal-ai/film/video',
    'https://fal.run/fal-ai/film',
    'https://queue.fal.run/fal-ai/film'
  ]
  
  const testImage = 'https://storage.googleapis.com/falserverless/model_tests/film/image.jpg'
  
  for (const endpoint of endpoints) {
    console.log(`\n🔍 Testing: ${endpoint}`)
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Key ${config.falApiKey}`
        },
        body: JSON.stringify({
          image_url: testImage,
          duration: 5,
          fps: 8
        })
      })
      
      console.log(`   Status: ${response.status} ${response.statusText}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('   ✅ SUCCESS! Response:', JSON.stringify(data, null, 2))
        return
      } else {
        const error = await response.text()
        console.log(`   ❌ Error: ${error}`)
      }
    } catch (error) {
      console.log(`   ❌ Exception: ${error}`)
    }
  }
  
  console.log('\n❌ All endpoints failed')
}

testFilmVideo()
