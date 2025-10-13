/**
 * Shared package exports
 */

export * from './types'
export * from './config'
export * from './logger'
export * from './providers'
export * from './orchestrator'
export * from './video-state-manager'
export * from './message-splitter'
export * from './prompts'
export * from './snippets'
export * from './banner'

// Admin notification channels (exported separately to avoid circular deps)
// import from './shared/whatsapp' or './shared/discord-admin' directly

