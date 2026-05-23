/**
 * Task 6 — viewport PNG export (requires dev server, PROTO_URL).
 */
const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

const BASE = process.env.PROTO_URL || 'http://localhost:5173'
const OUT_DIR = path.resolve(
  __dirname,
  '../../../docs/prod/prototypes/001-curve-text-canvas/screenshots',
)
const MIN_STRESS_BYTES = 50 * 1024

function readPngSize(buf) {
  if (buf.length < 24) throw new Error('file too small for PNG')
  if (buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4e || buf[3] !== 0x47) {
    throw new Error('invalid PNG signature')
  }
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

async function drawKnownScene(page, box) {
  const cx = (x) => box.x + box.width * x
  const cy = (y) => box.y + box.height * y
  await page.getByRole('button', { name: 'Polygon', exact: true }).click()
  await page.mouse.click(cx(0.42), cy(0.42))
  await page.mouse.click(cx(0.58), cy(0.42))
  await page.mouse.click(cx(0.5), cy(0.58))
  await page.mouse.dblclick(cx(0.5), cy(0.58))
  await page.waitForTimeout(400)
  await page.getByRole('button', { name: 'Text', exact: true }).click()
  await page.mouse.click(cx(0.78), cy(0.48))
  await page.waitForTimeout(400)
  const counts = await page.evaluate(() => {
    const objs = window.__proto001Debug?.objects ?? []
    return {
      polygons: objs.filter((o) => o.kind === 'polygon').length,
      texts: objs.filter((o) => o.kind === 'text').length,
    }
  })
  if (counts.polygons !== 1 || counts.texts !== 1) {
    throw new Error(`expected 1 polygon + 1 text, got ${JSON.stringify(counts)}`)
  }
}

async function exportAndValidate(page, saveAs, label) {
  const canvasMeta = await page.evaluate(() => {
    const canvas = document.querySelector('.primitives-canvas canvas')
    if (!canvas) return null
    return {
      width: canvas.width,
      height: canvas.height,
      cssWidth: canvas.clientWidth,
      cssHeight: canvas.clientHeight,
      dpr: window.devicePixelRatio || 1,
    }
  })
  if (!canvasMeta) throw new Error('no canvas for dimension check')

  const downloadPromise = page.waitForEvent('download', { timeout: 60_000 })
  await page.getByRole('button', { name: /Export viewport to PNG/i }).click()
  const download = await downloadPromise
  const tmpPath = path.join(OUT_DIR, saveAs)
  await download.saveAs(tmpPath)

  const buf = fs.readFileSync(tmpPath)
  if (buf.length === 0) throw new Error(`${label}: empty file`)
  const size = readPngSize(buf)
  const wOk = Math.abs(size.width - canvasMeta.width) <= 2
  const hOk = Math.abs(size.height - canvasMeta.height) <= 2
  if (!wOk || !hOk) {
    throw new Error(
      `${label}: PNG ${size.width}×${size.height} vs canvas ${canvasMeta.width}×${canvasMeta.height}`,
    )
  }
  console.log(
    `${label} ok: ${buf.length} bytes, ${size.width}×${size.height}px (canvas backing store, DPR ${canvasMeta.dpr})`,
  )
  return { buf, size, canvasMeta, path: tmpPath }
}

;(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const browser = await chromium.launch({ headless: true, args: ['--enable-webgl'] })
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  await page.goto(`${BASE}/?mode=primitives`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)

  const box = await page.locator('.primitives-canvas canvas').boundingBox()
  if (!box) throw new Error('no canvas')

  await drawKnownScene(page, box)
  await page.locator('.primitives-canvas canvas').screenshot({
    path: path.join(OUT_DIR, 'task6-export-source.png'),
  })

  const small = await exportAndValidate(page, 'task6-export-result.png', 'small scene export')

  if (small.buf.length < 500) {
    throw new Error('small scene export suspiciously tiny')
  }

  await page.getByRole('button', { name: /Spawn 1000 polygons/i }).click()
  await page.waitForFunction(
    () => (window.__proto001Debug?.objects?.length ?? 0) === 2000,
    { timeout: 120_000 },
  )
  await page.waitForTimeout(2000)

  const stress = await exportAndValidate(page, 'task6-export-stress-temp.png', 'stress export')
  if (stress.buf.length < MIN_STRESS_BYTES) {
    throw new Error(`stress export ${stress.buf.length} bytes < ${MIN_STRESS_BYTES}`)
  }
  fs.unlinkSync(stress.path)

  await browser.close()
  console.log('verify-export: all checks passed')
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
