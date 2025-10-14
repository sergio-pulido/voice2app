/**
 * App Interactor: Automates interactions with generated apps
 */

import { logger, config } from '../shared'
import { chromium } from 'playwright'
import { join } from 'path'
import { mkdir } from 'fs/promises'

export interface InteractionStep {
  type: 'type' | 'click' | 'wait' | 'scroll' | 'select' | 'keyboard'
  selector?: string
  text?: string
  duration?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  option?: string
  optionText?: string
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
  appContext: string,
  screenshotPath?: string,
  appCode?: string
): Promise<string | null> {
  logger.debug(`Testing app at ${url} with request: ${userRequest}`)

  let browser: any = null

  try {
    // Launch browser with video recording
    browser = await chromium.launch({
      headless: true,
    })

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      recordVideo: {
        dir: join(process.cwd(), config.artifactsRoot),
        size: { width: 1280, height: 720 }
      }
    })

    const page = await context.newPage()
    
    // Navigate to app
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 10000,
    })
    
    // Wait for app to load
    await page.waitForTimeout(2000)
    
    // Generate test based on user request, app context, screenshot, and code
    const test = await generateTestFromRequest(userRequest, appContext, screenshotPath, appCode)
    
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
    
    // Save video of interaction
    const artifactsPath = join(process.cwd(), config.artifactsRoot)
    await mkdir(artifactsPath, { recursive: true })
    
    const videoPath = join(artifactsPath, `${jobId}_interaction.mp4`)
    
    // Close page to finalize video recording
    await page.close()
    
    // Get video path from page context
    const video = page.video()
    if (video) {
      await video.saveAs(videoPath)
      await video.delete()
    }
    
    await browser.close()
    
    logger.success(`🎥 Video recorded: ${videoPath}`)
    return videoPath
  } catch (error) {
    logger.error('App interaction error:', error)
    
    if (browser) {
      try {
        await browser.close()
      } catch (e) {
        // Ignore
      }
    }
    
    // Provide more specific error information
    if (error.message.includes('net::ERR_CONNECTION_REFUSED')) {
      logger.error('❌ Cannot connect to app server - it might not be running')
    } else if (error.message.includes('Timeout')) {
      logger.error('❌ App interaction timed out - server might be slow')
    } else if (error.message.includes('selector')) {
      logger.error('❌ Could not find UI elements - app interface might have changed')
    } else {
      logger.error('❌ Unknown interaction error:', error.message)
    }
    
    return null
  }
}

