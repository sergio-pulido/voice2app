/**
 * App Code Adapter: Handles app/code generation requests
 * Wraps the existing Voice2App pipeline
 */

import { logger } from '../../shared'
import { processInput } from '../../planner'
import { generateApp } from '../../codegen'
import { runApp } from '../../runner'
import { analyzeResults } from '../../analyzer'
import { setUserAppSession } from '../services/session-store'
import { addProject } from '../../shared/project-db'
import { createLLMProvider } from '../../codegen/providers'
import type { Adapter, AdapterInput, AdapterOutput } from '../types'

export class AppCodeAdapter implements Adapter {
  private extractTitle(context: string): string {
    // Extract a clean title from the context
    const words = context.split(' ')
    if (words.length <= 5) {
      return context
    }
    
    // Look for common patterns
    const patterns = [
      /generate\s+(?:a\s+)?(.+?)(?:\s+with|\s+that|\s+for|$)/i,
      /create\s+(?:a\s+)?(.+?)(?:\s+with|\s+that|\s+for|$)/i,
      /build\s+(?:a\s+)?(.+?)(?:\s+with|\s+that|\s+for|$)/i,
      /make\s+(?:a\s+)?(.+?)(?:\s+with|\s+that|\s+for|$)/i
    ]
    
    for (const pattern of patterns) {
      const match = context.match(pattern)
      if (match && match[1]) {
        return match[1].trim()
      }
    }
    
    // Fallback: first 5 words
    return words.slice(0, 5).join(' ')
  }
  
  private extractDescription(context: string): string {
    // Clean up the context for a better description
    return context
      .replace(/^(generate|create|build|make)\s+(?:a\s+)?/i, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

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
      
      // Add public URL right after summary if available (even for failed apps)
      if (runnerResult.publicUrl) {
        message += `🌐 **Try your app here**: ${runnerResult.publicUrl}\n`
        message += `_Note: The link will work for a few hours_\n\n`
      }
      
      // Add interactive choices for successful apps
      if (analysisResult.status === 'success' && runnerResult.url) {
        message += `🎮 What would you like to do next?\n\n`
        // message += `1️⃣ Test the app - Ask me to interact with it (e.g., "add 2+5", "play the game")\n`
        // message += `2️⃣ Close - We're done here\n\n`
        // message += `Just tell me what you want to test! 🚀\n\n`
      } else {
        if (analysisResult.suggestions.length > 0) {
          message += `💡 Suggestions:\n`
          analysisResult.suggestions.forEach((suggestion, i) => {
            message += `${i + 1}. ${suggestion}\n`
          })
        }
      }
      
      if (plannerResult.transcription) {
        message += `\nTranscribed: "${plannerResult.transcription}"`
      }
      
      // Store session data for interactive testing
      if (analysisResult.status === 'success' && runnerResult.url) {
        // Try to read the main app code for better test generation
        let appCode: string | undefined
        try {
          const { readFile } = await import('fs/promises')
          const { join } = await import('path')
          const appCodePath = join(codegenResult.sandboxPath, 'src', 'App.tsx')
          appCode = await readFile(appCodePath, 'utf-8')
        } catch (error) {
          // App code not available, continue without it
          logger.debug('Could not read app code for session:', error)
        }
        
        setUserAppSession(
          input.userId,
          runnerResult.url,
          task.context,
          task.jobId,
          codegenResult.sandboxPath,
          runnerResult.screenshot,
          appCode
        )
      }
      
      // Save project to database
      try {
        const folderName = codegenResult.sandboxPath.split('/').pop() || task.jobId
        let title = this.extractTitle(task.context)
        let description = this.extractDescription(task.context)
        let summary = analysisResult.summary

        // Enrich metadata with LLM if needed
        try {
          const llm = createLLMProvider()
          const prompt = [
            { role: 'system', content: 'You generate concise metadata for an app project log. Return strict JSON with keys: title (≤60 chars), description (one short line ≤140 chars), summary (2-4 sentences). Do not include markdown, backticks, or extra text.' },
            { role: 'user', content: `Task context: ${task.context}\nStatus: ${analysisResult.status}\nAnalysis summary: ${analysisResult.summary || 'N/A'}\nBuild errors: ${(runnerResult.errors || []).join('\n').slice(0, 1000)}` }
          ]
          const completion = await llm.complete({ messages: prompt, temperature: 0.2, maxTokens: 300 })
          try {
            const parsed = JSON.parse(completion.content.trim()) as { title?: string; description?: string; summary?: string }
            if (parsed.title) title = parsed.title
            if (parsed.description) description = parsed.description
            if (parsed.summary) summary = parsed.summary
          } catch {}
        } catch (e) {
          // LLM unavailable, proceed with extracted values
        }
        
        await addProject({
          jobId: task.jobId,
          folderName,
          userId: input.userId,
          title,
          description,
          summary,
          screenshotPath: runnerResult.screenshot,
          publicUrl: runnerResult.publicUrl,
          status: analysisResult.status
        })
      } catch (error) {
        logger.error('Failed to save project to database:', error)
        // Don't fail the entire request if project saving fails
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
          jobId: task.jobId,
          // Store app info for interactive testing
          appUrl: runnerResult.url,
          appContext: task.context,
          sandboxPath: codegenResult.sandboxPath
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

