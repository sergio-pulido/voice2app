import { AdapterInput, AdapterOutput } from '../types'
import { logger } from '../../shared/logger'
import { 
  getUserProjects, 
  getProjectById, 
  searchProjects, 
  getProjectStats,
  Project 
} from '../../shared/project-db'
import { config } from '../../shared/config'
import { getUserProjectListState, setUserProjectListState, setUserAppSession } from '../services/session-store'
import { startInteractionSession } from '../../shared/interaction-state-manager'

interface ProjectManagerRequest {
  action: 'list' | 'details' | 'search' | 'stats' | 'more'
  projectId?: number
  searchQuery?: string
  page?: number
  limit?: number
}

export class ProjectManagerAdapter {
  async run(input: AdapterInput): Promise<AdapterOutput> {
    try {
      logger.info(`📁 Project Manager: ${input.text}`)
      
      const request = await this.parseRequest(input.text, input.userId)
      
      logger.debug(`📁 Parsed request: action=${request.action}, limit=${request.limit}, page=${request.page}`)
      
              switch (request.action) {
                case 'list':
                  return await this.listProjects(input.userId, request.limit)
        
        case 'details':
          return await this.getProjectDetails(input.userId, request.projectId!)
        
        case 'search':
          return await this.searchProjects(input.userId, request.searchQuery!)
        
        case 'stats':
          return await this.getProjectStats(input.userId)
        
        case 'more':
          return await this.listMoreProjects(input.userId, request.page)
        
        default:
          return {
            summaryText: "❌ I couldn't understand what you want to do with your projects. Try:\n\n• \"List my projects\" - See first 100 projects\n• \"Show more projects\" - See next 100 projects\n• \"Page 3\" - Jump to a page\n• \"Show project details for ID 1\" - Get full details\n• \"Search for calculator\" - Find projects\n• \"Project statistics\" - Get overview",
            metadata: {
              category: 'project_manager',
              status: 'error'
            }
          }
      }
    } catch (error) {
      logger.error('Project Manager error:', error)
      return {
        summaryText: "❌ Sorry, I encountered an error while managing your projects. Please try again.",
        metadata: {
          category: 'project_manager',
          status: 'error'
        }
      }
    }
  }

  private async parseRequest(text: string, userId: number): Promise<ProjectManagerRequest> {
    const lowerText = text.toLowerCase()
    
    // Check for specific project ID
    const idMatch = lowerText.match(/(?:project|app|id)\s*(\d+)/)
    if (idMatch) {
      return {
        action: 'details',
        projectId: parseInt(idMatch[1])
      }
    }
    
    // Check for "last N" requests (both numbers and words)
    const lastMatch = lowerText.match(/last\s+(\d+)/)
    const lastWordMatch = lowerText.match(/last\s+(one|two|three|four|five|six|seven|eight|nine|ten)/)
    
    if (lastMatch) {
      const count = parseInt(lastMatch[1])
      logger.debug(`📁 Found "last N" pattern: "${lastMatch[0]}" -> count=${count}`)
      return {
        action: 'list',
        page: 1,
        limit: count
      }
    } else if (lastWordMatch) {
      const wordToNumber: { [key: string]: number } = {
        'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
        'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
      }
      const count = wordToNumber[lastWordMatch[1]]
      logger.debug(`📁 Found "last word" pattern: "${lastWordMatch[0]}" -> count=${count}`)
      return {
        action: 'list',
        page: 1,
        limit: count
      }
    }
    
    // Check for "more" or pagination requests
    if (lowerText.includes('more') || lowerText.includes('show more') || lowerText.includes('next page')) {
      const pageMatch = lowerText.match(/page\s*(\d+)/)
      return {
        action: 'more',
        page: pageMatch ? parseInt(pageMatch[1]) : undefined // Don't specify page, let listMoreProjects use stored state
      }
    }
    
    // Check for search queries
    if (lowerText.includes('search') || lowerText.includes('find') || lowerText.includes('look for')) {
      const searchQuery = text.replace(/.*?(?:search|find|look for)\s+(.+)/i, '$1').trim()
      return {
        action: 'search',
        searchQuery
      }
    }
    
    // Check for statistics
    if (lowerText.includes('stat') || lowerText.includes('summary') || lowerText.includes('overview')) {
      return { action: 'stats' }
    }
    
    // Check for any "last" requests that might have been missed
    if (lowerText.includes('last') && (lowerText.includes('project') || lowerText.includes('app'))) {
      logger.debug(`📁 Found "last" request but no specific number, defaulting to 5`)
      return {
        action: 'list',
        page: 1,
        limit: 5
      }
    }
    
    // Default to list
    return { action: 'list' }
  }

