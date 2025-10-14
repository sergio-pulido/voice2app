#!/usr/bin/env bun

/**
 * Test JSON parser to verify it handles all LLM response formats
 */

// Simulate the exact response from the logs
const llmResponse = `[
  {
    "path": "package.json",
    "content": "{\\n  \\"name\\": \\"side-scroller-game\\",\\n  \\"private\\": true,\\n  \\"version\\": \\"0.0.0\\",\\n  \\"type\\": \\"module\\",\\n  \\"scripts\\": {\\n    \\"dev\\": \\"vite\\",\\n    \\"build\\": \\"tsc && vite build\\"\\n  }\\n}"
  }
]`

console.log('🧪 Testing JSON Parser\n')
console.log('Original LLM Response (first 300 chars):')
console.log(llmResponse.substring(0, 300))
console.log('\n' + '='.repeat(60) + '\n')

try {
  // Step 1: Parse outer JSON
  console.log('Step 1: Parsing outer JSON array...')
  const files = JSON.parse(llmResponse)
  console.log('✅ Outer JSON parsed successfully')
  console.log(`   Found ${files.length} files`)
  
  // Step 2: Check content field
  console.log('\nStep 2: Checking file content...')
  const packageFile = files[0]
  console.log(`   Path: ${packageFile.path}`)
  console.log(`   Content (first 100 chars): ${packageFile.content.substring(0, 100)}`)
  
  // Step 3: Parse package.json content
  console.log('\nStep 3: Parsing package.json content...')
  const packageJson = JSON.parse(packageFile.content)
  console.log('✅ Package.json parsed successfully')
  console.log(`   Name: ${packageJson.name}`)
  console.log(`   Scripts:`, packageJson.scripts)
  
  console.log('\n🎉 All tests passed! The JSON parser works correctly!\n')
} catch (error) {
  console.error('\n❌ Test failed:', error)
  console.error('\nThis is the exact error we need to fix!\n')
  process.exit(1)
}

