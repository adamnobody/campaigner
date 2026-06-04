import { Application, Container, Rectangle } from 'pixi.js'

export type ViewportExportResult = {
  blob: Blob
  /** Physical pixels (CSS × renderer resolution). */
  width: number
  height: number
}

/**
 * Export the visible framebuffer via Pixi v8 `renderer.extract.canvas` on the stage,
 * clipped to the screen rectangle at the renderer's resolution (matches canvas backing store).
 */
export async function exportVisibleViewport(
  app: Application,
  stage: Container,
  options: {
    hide?: Container[]
    clearColor?: number | string
  } = {},
): Promise<ViewportExportResult> {
  const hide = options.hide ?? []
  const saved = hide.map((c) => c.visible)
  hide.forEach((c) => {
    c.visible = false
  })

  try {
    app.renderer.render({ container: stage })

    const canvas = app.renderer.extract.canvas({
      target: stage,
      frame: new Rectangle(0, 0, app.screen.width, app.screen.height),
      resolution: app.renderer.resolution,
      clearColor: options.clearColor ?? '#1e1e2a',
    })

    const htmlCanvas = canvas as HTMLCanvasElement
    const blob = await new Promise<Blob>((resolve, reject) => {
      if (typeof htmlCanvas.toBlob !== 'function') {
        reject(new Error('extract canvas has no toBlob'))
        return
      }
      htmlCanvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('canvas.toBlob returned null'))),
        'image/png',
      )
    })

    return { blob, width: canvas.width, height: canvas.height }
  } finally {
    hide.forEach((c, i) => {
      c.visible = saved[i]
    })
  }
}

export function downloadPngBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
