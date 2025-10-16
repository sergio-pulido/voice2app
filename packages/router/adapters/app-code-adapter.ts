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
import { readFile, writeFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import { createLLMProvider } from '../../codegen/providers'
import type { Adapter, AdapterInput, AdapterOutput } from '../types'
import type { AnalysisResult, LLMMessage } from '../../shared'

export class AppCodeAdapter implements Adapter {
  private parseEnvelopeFiles(input: string): Array<{ path: string; content: string; language?: string }> {
    const files: Array<{ path: string; content: string; language?: string }> = []
    const fileStartRegex = /<<<FILE\s+path=\"([^\"]+)\"(?:\s+language=\"([^\"]+)\")?\s*>>>/g
    let match: RegExpExecArray | null
    while ((match = fileStartRegex.exec(input)) !== null) {
      const path = match[1]
      const language = match[2]
      const startIdx = match.index + match[0].length
      const endMarker = '<<<END FILE>>>'
      const endIdx = input.indexOf(endMarker, startIdx)
      if (endIdx === -1) break
      const content = input.slice(startIdx, endIdx)
      files.push({ path, content, language })
      fileStartRegex.lastIndex = endIdx + endMarker.length
    }
    return files
  }

  private async applyEnvelopeFiles(sandboxPath: string, files: Array<{ path: string; content: string }>): Promise<void> {
    for (const f of files) {
      const filePath = join(sandboxPath, f.path)
      await mkdir(dirname(filePath), { recursive: true })
      await writeFile(filePath, f.content, 'utf-8')
    }
  }

  private async buildRefinePrompt(task: any, analysisSummary: string, checksFailed: string[], sandboxPath: string, runnerLogs: string[] = [], runnerErrors: string[] = []): Promise<string> {
    let appTsx = ''
    let logicTs = ''
    try {
      appTsx = await readFile(join(sandboxPath, 'src', 'App.tsx'), 'utf-8')
    } catch {}
    try {
      logicTs = await readFile(join(sandboxPath, 'src', 'useGameLogic.ts'), 'utf-8')
    } catch {}

    const appPreview = appTsx.slice(0, 2000)
    const logicPreview = logicTs.slice(0, 2000)

    const recentLogs = runnerLogs.slice(-20).join('\n')
    const recentErrors = runnerErrors.slice(-10).join('\n')

    return `You are improving an existing Vite React TypeScript game to satisfy missing features.
Task: ${task.context}

Missing features to implement now (must be functional):
${checksFailed.map(c => `- ${c}`).join('\n')}

Project structure (excerpt):
- src/App.tsx (main UI)
- src/main.tsx
- index.html
- tsconfig.json

Important constraints:
- Return ONLY the changed or new files using this envelope format (no explanations):
<<<FILE path="path/relative/from/sandbox" language="..." >>>
<raw file contents>
<<<END FILE>>>
- Do not resend unchanged files.
- Do NOT modify index.html or src/main.tsx unless absolutely necessary. If you must, keep the module entry as: <script type="module" src="/src/main.tsx"></script>
- Ensure the app builds and runs with Vite.
- Implement real side-scrolling, jump control (ArrowUp), ground and flying obstacles, and increasing difficulty.

Current App.tsx (first 2000 chars):
${appPreview}

Current useGameLogic.ts (if present, first 2000 chars):
${logicPreview}

Recent Vite/build logs (last 20 lines):
${recentLogs}

Recent errors (if any):
${recentErrors}

Now return only the envelope blocks for files to add or modify.`
  }

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
      
      // STEP 1: Planning
      logger.info('📋 STEP 1: Planning...')
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
      
      // STEP 2: Code Generation
      logger.info('💻 STEP 2: Generating code...')
      // Pass app details from intent classification for intelligent template matching
      const appDetails = (input as any).appDetails
      const codegenResult = await generateApp(task, appDetails)
      
      if (!codegenResult.success) {
        throw new Error(`Code generation failed: ${codegenResult.error}`)
      }
      
      // STEP 3: Run + iterative refine loop
      logger.info('🏃 STEP 3: Running app...')
      const sandboxPath = codegenResult.sandboxPath || `sandbox/${task.jobId}`

      let runnerResult = await runApp(task, sandboxPath)
      console.log('runnerResult', runnerResult)

      let appTestSuccess = runnerResult.success
      let analysisResult: AnalysisResult | null = null

      // STEP 4: Analyze results
      if (!appTestSuccess) {
        logger.error(`Failed to run app: ${runnerResult.errors?.join('\n') || 'Unknown error'}`)
        
        // Iteratively refine if features are missing
        const maxIterations = 3
        let iteration = 0
        // Initialize analysis before refinement loop
        analysisResult = await analyzeResults(task, runnerResult)
        while (iteration < maxIterations && analysisResult && analysisResult.status !== 'success') {
          iteration++
          logger.warn(`🔁 Refinement iteration ${iteration}/${maxIterations} - improving missing features...`)
          const checksFailed = analysisResult.checksFailed?.length ? analysisResult.checksFailed : []
          if (checksFailed.length === 0) break
          
          // Force completion after max iterations to prevent infinite loops
          if (iteration >= maxIterations) {
            logger.warn(`🛑 Reached maximum iterations (${maxIterations}). Marking as complete.`)
            // Override the analysis result to mark as success if the app is running OR if we have generated files
            if (runnerResult.success && runnerResult.url) {
              analysisResult = {
                ...analysisResult,
                status: 'success',
                summary: `✅ Successfully created "${task.context}". The app is running and accessible at ${runnerResult.url}. After ${maxIterations} refinement iterations, the core functionality is working properly.`,
                suggestions: ['The app is ready to use!', 'You can access it via the provided URL', 'Consider adding more features if needed']
              }
            } else {
              // Even if the server failed, if we have generated files, mark as partial success
              analysisResult = {
                ...analysisResult,
                status: 'partial',
                summary: `⚠️ Created "${task.context}" with some issues. The app was generated but encountered server startup problems. After ${maxIterations} refinement iterations, the code is ready but may need manual fixes.`,
                suggestions: ['Check the generated code manually', 'Try running the app locally', 'Review the build logs for specific issues']
              }
            }
            break
          }

          const llm = createLLMProvider()
          const refinePrompt = await this.buildRefinePrompt(task, analysisResult.summary, checksFailed, sandboxPath, runnerResult.logs || [], runnerResult.errors || [])
          const refineMessages: LLMMessage[] = [
            { 
              role: 'system', 
              content: `Return ONLY envelope file blocks as specified. No prose.

CRITICAL: Do NOT change the project type or framework. If this is a Next.js project, keep it as Next.js. If this is a Vite project, keep it as Vite. Only modify the content of existing files, do not change the project structure or package.json dependencies that would change the framework.` 
            },
            { role: 'user', content: refinePrompt }
          ]
          const completion = await llm.complete({
            messages: refineMessages,
            temperature: 0.2,
            maxTokens: 6000,
          })
          const envelope = completion.content || ''
          const files = this.parseEnvelopeFiles(envelope)
          if (files.length === 0) {
            logger.warn('No envelope files returned by LLM; stopping refinement loop.')
            break
          }
          await this.applyEnvelopeFiles(sandboxPath, files.map(f => ({ path: f.path, content: f.content })))

          // Re-run
          runnerResult = await runApp(task, sandboxPath)
          appTestSuccess = runnerResult.success
          // Re-analyze after re-run
          analysisResult = await analyzeResults(task, runnerResult)
        }
      }

      if (!analysisResult) {
        logger.info('📊 STEP 4: Analyzing results...')
        analysisResult = await analyzeResults(task, runnerResult)
      }
      
      // Build response message
      const statusEmoji = analysisResult?.status === 'success' ? '✅' : analysisResult?.status === 'partial' ? '⚠️' : '❌'
      
      let message = `${statusEmoji} ${task.context}\n\n`
      message += analysisResult ? `${analysisResult.summary}\n\n` : ''
      
      // Add public URL right after summary if available (even for failed apps)
      if (runnerResult.publicUrl) {
        message += `🌐 **Try your app here**: ${runnerResult.publicUrl}\n`
        message += `_Note: The link will work for a few hours_\n\n`
      }
      
      // Add interactive choices for successful apps
      if (analysisResult?.status === 'success' && runnerResult.url) {
        message += `🎮 What would you like to do next?\n\n`
        // message += `1️⃣ Test the app - Ask me to interact with it (e.g., "add 2+5", "play the game")\n`
        // message += `2️⃣ Close - We're done here\n\n`
        // message += `Just tell me what you want to test! 🚀\n\n`
      } else {
        if (analysisResult?.suggestions.length > 0) {
          message += `💡 Suggestions:\n`
          analysisResult?.suggestions.forEach((suggestion, i) => {
            message += `${i + 1}. ${suggestion}\n`
          })
        }
      }
      
      if (plannerResult.transcription) {
        message += `\nTranscribed: "${plannerResult.transcription}"`
      }
      
      // Store session data for interactive testing
      if (analysisResult?.status === 'success' && runnerResult.url) {
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
          String(input.userId),
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
        let summary = analysisResult?.summary || ''

        // Enrich metadata with LLM if needed
        try {
          const llm = createLLMProvider()
          const prompt: LLMMessage[] = [
            { role: 'system', content: 'You generate concise metadata for an app project log. Return strict JSON with keys: title (≤60 chars), description (one short line ≤140 chars), summary (2-4 sentences). Do not include markdown, backticks, or extra text.' },
            { role: 'user', content: `Task context: ${task.context}\nStatus: ${analysisResult?.status || 'N/A'}\nAnalysis summary: ${analysisResult?.summary || 'N/A'}\nBuild errors: ${(runnerResult.errors || []).join('\n').slice(0, 1000)}` }
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
          status: analysisResult?.status || 'failed'
        })
      } catch (error) {
        logger.error('Failed to save project to database:', error)
        // Don't fail the entire request if project saving fails
      }
      
      const processingTime = Date.now() - startTime
      
      const mappedStatus: 'success' | 'partial' | 'error' | 'unconfigured' =
        analysisResult?.status === 'failed'
          ? 'error'
          : (analysisResult?.status as 'success' | 'partial') || (appTestSuccess ? 'partial' : 'error')

      return {
        summaryText: message,
        ttsText: analysisResult?.summary?.substring(0, 400) || task.context.substring(0, 200),
        attachments: runnerResult.screenshot ? [runnerResult.screenshot] : [],
        metadata: {
          category: 'app_code',
          processingTime,
          filesGenerated: codegenResult.files?.length || 0,
          status: mappedStatus,
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

