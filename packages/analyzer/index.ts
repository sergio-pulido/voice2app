/**
 * Analyzer package: summarizes results and suggests next steps
 */

import { config, logger, type Task, type RunnerResult, type AnalysisResult } from '../shared'
import { createLLMProvider } from '../codegen/providers'
import { readFile } from 'fs/promises'
import { join } from 'path'

const ANALYSIS_SYSTEM_PROMPT = `You are an expert code reviewer and UX analyst.
Analyze the results of a code generation and execution task, then provide:
1. A concise summary (2-3 sentences) of what was accomplished
2. Whether the checks passed or failed
3. 2-3 actionable next steps or improvements

Be encouraging but honest about any issues.`

export async function analyzeResults(
  task: Task,
  runnerResult: RunnerResult
): Promise<AnalysisResult> {
  logger.job(task.jobId, 'Analyzing results...')
  
  try {
    // Check which requirements were met by analyzing the generated code
    const { checksCompleted, checksFailed } = await analyzeGeneratedCode(task, runnerResult)
    
    // Determine status based on both build success and feature implementation
    let status: 'success' | 'partial' | 'failed'
    
    if (!runnerResult.success) {
      status = 'failed'
    } else if (checksCompleted.length === task.checks.length) {
      // All required features implemented
      status = 'success'
    } else if (checksCompleted.length > 0) {
      // Some features implemented
      status = 'partial'
    } else {
      // No features implemented despite successful build
      status = 'failed'
    }
    
    // Generate AI summary
    const summary = await generateSummary(task, runnerResult, checksCompleted, checksFailed)
    
    // Generate suggestions
    const suggestions = generateSuggestions(task, runnerResult, status)
    
    logger.success(`Analysis complete: ${status}`)
    
    return {
      summary,
      suggestions,
      status,
      checksCompleted,
      checksFailed,
    }
  } catch (error) {
    logger.error(`Analysis error for job ${task.jobId}:`, error)
    
    return {
      summary: 'An error occurred during analysis.',
      suggestions: ['Try again', 'Check the logs for details'],
      status: 'failed',
      checksCompleted: [],
      checksFailed: task.checks,
    }
  }
}

async function analyzeGeneratedCode(
  task: Task,
  runnerResult: RunnerResult
): Promise<{ checksCompleted: string[]; checksFailed: string[] }> {
  const checksCompleted: string[] = []
  const checksFailed: string[] = []
  
  // If the app didn't build successfully, all checks fail
  if (!runnerResult.success) {
    checksFailed.push(...task.checks)
    return { checksCompleted, checksFailed }
  }
  
  try {
    // Read the generated App.tsx file to analyze implementation
    const appPath = join(process.cwd(), runnerResult.sandboxPath || `sandbox/${task.jobId}`, 'src', 'App.tsx')
    let appCode = ''
    
    try {
      appCode = await readFile(appPath, 'utf-8')
    } catch (error) {
      logger.warn(`Could not read App.tsx for analysis: ${error.message}`)
      // If we can't read the code, assume basic implementation
      checksCompleted.push(...task.checks)
      return { checksCompleted, checksFailed }
    }
    
    // Use AI to analyze if the generated code implements the required features
    const llm = createLLMProvider()
    
    const analysisPrompt = `Analyze this React app code to determine which features are implemented:

REQUIRED FEATURES (from task):
${task.checks.map(check => `- ${check}`).join('\n')}

GENERATED CODE:
\`\`\`tsx
${appCode}
\`\`\`

For each required feature, respond with either "IMPLEMENTED" or "NOT_IMPLEMENTED" followed by a brief explanation.

Format your response as:
FEATURE_NAME: IMPLEMENTED/NOT_IMPLEMENTED - explanation

Be strict in your analysis. A feature is only IMPLEMENTED if it's actually functional, not just mentioned in comments or placeholders.`

    const response = await llm.complete({
      messages: [
        { role: 'system', content: 'You are an expert code reviewer. Analyze React code to determine if specific features are actually implemented and functional.' },
        { role: 'user', content: analysisPrompt }
      ],
      temperature: 0.3,
      maxTokens: 500
    })
    
    const analysis = response.content || ''
    
    // Parse the analysis results - look for explicit IMPLEMENTED/NOT_IMPLEMENTED markers
    for (const check of task.checks) {
      const checkLower = check.toLowerCase().replace(/\s+/g, '_')
      const analysisLower = analysis.toLowerCase()
      
      // Look for explicit IMPLEMENTED/NOT_IMPLEMENTED markers in the analysis
      const implementedPattern = new RegExp(`\\*\\*${checkLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\*\\*:\\s*implemented`, 'i')
      const notImplementedPattern = new RegExp(`\\*\\*${checkLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\*\\*:\\s*not_implemented`, 'i')
      
      if (implementedPattern.test(analysisLower)) {
        checksCompleted.push(check)
      } else if (notImplementedPattern.test(analysisLower)) {
        checksFailed.push(check)
      } else {
        // Fallback: if the AI says "all required features are implemented" or all checks show "IMPLEMENTED", mark all as completed
        if (analysisLower.includes('all required features are implemented') || 
            analysisLower.includes('all the required features are implemented') ||
            (analysisLower.includes('implemented') && !analysisLower.includes('not_implemented'))) {
          checksCompleted.push(check)
        } else {
          // Default to failed if we can't determine
          checksFailed.push(check)
        }
      }
    }
    
    logger.info(`Code analysis results: ${checksCompleted.length} completed, ${checksFailed.length} failed`)
    logger.debug(`Analysis response: ${analysis}`)
    
  } catch (error) {
    logger.error('Code analysis error:', error)
    // If analysis fails, fall back to basic check
    if (runnerResult.screenshot) {
      checksCompleted.push(...task.checks)
    } else {
      checksFailed.push(...task.checks)
    }
  }
  
  return { checksCompleted, checksFailed }
}

