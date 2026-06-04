import { Container, Sprite, Texture } from 'pixi.js'

/** World size per SPEC / ADR-0001 validation. */
export const WORLD_WIDTH = 16_384
export const WORLD_HEIGHT = 16_384
/** Tile size — stays under typical GPU MAX_TEXTURE_SIZE (8192/16384). */
export const TILE_SIZE = 4096

export function tileCounts(): { cols: number; rows: number } {
  return {
    cols: Math.ceil(WORLD_WIDTH / TILE_SIZE),
    rows: Math.ceil(WORLD_HEIGHT / TILE_SIZE),
  }
}

/** Procedural parchment + grid for one world tile (no repo asset). */
export function generateTileCanvas(tileX: number, tileY: number): HTMLCanvasElement {
  const worldX = tileX * TILE_SIZE
  const worldY = tileY * TILE_SIZE
  const width = Math.min(TILE_SIZE, WORLD_WIDTH - worldX)
  const height = Math.min(TILE_SIZE, WORLD_HEIGHT - worldY)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D context unavailable')

  const grad = ctx.createLinearGradient(0, 0, width, height)
  grad.addColorStop(0, '#c9b896')
  grad.addColorStop(0.5, '#e2d4b8')
  grad.addColorStop(1, '#b8a078')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, width, height)

  const gridStep = 256
  ctx.strokeStyle = 'rgba(60, 45, 30, 0.35)'
  ctx.lineWidth = 1
  const offsetX = worldX % gridStep
  const offsetY = worldY % gridStep
  for (let x = -offsetX; x <= width; x += gridStep) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  for (let y = -offsetY; y <= height; y += gridStep) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  ctx.fillStyle = 'rgba(30, 20, 10, 0.55)'
  ctx.font = 'bold 22px sans-serif'
  ctx.fillText(`tile ${tileX},${tileY}`, 12, 32)

  return canvas
}

export type TileLoadProgress = (loaded: number, total: number) => void

/** Build tiled sprites using PixiJS Texture.from(canvas) per tile. */
export async function loadTiledBackground(
  layer: Container,
  onProgress?: TileLoadProgress,
): Promise<{ tileCount: number; loadMs: number }> {
  const { cols, rows } = tileCounts()
  const total = cols * rows
  let loaded = 0
  const t0 = performance.now()

  for (let ty = 0; ty < rows; ty++) {
    for (let tx = 0; tx < cols; tx++) {
      const canvas = generateTileCanvas(tx, ty)
      const texture = Texture.from(canvas)
      const sprite = new Sprite(texture)
      sprite.x = tx * TILE_SIZE
      sprite.y = ty * TILE_SIZE
      layer.addChild(sprite)
      loaded++
      onProgress?.(loaded, total)
      // Yield so loading UI can paint
      if (loaded % 2 === 0) {
        await new Promise((r) => requestAnimationFrame(() => r(undefined)))
      }
    }
  }

  return { tileCount: total, loadMs: Math.round(performance.now() - t0) }
}

export function readMaxTextureSize(gl: WebGL2RenderingContext | WebGLRenderingContext): number {
  return gl.getParameter(gl.MAX_TEXTURE_SIZE) as number
}

export function readGpuMemoryMb(): number | null {
  const mem = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory
  if (!mem) return null
  return Math.round(mem.usedJSHeapSize / (1024 * 1024))
}
