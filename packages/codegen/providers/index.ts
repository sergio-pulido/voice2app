/**
 * LLM Provider Factory
 */

import { config, logger, type ILLMProvider, type LLMRequest, type LLMResponse } from '../../shared'
import { OpenAILLMProvider } from './openai-llm'
import { AnthropicLLMProvider } from './anthropic-llm'
import { GroqLLMProvider } from './groq-llm'
import { DeepSeekLLMProvider } from './deepseek-llm'

class MultiLLMProvider implements ILLMProvider {
  private providers: { name: string; impl: ILLMProvider; enabled: boolean }[]

  constructor() {
    // Priority: DeepSeek → OpenAI → Groq → Anthropic
    this.providers = [
      { name: 'deepseek', impl: new DeepSeekLLMProvider(), enabled: !!config.deepseekApiKey },
      { name: 'openai', impl: new OpenAILLMProvider(), enabled: !!config.openaiApiKey },
      { name: 'groq', impl: new GroqLLMProvider(), enabled: !!config.groqApiKey },
      { name: 'anthropic', impl: new AnthropicLLMProvider(), enabled: !!config.anthropicApiKey },
    ]
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    const errors: string[] = []
    for (const { name, impl, enabled } of this.providers) {
      if (!enabled) continue
      try {
        logger.info(`LLM: trying ${name}...`)
        const res = await impl.complete(request)
        logger.success(`LLM: using ${name}`)
        return res
      } catch (err: any) {
        const message = err?.message || String(err)
        errors.push(`${name}: ${message}`)
        logger.warn(`LLM: ${name} failed, trying next. Reason: ${message}`)
      }
    }
    throw new Error(`All LLM providers failed. Reasons: ${errors.join(' | ')}`)
  }
}

export function createLLMProvider(): ILLMProvider {
  // Always return a composite so we never fall back to OpenAI first by accident.
  // Priority is enforced inside MultiLLMProvider.
  return new MultiLLMProvider()
}

export { OpenAILLMProvider } from './openai-llm'
export { AnthropicLLMProvider } from './anthropic-llm'
export { GroqLLMProvider } from './groq-llm'
export { DeepSeekLLMProvider } from './deepseek-llm'

