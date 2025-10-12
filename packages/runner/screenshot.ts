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
    
    // Wait for server to be ready by retrying connection
    let retries = 0
    const maxRetries = 5
    while (retries < maxRetries) {
      try {
        await page.goto(url, {
          waitUntil: 'networkidle',
          timeout: 10000,
        })
        break
      } catch (error) {
        retries++
        if (retries >= maxRetries) {
          throw error
        }
        logger.debug(`Retry ${retries}/${maxRetries} - waiting for server...`)
        await page.waitForTimeout(2000)
      }
    }
    
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

