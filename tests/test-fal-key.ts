/**
 * Test if fal.ai API key works at all
 */

import { config } from '../packages/shared/config'

async function testFalKey() {
  console.log('🔍 Testing fal.ai API key...')
  
  if (!config.falApiKey) {
    console.error('❌ FAL_API_KEY not configured')
    process.exit(1)
  }
  
  console.log('✅ FAL_API_KEY found')
  console.log('Key format:', config.falApiKey.substring(0, 10) + '...')
  
  // Try a simple model that should work
  const testModels = [
    'fal-ai/lcm',
    'fal-ai/stable-diffusion-v3-medium',
    'fal-ai/flux/schnell',
    'fal-ai/film/video'
  ]
  
  for (const model of testModels) {
    console.log(`\n🔍 Testing model: ${model}`)
    
    try {
      const response = await fetch(`https://fal.run/fal-ai/${model.replace('/', '/')}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Key ${config.falApiKey}`
        },
        body: JSON.stringify({
          prompt: 'test'
        })
      })
      
      console.log(`   Status: ${response.status} ${response.statusText}`)
      
      if (response.status === 401) {
        console.log('   ❌ Unauthorized - API key is invalid')
      } else if (response.status === 403) {
        console.log('   ❌ Forbidden - API key valid but no access to this model')
      } else if (response.status === 404) {
        console.log('   ❌ Model not found')
      } else if (response.status === 422) {
        console.log('   ✅ Model exists and API key works (validation error expected)')
      } else {
        console.log('   ✅ API key works!')
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error}`)
    }
  }
}

testFalKey()
