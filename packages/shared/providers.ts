/**
 * Provider interfaces and types
 */

export type STTProvider = 'openai' | 'elevenlabs'
export type LLMProvider = 'openai' | 'anthropic' | 'groq'
export type TTSProvider = 'openai' | 'elevenlabs'

export interface STTResult {
  text: string
  duration: number
  language?: string
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMRequest {
  messages: LLMMessage[]
  temperature?: number
  maxTokens?: number
}

export interface LLMResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

/**
 * STT Provider Interface
 */
export interface ISTTProvider {
  transcribe(audioBuffer: Buffer): Promise<STTResult>
}

/**
 * LLM Provider Interface
 */
export interface ILLMProvider {
  complete(request: LLMRequest): Promise<LLMResponse>
}

/**
 * TTS Provider Interface
 */
export interface ITTSProvider {
  synthesize(text: string, voice?: string): Promise<Buffer>
}

