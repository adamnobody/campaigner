/**
 * Polygon double-click close — real UX: dblclick at a NEW position adds final vertex + closes.
 * Requires dev server; set PROTO_URL if not :5173.
 */
const { chromium } = require('playwright')

const BASE = process.env.PROTO_URL || 'http://localhost:5173'
const MAX_LAST_VERTEX_SCREEN_PX = 8

/**
 * @param {import('playwright').Page} page
 * @param {[number,number][]} singleVerts normalized canvas coords (single clicks only)
 * @param {[number,number]} closeAt normalized coords for dblclick (must differ from singles)
 */
async function drawAndClose(page, singleVerts, closeAt) {
  const box = await page.locator('.primitives-canvas canvas').boundingBox()
  if (!box) throw new Error('no canvas')
  const cx = (x) => box.x + box.width * x
  const cy = (y) => box.y + box.height * y

  for (const [x, y] of singleVerts) {
    await page.mouse.click(cx(x), cy(y))
    await page.waitForTimeout(60)
  }

  const before = await page.evaluate(() => window.__proto001Debug?.inProgress?.points?.length)
  if (before !== singleVerts.length) {
    throw new Error(`expected ${singleVerts.length} in-progress verts before dblclick, got ${before}`)
  }

  const clientX = cx(closeAt[0])
  const clientY = cy(closeAt[1])
  const expectedCount = singleVerts.length + 1

  await page.mouse.dblclick(clientX, clientY)
  await page.waitForTimeout(400)

  return page.evaluate(
    ({ clientX: cx, clientY: cy, expectedCount }) => {
      const poly = window.__proto001Debug?.objects?.find((o) => o.kind === 'polygon')
      const inProgress = window.__proto001Debug?.inProgress ?? null
      if (!poly || !window.__proto001ScreenToWorld || !window.__proto001WorldDistScreen) {
        return { error: 'missing polygon or debug helpers', poly, inProgress }
      }
      const expectedWorld = window.__proto001ScreenToWorld(cx, cy)
      const last = poly.points[poly.points.length - 1]
      const screenToLast = window.__proto001WorldDistScreen(expectedWorld, last)
      return {
        inProgress,
        pointCount: poly.points.length,
        points: poly.points,
        expectedWorld,
        last,
        screenToLast,
      }
    },
    { clientX, clientY, expectedCount },
  )
}

function assertCloseResult(result, label, expectedCount) {
  if (result.error) throw new Error(`${label}: ${result.error}`)
  if (result.inProgress != null) throw new Error(`${label}: inProgress should be null`)
  if (result.pointCount !== expectedCount) {
    throw new Error(
      `${label}: expected ${expectedCount} verts, got ${result.pointCount}: ${JSON.stringify(result.points)}`,
    )
  }
  if (result.screenToLast > MAX_LAST_VERTEX_SCREEN_PX) {
    throw new Error(
      `${label}: last vertex is ${result.screenToLast.toFixed(1)} screen px from dblclick (max ${MAX_LAST_VERTEX_SCREEN_PX})`,
    )
  }
}

;(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl'] })
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  await page.goto(`${BASE}/?mode=primitives`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await page.getByRole('button', { name: 'Polygon' }).click()

  // Triangle: 2 singles, dblclick at a 3rd NEW corner
  const triSingles = [
    [0.32, 0.32],
    [0.58, 0.28],
  ]
  const triClose = [0.4, 0.55]
  let result = await drawAndClose(page, triSingles, triClose)
  assertCloseResult(result, 'triangle', 3)
  console.log(
    `triangle ok: 3 verts, last vertex ${result.screenToLast.toFixed(1)} px from dblclick`,
  )

  await page.goto(`${BASE}/?mode=primitives`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await page.getByRole('button', { name: 'Polygon' }).click()

  // Pentagon: 4 singles, dblclick at 5th NEW corner
  const pentSingles = [
    [0.22, 0.32],
    [0.42, 0.22],
    [0.62, 0.32],
    [0.52, 0.48],
  ]
  const pentClose = [0.28, 0.58]
  result = await drawAndClose(page, pentSingles, pentClose)
  assertCloseResult(result, 'pentagon', 5)
  console.log(
    `pentagon ok: 5 verts, last vertex ${result.screenToLast.toFixed(1)} px from dblclick`,
  )

  await page.goto(`${BASE}/?mode=primitives`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await page.getByRole('button', { name: 'Polygon' }).click()

  // Drag existing polygon — must not spawn in-progress ring / extra polygon
  await drawAndClose(page, triSingles, triClose)
  const box = await page.locator('.primitives-canvas canvas').boundingBox()
  const cx = (x) => box.x + box.width * x
  const cy = (y) => box.y + box.height * y
  const centroid = [cx(0.43), cy(0.38)]
  await page.mouse.move(centroid[0], centroid[1])
  await page.mouse.down()
  await page.mouse.move(centroid[0] + 120, centroid[1] + 90, { steps: 12 })
  await page.mouse.up()
  await page.waitForTimeout(300)
  let dragState = await page.evaluate(() => ({
    polys: window.__proto001Debug?.objects?.filter((o) => o.kind === 'polygon').length ?? 0,
    inProgress: window.__proto001Debug?.inProgress ?? null,
  }))
  if (dragState.polys !== 1) {
    throw new Error(`polygon drag: expected 1 polygon, got ${dragState.polys}`)
  }
  if (dragState.inProgress != null) {
    throw new Error(`polygon drag: stray in-progress ${JSON.stringify(dragState.inProgress)}`)
  }
  console.log('polygon drag ok: 1 polygon, no phantom vertex')

  await page.goto(`${BASE}/?mode=primitives`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await page.getByRole('button', { name: 'Polygon' }).click()

  // Drag on empty canvas — must not place a vertex
  const empty = [cx(0.35), cy(0.45)]
  await page.mouse.move(empty[0], empty[1])
  await page.mouse.down()
  await page.mouse.move(empty[0] + 20, empty[1], { steps: 4 })
  await page.mouse.up()
  await page.waitForTimeout(300)
  dragState = await page.evaluate(() => ({
    polys: window.__proto001Debug?.objects?.filter((o) => o.kind === 'polygon').length ?? 0,
    inProgress: window.__proto001Debug?.inProgress ?? null,
  }))
  if (dragState.polys !== 0) {
    throw new Error(`empty drag: expected 0 polygons, got ${dragState.polys}`)
  }
  if (dragState.inProgress != null) {
    throw new Error(`empty drag: unexpected in-progress ${JSON.stringify(dragState.inProgress)}`)
  }
  console.log('empty canvas drag ok: no vertex placed')

  await browser.close()
  console.log('verify-polygon-close: all checks passed')
})()
