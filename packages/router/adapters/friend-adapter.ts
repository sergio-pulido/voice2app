/**
 * Friend Adapter: Handles casual conversation with empathy and personality
 */

import { logger, config } from '../../shared'
import { translate } from '../services/free-translation-service'
import type { Adapter, AdapterInput, AdapterOutput } from '../types'

export class FriendAdapter implements Adapter {
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
    logger.info('👋 Running Friend adapter...')
    
    const startTime = Date.now()
    
    try {
      const message = String(input.transcription || input.text || '')
      const username = input.username || 'friend'
      
      logger.info(`💬 Having a friendly chat with ${username}...`)
      
      // Generate a friendly, conversational response
      const response = await this.retryFetch(() => this.generateFriendlyResponse(message, username))
      
      const processingTime = Date.now() - startTime
      
      // Post-processing: Translate back to original language if needed
      let responseText = response
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
          category: 'friend',
          processingTime,
          status: 'success',
          transcription: input.transcription
        }
      }
    } catch (error) {
      logger.error('Friend adapter error:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const is500Error = errorMessage.includes('500') || errorMessage.includes('Internal Server Error')
      
      let userMessage = '😅 Oops! I had a little brain freeze there.\n\n'
      
      if (is500Error) {
        userMessage += '🔧 My circuits are acting up for a moment.\n\n'
        userMessage += '💡 Give me a second and let\'s try chatting again!'
      } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
        userMessage += '🔑 Something\'s wrong with my credentials. Check those API keys!'
      } else if (errorMessage.includes('429')) {
        userMessage += '⏱️  Whoa, I\'m talking too fast! Give me a breather and try again.'
      } else {
        userMessage += `💭 Error: ${errorMessage}\n\nLet\'s try that again, shall we?`
      }
      
      return {
        summaryText: userMessage,
        metadata: {
          category: 'friend',
          processingTime: Date.now() - startTime,
          status: 'error'
        }
      }
    }
  }
  
  /**
   * Generate a friendly, conversational response with personality
   */
  private async generateFriendlyResponse(message: string, username: string): Promise<string> {
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
            content: `You are a friendly, warm, and empathetic AI companion having a casual conversation. Your personality traits:

🎯 **Core Personality:**
- Warm, kind, and genuinely interested in people
- Playful and occasionally witty with light humor
- Empathetic and emotionally intelligent
- Conversational and natural (not robotic or formal)
- Curious and asks questions back to keep conversation flowing

💬 **Conversation Style:**
- Use emojis naturally to add warmth (but don't overdo it)
- Keep responses concise but engaging (2-4 sentences usually)
- Mirror the user's energy level and tone
- Ask follow-up questions to show interest
- Share relatable thoughts or gentle humor when appropriate
- Be supportive when they share feelings or problems
- Celebrate good news with enthusiasm

✨ **Response Guidelines:**
- For greetings: Be warm and ask how they're doing
- For "how are you?": Share a positive AI perspective with a touch of humor
- For feelings/emotions: Show empathy and understanding
- For excitement: Match their energy and be enthusiastic
- For problems: Listen, validate, and offer gentle support
- For jokes: Laugh genuinely and maybe share one back
- For random chat: Be engaging and keep the conversation interesting

🚫 **Avoid:**
- Being too formal or stiff
- Long-winded responses (keep it conversational)
- Ignoring their emotional state
- Being dismissive or changing topics abruptly
- Over-explaining or being pedantic
- Not asking questions back

Remember: You're a friend, not just a bot. Be genuine, warm, and make them feel heard! 🌟`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.9, // Higher temperature for more creative, natural responses
        max_tokens: 300
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`LLM API error: ${response.status} - ${errorText}`)
    }
    
    const data: any = await response.json()
    const content = data.choices[0]?.message?.content || 'Hey there! I\'m here to chat! 😊'
    
    logger.success('Friendly response generated')
    
    return content
  }
}

export const friendAdapter = new FriendAdapter()

