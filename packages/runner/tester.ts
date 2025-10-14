/**
 * App tester - validates basic app readiness before tunnels/screenshots/analysis
 */

import { logger, type Task } from '../shared'
import { readFile } from 'fs/promises'
import { join } from 'path'

export type TesterResult = {
  success: boolean
  logs: string[]
  errors: string[]
}

export async function testApp(task: Task, url: string, sandboxPath: string): Promise<TesterResult> {
  logger.job(task.jobId, 'Starting tester...')
  const logs: string[] = []
  const errors: string[] = []

  // 1) Fetch root and ensure 2xx
  try {
    const res = await fetch(url + '/', { signal: AbortSignal.timeout(3000) })
    logs.push(`[TEST] GET / -> ${res.status}`)
    if (!res.ok) {
      errors.push('Root path did not return 2xx')
      return { success: false, logs, errors }
    }
    const html = await res.text()
    // 2) Extract module script and fetch
    const m = html.match(/<script[^>]*type="module"[^>]*src="([^"]+)"/i)
    const scriptSrc = m?.[1]
    if (!scriptSrc) {
      errors.push('No module script found in index.html')
      return { success: false, logs, errors }
    }
    const scriptRes = await fetch(url + scriptSrc, { signal: AbortSignal.timeout(3000) })
    logs.push(`[TEST] GET ${scriptSrc} -> ${scriptRes.status}`)
    if (!scriptRes.ok) {
      errors.push(`Module script ${scriptSrc} did not return 2xx`)
      return { success: false, logs, errors }
    }
  } catch (e: any) {
    const msg = e?.message || 'Unknown fetch error'
    errors.push(`Tester fetch error: ${msg}`)
    return { success: false, logs, errors }
  }

  // 3) Optional: tsconfig sanity check (no references field)
  try {
    const tsconfigPath = join(sandboxPath, 'tsconfig.json')
    const txt = await readFile(tsconfigPath, 'utf-8')
    const ts = JSON.parse(txt)
    if (ts?.references) {
      logs.push('[TEST] tsconfig has references field - may trigger tsconfig.node.json lookup')
    }
  } catch {
    // ignore
  }

  return { success: true, logs, errors }
}