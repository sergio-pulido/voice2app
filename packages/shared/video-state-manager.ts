/**
 * Video Generation State Manager
 * Manages multi-step conversational video generation flow
 */

import { logger } from './logger'

export type VideoGenerationState = 'awaiting_image' | 'awaiting_audio' | 'complete'

interface VideoSession {
  userId: number
  state: VideoGenerationState
  prompt: string
  imagePath?: string
  audioPath?: string
  startedAt: number
}

// In-memory state store (in production, use Redis or a database)
const sessions = new Map<number, VideoSession>()

// Session timeout: 10 minutes
const SESSION_TIMEOUT = 10 * 60 * 1000

/**
 * Start a new video generation session
 */
export function startVideoSession(userId: number, prompt: string): void {
  logger.info(`🎬 Starting video session for user ${userId}`)
  
  sessions.set(userId, {
    userId,
    state: 'awaiting_image',
    prompt,
    startedAt: Date.now()
  })
  
  // Auto-cleanup after timeout
  setTimeout(() => {
    if (sessions.has(userId)) {
      logger.info(`⏱️ Video session timeout for user ${userId}`)
      sessions.delete(userId)
    }
  }, SESSION_TIMEOUT)
}

/**
 * Get current session for user
 */
export function getVideoSession(userId: number): VideoSession | null {
  const session = sessions.get(userId)
  
  if (!session) {
    return null
  }
  
  // Check if session expired
  if (Date.now() - session.startedAt > SESSION_TIMEOUT) {
    logger.warn(`⏱️ Session expired for user ${userId}`)
    sessions.delete(userId)
    return null
  }
  
  return session
}

/**
 * Update session with image path and move to next state
 */
export function setVideoSessionImage(userId: number, imagePath: string): boolean {
  const session = sessions.get(userId)
  
  if (!session || session.state !== 'awaiting_image') {
    logger.warn(`Cannot set image for user ${userId} - wrong state`)
    return false
  }
  
  session.imagePath = imagePath
  session.state = 'awaiting_audio'
  
  logger.info(`🖼️ Image saved for user ${userId}, now awaiting audio`)
  return true
}

/**
 * Update session with audio path and move to next state
 */
export function setVideoSessionAudio(userId: number, audioPath: string): boolean {
  const session = sessions.get(userId)
  
  if (!session || session.state !== 'awaiting_audio') {
    logger.warn(`Cannot set audio for user ${userId} - wrong state`)
    return false
  }
  
  session.audioPath = audioPath
  session.state = 'complete'
  
  logger.info(`🎤 Audio saved for user ${userId}, ready to generate video`)
  return true
}

/**
 * Complete and remove session
 */
export function completeVideoSession(userId: number): void {
  logger.info(`✅ Completing video session for user ${userId}`)
  sessions.delete(userId)
}

/**
 * Cancel session
 */
export function cancelVideoSession(userId: number): void {
  logger.info(`❌ Canceling video session for user ${userId}`)
  sessions.delete(userId)
}

/**
 * Check if user has an active session
 */
export function hasActiveVideoSession(userId: number): boolean {
  return sessions.has(userId)
}

