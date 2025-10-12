/**
 * App Interaction Adapter: Handles testing/interaction requests for generated apps
 */

import { logger } from '../../shared'
import { testAppWithInteraction } from '../../runner/app-interactor'
import { serveApp } from '../../runner/server'
import { getUserAppSession, updateSessionTimestamp } from '../services/session-store'
import type { Adapter, AdapterInput, AdapterOutput } from '../types'

export class AppInteractionAdapter implements Adapter {
  async run(input: AdapterInput): Promise<AdapterOutput> {
    logger.info('🎮 Running App Interaction adapter...')
    
    const startTime = Date.now()
    
    try {
      // Get app session data
      const session = getUserAppSession(input.userId)
      
      if (!session || !session.appUrl) {
        return {
          summaryText: `❌ No active app found. Please generate an app first!\n\n💡 Try saying: "Create a calculator app" or "Generate a todo list"`,
          metadata: {
            category: 'app_interaction',
            processingTime: Date.now() - startTime,
            status: 'error'
          }
        }
      }
      
      // Update session timestamp
      updateSessionTimestamp(input.userId)
      
      const { appUrl, appContext, jobId, sandboxPath } = session
      
      logger.info(`Testing app with request: ${input.text}`)
      
      // Start server if needed (the URL might be stale)
      let workingUrl = appUrl
      try {
        // Try to connect to existing URL
        const response = await fetch(appUrl, { signal: AbortSignal.timeout(2000) })
        if (!response.ok) {
          throw new Error('Server not responding')
        }
      } catch (error) {
        // Server not running, start it
        logger.info(`Starting server for job ${jobId}...`)
        const serveResult = await serveApp(sandboxPath || `sandbox/${jobId}`, jobId)
        
        if (!serveResult.success || !serveResult.url) {
          return {
            summaryText: `❌ Could not start the app server. The app might have been cleaned up. Please generate a new app.`,
            metadata: {
              category: 'app_interaction',
              processingTime: Date.now() - startTime,
              status: 'error'
            }
          }
        }
        
        workingUrl = serveResult.url
        logger.info(`App server restarted at ${workingUrl}`)
      }
      
      // Test the app with user's request
      const screenshotPath = await testAppWithInteraction(
        workingUrl,
        jobId,
        input.text || '',
        appContext
      )
      
      if (!screenshotPath) {
        return {
          summaryText: `❌ Could not test the app with your request. The app might not be running or the request wasn't understood.`,
          metadata: {
            category: 'app_interaction',
            processingTime: Date.now() - startTime,
            status: 'error'
          }
        }
      }
      
      const message = `🎮 App Test Complete!\n\n` +
        `✅ Successfully tested: "${input.text}"\n\n` +
        `Here's what happened:\n` +
        `• App: ${appContext}\n` +
        `• Action: ${input.text}\n` +
        `• Result: See screenshot below! 📸\n\n` +
        `Want to test something else? Just ask! 🚀`
      
      return {
        summaryText: message,
        ttsText: `Successfully tested the app with your request`,
        attachments: [screenshotPath],
        metadata: {
          category: 'app_interaction',
          processingTime: Date.now() - startTime,
          status: 'success',
          appUrl,
          appContext,
          jobId
        }
      }
    } catch (error) {
      logger.error('App Interaction adapter error:', error)
      
      return {
        summaryText: `❌ Sorry, couldn't test the app:\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\nTry asking for something simpler!`,
        metadata: {
          category: 'app_interaction',
          processingTime: Date.now() - startTime,
          status: 'error'
        }
      }
    }
  }
}

export const appInteractionAdapter = new AppInteractionAdapter()
