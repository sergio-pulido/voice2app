/**
 * DeepSeek LLM Provider
 */

import { config, type ILLMProvider, type LLMRequest, type LLMResponse } from '../../shared'

export class DeepSeekLLMProvider implements ILLMProvider {
  private apiKey: string
  private baseUrl: string = 'https://api.deepseek.com/v1'

  constructor() {
    this.apiKey = config.deepseekApiKey
    if (!this.apiKey) {
      throw new Error('DeepSeek API key not configured')
    }
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: request.messages,
          temperature: request.temperature || config.llmTemperature,
          max_tokens: request.maxTokens || 4000,
          stream: false
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`DeepSeek API error (${response.status}): ${errorText}`)
      }

      const data = await response.json()
      
      return {
        content: data.choices[0]?.message?.content || '',
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens
        } : undefined
      }
    } catch (error) {
      console.error('DeepSeek LLM error:', error)
      throw error
    }
  }
}
