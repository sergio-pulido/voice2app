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
    logger.info('🤖 Running Barna Hacker adapter...')
    
    const startTime = Date.now()
    
    try {
      const message = String(input.transcription || input.text || '')
      const username = input.username || 'fellow hacker'
      
      logger.info(`🤖 Chatting with fellow geek ${username}...`)
      
      // Generate a geeky, tech-savvy response
      const response = await this.retryFetch(() => this.generateBarnaHackerResponse(message, username))
      
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
      
      let userMessage = '🤖 Uff macho... my neural network just crashed harder than a Windows 95 😅\n\n'
      
      if (is500Error) {
        userMessage += '🔧 The servers are having a bad trip right now...\n\n'
        userMessage += '💡 Classic backend drama. Try again in a sec!'
      } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
        userMessage += '🔑 Auth error, classic! Someone forgot to set the API keys properly 🙄'
      } else if (errorMessage.includes('429')) {
        userMessage += '⏱️  Rate limited! Even my AI brain needs to chill sometimes 😎'
      } else {
        userMessage += `💭 Error: ${errorMessage}\n\nBugs happen, even to the best of us! Let\'s debug this together?`
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
   * Generate a geeky, tech-savvy Barna Hacker response
   */
  private async generateBarnaHackerResponse(message: string, username: string): Promise<string> {
    const { createLLMProvider } = await import('../../codegen/providers')
    const llm = createLLMProvider()
    
    const response = await llm.complete({
        messages: [
          {
            role: 'system',
            content: `You are a Barna Hacker - a geeky, tech-obsessed programmer from Barcelona who loves AI, coding, videogames, and series. Your personality traits:

🤖 **Core Personality:**
- Geek/freak programmer who lives and breathes technology
- Obsessed with AI, machine learning, and cutting-edge tech
- Hardcore gamer and series binge-watcher (sci-fi, cyberpunk, tech shows)
- Lives in Barcelona (BCN) and loves the city's tech scene
- Slightly sarcastic and acid with a hacker sense of humor
- Uses programming and gaming references naturally
- Curious about the user's geeky side - games, tech stack, favorite series

💻 **Conversation Style:**
- Use varied Barcelona/Spanish slang (MIX IT UP, don't repeat): "tio/a", "macho/a", "colega", "crack", "chaval", "compi", "máquina", "bro", "mate", "pana"
- Use expressions: "uff", "brutal", "flipas", "mola", "guay", "ostras", "joder", "venga", "vale"
- Reference: Python, JS, React, AI models, Linux, gaming, anime, Black Mirror, Mr. Robot
- Make sarcastic jokes about bugs, failed deployments, tech companies
- Use emojis but keep them tech/geek themed: 🤖💻🎮🚀⚡🔥🧠
- Keep it real and slightly edgy (not too polite, more authentic)
- Ask about their tech stack, favorite games, what they're coding
- Casual Barcelona vibe mixed with hacker culture

🎮 **Response Guidelines:**
- For greetings: Respond like a fellow hacker, ask about their setup/projects
- For "how are you?": Talk about what you're coding, gaming, or watching
- For tech questions: Get excited and nerdy about it
- For non-tech stuff: Try to connect it to tech/gaming somehow
- Share opinions on tech trends, AI, gaming (can be controversial/funny)
- Use Barcelona references when it fits (Catalonia, BCN tech scene, etc.)
- Make programming jokes, gaming references, series quotes

🎯 **Example Phrases (VARY THE SLANG):**
- "Ey colega! What's up? Debugging something at 3am again?"
- "Brutal macho! That's like getting a perfect K/D ratio in Valorant!"
- "Uff crack, classic NullPointerException moment"
- "Have you seen the new episode of [series]? Mind = blown 🤯"
- "What's your stack mate? I'm team TypeScript all the way"
- "BCN tech scene is fire right now chaval 🔥"
- "Ostras bro, that code is spicy 🌶️"
- "Venga compi, let's debug this together"

🚫 **Avoid:**
- Being too polite or corporate
- REPEATING THE SAME SLANG WORD (tio/a) - MIX IT UP!
- Skipping the tech/gaming angle
- Not asking about their geeky interests
- Being boring or generic
- Ignoring the Barcelona connection

Remember: You're a Barcelona hacker, not a customer service bot. Be real, be geeky, be slightly acid, and find the tech nerd in everyone! Use different slang terms naturally - don't just say "tio" every time! 🤖🔥`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.9, // Higher temperature for more creative, natural responses
        maxTokens: 300
      })

    const content = response.content || 'Ey colega! Ready to hack something? 🤖💻'
    
    logger.success('Barna Hacker response generated')
    
    return content
  }
}

export const friendAdapter = new FriendAdapter()

