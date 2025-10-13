import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { logger } from './logger'

export interface Project {
  id: number
  jobId: string
  folderName: string
  userId: number
  title: string
  description: string
  summary: string
  screenshotPath?: string
  publicUrl?: string
  createdAt: string
  status: 'success' | 'partial' | 'failed'
}

interface ProjectDatabase {
  projects: Project[]
  nextId: number
}

const DB_PATH = join(process.cwd(), 'data', 'projects.json')

// Ensure data directory exists
async function ensureDataDir(): Promise<void> {
  const { mkdir } = await import('fs/promises')
  const { dirname } = await import('path')
  try {
    await mkdir(dirname(DB_PATH), { recursive: true })
  } catch (error) {
    // Directory might already exist
  }
}

// Load projects from JSON file
export async function loadProjects(): Promise<ProjectDatabase> {
  try {
    await ensureDataDir()
    const data = await readFile(DB_PATH, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    // File doesn't exist or is invalid, return empty database
    return {
      projects: [],
      nextId: 1
    }
  }
}

// Save projects to JSON file
export async function saveProjects(db: ProjectDatabase): Promise<void> {
  try {
    await ensureDataDir()
    await writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf-8')
  } catch (error) {
    logger.error('Failed to save projects database:', error)
    throw error
  }
}

// Add a new project
export async function addProject(projectData: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
  const db = await loadProjects()
  
  const project: Project = {
    ...projectData,
    id: db.nextId++,
    createdAt: new Date().toISOString()
  }
  
  db.projects.push(project)
  await saveProjects(db)
  
  logger.success(`📁 Project saved: ${project.title} (ID: ${project.id})`)
  return project
}

// Get all projects for a user
export async function getUserProjects(userId: number): Promise<Project[]> {
  const db = await loadProjects()
  return db.projects.filter(p => p.userId === userId)
}

// Get project by ID
export async function getProjectById(id: number): Promise<Project | null> {
  const db = await loadProjects()
  return db.projects.find(p => p.id === id) || null
}

// Get project by job ID
export async function getProjectByJobId(jobId: string): Promise<Project | null> {
  const db = await loadProjects()
  return db.projects.find(p => p.jobId === jobId) || null
}

// Search projects by title or description
export async function searchProjects(userId: number, query: string): Promise<Project[]> {
  const db = await loadProjects()
  const userProjects = db.projects.filter(p => p.userId === userId)
  
  const searchTerm = query.toLowerCase()
  return userProjects.filter(p => 
    p.title.toLowerCase().includes(searchTerm) ||
    p.description.toLowerCase().includes(searchTerm) ||
    p.summary.toLowerCase().includes(searchTerm)
  )
}

// Get project statistics
export async function getProjectStats(userId: number): Promise<{
  total: number
  successful: number
  partial: number
  failed: number
}> {
  const projects = await getUserProjects(userId)
  
  return {
    total: projects.length,
    successful: projects.filter(p => p.status === 'success').length,
    partial: projects.filter(p => p.status === 'partial').length,
    failed: projects.filter(p => p.status === 'failed').length
  }
}
