import { Application, Text } from 'pixi.js'

export type InteractionKind = 'idle' | 'pan' | 'zoom'

export interface FpsSampleRow {
  /** Display label for zoom column (e.g. "0.25" or "fit-all (~0.06)") */
  zoomLabel: string
  interaction: InteractionKind
  avgFps: number
  minFps: number
}

export class FpsMonitor {
  private readonly samples: number[] = []
  private displayFps = 0
  private frameCount = 0
  private lastReportMs = performance.now()
  private lastFrameMs = performance.now()
  private interaction: InteractionKind = 'idle'
  private zoom = 1

  attach(app: Application): Text {
    const overlay = new Text({
      text: 'FPS: --',
      style: {
        fontFamily: 'monospace',
        fontSize: 13,
        fill: 0x7cfc00,
        stroke: { color: 0x000000, width: 3 },
      },
    })
    overlay.eventMode = 'none'
    overlay.x = 8
    overlay.y = 8
    overlay.zIndex = 10_000
    app.stage.addChild(overlay)

    app.ticker.add((ticker) => {
      const now = performance.now()
      const dt = now - this.lastFrameMs
      this.lastFrameMs = now
      const fps = dt > 0 ? 1000 / dt : ticker.deltaMS > 0 ? 1000 / ticker.deltaMS : 0
      if (fps > 0 && fps < 1000) this.samples.push(fps)
      this.frameCount++
      if (now - this.lastReportMs >= 250) {
        this.displayFps = Math.round((this.frameCount * 1000) / (now - this.lastReportMs))
        this.frameCount = 0
        this.lastReportMs = now
        overlay.text = `FPS: ${this.displayFps}  (${this.interaction}, ${this.zoom.toFixed(2)}×)`
      }
    })

    return overlay
  }

  setInteraction(kind: InteractionKind): void {
    this.interaction = kind
  }

  setZoom(scale: number): void {
    this.zoom = scale
  }

  getCurrentZoom(): number {
    return this.zoom
  }

  getDisplayFps(): number {
    return this.displayFps
  }

  /** Reset sample buffer for a measurement window. */
  beginSample(): void {
    this.samples.length = 0
  }

  /** Average and minimum FPS over samples collected since beginSample(). */
  endSample(): { avgFps: number; minFps: number; sampleCount: number } {
    if (this.samples.length === 0) {
      return { avgFps: 0, minFps: 0, sampleCount: 0 }
    }
    let sum = 0
    let min = Infinity
    for (const fps of this.samples) {
      sum += fps
      if (fps < min) min = fps
    }
    return {
      avgFps: Math.round((sum / this.samples.length) * 10) / 10,
      minFps: Math.round(min * 10) / 10,
      sampleCount: this.samples.length,
    }
  }

  async measureWindow(ms: number): Promise<{ avgFps: number; minFps: number; sampleCount: number }> {
    this.beginSample()
    await sleep(ms)
    return this.endSample()
  }
}

export function formatResultsTable(rows: FpsSampleRow[]): string {
  const header = '| Zoom | Interaction | Avg FPS | Min FPS | Pass (≥30) |'
  const sep = '| --- | --- | ---: | ---: | --- |'
  const body = rows.map((r) => {
    const pass = r.minFps >= 30 ? 'yes' : 'NO'
    return `| ${r.zoomLabel} | ${r.interaction} | ${r.avgFps} | ${r.minFps} | ${pass} |`
  })
  return [header, sep, ...body].join('\n')
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
