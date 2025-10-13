/**
 * Test fal-ai/film/video parameters to find the correct format
 */

import { config } from '../packages/shared/config'

async function testFilmParams() {
  console.log('🎬 Testing fal-ai/film/video parameters...')
  
  const apiKey = config.falApiKey
  const testImage = 'https://storage.googleapis.com/falserverless/model_tests/film/image.jpg'
  
  // Test different parameter combinations
  const testCases = [
    {
      name: 'Image only (minimal)',
      params: { image_url: testImage }
    },
    {
      name: 'Image + duration',
      params: { image_url: testImage, duration: 5 }
    },
    {
      name: 'Image + duration + fps',
      params: { image_url: testImage, duration: 5, fps: 8 }
    },
    {
      name: 'Image + fps only',
      params: { image_url: testImage, fps: 8 }
    },
    {
      name: 'Image + motion_bucket_id',
      params: { image_url: testImage, motion_bucket_id: 127 }
    },
    {
      name: 'Image + duration + motion_bucket_id',
      params: { image_url: testImage, duration: 5, motion_bucket_id: 127 }
    }
  ]
  
  for (const testCase of testCases) {
    console.log(`\n🔍 Testing: ${testCase.name}`)
    console.log('Parameters:', JSON.stringify(testCase.params, null, 2))
    
    try {
      const response = await fetch('https://queue.fal.run/fal-ai/film/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Key ${apiKey}`
        },
        body: JSON.stringify(testCase.params)
      })
      
      console.log(`Status: ${response.status} ${response.statusText}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ SUCCESS! Response:', JSON.stringify(data, null, 2))
        return testCase.params
      } else {
        const error = await response.text()
        console.log('❌ Error:', error)
      }
    } catch (error) {
      console.log('❌ Exception:', error)
    }
  }
  
  console.log('\n❌ All parameter combinations failed')
}

testFilmParams()
