/**
 * Task 4 — selection & hit-testing (requires dev server, PROTO_URL).
 */
const { chromium } = require('playwright')
const { execSync } = require('child_process')
const path = require('path')

const BASE = process.env.PROTO_URL || 'http://localhost:5173'

async function state(page) {
  return page.evaluate(() => ({
    selectedId: window.__proto001Debug?.selectedId ?? null,
    outline: window.__proto001HasSelectionOutline?.() ?? false,
    polys: window.__proto001Debug?.objects?.filter((o) => o.kind === 'polygon').length ?? 0,
    inProgress: window.__proto001Debug?.inProgress ?? null,
    objects: window.__proto001Debug?.objects?.map((o) => ({ id: o.id, kind: o.kind })) ?? [],
  }))
}

async function ensureToolOff(page) {
  for (const name of ['Polygon', 'Polyline', 'Text']) {
    const btn = page.getByRole('button', { name })
    if (await btn.evaluate((el) => el.classList.contains('active'))) {
      await btn.click()
    }
  }
}

async function drawL(page, box) {
  const cx = (x) => box.x + box.width * x
  const cy = (y) => box.y + box.height * y
  await page.getByRole('button', { name: 'Polygon' }).click()
  const verts = [
    [0.32, 0.32],
    [0.58, 0.32],
    [0.58, 0.44],
    [0.4, 0.44],
    [0.4, 0.56],
    [0.32, 0.56],
  ]
  for (const [x, y] of verts) {
    await page.mouse.click(cx(x), cy(y))
    await page.waitForTimeout(50)
  }
  await page.mouse.dblclick(cx(0.32), cy(0.58))
  await page.waitForTimeout(400)
  await ensureToolOff(page)
}

