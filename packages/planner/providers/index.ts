/**
 * STT Provider Factory
 */

import { config, type ISTTProvider } from '../../shared'
import { OpenAISTTProvider } from './openai-stt'
import { ElevenLabsSTTProvider } from './elevenlabs-stt'

export function createSTTProvider(): ISTTProvider {
  switch (config.sttProvider) {
    case 'openai':
      return new OpenAISTTProvider()
    case 'elevenlabs':
      return new ElevenLabsSTTProvider()
    default:
      throw new Error(`Unknown STT provider: ${config.sttProvider}`)
  }
}

export { OpenAISTTProvider } from './openai-stt'
export { ElevenLabsSTTProvider } from './elevenlabs-stt'

