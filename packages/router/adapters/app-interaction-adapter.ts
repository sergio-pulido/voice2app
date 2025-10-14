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
      
      const { appUrl, appContext, jobId, sandboxPath, screenshotPath, appCode } = session
      
      // Clean up numbered requests (e.g., "1. add 3+56" → "add 3+56")
      let cleanRequest = input.text || ''
      if (/^\s*\d+\.\s*/.test(cleanRequest)) {
        cleanRequest = cleanRequest.replace(/^\s*\d+\.\s*/, '')
        logger.info(`Cleaned request: "${input.text}" → "${cleanRequest}"`)
      }
      
      logger.info(`Testing app with request: ${cleanRequest}`)
      
      // Start server if needed (the URL might be stale)
      let workingUrl = appUrl
      try {
        // Try to connect to existing URL with longer timeout
        logger.info(`Checking if app server is running at ${appUrl}...`)
        const response = await fetch(appUrl, { 
          signal: AbortSignal.timeout(5000),
          headers: { 'User-Agent': 'Voice2App-Tester' }
        })
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`)
        }
        logger.info('✅ App server is running')
      } catch (error) {
        // Server not running, start it
        logger.warn(`❌ Server not accessible: ${error.message}`)
        logger.info(`Starting server for job ${jobId}...`)
        
        try {
          const serveResult = await serveApp(sandboxPath || `sandbox/${jobId}`, jobId)

          if (!serveResult.success || !serveResult.url) {
            return {
              summaryText: `❌ Could not start the app server. The app might have been cleaned up.\n\n💡 Please generate a new app by saying: "Create a calculator app"`,
              metadata: {
                category: 'app_interaction',
                processingTime: Date.now() - startTime,
                status: 'error'
              }
            }
          }

          workingUrl = serveResult.url
          logger.info(`✅ App server restarted at ${workingUrl}`)
        } catch (serveError) {
          logger.error('Failed to start server:', serveError)
          return {
            summaryText: `❌ Could not start the app server. Please generate a new app.\n\n💡 Try saying: "Create a calculator app"`,
            metadata: {
              category: 'app_interaction',
              processingTime: Date.now() - startTime,
              status: 'error'
            }
          }
        }
      }
      
      // Test the app with user's request
      const videoPath = await testAppWithInteraction(
        workingUrl,
        jobId,
        cleanRequest,
        appContext,
        screenshotPath,
        appCode
      )
      
      if (!videoPath) {
        return {
          summaryText: `❌ Could not test the app with your request: "${cleanRequest}"\n\n🔍 Possible issues:\n• The app might not be running\n• The request wasn't understood\n• The app interface changed`,
          metadata: {
            category: 'app_interaction',
            processingTime: Date.now() - startTime,
            status: 'error'
          }
        }
      }
      
      const message = `🎮 App Test Complete!\n\n` +
        `✅ Successfully tested: "${cleanRequest}"\n\n` +
        `Here's what happened:\n` +
        `• App: ${appContext}\n` +
        `• Action: ${cleanRequest}\n` +
        `• Result: See video below! 🎥\n\n` +
        `Want to test something else? Just ask! 🚀`
      
      return {
        summaryText: message,
        ttsText: `Successfully tested the app with your request`,
        attachments: [videoPath],
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
