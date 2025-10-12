/**
 * Debug fal.ai API key - compare with your working project
 */

import { config } from '../packages/shared/config'

async function debugFalKey() {
  console.log('🔍 Debugging fal.ai API key...')
  
  if (!config.falApiKey) {
    console.error('❌ FAL_API_KEY not configured')
    process.exit(1)
  }
  
  const apiKey = config.falApiKey
  
  console.log('\n📋 Current API Key Info:')
  console.log(`Length: ${apiKey.length} characters`)
  console.log(`Format: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 10)}`)
  console.log(`Starts with: ${apiKey.substring(0, 3)}`)
  console.log(`Contains hyphens: ${apiKey.includes('-')}`)
  console.log(`Contains underscores: ${apiKey.includes('_')}`)
  
  console.log('\n🔍 Test with simple endpoint:')
  
  // Test with a basic endpoint that should work with any valid key
  try {
    const response = await fetch('https://fal.run/fal-ai/stable-diffusion-v3-medium', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${apiKey}`
      },
      body: JSON.stringify({
        prompt: 'test'
      })
    })
    
    console.log(`Status: ${response.status} ${response.statusText}`)
    
    if (response.status === 401) {
      console.log('❌ API key is invalid or expired')
    } else if (response.status === 403) {
      console.log('❌ API key valid but no access to this model')
    } else if (response.status === 404) {
      console.log('❌ Model not found (but API key might be valid)')
    } else if (response.status === 422) {
      console.log('✅ API key is VALID! (validation error is expected)')
    } else {
      console.log(`✅ API key works! Status: ${response.status}`)
    }
    
    const errorText = await response.text()
    console.log('Response:', errorText.substring(0, 200))
    
  } catch (error) {
    console.log('❌ Network error:', error)
  }
  
  console.log('\n💡 Next Steps:')
  console.log('1. Check if this API key matches your working project')
  console.log('2. Verify the key in your fal.ai dashboard')
  console.log('3. Check if you need to request access to fal-ai/film/video')
  console.log('4. Try generating a new API key')
}

debugFalKey()
