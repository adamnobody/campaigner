const { chromium } = require('playwright')

const URL = 'http://localhost:5173/?mode=large&bench=1'
const TIMEOUT_MS = 120_000

;(async () => {
  const browser = await chromium.launch({
    headless: false,
    args: ['--enable-webgl'],
  })
  const page = await browser.newPage()
  try {
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 30_000 })
    await page.waitForFunction(() => window.__proto001LargeReady === true, { timeout: 60_000 })
    await page.waitForTimeout(1500)
    await page.waitForFunction(
      () => document.getElementById('bench-results')?.dataset.benchDone === 'true',
      { timeout: TIMEOUT_MS },
    )
    const raw = await page.locator('#bench-results').getAttribute('data-results')
    console.log(raw ?? '{}')
    const parsed = JSON.parse(raw ?? '{}')
    process.exit(parsed.pass ? 0 : 1)
  } catch (e) {
    console.error(e)
    process.exit(2)
  } finally {
    await browser.close()
  }
})()
