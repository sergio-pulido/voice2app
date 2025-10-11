/**
 * Task planner: converts natural language to structured task
 */

import { config, logger, type Task } from '../shared'
import { createLLMProvider } from '../codegen/providers'

const PLANNING_SYSTEM_PROMPT = `You are a task planner for a voice-to-app system.
Given a natural language instruction, convert it to a structured JSON task.

Output ONLY valid JSON with this structure:
{
  "project": "mvp" | "frontend" | "backend" | "fullstack",
  "intent": "create" | "edit" | "add-feature" | "fix" | "refactor",
  "context": "detailed description of what to build/change",
  "checks": ["array", "of", "elements", "to", "verify"],
  "artifact": {
    "screenshot": true/false,
    "logs": true/false
  }
}

Examples:
- "Create a landing page with a hero title" → intent: "create", project: "frontend", checks: ["h1", "hero section"]
- "Add dark mode toggle" → intent: "add-feature", project: "frontend", checks: ["dark mode", "toggle button"]
- "Fix the login button" → intent: "fix", project: "frontend", checks: ["button", "login"]

Always include screenshot: true for frontend tasks, and logs: true for all tasks.`

export async function planTask(
  instruction: string,
  jobId: string,
  chatId: number,
  messageId: number
): Promise<Task> {
  try {
    const llm = createLLMProvider()
    
    const response = await llm.complete({
      messages: [
        { role: 'system', content: PLANNING_SYSTEM_PROMPT },
        { role: 'user', content: instruction },
      ],
      temperature: 0.3,
      maxTokens: 500,
    })
    
    const content = response.content
    
    // Parse JSON from response - remove markdown code blocks if present
    let jsonContent = content.trim()
    
    // Remove markdown code blocks (```json ... ``` or ``` ... ```)
    if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }
    
    const parsed = JSON.parse(jsonContent.trim())
    
    // Create full task object
    const task: Task = {
      jobId,
      project: parsed.project || 'mvp',
      intent: parsed.intent || 'create',
      context: parsed.context || instruction,
      checks: parsed.checks || [],
      artifact: parsed.artifact || { screenshot: true, logs: true },
      chatId,
      messageId,
    }
    
    logger.debug('Planned task:', JSON.stringify(task, null, 2))
    
    return task
  } catch (error) {
    logger.error('Task planning error:', error)
    
    // Fallback to simple task
    return {
      jobId,
      project: 'mvp',
      intent: 'create',
      context: instruction,
      checks: [],
      artifact: { screenshot: true, logs: true },
      chatId,
      messageId,
    }
  }
}

