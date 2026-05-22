/**
 * Worst-case FPS in installed Google Chrome (vsync typically on). Dev server required.
 */
const { chromium } = require('playwright')

const URL = 'http://localhost:5173/?mode=large&bench=1'

;(async () => {
  let browser
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: false })
  } catch {
    console.log(JSON.stringify({ error: 'Google Chrome not found for channel launch' }))
    process.exit(3)
  }
  const page = await browser.newPage()
  try {
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 30_000 })
    await page.waitForFunction(() => window.__proto001LargeReady === true, { timeout: 60_000 })
    await page.waitForFunction(
      () => document.getElementById('bench-results')?.dataset.benchDone === 'true',
      { timeout: 120_000 },
    )
    const raw = await page.locator('#bench-results').getAttribute('data-results')
    const parsed = JSON.parse(raw ?? '{}')
    const worst = parsed.rows?.find((r) => r.zoomLabel?.startsWith('fit-all'))
    console.log(
      JSON.stringify({
        browser: 'Google Chrome (Playwright channel)',
        vsync: 'assumed on (desktop Chrome default; not instrumented)',
        worstCase: worst ?? null,
        pass: parsed.pass,
      }),
    )
  } finally {
    await browser.close()
  }
})()
