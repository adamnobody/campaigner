/**
 * Capture Task 3 screenshots (requires dev server on :5173).
 */
const { chromium } = require('playwright')
const path = require('path')

const OUT = path.resolve(
  __dirname,
  '../../../docs/prod/prototypes/001-curve-text-canvas/screenshots',
)

;(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl'] })
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  await page.goto('http://localhost:5173/?mode=primitives', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  // Polygon
  await page.getByRole('button', { name: 'Polygon' }).click()
  const canvas = page.locator('.primitives-canvas canvas')
  const box = await canvas.boundingBox()
  if (!box) throw new Error('canvas not found')
  const cx = (x) => box.x + box.width * x
  const cy = (y) => box.y + box.height * y
  await page.mouse.click(cx(0.35), cy(0.4))
  await page.mouse.click(cx(0.55), cy(0.35))
  await page.mouse.click(cx(0.65), cy(0.55))
  await page.mouse.dblclick(cx(0.4), cy(0.55))
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(OUT, 'task3-polygon.png') })

  // Polyline
  await page.getByRole('button', { name: 'Polyline' }).click()
  await page.mouse.click(cx(0.3), cy(0.65))
  await page.mouse.click(cx(0.5), cy(0.7))
  await page.mouse.click(cx(0.7), cy(0.62))
  await page.keyboard.press('Enter')
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(OUT, 'task3-polyline.png') })

  // Text
  await page.getByRole('button', { name: 'Text' }).click()
  await page.mouse.click(cx(0.5), cy(0.45))
  await page.locator('#text-rotation').fill('35')
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(OUT, 'task3-text.png') })

  await browser.close()
  console.log('Screenshots written to', OUT)
})()