;(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl'] })
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  await page.goto(`${BASE}/?mode=primitives`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)

  const box = await page.locator('.primitives-canvas canvas').boundingBox()
  if (!box) throw new Error('no canvas')
  const cx = (x) => box.x + box.width * x
  const cy = (y) => box.y + box.height * y

  // Concave L: miss in bbox void, hit inside fill
  await drawL(page, box)
  await page.mouse.click(cx(0.52), cy(0.5))
  await page.waitForTimeout(200)
  let s = await state(page)
  if (s.selectedId != null) {
    throw new Error(`concave void: should not select, got ${s.selectedId}`)
  }
  if (s.outline) throw new Error('concave void: selection outline visible')

  await page.mouse.click(cx(0.36), cy(0.34))
  await page.waitForTimeout(200)
  s = await state(page)
  if (!s.selectedId || !s.outline) {
    throw new Error(`concave hit: expected selection, got ${JSON.stringify(s)}`)
  }
  console.log('concave L hit-test ok')

  // Polyline: hit near segment, miss far away
  await page.goto(`${BASE}/?mode=primitives`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await page.getByRole('button', { name: 'Polyline' }).click()
  await page.mouse.click(cx(0.28), cy(0.52))
  await page.mouse.click(cx(0.72), cy(0.52))
  await page.keyboard.press('Enter')
  await page.waitForTimeout(300)
  await ensureToolOff(page)
  const lineY = cy(0.52)
  const lineX = cx(0.5)
  await page.mouse.click(lineX, lineY)
  await page.waitForTimeout(200)
  s = await state(page)
  const polylineId = s.selectedId
  if (!polylineId || s.objects.find((o) => o.id === polylineId)?.kind !== 'polyline') {
    throw new Error(`polyline on-line: expected polyline selected, got ${JSON.stringify(s)}`)
  }
  await page.mouse.click(lineX, lineY + 28)
  await page.waitForTimeout(200)
  s = await state(page)
  if (s.selectedId != null) {
    throw new Error(`polyline far: should not select, got ${s.selectedId}`)
  }
  await page.mouse.click(lineX, lineY + 3)
  await page.waitForTimeout(200)
  s = await state(page)
  if (!s.selectedId) {
    throw new Error('polyline 3px: expected hit within tolerance')
  }
  console.log('polyline hit tolerance ok')

  // Text label
  await page.goto(`${BASE}/?mode=primitives`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await page.getByRole('button', { name: 'Text' }).click()
  await page.mouse.click(cx(0.5), cy(0.48))
  await page.waitForTimeout(300)
  await ensureToolOff(page)
  await page.mouse.click(cx(0.5), cy(0.48))
  await page.waitForTimeout(200)
  s = await state(page)
  if (!s.selectedId || !s.objects.find((o) => o.id === s.selectedId && o.kind === 'text')) {
    throw new Error(`text select: ${JSON.stringify(s)}`)
  }
  console.log('text selection ok')

  // Empty click deselect (isolated)
  await page.goto(`${BASE}/?mode=primitives`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await drawL(page, box)
  await ensureToolOff(page)
  await page.mouse.click(cx(0.36), cy(0.34))
  await page.waitForTimeout(200)
  s = await state(page)
  if (!s.selectedId) throw new Error('deselect setup: need selection')
  // Top-left canvas coords sit under the sidebar overlay — use empty upper-right.
  await page.mouse.click(cx(0.88), cy(0.18))
  await page.waitForTimeout(200)
  s = await state(page)
  if (s.selectedId != null || s.outline) {
    throw new Error(`deselect: ${JSON.stringify(s)}`)
  }
  console.log('empty click deselect ok')

  // Overlap: draw apart, drag front over back, topmost wins
  await page.goto(`${BASE}/?mode=primitives`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await page.getByRole('button', { name: 'Polygon' }).click()
  const backVerts = [
    [0.28, 0.38],
    [0.42, 0.38],
    [0.42, 0.52],
    [0.28, 0.52],
  ]
  for (const [x, y] of backVerts) {
    await page.mouse.click(cx(x), cy(y))
    await page.waitForTimeout(40)
  }
  await page.mouse.dblclick(cx(0.28), cy(0.54))
  await page.waitForTimeout(400)
  await page.getByRole('button', { name: 'Polygon' }).click()
  const frontVerts = [
    [0.58, 0.38],
    [0.72, 0.38],
    [0.72, 0.52],
    [0.58, 0.52],
  ]
  for (const [x, y] of frontVerts) {
    await page.mouse.click(cx(x), cy(y))
    await page.waitForTimeout(40)
  }
  await page.mouse.dblclick(cx(0.58), cy(0.54))
  await page.waitForTimeout(400)
  const overlap = await page.evaluate(() => window.__proto001Debug?.objects?.filter((o) => o.kind === 'polygon'))
  if (overlap?.length !== 2) throw new Error(`expected 2 polygons, got ${overlap?.length}`)
  const topId = overlap[1].id
  await ensureToolOff(page)
  const dragStart = [cx(0.65), cy(0.45)]
  await page.mouse.move(dragStart[0], dragStart[1])
  await page.mouse.down()
  await page.mouse.move(cx(0.35), cy(0.45), { steps: 14 })
  await page.mouse.up()
  await page.waitForTimeout(400)
  await page.mouse.click(cx(0.35), cy(0.45))
  await page.waitForTimeout(200)
  s = await state(page)
  if (s.selectedId !== topId) {
    throw new Error(`overlap: expected top ${topId}, got ${s.selectedId}`)
  }
  console.log('z-order overlap ok')

  // Drag keeps selection, no phantom polygon
  await page.mouse.move(cx(0.35), cy(0.45))
  await page.mouse.down()
  await page.mouse.move(cx(0.35) + 80, cy(0.45) + 50, { steps: 10 })
  await page.mouse.up()
  await page.waitForTimeout(300)
  s = await state(page)
  if (s.selectedId !== topId) {
    throw new Error(`drag select: expected ${topId} still selected, got ${s.selectedId}`)
  }
  if (s.polys !== 2 || s.inProgress != null) {
    throw new Error(`drag regression: ${JSON.stringify(s)}`)
  }
  console.log('drag selection + no phantom vertex ok')

  // Empty canvas drag — no vertex
  await page.mouse.move(cx(0.2), cy(0.2))
  await page.mouse.down()
  await page.mouse.move(cx(0.2) + 20, cy(0.2), { steps: 4 })
  await page.mouse.up()
  await page.waitForTimeout(200)
  s = await state(page)
  if (s.inProgress != null || s.polys !== 2) {
    throw new Error(`empty drag: ${JSON.stringify(s)}`)
  }
  console.log('empty drag no vertex ok')

  await browser.close()

  try {
    execSync('node scripts/verify-polygon-close.cjs', {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, PROTO_URL: BASE },
      stdio: 'inherit',
    })
  } catch {
    throw new Error('verify-polygon-close regression failed')
  }

  console.log('verify-selection: all checks passed')
})()
