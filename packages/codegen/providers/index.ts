/**
 * LLM Provider Factory
 */

import { config, type ILLMProvider } from '../../shared'
import { OpenAILLMProvider } from './openai-llm'
import { AnthropicLLMProvider } from './anthropic-llm'
import { GroqLLMProvider } from './groq-llm'

export function createLLMProvider(): ILLMProvider {
  switch (config.llmProvider) {
    case 'openai':
      return new OpenAILLMProvider()
    case 'anthropic':
      return new AnthropicLLMProvider()
    case 'groq':
      return new GroqLLMProvider()
    default:
      throw new Error(`Unknown LLM provider: ${config.llmProvider}`)
  }
}

export { OpenAILLMProvider } from './openai-llm'
export { AnthropicLLMProvider } from './anthropic-llm'
export { GroqLLMProvider } from './groq-llm'

