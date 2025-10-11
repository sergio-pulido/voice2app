/**
 * Lingo.dev Translation Service
 */

import { config } from '../../shared/config'
import { logger } from '../../shared/logger'

const BASE = 'https://api.lingo.dev/v1'
const KEY = config.lingoApiKey

async function call(path: string, body: any) {
  if (!KEY) {
    throw new Error('LINGODEV_API_KEY not configured')
  }
  
  const r = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${KEY}`
    },
    body: JSON.stringify(body)
  })
  
  if (!r.ok) {
    const errorText = await r.text()
    throw new Error(`Lingo ${path} ${r.status}: ${errorText}`)
  }
  
  return r.json()
}

export async function detectLanguage(text: string): Promise<string> {
  try {
    logger.debug(`🔍 Detecting language for: "${text.substring(0, 50)}..."`)
    const res: any = await call('/detect', { text })
    const lang = res.language || res.lang || 'en'
    logger.debug(`🌍 Detected language: ${lang}`)
    return lang
  } catch (error) {
    logger.warn('Language detection failed, defaulting to English:', error)
    return 'en'
  }
}

export async function translate(text: string, targetLang: string, opts?: { style?: string }): Promise<string> {
  try {
    logger.debug(`🌐 Translating to ${targetLang}: "${text.substring(0, 50)}..."`)
    const res: any = await call('/translate', { 
      text, 
      target: targetLang, 
      style: opts?.style || config.lingoStyle || 'friendly'
    })
    const translated = res.text || res.translation || text
    logger.debug(`✅ Translation result: "${translated.substring(0, 50)}..."`)
    return translated
  } catch (error) {
    logger.warn('Translation failed, returning original text:', error)
    return text
  }
}

export async function normalizeInput(text: string, target = config.lingoDefaultTarget || 'en') {
  try {
    const lang = await detectLanguage(text)
    if (lang.toLowerCase() === target.toLowerCase()) {
      return { detectedLang: lang, translatedText: text }
    }
    const translatedText = await translate(text, target, { style: 'concise' })
    return { detectedLang: lang, translatedText }
  } catch (error) {
    logger.warn('Input normalization failed, using original text:', error)
    return { detectedLang: 'en', translatedText: text }
  }
}

// Optional: terminology memory per project
export async function upsertTerminology(projectId: string, terms: Array<{ source: string; target: string }>) {
  try {
    await call('/memory/upsert', { namespace: projectId, terms })
    logger.success(`📚 Terminology updated for project: ${projectId}`)
  } catch (error) {
    logger.warn('Terminology update failed:', error)
  }
}
