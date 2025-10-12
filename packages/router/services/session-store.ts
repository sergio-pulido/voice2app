/**
 * Session Store: Simple in-memory storage for user sessions
 * Stores app URLs and context for interactive testing
 */

import { logger } from '../../shared'

interface UserSession {
  userId: string
  appUrl?: string
  appContext?: string
  jobId?: string
  sandboxPath?: string
  lastUpdated: number
}

// Simple in-memory store (in production, use Redis or database)
const sessions = new Map<string, UserSession>()

// Session expiry time (1 hour)
const SESSION_EXPIRY = 60 * 60 * 1000

export function setUserAppSession(
  userId: string,
  appUrl: string,
  appContext: string,
  jobId: string,
  sandboxPath?: string
): void {
  logger.debug(`Setting app session for user ${userId}: ${appUrl}`)
  
  sessions.set(userId, {
    userId,
    appUrl,
    appContext,
    jobId,
    sandboxPath,
    lastUpdated: Date.now()
  })
}

export function getUserAppSession(userId: string): UserSession | null {
  const session = sessions.get(userId)
  
  if (!session) {
    return null
  }
  
  // Check if session expired
  if (Date.now() - session.lastUpdated > SESSION_EXPIRY) {
    logger.debug(`Session expired for user ${userId}`)
    sessions.delete(userId)
    return null
  }
  
  return session
}

export function clearUserSession(userId: string): void {
  logger.debug(`Clearing session for user ${userId}`)
  sessions.delete(userId)
}

export function updateSessionTimestamp(userId: string): void {
  const session = sessions.get(userId)
  if (session) {
    session.lastUpdated = Date.now()
  }
}

// Cleanup expired sessions periodically
setInterval(() => {
  const now = Date.now()
  for (const [userId, session] of sessions.entries()) {
    if (now - session.lastUpdated > SESSION_EXPIRY) {
      sessions.delete(userId)
      logger.debug(`Cleaned up expired session for user ${userId}`)
    }
  }
}, 5 * 60 * 1000) // Clean up every 5 minutes