async function executeStep(page: any, step: InteractionStep): Promise<void> {
  switch (step.type) {
    case 'type':
      if (step.selector && step.text) {
        try {
          // Try to find and fill the input with timeout
          await page.fill(step.selector, step.text, { timeout: 5000 })
        } catch (error) {
          logger.warn(`Could not fill selector ${step.selector}: ${error}`)
          // Try alternative selectors
          try {
            await page.fill('input:first-of-type', step.text, { timeout: 2000 })
          } catch (e) {
            logger.warn('Alternative input selector also failed')
          }
        }
      }
      break
    case 'select':
      if (step.selector && (step.option || step.optionText)) {
        try {
          if (step.option) {
            // Select by value
            await page.selectOption(step.selector, step.option, { timeout: 5000 })
          } else if (step.optionText) {
            // Select by text
            await page.selectOption(step.selector, { label: step.optionText }, { timeout: 5000 })
          }
        } catch (error) {
          logger.warn(`Could not select option in ${step.selector}: ${error}`)
        }
      }
      break
    case 'click':
      if (step.selector) {
        try {
          await page.click(step.selector, { timeout: 5000 })
        } catch (error) {
          logger.warn(`Could not click selector ${step.selector}: ${error}`)
          // Try alternative selectors
          try {
            await page.click('button:first-of-type', { timeout: 2000 })
          } catch (e) {
            logger.warn('Alternative button selector also failed')
          }
        }
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
    case 'keyboard':
      if (step.text) {
        // Allow comma-separated key chords, e.g., "Control+K, Enter"
        const combos = step.text.split(',').map(s => s.trim()).filter(Boolean)
        for (const combo of combos) {
          await page.keyboard.press(combo)
        }
      }
      break
  }
}

async function generateTestFromRequest(userRequest: string, appContext: string, screenshotPath?: string, appCode?: string): Promise<AppTest | null> {
  try {
    const { createLLMProvider } = await import('../codegen/providers')
    const llm = createLLMProvider()
    
    // Prepare context for LLM analysis
    let analysisContext = `App Context: ${appContext}\nUser Request: ${userRequest}\n`
    
    if (screenshotPath) {
      analysisContext += `Screenshot available at: ${screenshotPath}\n`
    }
    
    if (appCode) {
      // Truncate code if too long
      const truncatedCode = appCode.length > 2000 ? appCode.substring(0, 2000) + '...' : appCode
      analysisContext += `App Code (truncated): ${truncatedCode}\n`
    }
    
    const prompt = [
      {
        role: 'system',
        content: `You are an expert at analyzing web applications and generating automated test steps. 

Given an app context, user request, and optionally a screenshot/code, generate a JSON test plan that will interact with the app and demonstrate its functionality.

Return ONLY valid JSON with this exact structure:
{
  "description": "Brief description of what the test will do",
  "steps": [
    {
      "type": "click|type|select|wait|scroll|keyboard",
      "selector": "CSS selector or description",
      "text": "text to type (for type actions)",
      "option": "option value (for select actions)",
      "optionText": "option text (for select actions)",
      "direction": "up|down|left|right (for scroll/keyboard)",
      "duration": 1000 (for wait actions)
    }
  ],
  "waitAfter": 2000
}

Available action types:
- click: Click on an element
- type: Type text into an input field
- select: Select an option from dropdown
- wait: Wait for specified duration (ms)
- scroll: Scroll in direction
- keyboard: Press keyboard keys

For selectors, use:
- CSS selectors when possible
- Text-based selectors like "button:has-text('Calculate')"
- Generic selectors like "input[type='number']:first-of-type"
- Multiple fallback selectors separated by commas

Make the test realistic and demonstrate the app's main functionality based on the user's request.`
      },
      {
        role: 'user',
        content: analysisContext
      }
    ]
    
    const response = await llm.complete({ 
      messages: prompt, 
      temperature: 0.3,
      maxTokens: 1000 
    })
    
    try {
      // Clean LLM response: remove code fences and extract JSON object
      let raw = response.content.trim()
      const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (fenced) raw = fenced[1].trim()
      const objMatch = raw.match(/\{[\s\S]*\}/)
      const jsonStr = objMatch ? objMatch[0] : raw
      const testPlan = JSON.parse(jsonStr)
      
      // Validate the test plan structure
      if (!testPlan.description || !Array.isArray(testPlan.steps)) {
        throw new Error('Invalid test plan structure')
      }
      
      // Convert to AppTest format
      const appTest: AppTest = {
        description: testPlan.description,
        steps: testPlan.steps.map((step: any) => ({
          type: step.type,
          selector: step.selector || '',
          text: step.text || '',
          option: step.option || '',
          optionText: step.optionText || '',
          direction: step.direction || 'down',
          duration: step.duration || 1000
        })),
        waitAfter: testPlan.waitAfter || 2000
      }
      
      logger.info(`Generated test plan: ${appTest.description}`)
      return appTest
      
    } catch (parseError) {
      logger.error('Failed to parse LLM test plan:', parseError)
      logger.debug('LLM response:', response.content)
      return null
    }
    
  } catch (error) {
    logger.error('Failed to generate test from LLM:', error)
    return null
  }
}

function extractNumbers(text: string): number[] {
  const numbers = text.match(/\d+/g)
  return numbers ? numbers.map(Number) : []
}
