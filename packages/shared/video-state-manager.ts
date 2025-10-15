import { writeFile, readFile, mkdir } from 'fs/promises'
import { join } from 'path'

type InteractionSession = {
  userId: string
  projectId?: number
  jobId?: string
  folderName?: string
  publicUrl?: string
  sandboxPath?: string
  updatedAt: number
}

const DATA_DIR = join(process.cwd(), 'data')
const FILEPATH = join(DATA_DIR, 'interaction_sessions.json')
const store = new Map<string, InteractionSession>()

async function persist(): Promise<void> {
  try {
    await mkdir(DATA_DIR, { recursive: true })
    const obj: Record<string, InteractionSession> = {}
    for (const [k, v] of store.entries()) obj[k] = v
    await writeFile(FILEPATH, JSON.stringify(obj, null, 2), 'utf-8')
  } catch {}
}

async function load(): Promise<void> {
  try {
    const raw = await readFile(FILEPATH, 'utf-8').catch(() => '{}')
    const obj = JSON.parse(raw)
    for (const k of Object.keys(obj)) store.set(k, obj[k])
  } catch {}
}

void load()

export function startInteractionSession(userId: number | string, payload: {
  projectId?: number
  jobId?: string
  folderName?: string
  publicUrl?: string
  sandboxPath?: string
}): void {
  const key = String(userId)
  store.set(key, {
    userId: key,
    ...payload,
    updatedAt: Date.now(),
  })
  void persist()
}

export function getInteractionSession(userId: number | string): InteractionSession | null {
  const s = store.get(String(userId))
  return s || null
}

export function clearInteractionSession(userId: number | string): void {
  store.delete(String(userId))
  void persist()
}

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

