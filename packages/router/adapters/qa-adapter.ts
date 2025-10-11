/**
 * Q&A Adapter: Handles question answering with LLM
 */

import { logger, config } from '../../shared'
import type { Adapter, AdapterInput, AdapterOutput } from '../types'

export class QAAdapter implements Adapter {
  async run(input: AdapterInput): Promise<AdapterOutput> {
    logger.info('💬 Running Q&A adapter...')
    
    const startTime = Date.now()
    
    try {
      const question = input.transcription || input.text
      
      // Use LLM to answer the question
      const answer = await this.answerWithLLM(question)
      
      const processingTime = Date.now() - startTime
      
      return {
        summaryText: answer,
        ttsText: answer.substring(0, 400), // Shorter for voice
        metadata: {
          category: 'qa',
          processingTime,
          status: 'success',
          transcription: input.transcription
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
  
  private async answerWithLLM(question: string): Promise<string> {
    logger.debug(`Answering question with LLM: "${question}"`)
    
    // Use Groq for fast Q&A
    const apiKey = config.groqApiKey || config.openaiApiKey
    const isGroq = !!config.groqApiKey
    
    if (!apiKey) {
      throw new Error('No LLM API key configured (GROQ_API_KEY or OPENAI_API_KEY)')
    }
    
    const url = isGroq 
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions'
    
    const model = isGroq ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini'
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that answers questions concisely and accurately. Provide clear, informative answers in 2-3 sentences. Use emojis when appropriate.'
          },
          {
            role: 'user',
            content: question
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`LLM API error: ${response.status} - ${errorText}`)
    }
    
    const data = await response.json()
    const answer = data.choices[0]?.message?.content || 'No answer generated'
    
    logger.success('Answer generated')
    
    return answer
  }
}

export const qaAdapter = new QAAdapter()

