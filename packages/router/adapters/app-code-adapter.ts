/**
 * App Code Adapter: Handles app/code generation requests
 * Wraps the existing Voice2App pipeline
 */

import { logger } from '../../shared'
import { processInput } from '../../planner'
import { generateApp } from '../../codegen'
import { runApp } from '../../runner'
import { analyzeResults } from '../../analyzer'
import type { Adapter, AdapterInput, AdapterOutput } from '../types'

export class AppCodeAdapter implements Adapter {
  async run(input: AdapterInput): Promise<AdapterOutput> {
    logger.info('💻 Running App Code adapter...')
    
    const startTime = Date.now()
    
    try {
      // Use the existing Voice2App pipeline
      // This is the core functionality we already built
      
      // Step 1: Planning
      logger.info('📋 Step 1: Planning...')
      const plannerResult = await processInput(
        input.userId,
        0, // messageId not needed for adapter
        input.voiceBuffer,
        input.text
      )
      
      if (plannerResult.error) {
        throw new Error(`Planning failed: ${plannerResult.error}`)
      }
      
      const task = plannerResult.task!
      
      // Step 2: Code Generation
      logger.info('💻 Step 2: Generating code...')
      const codegenResult = await generateApp(task)
      
      if (!codegenResult.success) {
        throw new Error(`Code generation failed: ${codegenResult.error}`)
      }
      
      // Step 3: Running
      logger.info('🏃 Step 3: Running app...')
      const sandboxPath = codegenResult.sandboxPath || `sandbox/${task.jobId}`
      const runnerResult = await runApp(task, sandboxPath)
      
      // Step 4: Analysis
      logger.info('📊 Step 4: Analyzing results...')
      const analysisResult = await analyzeResults(task, runnerResult)
      
      // Build response message
      const statusEmoji = analysisResult.status === 'success' ? '✅' : analysisResult.status === 'partial' ? '⚠️' : '❌'
      
      let message = `${statusEmoji} ${task.context}\n\n`
      message += `${analysisResult.summary}\n\n`
      
      if (analysisResult.suggestions.length > 0) {
        message += `💡 Suggestions:\n`
        analysisResult.suggestions.forEach((suggestion, i) => {
          message += `${i + 1}. ${suggestion}\n`
        })
      }
      
      if (plannerResult.transcription) {
        message += `\nTranscribed: "${plannerResult.transcription}"`
      }
      
      const processingTime = Date.now() - startTime
      
      return {
        summaryText: message,
        ttsText: analysisResult.summary.substring(0, 400), // Shorter for voice
        attachments: runnerResult.screenshot ? [runnerResult.screenshot] : [],
        metadata: {
          category: 'app_code',
          processingTime,
          filesGenerated: codegenResult.files?.length || 0,
          status: analysisResult.status,
          project: task.project,
          intent: task.intent,
          jobId: task.jobId
        }
      }
    } catch (error) {
      logger.error('App Code adapter error:', error)
      
      return {
        summaryText: `❌ Sorry, something went wrong while building your app:\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again!`,
        metadata: {
          category: 'app_code',
          processingTime: Date.now() - startTime,
          status: 'error'
        }
      }
    }
  }
}

export const appCodeAdapter = new AppCodeAdapter()

