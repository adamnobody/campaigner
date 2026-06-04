/**
 * Capture Task 3 screenshots (requires dev server on :5173).
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
    if (!b) throw new Error('canvas not found')
    return b
  }
  const cx = (b, x) => b.x + b.width * x
  const cy = (b, y) => b.y + b.height * y

  const goPrimitives = async () => {
    await page.goto(`${BASE}/?mode=primitives`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1200)
  }

  // Closed pentagon: 4 singles + dblclick at 5th corner; zoom to that vertex
  await goPrimitives()
  await page.getByRole('button', { name: 'Polygon', exact: true }).click()
  let b = await box()
  const singles = [
    [cx(b, 0.28), cy(b, 0.28)],
    [cx(b, 0.55), cy(b, 0.22)],
    [cx(b, 0.68), cy(b, 0.42)],
    [cx(b, 0.5), cy(b, 0.52)],
  ]
  const closeNorm = [0.32, 0.62]
  const close = [cx(b, closeNorm[0]), cy(b, closeNorm[1])]
  for (const [x, y] of singles) {
    await page.mouse.click(x, y)
    await page.waitForTimeout(60)
  }
  await page.mouse.dblclick(close[0], close[1])
  await page.waitForTimeout(500)
  const check = await page.evaluate(
    ({ cx, cy }) => {
      const poly = window.__proto001Debug?.objects?.find((o) => o.kind === 'polygon')
      const w = window.__proto001ScreenToWorld(cx, cy)
      const last = poly?.points?.[poly.points.length - 1]
      return {
        n: poly?.points?.length,
        px: window.__proto001WorldDistScreen(w, last),
        inProgress: window.__proto001Debug?.inProgress,
      }
    },
    { cx: close[0], cy: close[1] },
  )
  if (check.n !== 5 || check.inProgress || check.px > 8) {
    throw new Error(`polygon screenshot precheck failed: ${JSON.stringify(check)}`)
  }
  await page.getByRole('button', { name: 'Polygon', exact: true }).click()
  await page.mouse.move(close[0], close[1])
  for (let i = 0; i < 12; i++) await page.mouse.wheel(0, -120)
  await page.waitForTimeout(400)
  await page.locator('.primitives-canvas canvas').screenshot({
    path: path.join(OUT, 'task3-polygon.png'),
  })

  // Readable rotated text
  await goPrimitives()
  await page.locator('#text-rotation').fill('42')
  await page.getByRole('button', { name: 'Text' }).click()
  b = await box()
  await page.mouse.click(cx(b, 0.5), cy(b, 0.48))
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(OUT, 'task3-text.png') })

  // Drag: closed pentagon moved — no phantom vertex at drop (see REPORT screenshot checklist)
  await goPrimitives()
  await page.getByRole('button', { name: 'Polygon', exact: true }).click()
  b = await box()
  const dragSingles = [
    [cx(b, 0.28), cy(b, 0.28)],
    [cx(b, 0.55), cy(b, 0.22)],
    [cx(b, 0.68), cy(b, 0.42)],
    [cx(b, 0.5), cy(b, 0.52)],
  ]
  const dragCloseNorm = [0.32, 0.62]
  const dragClose = [cx(b, dragCloseNorm[0]), cy(b, dragCloseNorm[1])]
  for (const [x, y] of dragSingles) {
    await page.mouse.click(x, y)
    await page.waitForTimeout(60)
  }
  await page.mouse.dblclick(dragClose[0], dragClose[1])
  await page.waitForTimeout(500)
  const dragFrom = [cx(b, 0.45), cy(b, 0.42)]
  await page.mouse.move(dragFrom[0], dragFrom[1])
  await page.mouse.down()
  await page.mouse.move(dragFrom[0] + 140, dragFrom[1] + 100, { steps: 14 })
  await page.mouse.up()
  await page.waitForTimeout(400)
  const dragCheck = await page.evaluate(() => ({
    polys: window.__proto001Debug?.objects?.filter((o) => o.kind === 'polygon').length ?? 0,
    inProgress: window.__proto001Debug?.inProgress ?? null,
  }))
  if (dragCheck.polys !== 1 || dragCheck.inProgress != null) {
    throw new Error(`task3-drag precheck failed: ${JSON.stringify(dragCheck)}`)
  }
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
