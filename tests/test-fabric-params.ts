/**
 * Test veed/fabric-1.0 parameters for talking videos
 */

import { config } from '../packages/shared/config'

async function testFabricParams() {
  console.log('🎬 Testing veed/fabric-1.0 parameters...')
  
  const apiKey = config.falApiKey
  const testImage = 'https://storage.googleapis.com/falserverless/model_tests/film/image.jpg'
  const testAudio = 'https://storage.googleapis.com/falserverless/model_tests/film/audio.mp3'
  
  // Test different parameter combinations for talking videos
  const testCases = [
    {
      name: 'Image + audio_url (talking video)',
      params: { 
        image_url: testImage,
        audio_url: testAudio
      }
    },
    {
      name: 'Image + audio_url + duration',
      params: { 
        image_url: testImage,
        audio_url: testAudio,
        duration: 5
      }
    },
    {
      name: 'Image + audio_url + fps',
      params: { 
        image_url: testImage,
        audio_url: testAudio,
        fps: 24
      }
    },
    {
      name: 'Image + audio_url + resolution',
      params: { 
        image_url: testImage,
        audio_url: testAudio,
        resolution: '720p'
      }
    }
  ]
  
  for (const testCase of testCases) {
    console.log(`\n🔍 Testing: ${testCase.name}`)
    console.log('Parameters:', JSON.stringify(testCase.params, null, 2))
    
    try {
      const response = await fetch('https://queue.fal.run/veed/fabric-1.0', {
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

testFabricParams()
