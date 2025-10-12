/**
 * App Interactor: Automates interactions with generated apps
 */

import { logger } from '../shared'
import { chromium } from 'playwright'
import { join } from 'path'
import { mkdir } from 'fs/promises'

export interface InteractionStep {
  type: 'type' | 'click' | 'wait' | 'scroll'
  selector?: string
  text?: string
  duration?: number
  direction?: 'up' | 'down' | 'left' | 'right'
}

export interface AppTest {
  description: string
  steps: InteractionStep[]
  waitAfter?: number
}

export async function testAppWithInteraction(
  url: string,
  jobId: string,
  userRequest: string,
  appContext: string
): Promise<string | null> {
  logger.debug(`Testing app at ${url} with request: ${userRequest}`)
  
  let browser: any = null
  
  try {
    // Launch browser
    browser = await chromium.launch({
      headless: true,
    })
    
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    })
    
    const page = await context.newPage()
    
    // Navigate to app
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 10000,
    })
    
    // Wait for app to load
    await page.waitForTimeout(2000)
    
    // Generate test based on user request and app context
    const test = await generateTestFromRequest(userRequest, appContext)
    
    if (!test) {
      logger.warn('Could not generate test for request')
      return null
    }
    
    logger.info(`Executing test: ${test.description}`)
    
    // Execute test steps
    for (const step of test.steps) {
      await executeStep(page, step)
    }
    
    // Wait after test completion
    if (test.waitAfter) {
      await page.waitForTimeout(test.waitAfter)
    }
    
    // Capture screenshot
    const artifactsPath = join(process.cwd(), 'artifacts')
    await mkdir(artifactsPath, { recursive: true })
    
    const screenshotPath = join(artifactsPath, `${jobId}_interaction.png`)
    await page.screenshot({
      path: screenshotPath,
      fullPage: false,
    })
    
    await browser.close()
    
    logger.success(`Interaction test completed: ${screenshotPath}`)
    return screenshotPath
  } catch (error) {
    logger.error('App interaction error:', error)
    
    if (browser) {
      try {
        await browser.close()
      } catch (e) {
        // Ignore
      }
    }
    
    return null
  }
}

async function executeStep(page: any, step: InteractionStep): Promise<void> {
  switch (step.type) {
    case 'type':
      if (step.selector && step.text) {
        await page.fill(step.selector, step.text)
      }
      break
    case 'click':
      if (step.selector) {
        await page.click(step.selector)
      }
      break
    case 'wait':
      await page.waitForTimeout(step.duration || 1000)
      break
    case 'scroll':
      if (step.direction) {
        await page.keyboard.press(`Arrow${step.direction.charAt(0).toUpperCase() + step.direction.slice(1)}`)
      }
      break
  }
}

async function generateTestFromRequest(userRequest: string, appContext: string): Promise<AppTest | null> {
  // This would use an LLM to generate appropriate test steps
  // For now, we'll use pattern matching for common requests
  
  const request = userRequest.toLowerCase()
  
  // Calculator tests
  if (appContext.toLowerCase().includes('calculator')) {
    if (request.includes('add') || request.includes('sumar') || request.includes('+')) {
      const numbers = extractNumbers(request)
      if (numbers.length >= 2) {
        return {
          description: `Testing calculator: ${numbers[0]} + ${numbers[1]}`,
          steps: [
            { type: 'type', selector: 'input[type="number"]:nth-of-type(1)', text: numbers[0].toString() },
            { type: 'type', selector: 'input[type="number"]:nth-of-type(2)', text: numbers[1].toString() },
            { type: 'click', selector: 'button:has-text("Add"), button:has-text("Suma")' },
            { type: 'wait', duration: 1000 }
          ],
          waitAfter: 1000
        }
      }
    }
    
    if (request.includes('subtract') || request.includes('restar') || request.includes('-')) {
      const numbers = extractNumbers(request)
      if (numbers.length >= 2) {
        return {
          description: `Testing calculator: ${numbers[0]} - ${numbers[1]}`,
          steps: [
            { type: 'type', selector: 'input[type="number"]:nth-of-type(1)', text: numbers[0].toString() },
            { type: 'type', selector: 'input[type="number"]:nth-of-type(2)', text: numbers[1].toString() },
            { type: 'click', selector: 'button:has-text("Subtract"), button:has-text("Resta")' },
            { type: 'wait', duration: 1000 }
          ],
          waitAfter: 1000
        }
      }
    }
  }
  
  // Game tests (Tetris, etc.)
  if (appContext.toLowerCase().includes('game') || appContext.toLowerCase().includes('tetris')) {
    return {
      description: 'Testing game: Waiting for blocks to fall',
      steps: [
        { type: 'wait', duration: 5000 }, // Wait for game to start
      ],
      waitAfter: 2000
    }
  }
  
  // Portfolio/Website tests
  if (appContext.toLowerCase().includes('portfolio') || appContext.toLowerCase().includes('website')) {
    return {
      description: 'Testing website: Navigating through pages',
      steps: [
        { type: 'wait', duration: 2000 },
        { type: 'scroll', direction: 'down' },
        { type: 'wait', duration: 1000 }
      ],
      waitAfter: 1000
    }
  }
  
  return null
}

function extractNumbers(text: string): number[] {
  const numbers = text.match(/\d+/g)
  return numbers ? numbers.map(Number) : []
}
