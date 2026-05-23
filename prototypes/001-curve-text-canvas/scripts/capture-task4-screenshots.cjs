/**
 * Task 4 screenshots (requires dev server, PROTO_URL).
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
  const canvas = () => page.locator('.primitives-canvas canvas')
  const box = async () => {
    const b = await canvas().boundingBox()
    if (!b) throw new Error('no canvas')
    return b
  }
  const cx = (b, x) => b.x + b.width * x
  const cy = (b, y) => b.y + b.height * y

  const go = async () => {
    await page.goto(`${BASE}/?mode=primitives`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1200)
  }

  // L-polygon selected inside shape
  await go()
  let b = await box()
  await page.getByRole('button', { name: 'Polygon', exact: true }).click()
  for (const [x, y] of [
    [0.32, 0.32],
    [0.58, 0.32],
    [0.58, 0.44],
    [0.4, 0.44],
    [0.4, 0.56],
    [0.32, 0.56],
  ]) {
    await page.mouse.click(cx(b, x), cy(b, y))
    await page.waitForTimeout(50)
  }
  await page.mouse.dblclick(cx(b, 0.32), cy(b, 0.58))
  await page.waitForTimeout(400)
  await page.mouse.click(cx(b, 0.36), cy(b, 0.34))
  await page.waitForTimeout(200)
  if (!(await page.evaluate(() => window.__proto001HasSelectionOutline?.()))) {
    throw new Error('task4-concave-hit: selection outline not visible')
  }
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(OUT, 'task4-concave-hit.png') })

  // Polyline selected
  await go()
  b = await box()
  await page.getByRole('button', { name: 'Polyline' }).click()
  await page.mouse.click(cx(b, 0.25), cy(b, 0.55))
  await page.mouse.click(cx(b, 0.55), cy(b, 0.48))
  await page.mouse.click(cx(b, 0.75), cy(b, 0.58))
  await page.keyboard.press('Enter')
  await page.waitForTimeout(300)
  await page.mouse.click(cx(b, 0.5), cy(b, 0.53))
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(OUT, 'task4-polyline-hit.png') })

  // Overlap — front dragged over back, topmost selected
  await go()
  b = await box()
  await page.getByRole('button', { name: 'Polygon', exact: true }).click()
  for (const [x, y] of [
    [0.28, 0.38],
    [0.42, 0.38],
    [0.42, 0.52],
    [0.28, 0.52],
  ]) {
    await page.mouse.click(cx(b, x), cy(b, y))
    await page.waitForTimeout(40)
  }
  await page.mouse.dblclick(cx(b, 0.28), cy(b, 0.54))
  await page.waitForTimeout(400)
  await page.getByRole('button', { name: 'Polygon', exact: true }).click()
  for (const [x, y] of [
    [0.58, 0.38],
    [0.72, 0.38],
    [0.72, 0.52],
    [0.58, 0.52],
  ]) {
    await page.mouse.click(cx(b, x), cy(b, y))
    await page.waitForTimeout(40)
  }
  await page.mouse.dblclick(cx(b, 0.58), cy(b, 0.54))
  await page.waitForTimeout(400)
  await page.mouse.move(cx(b, 0.65), cy(b, 0.45))
  await page.mouse.down()
  await page.mouse.move(cx(b, 0.35), cy(b, 0.45), { steps: 14 })
  await page.mouse.up()
  await page.waitForTimeout(400)
  await page.mouse.click(cx(b, 0.35), cy(b, 0.45))
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(OUT, 'task4-overlap.png') })

  await browser.close()
  console.log('Task 4 screenshots written to', OUT)
})()
