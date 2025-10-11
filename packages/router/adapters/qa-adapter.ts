/**
 * Q&A Adapter: Handles question answering
 */

import { logger } from '../../shared'
import type { Adapter, AdapterInput, AdapterOutput } from '../types'

export class QAAdapter implements Adapter {
  async run(input: AdapterInput): Promise<AdapterOutput> {
    logger.info('💬 Running Q&A adapter...')
    
    const startTime = Date.now()
    
    try {
      // TODO: Integrate with Linkup for factual queries
      // For now, use a simple LLM response
      
      const question = input.transcription || input.text
      
      // Simulate Q&A processing
      // In production, this would call an LLM or search API
      const answer = await this.answerQuestion(question)
      
      const processingTime = Date.now() - startTime
      
      return {
        summaryText: answer,
        ttsText: answer.substring(0, 300), // Shorter for voice
        metadata: {
          category: 'qa',
          processingTime,
          status: 'success'
        }
      }
    } catch (error) {
      logger.error('Q&A adapter error:', error)
      
      return {
        summaryText: `❌ Sorry, I couldn't answer your question: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: {
          category: 'qa',
          processingTime: Date.now() - startTime,
          status: 'error'
        }
      }
    }
  }
  
  private async answerQuestion(question: string): Promise<string> {
    // Simple pattern matching for demo
    // TODO: Replace with actual LLM/search integration
    
    const lowerQ = question.toLowerCase()
    
    if (lowerQ.includes('capital') && lowerQ.includes('spain')) {
      return '🌍 The capital of Spain is **Madrid**. It\'s located in the center of the country and is the largest city in Spain with a population of over 3 million people.'
    }
    
    if (lowerQ.includes('capital') && lowerQ.includes('france')) {
      return '🇫🇷 The capital of France is **Paris**. Known as the "City of Light," it\'s famous for the Eiffel Tower, the Louvre, and its rich history.'
    }
    
    // Generic response
    return `💬 **Question**: ${question}\n\n` +
           `I'm currently set up primarily for app building. For comprehensive Q&A, I'll need to integrate with additional AI services.\n\n` +
           `💡 **Tip**: Try asking me to build something instead! For example:\n` +
           `• "Create a counter app"\n` +
           `• "Build a landing page"\n` +
           `• "Make a todo list"`
  }
}

export const qaAdapter = new QAAdapter()

