/**
 * Q&A Adapter: Handles question answering with LLM + Web Search
 */

import { logger, config } from '../../shared'
import { searchWeb, shouldUseWebSearch } from '../services/linkup-service'
import type { Adapter, AdapterInput, AdapterOutput } from '../types'

export class QAAdapter implements Adapter {
  async run(input: AdapterInput): Promise<AdapterOutput> {
    logger.info('💬 Running Q&A adapter...')
    
    const startTime = Date.now()
    
    try {
      const question = input.transcription || input.text
      
      // Step 1: Ask Groq to answer AND assess if it needs more information
      logger.info('🤖 Step 1: Asking Groq to assess complexity...')
      const initialResult = await this.assessAndAnswer(question)
      
      // Step 2: If Groq says it needs more info, use Linkup
      let finalAnswer = initialResult.answer
      let usedWebSearch = false
      
      if (initialResult.needsMoreInfo && config.linkupApiKey) {
        logger.info('🔍 Step 2: Groq needs more info, searching with Linkup...')
        
        try {
          const searchContext = await searchWeb(question)
          logger.success('Search context retrieved')
          
          // Step 3: Ask Groq again with search context for detailed answer
          logger.info('🤖 Step 3: Generating detailed answer with search results...')
          finalAnswer = await this.answerWithContext(question, searchContext)
          usedWebSearch = true
        } catch (error) {
          logger.warn('Linkup search failed, falling back to simple answer:', error)
          // Fallback: Just answer without search
          finalAnswer = await this.simpleAnswer(question)
        }
      } else if (initialResult.needsMoreInfo && !config.linkupApiKey) {
        logger.warn('⚠️  Complex question but Linkup not configured, answering with LLM only')
        // Answer as best as we can without search
        finalAnswer = await this.simpleAnswer(question)
      }
      
      const processingTime = Date.now() - startTime
      
      // Add indicator if web search was used
      const responseText = usedWebSearch 
        ? `${finalAnswer}\n\n_🔍 Answer enhanced with web search_`
        : finalAnswer
      
      return {
        summaryText: responseText,
        ttsText: finalAnswer.substring(0, 400), // Shorter for voice
        metadata: {
          category: 'qa',
          processingTime,
          status: 'success',
          transcription: input.transcription,
          usedWebSearch,
          complexity: initialResult.needsMoreInfo ? 'complex' : 'simple'
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
  
  /**
   * Step 1: Ask Groq to answer and assess if it needs more information
   */
  private async assessAndAnswer(question: string): Promise<{ answer: string; needsMoreInfo: boolean }> {
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
            content: `You are a helpful assistant. Your task is to answer questions and decide if web search is needed.

SIMPLE questions (answer directly):
- Basic facts you know: "What is the capital of Spain?" → Just answer "Madrid"
- Simple definitions you know: "What is photosynthesis?" → Explain briefly
- Common knowledge: "Who invented the telephone?" → Answer directly

COMPLEX questions (need web search):
- Detailed explanations: "Explain how quantum computing works" or "Explain how the European Union works"
- Current data: "Microsoft's revenue for 2024", "Latest news about AI"
- Detailed processes: "How does the stock market work step by step"

For SIMPLE questions: Answer normally in 2-3 sentences.

For COMPLEX questions: Start your response with exactly "NEEDS_SEARCH:" followed by nothing else. Don't explain why, just type "NEEDS_SEARCH:" and I'll get web data for you.`
          },
          {
            role: 'user',
            content: question
          }
        ],
        temperature: 0.7,
        max_tokens: 400
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`LLM API error: ${response.status} - ${errorText}`)
    }
    
    const data = await response.json()
    const content = data.choices[0]?.message?.content || 'No answer generated'
    
    // Check if Groq wants more information (check if NEEDS_SEARCH appears anywhere)
    if (content.includes('NEEDS_SEARCH:')) {
      // Extract just the brief answer part after NEEDS_SEARCH:
      const parts = content.split('NEEDS_SEARCH:')
      const briefAnswer = parts[parts.length - 1].trim()
      logger.info('🧠 Groq assessment: COMPLEX - needs web search')
      return { answer: briefAnswer, needsMoreInfo: true }
    }
    
    logger.info('🧠 Groq assessment: SIMPLE - can answer directly')
    return { answer: content, needsMoreInfo: false }
  }
  
  /**
   * Simple answer without web search
   */
  private async simpleAnswer(question: string): Promise<string> {
    const apiKey = config.groqApiKey || config.openaiApiKey
    const isGroq = !!config.groqApiKey
    
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
            content: 'You are a helpful assistant. Provide clear, informative answers. Use emojis when appropriate.'
          },
          {
            role: 'user',
            content: question
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`LLM API error: ${response.status} - ${errorText}`)
    }
    
    const data = await response.json()
    return data.choices[0]?.message?.content || 'No answer generated'
  }
  
  /**
   * Step 3: Generate detailed answer with search context (no length limit)
   */
  private async answerWithContext(question: string, searchContext: string): Promise<string> {
    const apiKey = config.groqApiKey || config.openaiApiKey
    const isGroq = !!config.groqApiKey
    
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
            content: 'You are a helpful assistant that provides comprehensive, detailed answers using web search results. ' +
                     'Use the search results to give a thorough, accurate explanation. ' +
                     'Structure your answer clearly with paragraphs if needed. Use emojis to make it engaging.'
          },
          {
            role: 'user',
            content: `Question: ${question}\n\nWeb Search Results:\n${searchContext}\n\nProvide a detailed, comprehensive answer using the search results.`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000  // Much longer for detailed answers!
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`LLM API error: ${response.status} - ${errorText}`)
    }
    
    const data = await response.json()
    const answer = data.choices[0]?.message?.content || 'No answer generated'
    
    logger.success('Detailed answer generated with search context')
    
    return answer
  }
}

export const qaAdapter = new QAAdapter()

