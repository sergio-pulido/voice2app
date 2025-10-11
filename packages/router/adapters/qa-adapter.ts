/**
 * Q&A Adapter: Handles question answering with LLM + Web Search
 */

import { logger, config } from '../../shared'
import { searchWeb, shouldUseWebSearch } from '../services/linkup-service'
import { translate } from '../services/free-translation-service'
import type { Adapter, AdapterInput, AdapterOutput } from '../types'

export class QAAdapter implements Adapter {
  /**
   * Retry wrapper for API calls with exponential backoff
   */
  private async retryFetch(fn: () => Promise<any>, maxRetries = 3): Promise<any> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error: any) {
        const is500Error = error.message?.includes('500') || error.message?.includes('Internal Server Error')
        const isLastAttempt = attempt === maxRetries
        
        if (is500Error && !isLastAttempt) {
          const delay = Math.pow(2, attempt - 1) * 1000 // 1s, 2s, 4s
          logger.warn(`⚠️  API error (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        
        throw error
      }
    }
  }
  
  async run(input: AdapterInput): Promise<AdapterOutput> {
    logger.info('💬 Running Q&A adapter...')
    
    const startTime = Date.now()
    
    try {
      const question = String(input.transcription || input.text || '')
      
      // Check if it's a super simple question (one or two words)
      const wordCount = question.trim().split(/\s+/).length
      if (wordCount <= 2 && !question.includes('?')) {
        logger.info('⚡ Super short input, treating as simple question...')
      }
      
      // Step 1: Ask Groq to answer AND assess if it needs more information
      logger.info('🤖 Step 1: Asking Groq to assess complexity...')
      const initialResult = await this.retryFetch(() => this.assessAndAnswer(question))
      
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
          finalAnswer = await this.retryFetch(() => this.answerWithContext(question, searchContext))
          usedWebSearch = true
        } catch (error) {
          logger.warn('Linkup search failed, falling back to simple answer:', error)
          // Fallback: Just answer without search
          finalAnswer = await this.retryFetch(() => this.simpleAnswer(question))
        }
      } else if (initialResult.needsMoreInfo && !config.linkupApiKey) {
        logger.warn('⚠️  Complex question but Linkup not configured, answering with LLM only')
        // Answer as best as we can without search
        finalAnswer = await this.retryFetch(() => this.simpleAnswer(question))
      }
      
      const processingTime = Date.now() - startTime
      
      // Add indicator if web search was used
      let responseText = usedWebSearch 
        ? `${finalAnswer}\n\n_🔍 Answer enhanced with web search_`
        : finalAnswer
      
      // Post-processing: Translate back to original language if needed
      const targetLang = input.detectedLang || 'en'
      if (targetLang !== 'en' && responseText.trim().length > 0) {
        logger.info(`🌐 Translating response back to ${targetLang}...`)
        try {
          responseText = await translate(responseText, targetLang)
          logger.success(`✅ Response translated to ${targetLang}`)
        } catch (error) {
          logger.warn('Response translation failed, keeping English:', error)
        }
      }
      
      return {
        summaryText: responseText,
        ttsText: responseText.substring(0, 400), // Shorter for voice
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
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const is500Error = errorMessage.includes('500') || errorMessage.includes('Internal Server Error')
      
      let userMessage = '❌ Sorry, I couldn\'t answer your question.\n\n'
      
      if (is500Error) {
        userMessage += '🔧 The AI service is temporarily experiencing issues.\n\n'
        userMessage += '💡 Please try again in a few seconds. This is usually a temporary problem with Groq\'s servers.'
      } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
        userMessage += '🔑 API authentication error. Please check your API keys in the .env file.'
      } else if (errorMessage.includes('429')) {
        userMessage += '⏱️  Rate limit reached. Please wait a moment and try again.'
      } else {
        userMessage += `Error: ${errorMessage}\n\nPlease try again or rephrase your question.`
      }
      
      return {
        summaryText: userMessage,
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

🟢 SIMPLE questions (answer directly - one straightforward fact):
- Single facts: "What is the capital of Spain?" → Answer "Madrid 🇪🇸"
- Yes/no questions: "Is water H2O?" → Answer "Yes"
- Basic math: "What is 15% of 200?" → Calculate and answer
- Single item: "Who invented the telephone?" → Answer directly

🔴 COMPLEX questions (need web search - requires comprehensive info):
- Multiple parts: "Which hormones exist and how do they work?" → NEEDS_SEARCH
- Detailed explanations: "Explain how quantum computing works" → NEEDS_SEARCH
- "How does X work?" when X is complex → NEEDS_SEARCH
- Lists with explanations: "What are the main X and what do they do?" → NEEDS_SEARCH
- Current data: "Microsoft's revenue for 2024", "Latest AI news" → NEEDS_SEARCH
- Multi-step processes: "How does the stock market work step by step" → NEEDS_SEARCH

IMPORTANT RULE:
- If the question has multiple parts (AND, OR, "how do they work", "what are they useful for") → It's COMPLEX

FOR SIMPLE QUESTIONS:
Answer in 1-2 sentences with emojis.

FOR COMPLEX QUESTIONS:
Type EXACTLY: "NEEDS_SEARCH:" and nothing else. No explanation. I'll fetch web data for you.`
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
    
    const data: any = await response.json()
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
    
    const data: any = await response.json()
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
    
    const data: any = await response.json()
    const answer = data.choices[0]?.message?.content || 'No answer generated'
    
    logger.success('Detailed answer generated with search context')
    
    return answer
  }
}

export const qaAdapter = new QAAdapter()

