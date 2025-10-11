/**
 * Main orchestrator: coordinates all packages
 */

import { logger, config } from '../shared'
import { sendWhatsAppMessage } from '../shared/whatsapp'
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
  username?: string
}

/**
 * Send detailed admin notification to WhatsApp
 */
async function sendAdminNotification(message: string): Promise<void> {
  if (config.vonageWhatsAppTo) {
    await sendWhatsAppMessage({
      to: config.vonageWhatsAppTo,
      text: message
    })
  }
}

export async function orchestrate(options: OrchestrateOptions): Promise<void> {
  const { chatId, messageId, voiceBuffer, textMessage, username } = options
  
  const startTime = Date.now()
  logger.info('🚀 Starting orchestration...')
  
  try {
    // Send acknowledgment to Telegram
    await sendAcknowledgment(chatId, voiceBuffer ? 'voice' : 'text')
    
    // Send detailed admin notification to WhatsApp
    const messageType = voiceBuffer ? 'voice' : 'text'
    const inputPreview = textMessage || (voiceBuffer ? `[Voice: ${Math.round(voiceBuffer.length / 1024)}KB]` : '[No input]')
    
    await sendAdminNotification(
      `🔔 NEW REQUEST\n` +
      `👤 User: ${username || 'Unknown'} (${chatId})\n` +
      `📱 Type: ${messageType === 'voice' ? '🎤 Voice' : '📝 Text'}\n` +
      `💬 Input: ${inputPreview.substring(0, 100)}${inputPreview.length > 100 ? '...' : ''}\n` +
      `⏰ Started: ${new Date().toLocaleTimeString()}\n` +
      `🔄 Status: Processing...`
    )
    
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
      voice: !!voiceBuffer,  // Send voice reply if input was voice
    })
    
    // Send detailed admin notification to WhatsApp
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(1)
    const statusEmoji = analysisResult.status === 'success' ? '✅' : analysisResult.status === 'partial' ? '⚠️' : '❌'
    
    await sendAdminNotification(
      `${statusEmoji} REQUEST COMPLETED\n` +
      `👤 User: ${username || 'Unknown'} (${chatId})\n` +
      `📋 Task: ${task.context}\n` +
      `⏱️  Time: ${processingTime}s\n` +
      `📊 Status: ${analysisResult.status.toUpperCase()}\n` +
      `📦 Files: ${codegenResult.files?.length || 0} generated\n` +
      `🎯 Project: ${task.project || 'N/A'}\n` +
      `🔧 Intent: ${task.intent || 'N/A'}\n` +
      (plannerResult.transcription ? `🎤 Transcription: "${plannerResult.transcription}"\n` : '') +
      `\n📝 Summary:\n${analysisResult.summary.substring(0, 200)}${analysisResult.summary.length > 200 ? '...' : ''}\n` +
      (analysisResult.suggestions.length > 0 ? `\n💡 Suggestions: ${analysisResult.suggestions.length} provided` : '')
    )
    
    logger.success('🎉 Orchestration complete!')
  } catch (error) {
    logger.error('Orchestration error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(1)
    
    // Send error to Telegram (customer)
    await sendError(chatId, errorMessage)
    
    // Send detailed error notification to WhatsApp (admin)
    await sendAdminNotification(
      `❌ REQUEST FAILED\n` +
      `👤 User: ${username || 'Unknown'} (${chatId})\n` +
      `⏱️  Time: ${processingTime}s\n` +
      `💬 Input: ${textMessage?.substring(0, 100) || '[Voice message]'}\n` +
      `\n🔴 Error:\n${errorMessage}\n` +
      (errorStack ? `\n📋 Stack (first 200 chars):\n${errorStack.substring(0, 200)}...` : '') +
      `\n⏰ Failed at: ${new Date().toLocaleTimeString()}`
    )
  }
}

