import { Graphics } from 'pixi.js'
import type { Bounds } from './hitTest'

const SELECTION_COLOR = 0x7ec8ff
const SELECTION_WIDTH = 2
const DASH = 10
const GAP = 6

function strokeDashedLine(
  g: Graphics,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  const len = Math.hypot(x2 - x1, y2 - y1)
  if (len < 0.001) return
  const ux = (x2 - x1) / len
  const uy = (y2 - y1) / len
  let dist = 0
  let draw = true
  let remain = DASH
  let x = x1
  let y = y1
  while (dist < len) {
    const step = Math.min(remain, len - dist)
    const nx = x + ux * step
    const ny = y + uy * step
    if (draw) {
      g.moveTo(x, y)
      g.lineTo(nx, ny)
    }
    x = nx
    y = ny
    dist += step
    remain -= step
    if (remain <= 0) {
      draw = !draw
      remain = draw ? DASH : GAP
    }
  }
}

export function drawSelectionOutline(g: Graphics, b: Bounds) {
  const { minX, minY, maxX, maxY } = b
  strokeDashedLine(g, minX, minY, maxX, minY)
  strokeDashedLine(g, maxX, minY, maxX, maxY)
  strokeDashedLine(g, maxX, maxY, minX, maxY)
  strokeDashedLine(g, minX, maxY, minX, minY)
  g.stroke({ width: SELECTION_WIDTH, color: SELECTION_COLOR, alpha: 0.95 })
}
