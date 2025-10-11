/**
 * Screenshot capture using Playwright
 */

import { config, logger } from '../shared'
import { chromium } from 'playwright'
import { join } from 'path'
import { mkdir } from 'fs/promises'

export async function captureScreenshot(url: string, jobId: string): Promise<string | null> {
  logger.debug(`Capturing screenshot of ${url}`)
  
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
    
    // Navigate to URL
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: config.runnerTimeout,
    })
    
    // Wait a bit for rendering
    await page.waitForTimeout(config.screenshotDelay)
    
    // Ensure artifacts directory exists
    const artifactsPath = join(process.cwd(), config.artifactsRoot)
    await mkdir(artifactsPath, { recursive: true })
    
    // Save screenshot
    const screenshotPath = join(artifactsPath, `${jobId}.png`)
    await page.screenshot({
      path: screenshotPath,
      fullPage: false,
    })
    
    await browser.close()
    
    return screenshotPath
  } catch (error) {
    logger.error('Screenshot error:', error)
    
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

