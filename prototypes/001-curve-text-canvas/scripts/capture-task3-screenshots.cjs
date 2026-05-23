/**
 * Capture Task 3 screenshots (requires dev server on :5173).
 */
const { chromium } = require('playwright')
const path = require('path')

const OUT = path.resolve(
  __dirname,
  '../../../docs/prod/prototypes/001-curve-text-canvas/screenshots',
)
const BASE = 'http://localhost:5173'

;(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl'] })
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

  const canvas = () => page.locator('.primitives-canvas canvas')
  const box = async () => {
    const b = await canvas().boundingBox()
    if (!b) throw new Error('canvas not found')
    return b
  }
  const cx = (b, x) => b.x + b.width * x
  const cy = (b, y) => b.y + b.height * y

  const goPrimitives = async () => {
    await page.goto(`${BASE}/?mode=primitives`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1200)
  }

  // Closed polygon only (no in-progress preview)
  await goPrimitives()
  await page.getByRole('button', { name: 'Polygon' }).click()
  let b = await box()
  const p1 = [cx(b, 0.38), cy(b, 0.38)]
  const p2 = [cx(b, 0.58), cy(b, 0.32)]
  const p3 = [cx(b, 0.52), cy(b, 0.52)]
  await page.mouse.click(p1[0], p1[1])
  await page.waitForTimeout(80)
  await page.mouse.click(p2[0], p2[1])
  await page.waitForTimeout(80)
  await page.mouse.click(p3[0], p3[1])
  await page.waitForTimeout(80)
  await page.mouse.click(p3[0], p3[1], { delay: 40 })
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(OUT, 'task3-polygon.png') })

  // Readable rotated text
  await goPrimitives()
  await page.locator('#text-rotation').fill('42')
  await page.getByRole('button', { name: 'Text' }).click()
  b = await box()
  await page.mouse.click(cx(b, 0.5), cy(b, 0.48))
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(OUT, 'task3-text.png') })

  // Drag: polygon moved from original position
  await goPrimitives()
  await page.getByRole('button', { name: 'Polygon' }).click()
  b = await box()
  const t1 = [cx(b, 0.35), cy(b, 0.42)]
  const t2 = [cx(b, 0.5), cy(b, 0.38)]
  const t3 = [cx(b, 0.45), cy(b, 0.52)]
  await page.mouse.click(t1[0], t1[1])
  await page.waitForTimeout(60)
  await page.mouse.click(t2[0], t2[1])
  await page.waitForTimeout(60)
  await page.mouse.click(t3[0], t3[1])
  await page.waitForTimeout(60)
  await page.mouse.click(t3[0], t3[1], { delay: 40 })
  await page.waitForTimeout(300)
  await page.getByRole('button', { name: 'Polygon' }).click()
  const dragX = cx(b, 0.43)
  const dragY = cy(b, 0.44)
  await page.mouse.move(dragX, dragY)
  await page.mouse.down()
  await page.mouse.move(dragX + 120, dragY + 90, { steps: 12 })
  await page.waitForTimeout(100)
  await page.mouse.up()
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(OUT, 'task3-drag.png') })

  // Polyline (unchanged)
  await goPrimitives()
  await page.getByRole('button', { name: 'Polyline' }).click()
  b = await box()
  await page.mouse.click(cx(b, 0.3), cy(b, 0.65))
  await page.mouse.click(cx(b, 0.5), cy(b, 0.7))
  await page.mouse.click(cx(b, 0.7), cy(b, 0.62))
  await page.keyboard.press('Enter')
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(OUT, 'task3-polyline.png') })

  await browser.close()
  console.log('Screenshots written to', OUT)
})()