  private async listProjects(userId: number, limit?: number): Promise<AdapterOutput> {
    const projects = await getUserProjects(userId)
    
    if (projects.length === 0) {
      return {
        summaryText: "📁 **Your Projects**\n\nYou haven't created any projects yet! Generate your first app to get started. 🚀",
        metadata: {
          category: 'project_manager',
          status: 'success'
        }
      }
    }
    
    // Sort by creation date (newest first)
    projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    // Use limit if specified, otherwise default to 100
    const pageSize = limit || 100
    const page = 1
    setUserProjectListState(String(userId), page, pageSize)
    const displayProjects = projects.slice(0, pageSize)
    
    logger.debug(`Project list: limit=${limit}, pageSize=${pageSize}, total=${projects.length}, showing=${displayProjects.length}`)
    
    let message = `📁 **Your Projects** (${projects.length} total)\n\n`
    
    // Use the shared formatting function
    message += this.formatProjectsList(displayProjects)
    
    // Add note if there are more projects
    if (projects.length > pageSize) {
      message += `\n… and ${projects.length - pageSize} more projects\n\n`
    } else {
      message += `\n`
    }
    
    message += `💡 **Commands:**\n`
    message += `• "Show project details for ID X" - Get full details\n`
    message += `• "Search for [keyword]" - Find projects\n`
    message += `• "Project statistics" - Get overview\n`
    if (projects.length > pageSize) {
      message += `• "Show more projects" - See next ${pageSize} projects\n`
    }
    
    return {
      summaryText: message,
      metadata: {
        category: 'project_manager',
        status: 'success'
      }
    }
  }

  private async listMoreProjects(userId: number, page?: number): Promise<AdapterOutput> {
    const projects = await getUserProjects(userId)
    
    if (projects.length === 0) {
      return {
        summaryText: "📁 **Your Projects**\n\nYou haven't created any projects yet! Generate your first app to get started. 🚀",
        metadata: {
          category: 'project_manager',
          status: 'success'
        }
      }
    }
    
    // Sort by creation date (newest first)
    projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    // Get current state from storage
    const stored = getUserProjectListState(String(userId))
    const pageSize = stored?.pageSize || 100
    
    // If no page specified, use the stored page (this is the key fix!)
    const currentPage = page || stored?.page || 1
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = Math.min(projects.length, startIndex + pageSize)
    const displayProjects = projects.slice(startIndex, endIndex)
    
    if (displayProjects.length === 0) {
      return {
        summaryText: `📁 **Page ${currentPage}**\n\nNo more projects to show. You've reached the end of your project list! 🎯`,
        metadata: {
          category: 'project_manager',
          status: 'success'
        }
      }
    }
    
    // Advance stored page for subsequent "show more" calls
    setUserProjectListState(String(userId), currentPage + 1, pageSize)

    let message = `📁 **Your Projects - Page ${currentPage}** (${projects.length} total)\n\n`
    
    // Use the shared formatting function for consistency
    message += this.formatProjectsList(displayProjects)
    
    message += `💡 **Commands:**\n`
    message += `• "Show project details for ID X" - Get full details\n`
    message += `• "Search for [keyword]" - Find projects\n`
    if (endIndex < projects.length) {
      message += `• "Show more projects" or "Page ${currentPage + 1}" - Next page\n`
    }
    message += `• "List my projects" - Back to first page\n`
    
    return {
      summaryText: message,
      metadata: {
        category: 'project_manager',
        status: 'success'
      }
    }
  }

  /**
   * Shared function to format project list display
   * Uses the better formatting from listProjects
   */
  private formatProjectsList(projects: any[]): string {
    let formatted = ''
    
    projects.forEach((project) => {
      const statusEmoji = project.status === 'success' ? '✅' : 
                         project.status === 'partial' ? '⚠️' : '❌'
      const date = new Date(project.createdAt).toLocaleDateString()
      
      formatted += `${statusEmoji} **ID ${project.id}**: ${project.title}\n`
      formatted += `   📅 ${date}\n`
      formatted += `\n`
    })
    
    return formatted
  }

