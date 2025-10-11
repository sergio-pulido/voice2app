/**
 * Main entry point - re-exports from packages
 * @deprecated Use server.ts to start the application
 */

export { default as app } from './packages/telegram-gateway'
export { orchestrate } from './packages/telegram-gateway/orchestrator'
export { processInput } from './packages/planner'
export { generateApp } from './packages/codegen'
export { runApp } from './packages/runner'
export { analyzeResults } from './packages/analyzer'
export { sendNotification } from './packages/notifier'

// For backward compatibility
export { setupWebhook as setupTelegramWebhook } from './packages/telegram-gateway/telegram-client'
