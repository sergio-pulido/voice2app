/**
 * Groq LLM Provider (Fast inference)
 */

import { config, logger, type ILLMProvider, type LLMRequest, type LLMResponse } from '../../shared'

export class GroqLLMProvider implements ILLMProvider {
  async complete(request: LLMRequest): Promise<LLMResponse> {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.groqApiKey}`,
        },
        body: JSON.stringify({
          model: config.llmModel || 'llama-3.3-70b-versatile',
          messages: request.messages,
          temperature: request.temperature ?? config.llmTemperature,
          max_tokens: request.maxTokens ?? 4000,
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Groq API error (${response.status}): ${errorText}`)
      }
      
      const result = await response.json() as {
        choices: Array<{ message: { content: string } }>
        usage?: {
          prompt_tokens: number
          completion_tokens: number
          total_tokens: number
        }
      }
      
      const content = result.choices[0]?.message?.content
      if (!content) {
        throw new Error('No content in Groq response')
      }
      
      return {
        content,
        usage: result.usage ? {
          promptTokens: result.usage.prompt_tokens,
          completionTokens: result.usage.completion_tokens,
          totalTokens: result.usage.total_tokens,
        } : undefined,
      }
    } catch (error) {
      logger.error('Groq LLM error:', error)
      throw error
    }
  }
}

