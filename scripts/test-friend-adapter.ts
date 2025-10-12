/**
 * Test script for the Barna Hacker Adapter
 * 
 * Usage: bun run scripts/test-friend-adapter.ts
 */

import { routeRequest } from '../packages/router'
import { logger } from '../packages/shared'

// Test cases for the Barna Hacker adapter
const testCases = [
  { text: 'Ey! What\'s up tio?', description: 'Barcelona style greeting' },
  { text: 'How are you? What are you coding today?', description: 'Asking about current projects' },
  { text: 'What\'s your favorite programming language?', description: 'Tech preferences question' },
  { text: 'Tell me a programming joke', description: 'Request for geeky humor' },
  { text: 'What games are you playing?', description: 'Gaming question' },
  { text: 'Have you watched the latest Black Mirror episode?', description: 'Series talk' },
  { text: 'My code is broken, everything crashes!', description: 'Tech frustration' },
  { text: 'Just deployed to production on a Friday 😱', description: 'Sharing risky dev moment' },
  { text: 'What\'s the BCN tech scene like?', description: 'Barcelona tech culture' },
  { text: 'Hola! Qué opinas de la nueva IA de OpenAI?', description: 'Spanish tech question' }
]

async function testBarnaHacker() {
  logger.info('🧪 Testing Barna Hacker Adapter...\n')
  
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
testBarnaHacker().catch(error => {
  logger.error('Test suite failed:', error)
  process.exit(1)
})

