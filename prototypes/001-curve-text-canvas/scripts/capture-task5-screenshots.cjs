/**
 * Task 5 screenshots (requires dev server, PROTO_URL).
 */
const { chromium } = require('playwright')
const path = require('path')

const OUT = path.resolve(
  __dirname,
  '../../../docs/prod/prototypes/001-curve-text-canvas/screenshots',
)
const BASE = process.env.PROTO_URL || 'http://localhost:5173'

;(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl'] })
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  await page.goto(`${BASE}/?mode=primitives`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)

  await page.getByRole('button', { name: /Spawn 1000 polygons/i }).click()
  await page.waitForFunction(
    () => (window.__proto001Debug?.objects?.length ?? 0) === 2000,
    { timeout: 120_000 },
  )
  await page.waitForTimeout(2000)

  await page.screenshot({ path: path.join(OUT, 'task5-stress-idle.png') })

  const box = await page.locator('.primitives-canvas canvas').boundingBox()
  if (!box) throw new Error('no canvas')
  const cx = box.x + box.width * 0.55
  const cy = box.y + box.height * 0.55
  await page.mouse.move(cx, cy)
  await page.mouse.down({ button: 'left' })
  await page.mouse.move(cx + 200, cy - 80, { steps: 12 })
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(OUT, 'task5-stress-pan.png') })
  await page.mouse.up({ button: 'left' })

  await page.evaluate(() => window.__proto001FitWorld?.())
  await page.waitForTimeout(400)
  await page.evaluate(() => window.__proto001SetZoomRelative?.(0.35))
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(OUT, 'task5-stress-zoomed.png') })

  await browser.close()
  console.log('Task 5 screenshots written to', OUT)
})()
