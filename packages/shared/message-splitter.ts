/**
 * Message Splitter: Handles message length limits for different channels
 */

import { logger } from './logger'
import { createLLMProvider } from '../codegen/providers'

export interface ChannelLimits {
  maxLength: number
  maxMessages: number
  name: string
}

export const CHANNEL_LIMITS: Record<string, ChannelLimits> = {
  telegram: {
    maxLength: 4096,
    maxMessages: 5,
    name: 'Telegram'
  },
  whatsapp: {
    maxLength: 4096,
    maxMessages: 5,
    name: 'WhatsApp'
  },
  discord: {
    maxLength: 2000,
    maxMessages: 5,
    name: 'Discord'
  },
  slack: {
    maxLength: 4000,
    maxMessages: 5,
    name: 'Slack'
  },
  default: {
    maxLength: 4096,
    maxMessages: 5,
    name: 'Default'
  }
}

export interface MessageSplitResult {
  messages: string[]
  needsSplitting: boolean
  originalLength: number
  channel: string
}

/**
 * Intelligently split a message for a specific channel using LLM
 */
export async function splitMessageForChannel(
  message: string,
  channel: string = 'default'
): Promise<MessageSplitResult> {
  const limits = CHANNEL_LIMITS[channel] || CHANNEL_LIMITS.default
  const originalLength = message.length
  
  logger.debug(`Checking message length for ${limits.name}: ${originalLength}/${limits.maxLength} chars`)
  
  // If message is within limits, return as-is
  if (originalLength <= limits.maxLength) {
    return {
      messages: [message],
      needsSplitting: false,
      originalLength,
      channel
    }
  }
  
  logger.info(`Message too long for ${limits.name}, splitting with LLM...`)
  
  try {
    const llm = createLLMProvider()
    
    const prompt = [
      {
        role: 'system' as const,
        content: `You are an expert at splitting long messages into smaller, coherent parts while preserving all important information.

TASK: Split the given message into multiple smaller messages that fit within the character limit.

RULES:
1. Maximum ${limits.maxLength} characters per message
2. Maximum ${limits.maxMessages} messages total
3. Each message must be understandable by itself
4. Don't cut words or sentences in the middle
5. If a message needs continuation, end with "..." and start the next with "..."
6. Preserve all important information (no content loss)
7. Maintain the original tone and formatting
8. Keep code blocks, links, and special formatting intact when possible

CRITICAL: Return ONLY a valid JSON array of strings. Do not include markdown backticks, explanations, or any other text. Just the JSON array.

Example: ["Part 1 content...", "...Part 2 content"]`
      },
      {
        role: 'user' as const,
        content: `Split this message for ${limits.name} (max ${limits.maxLength} chars per message, max ${limits.maxMessages} messages):

${message}`
      }
    ]
    
    const response = await llm.complete({
      messages: prompt,
      temperature: 0.1,
      maxTokens: 2000
    })
    
    try {
      // Clean the response - remove any markdown backticks or extra text
      let cleanResponse = response.content.trim()
      
      // Remove markdown code blocks if present
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      // Remove any leading/trailing text that's not JSON
      const jsonMatch = cleanResponse.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        cleanResponse = jsonMatch[0]
      }
      
      const messages = JSON.parse(cleanResponse)
      
      if (!Array.isArray(messages) || messages.length === 0) {
        throw new Error('Invalid response format')
      }
      
      // Validate each message
      const validMessages = messages.filter((msg: string) => {
        if (typeof msg !== 'string') return false
        if (msg.length > limits.maxLength) {
          logger.warn(`Message part too long: ${msg.length}/${limits.maxLength} chars`)
          return false
        }
        return true
      })
      
      if (validMessages.length === 0) {
        throw new Error('No valid message parts generated')
      }
      
      // Limit to max messages
      const finalMessages = validMessages.slice(0, limits.maxMessages)
      
      logger.success(`Split message into ${finalMessages.length} parts for ${limits.name}`)
      
      return {
        messages: finalMessages,
        needsSplitting: true,
        originalLength,
        channel
      }
      
    } catch (parseError) {
      logger.error('Failed to parse LLM split response:', parseError)
      logger.debug('LLM response:', response.content)
      
      // Fallback: simple text splitting
      return fallbackSplit(message, limits)
    }
    
  } catch (error) {
    logger.error('LLM message splitting failed:', error)
    
    // Fallback: simple text splitting
    return fallbackSplit(message, limits)
  }
}

/**
 * Fallback method for splitting messages when LLM fails
 */
function fallbackSplit(message: string, limits: ChannelLimits): MessageSplitResult {
  logger.info(`Using fallback splitting for ${limits.name}`)
  
  const messages: string[] = []
  const maxLength = limits.maxLength - 100 // Leave some buffer for continuation markers
  
  let remaining = message
  let messageCount = 0
  
  while (remaining.length > 0 && messageCount < limits.maxMessages) {
    if (remaining.length <= maxLength) {
      messages.push(remaining)
      break
    }
    
    // Find the last complete sentence or line break within the limit
    let splitPoint = maxLength
    const lastSentence = remaining.lastIndexOf('.', maxLength)
    const lastLineBreak = remaining.lastIndexOf('\n', maxLength)
    const lastSpace = remaining.lastIndexOf(' ', maxLength)
    
    // Prefer sentence breaks, then line breaks, then word breaks
    if (lastSentence > maxLength * 0.7) {
      splitPoint = lastSentence + 1
    } else if (lastLineBreak > maxLength * 0.7) {
      splitPoint = lastLineBreak + 1
    } else if (lastSpace > maxLength * 0.7) {
      splitPoint = lastSpace
    }
    
    const part = remaining.substring(0, splitPoint).trim()
    
    // Add continuation markers if needed
    if (messageCount < limits.maxMessages - 1 && remaining.length > splitPoint) {
      messages.push(part + '...')
    } else {
      messages.push(part)
    }
    
    remaining = remaining.substring(splitPoint).trim()
    messageCount++
  }
  
  // If we still have remaining text and haven't hit the message limit, add it
  if (remaining.length > 0 && messageCount < limits.maxMessages) {
    messages.push('...' + remaining)
  }
  
  return {
    messages,
    needsSplitting: true,
    originalLength: message.length,
    channel: limits.name
  }
}

/**
 * Get channel limits for a specific channel
 */
export function getChannelLimits(channel: string): ChannelLimits {
  return CHANNEL_LIMITS[channel] || CHANNEL_LIMITS.default
}

/**
 * Check if a message needs splitting for a channel
 */
export function needsSplitting(message: string, channel: string = 'default'): boolean {
  const limits = getChannelLimits(channel)
  return message.length > limits.maxLength
}
