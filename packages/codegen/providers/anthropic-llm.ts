/**
 * Anthropic Claude LLM Provider
 */

import { config, logger, type ILLMProvider, type LLMRequest, type LLMResponse } from '../../shared'

export class AnthropicLLMProvider implements ILLMProvider {
  async complete(request: LLMRequest): Promise<LLMResponse> {
    try {
      // Convert messages format (Anthropic requires system message separate)
      const systemMessage = request.messages.find(m => m.role === 'system')
      const messages = request.messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        }))
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.anthropicApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.llmModel || 'claude-3-5-sonnet-20241022',
          messages,
          system: systemMessage?.content,
          temperature: request.temperature ?? config.llmTemperature,
          max_tokens: request.maxTokens ?? 4000,
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Anthropic API error (${response.status}): ${errorText}`)
      }
      
      const result = await response.json() as {
        content: Array<{ text: string }>
        usage?: {
          input_tokens: number
          output_tokens: number
        }
      }
      
      const content = result.content[0]?.text
      if (!content) {
        throw new Error('No content in Anthropic response')
      }
      
      return {
        content,
        usage: result.usage ? {
          promptTokens: result.usage.input_tokens,
          completionTokens: result.usage.output_tokens,
          totalTokens: result.usage.input_tokens + result.usage.output_tokens,
        } : undefined,
      }
    } catch (error) {
      logger.error('Anthropic LLM error:', error)
      throw error
    }
  }
}

