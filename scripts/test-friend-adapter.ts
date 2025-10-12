/**
 * Test script for the Friend Adapter
 * 
 * Usage: bun run scripts/test-friend-adapter.ts
 */

import { routeRequest } from '../packages/router'
import { logger } from '../packages/shared'

// Test cases for the friend adapter
const testCases = [
  { text: 'Hello!', description: 'Simple greeting' },
  { text: 'How are you?', description: 'Asking how the bot is' },
  { text: 'How are you feeling today?', description: 'More personal question' },
  { text: 'Tell me a joke', description: 'Request for entertainment' },
  { text: 'What\'s up?', description: 'Casual greeting' },
  { text: 'Good morning!', description: 'Time-specific greeting' },
  { text: 'Thanks for your help!', description: 'Gratitude expression' },
  { text: 'You\'re pretty cool', description: 'Compliment' },
  { text: 'I\'m feeling a bit tired today', description: 'Sharing feelings' },
  { text: 'Hola, cómo estás?', description: 'Spanish greeting' }
]

async function testFriendAdapter() {
  logger.info('🧪 Testing Friend Adapter...\n')
  
  for (const testCase of testCases) {
    logger.info(`\n${'='.repeat(60)}`)
    logger.info(`📝 Test: ${testCase.description}`)
    logger.info(`💬 Input: "${testCase.text}"`)
    logger.info(`${'='.repeat(60)}`)
    
    try {
      const result = await routeRequest({
        text: testCase.text,
        userId: 12345,
        username: 'TestUser'
      })
      
      logger.success(`\n✅ Routed to: ${result.metadata?.routedTo}`)
      logger.success(`🎯 Confidence: ${result.metadata?.routingConfidence}`)
      logger.info(`\n📤 Response:\n${result.summaryText}`)
      
      if (result.metadata?.routedTo !== 'friend') {
        logger.warn(`\n⚠️  WARNING: Expected 'friend' but got '${result.metadata?.routedTo}'`)
      }
      
    } catch (error) {
      logger.error(`\n❌ Test failed:`, error)
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  logger.info(`\n\n${'='.repeat(60)}`)
  logger.success('🎉 All tests completed!')
  logger.info(`${'='.repeat(60)}\n`)
}

// Run tests
testFriendAdapter().catch(error => {
  logger.error('Test suite failed:', error)
  process.exit(1)
})