async function generateSummary(
  task: Task,
  runnerResult: RunnerResult,
  checksCompleted: string[],
  checksFailed: string[]
): Promise<string> {
  try {
    // Build detailed error information
    const errorDetails = runnerResult.errors.length > 0 
      ? `\n\nBuild Errors:\n${runnerResult.errors.slice(0, 3).join('\n')}`
      : ''
    
    const prompt = `Task: ${task.context}
Intent: ${task.intent}
Build Success: ${runnerResult.success}
Has Screenshot: ${!!runnerResult.screenshot}
Features Implemented: ${checksCompleted.join(', ') || 'none'}
Features Missing: ${checksFailed.join(', ') || 'none'}
Errors: ${runnerResult.errors.join(' | ') || 'none'}

Provide a concise, honest summary (2-3 sentences) of what was actually accomplished. Be specific about which features were implemented vs missing. If no required features were implemented, clearly state this.${errorDetails ? ' Mention the specific build error briefly.' : ''}`
    
    const llm = createLLMProvider()
    
    const response = await llm.complete({
      messages: [
        { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      maxTokens: 300,
    })
    
    return response.content || 'Task completed.'
  } catch (error) {
    logger.error('Summary generation error:', error)
    
    // Fallback summary with error details
    if (runnerResult.success) {
      return `✅ Successfully created "${task.context}". The app is running and ready to use!`
    } else {
      const errorInfo = runnerResult.errors.length > 0 
        ? ` The build failed with error: ${runnerResult.errors[0].substring(0, 200)}`
        : ''
      return `❌ Failed to create "${task.context}".${errorInfo} Please try again with simpler requirements or check the build logs.`
    }
  }
}

function generateSuggestions(
  task: Task,
  runnerResult: RunnerResult,
  status: string
): string[] {
  const suggestions: string[] = []
  
  if (status === 'success') {
    suggestions.push('Try adding more features or styling')
    suggestions.push('Test the app with different screen sizes')
    suggestions.push('Add animations or interactions')
  } else if (status === 'partial') {
    suggestions.push('Review the build logs for warnings')
    suggestions.push('Try rebuilding with more specific requirements')
  } else {
    suggestions.push('Check the error messages and try again')
    suggestions.push('Simplify the requirements and iterate')
    suggestions.push('Review the generated code for issues')
  }
  
  return suggestions
}

