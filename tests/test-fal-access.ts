/**
 * Test what fal.ai models you have access to
 */

import { config } from '../packages/shared/config'

async function testFalAccess() {
  console.log('🔍 Testing fal.ai API access...')
  
  if (!config.falApiKey) {
    console.error('❌ FAL_API_KEY not configured')
    process.exit(1)
  }
  
  // Test basic API access
  try {
    const response = await fetch('https://fal.run/fal-ai/fal-ai-lcm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${config.falApiKey}`
      },
      body: JSON.stringify({
        prompt: 'test'
      })
    })
    
    console.log('Basic API test:', response.status, response.statusText)
    
    if (response.status === 401) {
      console.log('❌ API Key is invalid or expired')
    } else if (response.status === 403) {
      console.log('❌ API Key valid but no access to this model')
    } else if (response.status === 404) {
      console.log('❌ Model not found')
    } else {
      console.log('✅ API Key works!')
    }
  } catch (error) {
    console.error('Error:', error)
  }
  
  // Test Fabric specifically
  console.log('\n🎬 Testing Fabric 1.0 access...')
  try {
    const fabricResponse = await fetch('https://fal.run/fal-ai/veed/fabric-1.0', {
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
    
    console.log('Fabric test:', fabricResponse.status, fabricResponse.statusText)
    const errorText = await fabricResponse.text()
    console.log('Response:', errorText)
  } catch (error) {
    console.error('Fabric error:', error)
  }
}

testFalAccess()
