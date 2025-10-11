/**
 * Quick OpenAI API key test
 */

const apiKey = process.env.OPENAI_API_KEY

if (!apiKey) {
  console.error('❌ OPENAI_API_KEY not found in environment')
  process.exit(1)
}

console.log('🔑 API Key format:', apiKey.substring(0, 20) + '...')
console.log('📏 API Key length:', apiKey.length)
console.log('\n🧪 Testing OpenAI API...\n')

try {
  const response = await fetch('https://api.openai.com/v1/models', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  })
  
  console.log('📡 Response status:', response.status)
  
  if (response.ok) {
    const data = await response.json()
    console.log('✅ SUCCESS! API key is valid')
    console.log('📦 Available models:', data.data?.length || 0)
  } else {
    const errorText = await response.text()
    console.error('\n❌ FAILED!')
    console.error('Status:', response.status)
    console.error('Error:', errorText)
    
    if (response.status === 401) {
      console.error('\n💡 Solutions:')
      console.error('1. Check your API key at: https://platform.openai.com/api-keys')
      console.error('2. Make sure the key is not revoked')
      console.error('3. Check billing status: https://platform.openai.com/account/billing')
      console.error('4. Create a new API key and update .env file')
    }
  }
} catch (error) {
  console.error('❌ Network error:', error)
}

