/**
 * Test different authentication formats for fal-ai/film/video
 */

import { config } from '../packages/shared/config'

async function testFilmAuth() {
  console.log('🔑 Testing different authentication formats...')
  
  if (!config.falApiKey) {
    console.error('❌ FAL_API_KEY not configured')
    process.exit(1)
  }
  
  const apiKey = config.falApiKey
  console.log('API Key format:', apiKey.substring(0, 10) + '...')
  
  const endpoint = 'https://queue.fal.run/fal-ai/film/video'
  const testImage = 'https://storage.googleapis.com/falserverless/model_tests/film/image.jpg'
  
  // Test different auth header formats
  const authFormats = [
    { name: 'Key', header: `Key ${apiKey}` },
    { name: 'Bearer', header: `Bearer ${apiKey}` },
    { name: 'Authorization', header: `Authorization: ${apiKey}` },
    { name: 'X-API-Key', header: apiKey },
    { name: 'fal-key', header: apiKey }
  ]
  
  for (const auth of authFormats) {
    console.log(`\n🔍 Testing ${auth.name} auth format...`)
    
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (auth.name === 'X-API-Key') {
        headers['X-API-Key'] = apiKey
      } else if (auth.name === 'fal-key') {
        headers['fal-key'] = apiKey
      } else {
        headers['Authorization'] = auth.header
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          image_url: testImage,
          duration: 5,
          fps: 8
        })
      })
      
      console.log(`   Status: ${response.status} ${response.statusText}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('   ✅ SUCCESS with', auth.name, '!')
        console.log('   Response:', JSON.stringify(data, null, 2))
        return
      } else {
        const error = await response.text()
        console.log(`   ❌ Error: ${error.substring(0, 100)}...`)
      }
    } catch (error) {
      console.log(`   ❌ Exception: ${error}`)
    }
  }
  
  console.log('\n❌ All auth formats failed')
}

testFilmAuth()
