/**
 * App Analyzer Adapter: Analyzes existing apps to complete project details
 */

import { logger } from '../../shared'
import { serveApp } from '../../runner/server'
import { captureScreenshot } from '../../runner/screenshot'
import { createTunnel } from '../../runner/tunnel'
import { createLLMProvider } from '../../codegen/providers'
import { APP_ANALYSIS_PROMPT } from '../../shared/prompts'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { updateProject } from '../../shared/project-db'
import { setUserAppSession } from '../services/session-store'
import { startInteractionSession } from '../../shared/interaction-state-manager'
import type { Adapter, AdapterInput, AdapterOutput } from '../types'

export class AppAnalyzerAdapter implements Adapter {
  async run(input: AdapterInput): Promise<AdapterOutput> {
    logger.info('🔍 Running App Analyzer adapter...')
    
    const startTime = Date.now()
    
    try {
      // Parse the request to get project ID or folder name
      const { projectId, folderName } = this.parseRequest(input.text)
      
      if (!projectId && !folderName) {
        return {
          summaryText: "❌ Please specify which project to analyze.\n\n💡 Examples:\n• \"Analyze project 98\"\n• \"Analyze folder job_1760208385190_nr2n3ij8y\"\n• \"Complete details for project 45\"",
          metadata: {
            category: 'app_analyzer',
            processingTime: Date.now() - startTime,
            status: 'error'
          }
        }
      }
      
      // Find the project in the database
      const project = await this.findProject(projectId, folderName)
      
      if (!project) {
        return {
          summaryText: `❌ Project not found. Please check the project ID or folder name.`,
          metadata: {
            category: 'app_analyzer',
            processingTime: Date.now() - startTime,
            status: 'error'
          }
        }
      }
      
      logger.info(`🔍 Analyzing project: ${project.title} (ID: ${project.id})`)
      
      // Step 1: Try to run the app
      const runResult = await this.runApp(project)
      
      if (!runResult.success) {
        return {
          summaryText: `❌ Failed to run project "${project.title}".\n\n🔍 Issues found:\n${runResult.errors.join('\n')}\n\n💡 The app might have build errors or missing dependencies.`,
          metadata: {
            category: 'app_analyzer',
            processingTime: Date.now() - startTime,
            status: 'error'
          }
        }
      }
      
      // Step 2: Take screenshot
      const screenshotPath = await captureScreenshot(runResult.url!, `analyze_${project.id}`)
      
      if (!screenshotPath) {
        return {
          summaryText: `❌ Failed to capture screenshot of project "${project.title}".`,
          metadata: {
            category: 'app_analyzer',
            processingTime: Date.now() - startTime,
            status: 'error'
          }
        }
      }
      
      // Step 3: Read app code for analysis
      const appCode = await this.readAppCode(project)
      
      // Step 4: Analyze with LLM
      const analysisResult = await this.analyzeApp(project, screenshotPath, appCode, runResult.publicUrl)
      
      // Step 5: Update project in database
      await this.updateProjectDetails(project, analysisResult, screenshotPath, runResult.publicUrl)

      // Step 6: Set active app session for immediate interaction (works even if intent routes to analyzer)
      try {
        const sandboxPath = join(process.cwd(), 'sandbox', project.folderName)
        setUserAppSession(
          String(input.userId),
          runResult.url || '',
          analysisResult.summary || project.title,
          String(project.jobId || project.id),
          sandboxPath,
          screenshotPath,
          undefined
        )
        startInteractionSession(input.userId, {
          projectId: project.id,
          jobId: project.jobId,
          folderName: project.folderName,
          publicUrl: runResult.publicUrl,
          sandboxPath,
        })
        console.log('[analyzer] set active session from analyzer for user', input.userId, 'project', project.id)
      } catch (e) {
        console.log('[analyzer] failed to set session', e)
      }
      
      const processingTime = Date.now() - startTime
      
      return {
        summaryText: `🔍 **App Analysis Complete!**\n\n✅ **${analysisResult.title}**\n\n📝 **Description:** ${analysisResult.description}\n\n📊 **Summary:** ${analysisResult.summary}\n\n🌐 **App URL:** ${runResult.publicUrl}\n\n📸 **Screenshot:** Captured and saved\n\n⏱️ **Analysis completed in ${(processingTime / 1000).toFixed(1)}s**`,
        attachments: [screenshotPath],
        metadata: {
          category: 'app_analyzer',
          processingTime,
          status: 'success'
        }
      }
      
    } catch (error) {
      logger.error('App Analyzer error:', error)
      return {
        summaryText: `❌ Sorry, I encountered an error while analyzing the app. Please try again.`,
        metadata: {
          category: 'app_analyzer',
          processingTime: Date.now() - startTime,
          status: 'error'
        }
      }
    }
  }
  
