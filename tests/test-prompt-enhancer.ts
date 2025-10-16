/**
 * Test script for the Prompt Enhancer Adapter
 */

import { promptEnhancerAdapter } from '../packages/router/adapters/prompt-enhancer-adapter'

async function testPromptEnhancer() {
  console.log('🧪 Testing Prompt Enhancer Adapter...\n')

  // Test cases
  const testCases = [
    {
      name: 'Basic AI/ML Prompt Enhancement',
      input: 'Enhance this prompt: Create a machine learning model',
      expectedDomain: 'ai_ml'
    },
    {
      name: 'Development Prompt Enhancement',
      input: 'Improve: Build a web application',
      expectedDomain: 'development'
    },
    {
      name: 'DevOps Prompt Enhancement',
      input: 'Make this better: Deploy an app to production',
      expectedDomain: 'devops'
    },
    {
      name: 'Systems Prompt Enhancement',
      input: 'Enhance: Design a distributed system',
      expectedDomain: 'systems'
    },
    {
      name: 'Prompt Analysis',
      input: 'Analyze this prompt: Write a function',
      expectedAction: 'analyze'
    },
    {
      name: 'Examples Request',
      input: 'Show prompt examples for AI/ML',
      expectedAction: 'examples'
    }
  ]

  for (const testCase of testCases) {
    console.log(`📋 Testing: ${testCase.name}`)
    console.log(`Input: "${testCase.input}"`)
    
    try {
      const result = await promptEnhancerAdapter.run({
        text: testCase.input,
        userId: 123,
      })

      console.log(`✅ Success!`)
      console.log(`Status: ${result.metadata?.status}`)
      console.log(`Category: ${result.metadata?.category}`)
      
      if (testCase.expectedDomain) {
        console.log(`Domain: ${result.metadata?.domain} (expected: ${testCase.expectedDomain})`)
      }
      
      if (testCase.expectedAction) {
        console.log(`Action: ${result.metadata?.analysis_type || 'enhance'} (expected: ${testCase.expectedAction})`)
      }
      
      console.log(`Response Preview: ${result.summaryText.substring(0, 100)}...`)
      console.log('---\n')
      
    } catch (error) {
      console.log(`❌ Error: ${error}`)
      console.log('---\n')
    }
  }

  console.log('🎯 Test completed!')
}

// Run the test
testPromptEnhancer().catch(console.error)
