/**
 * Test fal.ai using submit/queue API (async job submission)
 */

import { config } from '../packages/shared/config'

async function testFalSubmit() {
  console.log('🎬 Testing fal.ai with submit API...')
  
  // Try the submit endpoint which queues the job
  const endpoint = 'https://queue.fal.run/fal-ai/fabric'
  
  const testData = {
    image_url: 'https://storage.googleapis.com/falserverless/model_tests/fabric/image.jpg',
    audio_url: 'https://storage.googleapis.com/falserverless/model_tests/fabric/audio.mp3'
  }
  
  console.log('Endpoint:', endpoint)
  console.log('Payload:', JSON.stringify(testData, null, 2))
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${config.falApiKey}`
      },
      body: JSON.stringify(testData)
    })
    
    console.log('Status:', response.status, response.statusText)
    const responseText = await response.text()
    console.log('Response:', responseText)
    
    if (response.ok) {
      const data = JSON.parse(responseText)
      console.log('\n✅ Job submitted!')
      
      // If there's a request_id, poll for results
      if (data.request_id) {
        console.log('Request ID:', data.request_id)
        console.log('Status URL:', data.status_url || data.response_url)
      }
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

testFalSubmit()

