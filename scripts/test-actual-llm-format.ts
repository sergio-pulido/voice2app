#!/usr/bin/env bun

/**
 * Test the ACTUAL problematic LLM response from the logs
 */

// This is the EXACT format from the logs
const llmResponse = `[
  {
    "path": "package.json",
    "content": "{\\n  \\\"name\\\": \\\"side-scroller-game\\\",\\n  \\\"private\\\": true,\\n  \\\"version\\\": \\\"0.0.0\\\",\\n  \\\"type\\\": \\\"module\\\",\\n  \\\"scripts\\\": {\\n    \\\"dev\\\": \\\"vite\\\",\\n    \\\"build\\\": \\\"tsc && vite build\\\"\\n  }\\n}"
  }
]`

console.log('🧪 Testing ACTUAL Problematic LLM Format\n')
console.log('Raw LLM Response (first 300 chars):')
console.log(llmResponse.substring(0, 300))
console.log('\n' + '='.repeat(60) + '\n')

try {
  // Step 1: Try direct parse (this will fail)
  console.log('Step 1: Trying direct JSON parse...')
  const files = JSON.parse(llmResponse)
  console.log('✅ Outer JSON parsed')
  
  // Step 2: Try to parse content
  console.log('\nStep 2: Parsing package.json content...')
  const packageFile = files[0]
  console.log(`Content: ${packageFile.content.substring(0, 100)}`)
  
  const packageJson = JSON.parse(packageFile.content)
  console.log('✅ Package.json parsed successfully')
  console.log(`   Name: ${packageJson.name}`)
  
  console.log('\n🎉 SUCCESS! This format works!\n')
} catch (error) {
  console.error('\n❌ Direct parse failed:', error.message)
  console.log('\n🔧 Now testing with our cleanup logic...\n')
  
  // Apply our cleanup logic
  let result = llmResponse
  
  // Fix over-escaped quotes: \\\" -> \"
  result = result.replace(/\\\\\\\"/g, '\\"')
  console.log('After fixing triple-escaped quotes (first 300 chars):')
  console.log(result.substring(0, 300))
  
  try {
    const files = JSON.parse(result)
    console.log('\n✅ Outer JSON parsed after cleanup')
    
    const packageFile = files[0]
    console.log(`\nContent after cleanup: ${packageFile.content.substring(0, 100)}`)
    
    const packageJson = JSON.parse(packageFile.content)
    console.log('✅ Package.json parsed successfully!')
    console.log(`   Name: ${packageJson.name}`)
    console.log(`   Scripts:`, packageJson.scripts)
    
    console.log('\n🎉 SUCCESS with cleanup logic!\n')
  } catch (cleanupError) {
    console.error('\n❌ Cleanup logic also failed:', cleanupError.message)
    console.log('\nNeed to fix the cleanup logic!\n')
    process.exit(1)
  }
}

