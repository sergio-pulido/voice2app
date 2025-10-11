/**
 * Main orchestrator: coordinates all packages
 */

import { logger } from '../shared'
import { processInput } from '../planner'
import { generateApp } from '../codegen'
import { runApp } from '../runner'
import { analyzeResults } from '../analyzer'
import { sendNotification, sendAcknowledgment, sendError } from '../notifier'

interface OrchestrateOptions {
  chatId: number
  messageId: number
  voiceBuffer?: Buffer
  textMessage?: string
}

export async function orchestrate(options: OrchestrateOptions): Promise<void> {
  const { chatId, messageId, voiceBuffer, textMessage } = options
  
  logger.info('🚀 Starting orchestration...')
  
  try {
    // Send acknowledgment
    await sendAcknowledgment(chatId, voiceBuffer ? 'voice' : 'text')
    
    // Step 1: Planner (STT + Task Planning)
    logger.info('📋 Step 1: Planning...')
    const plannerResult = await processInput(chatId, messageId, voiceBuffer, textMessage)
    
    if (plannerResult.error) {
      throw new Error(`Planning failed: ${plannerResult.error}`)
    }
    
    const task = plannerResult.task
    logger.success(`Task created: ${task.jobId}`)
    
    // Step 2: Codegen
    logger.info('💻 Step 2: Generating code...')
    const codegenResult = await generateApp(task)
    
    if (!codegenResult.success) {
      throw new Error(`Code generation failed: ${codegenResult.error}`)
    }
    
    logger.success(`Generated ${codegenResult.files.length} files`)
    
    // Step 3: Runner
    logger.info('🏃 Step 3: Running app...')
    const runnerResult = await runApp(task, codegenResult.sandboxPath)
    
    // Step 4: Analyzer
    logger.info('📊 Step 4: Analyzing results...')
    const analysisResult = await analyzeResults(task, runnerResult)
    
    // Step 5: Notifier
    logger.info('📨 Step 5: Sending notification...')
    
    // Build notification message
    let message = `*${analysisResult.status === 'success' ? '✅' : analysisResult.status === 'partial' ? '⚠️' : '❌'} ${task.context}*\n\n`
    message += `${analysisResult.summary}\n\n`
    
    if (analysisResult.suggestions.length > 0) {
      message += `*💡 Suggestions:*\n`
      analysisResult.suggestions.forEach((suggestion, i) => {
        message += `${i + 1}. ${suggestion}\n`
      })
    }
    
    if (plannerResult.transcription) {
      message += `\n_Transcribed: "${plannerResult.transcription}"_`
    }
    
    await sendNotification({
      chatId,
      text: message,
      screenshot: runnerResult.screenshot,
      voice: false,
    })
    
    logger.success('🎉 Orchestration complete!')
  } catch (error) {
    logger.error('Orchestration error:', error)
    await sendError(chatId, error instanceof Error ? error.message : 'Unknown error')
  }
}

