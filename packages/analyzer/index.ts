/**
 * Analyzer package: summarizes results and suggests next steps
 */

import { config, logger, type Task, type RunnerResult, type AnalysisResult } from '../shared'
import { createLLMProvider } from '../codegen/providers'

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
    // Check which requirements were met
    const checksCompleted: string[] = []
    const checksFailed: string[] = []
    
    // Simple check: if we have a screenshot, assume visual checks passed
    // In a real implementation, you'd use computer vision or DOM inspection
    if (runnerResult.success && runnerResult.screenshot) {
      checksCompleted.push(...task.checks)
    } else {
      checksFailed.push(...task.checks)
    }
    
    // Determine status
    let status: 'success' | 'partial' | 'failed'
    if (runnerResult.success && runnerResult.screenshot) {
      status = 'success'
    } else if (runnerResult.success && !runnerResult.screenshot) {
      // App ran but no screenshot - could be because screenshot wasn't requested
      status = task.artifact.screenshot ? 'partial' : 'success'
    } else {
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
Success: ${runnerResult.success}
Has Screenshot: ${!!runnerResult.screenshot}
Checks Completed: ${checksCompleted.join(', ') || 'none'}
Checks Failed: ${checksFailed.join(', ') || 'none'}
Errors: ${runnerResult.errors.join(' | ') || 'none'}

Provide a concise, friendly summary (2-3 sentences) of what was accomplished or what went wrong.${errorDetails ? ' Mention the specific build error briefly.' : ''}`
    
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

