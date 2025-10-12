/**
 * Find available video models with your API key
 */

import { config } from '../packages/shared/config'

async function findVideoModels() {
  console.log('🎬 Searching for available video models...')
  
  const apiKey = config.falApiKey
  
  // Common video model names to test
  const videoModels = [
    'fal-ai/film/video',
    'fal-ai/film',
    'fal-ai/video',
    'runwayml/gen3a',
    'runwayml/gen3',
    'runwayml/gen2',
    'stabilityai/stable-video-diffusion',
    'veed/fabric-1.0',
    'veed/fabric',
    'fal-ai/runwayml/gen3a',
    'fal-ai/runwayml/gen2',
    'fal-ai/stabilityai/stable-video-diffusion'
  ]
  
  console.log('🔍 Testing video models...\n')
  
  for (const model of videoModels) {
    try {
      const endpoint = `https://queue.fal.run/${model}`
      console.log(`Testing: ${model}`)
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Key ${apiKey}`
        },
        body: JSON.stringify({
          prompt: 'test',
          image_url: 'https://storage.googleapis.com/falserverless/model_tests/film/image.jpg'
        })
      })
      
      if (response.status === 200) {
        console.log(`   ✅ AVAILABLE: ${model}`)
      } else if (response.status === 401) {
        console.log(`   ❌ Unauthorized: ${model}`)
      } else if (response.status === 403) {
        console.log(`   ❌ No access: ${model}`)
      } else if (response.status === 404) {
        console.log(`   ❌ Not found: ${model}`)
      } else if (response.status === 422) {
        console.log(`   ✅ AVAILABLE (validation error): ${model}`)
      } else {
        console.log(`   ❓ Status ${response.status}: ${model}`)
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${model}`)
    }
  }
  
  console.log('\n💡 If no video models are available:')
  console.log('1. Check your fal.ai dashboard for available models')
  console.log('2. Consider upgrading your plan')
  console.log('3. Use alternative video services (RunwayML, etc.)')
}

findVideoModels()
