/**
 * Session Store: Simple in-memory storage for user sessions
 * Stores app URLs and context for interactive testing
 */

import { logger } from '../../shared'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'

interface UserSession {
  userId: string
  appUrl?: string
  appContext?: string
  jobId?: string
  sandboxPath?: string
  screenshotPath?: string
  appCode?: string
  lastUpdated: number
}

// Simple in-memory store with file persistence (in production, use Redis)
const sessions = new Map<string, UserSession>()

// Separate in-memory store for project list pagination state
interface ProjectListState {
  page: number
  pageSize: number
  lastUpdated: number
}

const projectListSessions = new Map<string, ProjectListState>()

const DATA_DIR = join(process.cwd(), 'data')
const SESSIONS_FILE = join(DATA_DIR, 'sessions.json')
const PROJECT_PAGES_FILE = join(DATA_DIR, 'project_pages.json')

async function persist(): Promise<void> {
  try {
    await mkdir(DATA_DIR, { recursive: true })
    const sessionsObj: Record<string, UserSession> = {}
    for (const [k, v] of sessions.entries()) sessionsObj[k] = v
    await writeFile(SESSIONS_FILE, JSON.stringify(sessionsObj, null, 2), 'utf-8')
    console.log('[session-store] persisted sessions to', SESSIONS_FILE, 'count=', Object.keys(sessionsObj).length)
    const pagesObj: Record<string, ProjectListState> = {}
    for (const [k, v] of projectListSessions.entries()) pagesObj[k] = v
    await writeFile(PROJECT_PAGES_FILE, JSON.stringify(pagesObj, null, 2), 'utf-8')
    console.log('[session-store] persisted project pages to', PROJECT_PAGES_FILE, 'count=', Object.keys(pagesObj).length)
  } catch (e) {
    logger.debug('Failed to persist sessions:', e)
  }
}

async function loadPersisted(): Promise<void> {
  try {
    const raw = await readFile(SESSIONS_FILE, 'utf-8').catch(() => '{}')
    const obj = JSON.parse(raw)
    for (const k of Object.keys(obj)) sessions.set(k, obj[k])
    console.log('[session-store] loaded sessions from', SESSIONS_FILE, 'count=', sessions.size)
  } catch {}
  try {
    const raw = await readFile(PROJECT_PAGES_FILE, 'utf-8').catch(() => '{}')
    const obj = JSON.parse(raw)
    for (const k of Object.keys(obj)) projectListSessions.set(k, obj[k])
    console.log('[session-store] loaded project pages from', PROJECT_PAGES_FILE, 'count=', projectListSessions.size)
  } catch {}
}

// Load persisted sessions on module init
void loadPersisted()

// Session expiry time (1 hour)
const SESSION_EXPIRY = 60 * 60 * 1000

export function setUserAppSession(
  userId: string,
  appUrl: string,
  appContext: string,
  jobId: string,
  sandboxPath?: string,
  screenshotPath?: string,
  appCode?: string
): void {
  logger.debug(`Setting app session for user ${userId}: ${appUrl}`)
  
  sessions.set(userId, {
    userId,
    appUrl,
    appContext,
    jobId,
    sandboxPath,
    screenshotPath,
    appCode,
    lastUpdated: Date.now()
  })
  console.log('[session-store] setUserAppSession', { userId, appUrl, jobId, sandboxPath })
  void persist()
}

export function getUserAppSession(userId: string): UserSession | null {
  console.log('sessions', sessions)
  console.log('userId', userId)
  
  const session = sessions.get(userId)
  console.log('session', session)

  if (!session) {
    console.log('[session-store] no session for', userId)
    return null
  }
  
  // Check if session expired
  const now = Date.now()
  const timeDiff = now - session.lastUpdated
  const sessionExpired = timeDiff > SESSION_EXPIRY
  console.log({ sessionExpired, timeDiff, session })
  if (sessionExpired) {
    logger.debug(`Session expired for user ${userId}`)
    sessions.delete(userId)
    void persist()
    return null
  }
  
  console.log('[session-store] getUserAppSession OK', { userId, appUrl: session.appUrl, jobId: session.jobId, sandboxPath: session.sandboxPath })
  return session
}

export function clearUserSession(userId: string): void {
  logger.debug(`Clearing session for user ${userId}`)
  sessions.delete(userId)
  void persist()
}

export function updateSessionTimestamp(userId: string): void {
  const session = sessions.get(userId)
  if (session) {
    session.lastUpdated = Date.now()
    void persist()
  }
}

// Project list pagination helpers
export function setUserProjectListState(userId: string, page: number, pageSize: number): void {
  projectListSessions.set(userId, {
    page,
    pageSize,
    lastUpdated: Date.now()
  })
  void persist()
}

export function getUserProjectListState(userId: string): ProjectListState | null {
  const state = projectListSessions.get(userId)
  if (!state) return null
  // Expire after 1 hour to match session expiry
  if (Date.now() - state.lastUpdated > SESSION_EXPIRY) {
    projectListSessions.delete(userId)
    void persist()
    return null
  }
  return state
}

export function clearUserProjectListState(userId: string): void {
  projectListSessions.delete(userId)
  void persist()
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
  void persist()
}, 5 * 60 * 1000) // Clean up every 5 minutes

// Cleanup expired project list states periodically
setInterval(() => {
  const now = Date.now()
  for (const [userId, state] of projectListSessions.entries()) {
    if (now - state.lastUpdated > SESSION_EXPIRY) {
      projectListSessions.delete(userId)
      logger.debug(`Cleaned up expired project list state for user ${userId}`)
    }
  }
  void persist()
}, 5 * 60 * 1000)
