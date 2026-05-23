import type { SceneObject } from '../sceneTypes'

/** Stress scene extent (SPEC Task 5). */
export const STRESS_WORLD_SIZE = 8000

export const STRESS_DEFAULT_SEED = 42

function mulberry32(seed: number): () => number {
  let s = seed
  return () => {
    s += 0x6d2b79f5
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Deterministic 1000 polygons + 1000 text labels across the stress world. */
export function createStressScene(seed = STRESS_DEFAULT_SEED): SceneObject[] {
  const rand = mulberry32(seed)
  const objects: SceneObject[] = []
  const margin = 200
  const span = STRESS_WORLD_SIZE - 2 * margin

  for (let i = 0; i < 1000; i++) {
    const cx = margin + rand() * span
    const cy = margin + rand() * span
    const vertCount = 3 + Math.floor(rand() * 4)
    const baseRadius = 20 + rand() * 130
    const points: [number, number][] = []
    const angle0 = rand() * Math.PI * 2
    for (let v = 0; v < vertCount; v++) {
      const a = angle0 + (v / vertCount) * Math.PI * 2 + (rand() - 0.5) * 0.35
      const r = baseRadius * (0.65 + rand() * 0.35)
      points.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
    }
    const fill = (Math.floor(rand() * 0xffffff) & 0xfefefe) | 0x303030
    objects.push({
      id: `stress-poly-${String(i).padStart(4, '0')}`,
      kind: 'polygon',
      points,
      fill,
    })
  }

  for (let i = 0; i < 1000; i++) {
    const x = margin + rand() * span
    const y = margin + rand() * span
    const rotation = rand() < 0.5 ? 0 : (rand() - 0.5) * (30 * Math.PI) / 180
    objects.push({
      id: `stress-text-${String(i).padStart(4, '0')}`,
      kind: 'text',
      x,
      y,
      rotation,
      content: `Label ${String(i + 1).padStart(4, '0')}`,
    })
  }

  return objects
}