  private parseRequest(text: string): { projectId?: number; folderName?: string } {
    const lowerText = text.toLowerCase()
    
    // Look for project ID
    const idMatch = lowerText.match(/(?:project|app|id)\s*(\d+)/)
    if (idMatch) {
      return { projectId: parseInt(idMatch[1]) }
    }
    
    // Look for folder name
    const folderMatch = lowerText.match(/folder\s+([a-zA-Z0-9_-]+)/)
    if (folderMatch) {
      return { folderName: folderMatch[1] }
    }
    
    // Look for job folder pattern
    const jobMatch = lowerText.match(/job[_\d]+[a-z0-9]+/)
    if (jobMatch) {
      return { folderName: jobMatch[0] }
    }
    
    return {}
  }
  
  private async findProject(projectId?: number, folderName?: string): Promise<any> {
    const { getProjectById, getUserProjects } = await import('../../shared/project-db')
    
    if (projectId) {
      return await getProjectById(projectId)
    }
    
    if (folderName) {
      // Find by folder name
      const projects = await getUserProjects(6181465305) // Default user ID
      return projects.find(p => p.folderName === folderName)
    }
    
    return null
  }
  
  private async runApp(project: any): Promise<{ success: boolean; url?: string; publicUrl?: string; errors: string[] }> {
    try {
      const sandboxPath = join(process.cwd(), 'sandbox', project.folderName)
      
      // Try to serve the app
      const serveResult = await serveApp(sandboxPath, `analyze_${project.id}`)
      
      if (!serveResult.success || !serveResult.url) {
        return {
          success: false,
          errors: serveResult.errors || ['Failed to start server']
        }
      }
      
      // Wait a bit more for server to be fully ready
      logger.info(`⏳ Waiting for server to be fully ready...`)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Test server readiness with multiple attempts
      let serverReady = false
      for (let i = 0; i < 5; i++) {
        try {
          const response = await fetch(serveResult.url, { 
            signal: AbortSignal.timeout(3000),
            method: 'HEAD'
          })
          if (response.ok || response.status === 200) {
            serverReady = true
            break
          }
        } catch (e) {
          logger.debug(`Server readiness check ${i + 1}/5 failed, retrying...`)
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
      
      if (!serverReady) {
        return {
          success: false,
          errors: ['Server is not responding after multiple attempts']
        }
      }
      
      logger.info(`✅ Server is ready, creating tunnel...`)
      
      // Create public URL
      const tunnelResult = await createTunnel(serveResult.url, `analyze_${project.id}`)
      
      return {
        success: true,
        url: serveResult.url,
        publicUrl: tunnelResult.publicUrl,
        errors: []
      }
      
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }
  
  private async readAppCode(project: any): Promise<string | undefined> {
    try {
      const sandboxPath = join(process.cwd(), 'sandbox', project.folderName)
      const appCodePath = join(sandboxPath, 'src', 'App.tsx')
      return await readFile(appCodePath, 'utf-8')
    } catch (error) {
      logger.debug('Could not read app code:', error)
      return undefined
    }
  }
  
  private async analyzeApp(project: any, screenshotPath: string, appCode?: string, publicUrl?: string): Promise<{
    title: string
    description: string
    summary: string
  }> {
    const llm = createLLMProvider()
    
    let analysisContext = `Project to analyze:\n`
    analysisContext += `- Current title: ${project.title}\n`
    analysisContext += `- Current description: ${project.description}\n`
    analysisContext += `- Current summary: ${project.summary}\n`
    analysisContext += `- Screenshot: ${screenshotPath}\n`
    if (publicUrl) {
      analysisContext += `- Live URL: ${publicUrl}\n`
    }
    if (appCode) {
      analysisContext += `- App code (truncated): ${appCode.substring(0, 2000)}...\n`
    }
    
    const prompt = [
      {
        role: 'system',
        content: APP_ANALYSIS_PROMPT + `

🚨 CRITICAL: Return ONLY valid JSON in this exact format:
{
  "title": "Your title here (max 60 chars)",
  "description": "Your description here (max 140 chars)",
  "summary": "Your summary here (2-4 sentences)"
}

DO NOT use markdown formatting, bullet points, or any other format.
Return ONLY the raw JSON object, nothing else.`
      },
      {
        role: 'user',
        content: analysisContext
      }
    ]
    
    const response = await llm.complete({
      messages: prompt as any,
      temperature: 0.2,
      maxTokens: 500
    })
    
    try {
      // Clean the response - remove any markdown backticks or extra text
      let cleanResponse = response.content?.trim() || ''
      
      // Remove markdown code blocks if present
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      // Check if it's markdown bullet points instead of JSON
      if (cleanResponse.includes('**Title:**') || cleanResponse.includes('- **Title:**')) {
        logger.warn('LLM returned markdown format instead of JSON, parsing manually...')
        
        // Extract from markdown format
        const titleMatch = cleanResponse.match(/\*\*Title:\*\*\s*(.+?)(?:\n|$)/i)
        const descMatch = cleanResponse.match(/\*\*Description:\*\*\s*(.+?)(?:\n|$)/i)
        const summaryMatch = cleanResponse.match(/\*\*Summary:\*\*\s*(.+?)(?:\n|$)/is)
        
        return {
          title: titleMatch ? titleMatch[1].trim() : project.title,
          description: descMatch ? descMatch[1].trim() : project.description,
          summary: summaryMatch ? summaryMatch[1].trim() : project.summary
        }
      }
      
      // Remove any leading/trailing text that's not JSON
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        cleanResponse = jsonMatch[0]
      }
      
      const analysis = JSON.parse(cleanResponse)
      return {
        title: analysis.title || project.title,
        description: analysis.description || project.description,
        summary: analysis.summary || project.summary
      }
    } catch (error) {
      logger.error('Failed to parse LLM analysis:', error)
      logger.debug('LLM response (first 300 chars):', response.content.substring(0, 300))
      
      // Enhanced fallback: try to extract information from the response text
      const responseText = response.content
      let title = project.title
      let description = project.description
      let summary = project.summary
      
      // Try multiple extraction patterns
      
      // Pattern 1: "Title: value" or "**Title:** value"
      const titleMatch = responseText.match(/\*?\*?title\*?\*?["\s]*:["\s]*([^",\n]+)/i)
      if (titleMatch) title = titleMatch[1].trim()
      
      // Try to extract description
      const descMatch = response.content.match(/description["\s]*:["\s]*([^",\n]+)/i)
      if (descMatch) description = descMatch[1].trim()
      
      // Try to extract summary
      const summaryMatch = response.content.match(/summary["\s]*:["\s]*([^",\n}]+)/i)
      if (summaryMatch) summary = summaryMatch[1].trim()
      
      return { title, description, summary }
    }
  }
  
  private async updateProjectDetails(project: any, analysis: any, screenshotPath: string, publicUrl?: string): Promise<void> {
    try {
      await updateProject(project.id, {
        title: analysis.title,
        description: analysis.description,
        summary: analysis.summary,
        screenshotPath: screenshotPath,
        publicUrl: publicUrl,
        status: 'success' // Mark as successfully analyzed
      })
      
      logger.success(`Updated project ${project.id} with analysis results`)
    } catch (error) {
      logger.error('Failed to update project details:', error)
    }
  }
}

export const appAnalyzerAdapter = new AppAnalyzerAdapter()
