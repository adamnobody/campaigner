/**
 * Task 5 — stress spawn + FPS + selection spot-check (requires dev server, PROTO_URL).
 */
const { chromium } = require('playwright')

const BASE = process.env.PROTO_URL || 'http://localhost:5173'
const SAMPLE_MS = 3000
const MIN_AVG_FPS = 30

async function measureFps(page, ms, interaction) {
  return page.evaluate(
    async ([duration, kind]) => window.__proto001MeasureFps?.(duration, kind),
    [ms, interaction],
  )
}

async function objectCounts(page) {
  return page.evaluate(() => {
    const objs = window.__proto001Debug?.objects ?? []
    return {
      total: objs.length,
      polygons: objs.filter((o) => o.kind === 'polygon').length,
      texts: objs.filter((o) => o.kind === 'text').length,
    }
  })
}

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
  const counts = await objectCounts(page)
  if (counts.total !== 2000 || counts.polygons !== 1000 || counts.texts !== 1000) {
    throw new Error(`expected 2000 objects, got ${JSON.stringify(counts)}`)
  }
  console.log('stress spawn ok:', counts)

  await page.waitForTimeout(1500)

  const idle = await measureFps(page, SAMPLE_MS, 'idle')
  console.log('idle FPS:', idle)
  if (!idle || idle.avgFps < MIN_AVG_FPS) {
    throw new Error(`idle avg FPS ${idle?.avgFps} < ${MIN_AVG_FPS}`)
  }

  const box = await page.locator('.primitives-canvas canvas').boundingBox()
  if (!box) throw new Error('no canvas')
  const cx = box.x + box.width * 0.55
  const cy = box.y + box.height * 0.55

  await page.mouse.move(cx, cy)
  await page.mouse.down({ button: 'left' })
  const panPromise = measureFps(page, SAMPLE_MS, 'pan')
  for (let i = 0; i <= 24; i++) {
    await page.mouse.move(cx - 280 + (i * 560) / 24, cy - 120 + (i * 240) / 24)
    await page.waitForTimeout(SAMPLE_MS / 24)
  }
  await page.mouse.up({ button: 'left' })
  const pan = await panPromise
  console.log('pan FPS:', pan)
  if (!pan || pan.avgFps < MIN_AVG_FPS) {
    throw new Error(`pan avg FPS ${pan?.avgFps} < ${MIN_AVG_FPS}`)
  }

  await page.waitForTimeout(400)
  await page.mouse.move(cx, cy)
  const zoomPromise = measureFps(page, SAMPLE_MS, 'zoom')
  for (let i = 0; i < 18; i++) {
    await page.mouse.wheel(0, i % 2 === 0 ? -90 : 90)
    await page.waitForTimeout(SAMPLE_MS / 18)
  }
  const zoom = await zoomPromise
  console.log('zoom FPS:', zoom)
  if (!zoom || zoom.avgFps < MIN_AVG_FPS) {
    throw new Error(`zoom avg FPS ${zoom?.avgFps} < ${MIN_AVG_FPS}`)
  }

  let hitId = null
  for (let x = 0.35; x <= 0.8 && !hitId; x += 0.05) {
    for (let y = 0.35; y <= 0.8 && !hitId; y += 0.05) {
      const px = box.x + box.width * x
      const py = box.y + box.height * y
      hitId = await page.evaluate(
        ([clientX, clientY]) => window.__proto001HitTestAtClient?.(clientX, clientY) ?? null,
        [px, py],
      )
      if (hitId) {
        await page.mouse.click(px, py)
      }
    }
  }
  await page.waitForTimeout(300)
  const sel = await page.evaluate(() => ({
    selectedId: window.__proto001Debug?.selectedId ?? null,
    outline: window.__proto001HasSelectionOutline?.() ?? false,
    kind: window.__proto001Debug?.objects?.find(
      (o) => o.id === window.__proto001Debug?.selectedId,
    )?.kind,
  }))
  if (!sel.selectedId || !sel.outline) {
    throw new Error(`stress selection spot-check failed: ${JSON.stringify(sel)}`)
  }
  console.log('stress selection ok:', sel.kind, sel.selectedId)

  const env = await page.evaluate(() => ({
    userAgent: navigator.userAgent,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: navigator.deviceMemory,
  }))
  console.log('environment:', JSON.stringify(env))

  await browser.close()
  console.log('verify-stress: all checks passed')
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
