/**
 * Planner package: STT + natural-language to JSON task
 */

import { config, logger, type Task, type STTResult, type PlannerResult } from '../shared'
import { transcribeAudio } from './stt'
import { planTask } from './task-planner'

export async function processInput(
  chatId: number,
  messageId: number,
  voiceBuffer?: Buffer,
  textMessage?: string
): Promise<PlannerResult> {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  logger.job(jobId, 'Starting planner...')
  
  try {
    let transcription: string
    
    // If voice, transcribe first
    if (voiceBuffer) {
      logger.job(jobId, 'Transcribing voice message...')
      const sttResult = await transcribeAudio(voiceBuffer)
      transcription = sttResult.text
      logger.success(`Transcription: "${transcription}"`)
    } else if (textMessage) {
      transcription = textMessage
      logger.job(jobId, `Using text message: "${transcription}"`)
    } else {
      throw new Error('No voice or text input provided')
    }
    
    // Plan the task from transcription
    logger.job(jobId, 'Planning task from input...')
    const task = await planTask(transcription, jobId, chatId, messageId)
    
    logger.success(`Task planned for project: ${task.project}, intent: ${task.intent}`)
    
    return {
      task,
      transcription,
    }
  } catch (error) {
    logger.error(`Planner error for job ${jobId}:`, error)
    
    // Return a fallback task
    return {
      task: {
        jobId,
        intent: 'create',
        project: 'unknown',
        context: 'Failed to process input',
        checks: [],
        template: { id: 'none', confidence: 0, rationale: '', entryPoints: [], healthcheckPath: '/healthz' },
        runtime: { port: 5173, mustKeepPort: true, mustKeepScripts: true, deterministic: true },
        artifact: { screenshot: false, logs: true },
        chatId,
        messageId,
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export { transcribeAudio } from './stt'
export { planTask } from './task-planner'

