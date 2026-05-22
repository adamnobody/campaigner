/** Engine-agnostic scene model (SPEC / ADR-0001). */
export type SceneObject =
  | { id: string; kind: 'polygon'; points: [number, number][]; fill: number }
  | { id: string; kind: 'polyline'; points: [number, number][]; stroke: number }
  | { id: string; kind: 'text'; x: number; y: number; rotation: number; content: string }
  | { id: string; kind: 'curveText'; curve: BezierCurve; content: string }
  | { id: string; kind: 'image'; x: number; y: number; src: string }

export type BezierCurve = {
  p0: [number, number]
  p1: [number, number]
  p2: [number, number]
  p3: [number, number]
}

export type DrawTool = 'polygon' | 'polyline' | 'text'

export type InProgressShape =
  | { kind: 'polygon'; points: [number, number][] }
  | { kind: 'polyline'; points: [number, number][] }

export const DEFAULT_POLYGON_FILL = 0x4a90d9
export const DEFAULT_POLYLINE_STROKE = 0xe6b422
export const DEFAULT_TEXT = 'Label'

export function newId(): string {
  return `obj-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
