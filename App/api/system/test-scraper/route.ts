
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { chromium } from 'playwright';

const LIST_URL = 'https://www.livescore.in/br/futebol/';

export async function GET() {
  let browser = null;
  try {
    console.log('[test-scraper] Starting browser test...');
    
    browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });
    
    console.log('[test-scraper] Navigating to:', LIST_URL);
    await page.goto(LIST_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // Try to accept cookies
    try {
      const acceptButton = await page.locator("button:has-text('Aceitar')").first();
      if (await acceptButton.isVisible({ timeout: 2000 })) {
        await acceptButton.click();
        await page.waitForTimeout(1000);
      }
    } catch (e) {
      console.log('[test-scraper] No cookie banner or already accepted');
    }
    
    // Wait for matches to load
    await page.waitForTimeout(5000);
    
    // Look for live matches
    const liveMatches = await page.evaluate(() => {
      const matchElements = document.querySelectorAll('[class*="match"], [class*="evento"], [class*="live"]');
      return {
        totalElements: matchElements.length,
        sample: Array.from(matchElements).slice(0, 3).map(el => ({
          classes: el.className,
          text: el.textContent?.substring(0, 100)
        }))
      };
    });
    
    // Get page content sample
    const pageTitle = await page.title();
    const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
    
    await browser.close();
    
    return NextResponse.json({
      success: true,
      url: LIST_URL,
      pageTitle,
      liveMatches,
      bodyTextSample: bodyText,
      message: liveMatches.totalElements > 0 
        ? `Found ${liveMatches.totalElements} potential match elements` 
        : 'No match elements found - there may be no live matches right now'
    });
    
  } catch (error: any) {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        // Ignore close errors
      }
    }
    
    console.error('[test-scraper] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
