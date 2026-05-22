const { chromium } = require('playwright')

const URL = 'http://localhost:5173/?mode=large&sanity=1'

;(async () => {
  const browser = await chromium.launch({ headless: false, args: ['--enable-webgl'] })
  const page = await browser.newPage()
  try {
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 30_000 })
    await page.waitForFunction(() => window.__proto001LargeReady === true, { timeout: 60_000 })
    await page.waitForFunction(() => window.__proto001SanityResult != null, { timeout: 20_000 })
    const result = await page.evaluate(() => window.__proto001SanityResult)
    console.log(JSON.stringify({ agent: 'Playwright Chromium headed', result }))
  } finally {
    await browser.close()
  }
})()