  private async getProjectDetails(userId: number, projectId: number): Promise<AdapterOutput> {
    const project = await getProjectById(projectId)
    
    if (!project || project.userId !== userId) {
      return {
        summaryText: `❌ Project with ID ${projectId} not found or you don't have access to it.`,
        metadata: {
          category: 'project_manager',
          status: 'error'
        }
      }
    }
    
    const statusEmoji = project.status === 'success' ? '✅' : 
                       project.status === 'partial' ? '⚠️' : '❌'
    const date = new Date(project.createdAt).toLocaleString()
    
    let message = `📁 **Project Details**\n\n`
    message += `${statusEmoji} **${project.title}**\n\n`
    message += `🆔 **ID**: ${project.id}\n`
    message += `📁 **Folder**: ${project.folderName}\n`
    message += `📅 **Created**: ${date}\n`
    message += `📊 **Status**: ${project.status}\n\n`
    message += `📝 **Description**: ${project.description}\n\n`
    message += `📋 **Summary**: ${project.summary}\n\n`
    
    if (project.publicUrl) {
      message += `🌐 **Live URL**: ${project.publicUrl}\n\n`
    }
    
    message += `💡 **Commands:**\n`
    message += `• "List my projects" - See all projects\n`
    message += `• "Search for [keyword]" - Find projects\n`
    
    const result: AdapterOutput = {
      summaryText: message,
      metadata: {
        category: 'project_manager',
        status: 'success'
      }
    }
    
    // Add screenshot if available
    if (project.screenshotPath) {
      result.attachments = [project.screenshotPath]
    }

    // Set active app session for immediate interaction
    try {
      const sandboxPath = project.folderName ? require('path').join(process.cwd(), 'sandbox', project.folderName) : undefined
      setUserAppSession(
        String(userId),
        project.publicUrl || '',
        project.summary || project.title || 'App Project',
        project.jobId || String(project.id),
        sandboxPath,
        project.screenshotPath,
        undefined
      )
      startInteractionSession(userId, {
        projectId: project.id,
        jobId: project.jobId,
        folderName: project.folderName,
        publicUrl: project.publicUrl,
        sandboxPath,
      })
    } catch (e) {
      // best-effort; don't fail details on session set issues
    }
    
    return result
  }

  private async searchProjects(userId: number, query: string): Promise<AdapterOutput> {
    const projects = await searchProjects(userId, query)
    
    if (projects.length === 0) {
      return {
        summaryText: `🔍 **Search Results for "${query}"**\n\nNo projects found matching your search. Try different keywords or create a new project! 🚀`,
        metadata: {
          category: 'project_manager',
          status: 'success'
        }
      }
    }
    
    let message = `🔍 **Search Results for "${query}"** (${projects.length} found)\n\n`
    
    projects.forEach((project, index) => {
      const statusEmoji = project.status === 'success' ? '✅' : 
                         project.status === 'partial' ? '⚠️' : '❌'
      const date = new Date(project.createdAt).toLocaleDateString()
      
      message += `${statusEmoji} **ID ${project.id}**: ${project.title}\n`
      message += `   📅 ${date} | 📁 ${project.folderName}\n\n`
    })
    
    message += `💡 **Commands:**\n`
    message += `• "Show project details for ID X" - Get full details\n`
    message += `• "List my projects" - See all projects\n`
    
    return {
      summaryText: message,
      metadata: {
        category: 'project_manager',
        status: 'success'
      }
    }
  }

  private async getProjectStats(userId: number): Promise<AdapterOutput> {
    const stats = await getProjectStats(userId)
    
    let message = `📊 **Project Statistics**\n\n`
    message += `📁 **Total Projects**: ${stats.total}\n`
    message += `✅ **Successful**: ${stats.successful}\n`
    message += `⚠️ **Partial**: ${stats.partial}\n`
    message += `❌ **Failed**: ${stats.failed}\n\n`
    
    if (stats.total === 0) {
      message += `🎯 **Get Started**: Generate your first app to begin building your project portfolio! 🚀`
    } else {
      const successRate = Math.round((stats.successful / stats.total) * 100)
      message += `🎯 **Success Rate**: ${successRate}%\n\n`
      message += `💡 **Commands:**\n`
      message += `• "List my projects" - See all projects\n`
      message += `• "Search for [keyword]" - Find projects\n`
    }
    
    return {
      summaryText: message,
      metadata: {
        category: 'project_manager',
        status: 'success'
      }
    }
  }
}

export const projectManagerAdapter = new ProjectManagerAdapter()
