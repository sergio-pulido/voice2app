import { writeFile, readFile, mkdir } from 'fs/promises'
import { join } from 'path'

export type InteractionSession = {
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
    console.log('[interaction-state] persisted', FILEPATH, 'count=', Object.keys(obj).length)
  } catch {}
}

async function load(): Promise<void> {
  try {
    const raw = await readFile(FILEPATH, 'utf-8').catch(() => '{}')
    const obj = JSON.parse(raw)
    for (const k of Object.keys(obj)) store.set(k, obj[k])
    console.log('[interaction-state] loaded', FILEPATH, 'count=', store.size)
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


