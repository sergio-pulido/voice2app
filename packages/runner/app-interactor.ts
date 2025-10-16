/**
 * App Interactor: Automates interactions with generated apps
 */

import { logger, config, type LLMMessage } from '../shared'
import { chromium } from 'playwright'
import { join } from 'path'
import { mkdir } from 'fs/promises'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

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
    
    // Navigate to app with longer timeout for games
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    })
    
    // Wait for app to load, longer for games
    await page.waitForTimeout(5000)
    
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
    
    // Grab handle BEFORE closing page; finalize after close
    const videoHandle = page.video()
    
    // Close page to finalize video recording
    await page.close()
    
    // Persist video (Playwright records WebM)
    let videoPath = join(artifactsPath, `${jobId}_interaction.webm`)
    if (videoHandle) {
      try {
        await videoHandle.saveAs(videoPath)
        await videoHandle.delete()
      } catch (e) {
        // Fallback to original path if saveAs fails
        const p = await videoHandle.path().catch(() => null)
        if (p) {
          videoPath = p
        }
      }
    }
    
    await browser.close()
    
    logger.success(`🎥 Video recorded: ${videoPath}`)

    // Convert to mp4
    const mp4Path = videoPath.replace('.webm', '.mp4')
    await convertToMp4(videoPath, mp4Path)

    return mp4Path
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
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('net::ERR_CONNECTION_REFUSED')) {
      logger.error('❌ Cannot connect to app server - it might not be running')
    } else if (errorMessage.includes('Timeout')) {
      logger.error('❌ App interaction timed out - server might be slow')
    } else if (errorMessage.includes('selector')) {
      logger.error('❌ Could not find UI elements - app interface might have changed')
    } else {
      logger.error('❌ Unknown interaction error:', errorMessage)
    }
    
    return null
  }
}

async function executeStep(page: any, step: InteractionStep): Promise<void> {
  try {
    switch (step.type) {
      case 'type':
        if (step.selector && step.text) {
          try {
            // Try to find and fill the input with longer timeout
            await page.fill(step.selector, step.text, { timeout: 10000 })
          } catch (error) {
            logger.warn(`Could not fill selector ${step.selector}: ${error}`)
            // Try alternative selectors
            try {
              await page.fill('input:first-of-type', step.text, { timeout: 5000 })
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
              await page.selectOption(step.selector, step.option, { timeout: 10000 })
            } else if (step.optionText) {
              // Select by text
              await page.selectOption(step.selector, { label: step.optionText }, { timeout: 10000 })
            }
          } catch (error) {
            logger.warn(`Could not select option in ${step.selector}: ${error}`)
          }
        }
        break
      case 'click':
        if (step.selector) {
          try {
            await page.click(step.selector, { timeout: 10000 })
          } catch (error) {
            logger.warn(`Could not click selector ${step.selector}: ${error}`)
            // Try alternative selectors for games
            try {
              // For games, try clicking the canvas or any clickable element
              await page.click('canvas, button:first-of-type, .game-area, .canvas', { timeout: 5000 })
            } catch (e) {
              logger.warn('Alternative click selectors also failed')
            }
          }
        }
        break
      case 'wait':
        await page.waitForTimeout(step.duration || 2000)
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
            // Small delay between key presses for games
            await page.waitForTimeout(100)
          }
        }
        break
    }
  } catch (error) {
    logger.error(`Step execution failed: ${error}`)
    // Continue with next step instead of failing completely
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

    const systemPrompt = `You are an expert at analyzing web applications and generating automated test steps, especially for games and interactive apps.

Given an app context, user request, and optionally a screenshot/code, generate a JSON test plan that will interact with the app and demonstrate its functionality.

IMPORTANT FOR GAMES:
- Use keyboard actions for game controls (Space, ArrowUp, ArrowDown, etc.)
- Click on canvas elements for touch/mouse interactions
- Include wait times between actions for game responsiveness
- For jumping games, use Space or ArrowUp keys
- For obstacle avoidance, include multiple jump attempts

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
  "waitAfter": 3000
}

Available action types:
- click: Click on an element (use for canvas, buttons)
- type: Type text into an input field
- select: Select an option from dropdown
- wait: Wait for specified duration (ms) - use longer times for games
- scroll: Scroll in direction
- keyboard: Press keyboard keys (Space, ArrowUp, ArrowDown, etc.)

For selectors, use:
- CSS selectors when possible
- For games: "canvas", ".game-area", ".canvas", "button"
- Text-based selectors like "button:has-text('Calculate')"
- Generic selectors like "input[type='number']:first-of-type"
- Multiple fallback selectors separated by commas

For game testing:
- Use keyboard actions for controls (Space for jump, Arrow keys for movement)
- Include wait times of 1-3 seconds between actions
- Click on canvas for touch interactions
- Test multiple game actions to demonstrate gameplay

Make the test realistic and demonstrate the app's main functionality based on the user's request.`;
    
    const prompt = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: analysisContext
      }
    ] as LLMMessage[]
    
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
      
      // Fallback: generate a simple game test based on the request
      return generateFallbackGameTest(userRequest, appContext)
    }
    
  } catch (error) {
    logger.error('Failed to generate test from LLM:', error)
    
    // Fallback: generate a simple game test based on the request
    logger.info('Using fallback test generation due to LLM error')
    return generateFallbackGameTest(userRequest, appContext)
  }
}

