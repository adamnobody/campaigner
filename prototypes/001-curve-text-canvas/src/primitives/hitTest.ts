import type { SceneObject } from '../sceneTypes'

/** Ray-casting even-odd point-in-polygon (concave-safe). */
export function pointInPolygon(
  x: number,
  y: number,
  points: [number, number][],
): boolean {
  if (points.length < 3) return false
  let inside = false
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i][0]
    const yi = points[i][1]
    const xj = points[j][0]
    const yj = points[j][1]
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

export function distancePointToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1
  const dy = y2 - y1
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return Math.hypot(px - x1, py - y1)
  let t = ((px - x1) * dx + (py - y1) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))
}

const TEXT_CHAR_WIDTH = 14
const TEXT_LINE_HEIGHT = 28
const TEXT_HIT_PAD = 4

function hitTestText(obj: Extract<SceneObject, { kind: 'text' }>, wx: number, wy: number): boolean {
  const cos = Math.cos(-obj.rotation)
  const sin = Math.sin(-obj.rotation)
  const dx = wx - obj.x
  const dy = wy - obj.y
  const lx = dx * cos - dy * sin
  const ly = dx * sin + dy * cos
  const halfW = (obj.content.length * TEXT_CHAR_WIDTH) / 2 + TEXT_HIT_PAD
  const halfH = TEXT_LINE_HEIGHT / 2 + TEXT_HIT_PAD
  return Math.abs(lx) <= halfW && Math.abs(ly) <= halfH
}

export function hitTestObject(
  obj: SceneObject,
  wx: number,
  wy: number,
  polylineToleranceWorld: number,
): boolean {
  switch (obj.kind) {
    case 'polygon':
      return pointInPolygon(wx, wy, obj.points)
    case 'polyline': {
      const pts = obj.points
      if (pts.length === 0) return false
      if (pts.length === 1) {
        return (
          Math.hypot(wx - pts[0][0], wy - pts[0][1]) <= polylineToleranceWorld
        )
      }
      for (let i = 0; i < pts.length - 1; i++) {
        const d = distancePointToSegment(
          wx,
          wy,
          pts[i][0],
          pts[i][1],
          pts[i + 1][0],
          pts[i + 1][1],
        )
        if (d <= polylineToleranceWorld) return true
      }
      return false
    }
    case 'text':
      return hitTestText(obj, wx, wy)
    default:
      return false
  }
}

/** Topmost hit (last in paint order wins). */
export function hitTestTopmost(
  objects: SceneObject[],
  wx: number,
  wy: number,
  polylineToleranceWorld: number,
): string | null {
  for (let i = objects.length - 1; i >= 0; i--) {
    if (hitTestObject(objects[i], wx, wy, polylineToleranceWorld)) {
      return objects[i].id
    }
  }
  return null
}

export type Bounds = { minX: number; minY: number; maxX: number; maxY: number }

export function boundsOfObject(obj: SceneObject, pad = 4): Bounds | null {
  if (obj.kind === 'polygon' || obj.kind === 'polyline') {
    if (obj.points.length === 0) return null
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const [x, y] of obj.points) {
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }
    return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad }
  }
  if (obj.kind === 'text') {
    const halfW = (obj.content.length * TEXT_CHAR_WIDTH) / 2 + pad
    const halfH = TEXT_LINE_HEIGHT / 2 + pad
    const cos = Math.cos(obj.rotation)
    const sin = Math.sin(obj.rotation)
    const corners: [number, number][] = [
      [-halfW, -halfH],
      [halfW, -halfH],
      [halfW, halfH],
      [-halfW, halfH],
    ]
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const [lx, ly] of corners) {
      const wx = obj.x + lx * cos - ly * sin
      const wy = obj.y + lx * sin + ly * cos
      minX = Math.min(minX, wx)
      minY = Math.min(minY, wy)
      maxX = Math.max(maxX, wx)
      maxY = Math.max(maxY, wy)
    }
    return { minX, minY, maxX, maxY }
  }
  return null
}