async function convertToMp4(webmPath: string, mp4Path: string): Promise<void> {
  try {
    // Use ffmpeg to convert WebM to MP4
    await execAsync(`ffmpeg -i "${webmPath}" -c:v libx264 -c:a aac -y "${mp4Path}"`)
    logger.debug(`Converted video: ${webmPath} -> ${mp4Path}`)
  } catch (error) {
    logger.warn(`Failed to convert video to MP4: ${error}`)
    // If conversion fails, we'll still return the original WebM path
  }
}

function extractNumbers(text: string): number[] {
  const numbers = text.match(/\d+/g)
  return numbers ? numbers.map(Number) : []
}

function generateFallbackGameTest(userRequest: string, appContext: string): AppTest {
  const request = userRequest.toLowerCase()
  
  // Game-specific fallback tests
  if (request.includes('jump') || request.includes('obstacle')) {
    return {
      description: 'Test jumping over obstacles in the game',
      steps: [
        {
          type: 'wait',
          duration: 2000
        },
        {
          type: 'keyboard',
          text: 'Space'
        },
        {
          type: 'wait',
          duration: 1000
        },
        {
          type: 'keyboard',
          text: 'Space'
        },
        {
          type: 'wait',
          duration: 1000
        },
        {
          type: 'keyboard',
          text: 'Space'
        },
        {
          type: 'wait',
          duration: 2000
        }
      ],
      waitAfter: 3000
    }
  }
  
  if (request.includes('click') || request.includes('tap')) {
    return {
      description: 'Test clicking/tapping on the game canvas',
      steps: [
        {
          type: 'wait',
          duration: 2000
        },
        {
          type: 'click',
          selector: 'canvas'
        },
        {
          type: 'wait',
          duration: 1000
        },
        {
          type: 'click',
          selector: 'canvas'
        },
        {
          type: 'wait',
          duration: 2000
        }
      ],
      waitAfter: 3000
    }
  }
  
  // Default game test
  return {
    description: 'Test basic game interactions',
    steps: [
      {
        type: 'wait',
        duration: 2000
      },
      {
        type: 'keyboard',
        text: 'Space'
      },
      {
        type: 'wait',
        duration: 1000
      },
      {
        type: 'click',
        selector: 'canvas'
      },
      {
        type: 'wait',
        duration: 2000
      }
    ],
    waitAfter: 3000
  }
}
