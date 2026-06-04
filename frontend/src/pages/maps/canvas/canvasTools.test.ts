import { describe, expect, it } from 'vitest';
import {
  isMapScene,
  isRootCanvasScene,
  isToolAllowedForSceneType,
  listAllowedCanvasModes,
  normalizeCanvasModeForSceneType,
} from './canvasTools';
import type { CanvasMode } from './canvasModel';

const ALL_MODES: CanvasMode[] = [
  'select',
  'marker',
  'text',
  'draw_territory',
  'polygon',
  'polyline',
  'rectangle',
  'ellipse',
  'curve_text',
  'image',
  'scene_container',
];

describe('isToolAllowedForSceneType', () => {
  it('root_canvas hides marker and territory tools', () => {
    expect(isToolAllowedForSceneType('marker', 'root_canvas')).toBe(false);
    expect(isToolAllowedForSceneType('draw_territory', 'root_canvas')).toBe(false);
    expect(isToolAllowedForSceneType('scene_container', 'root_canvas')).toBe(true);
    expect(isToolAllowedForSceneType('text', 'root_canvas')).toBe(true);
  });

  it('map hides create-map / scene_container tool', () => {
    expect(isToolAllowedForSceneType('scene_container', 'map')).toBe(false);
    expect(isToolAllowedForSceneType('marker', 'map')).toBe(true);
    expect(isToolAllowedForSceneType('draw_territory', 'map')).toBe(true);
  });

  it('legacy null scene_type keeps all tools', () => {
    for (const mode of ALL_MODES) {
      expect(isToolAllowedForSceneType(mode, null)).toBe(true);
      expect(isToolAllowedForSceneType(mode, undefined)).toBe(true);
    }
  });
});

describe('listAllowedCanvasModes', () => {
  it('root_canvas list excludes marker and draw_territory', () => {
    const allowed = listAllowedCanvasModes('root_canvas', ALL_MODES);
    expect(allowed).not.toContain('marker');
    expect(allowed).not.toContain('draw_territory');
    expect(allowed).toContain('scene_container');
  });

  it('map list excludes scene_container', () => {
    const allowed = listAllowedCanvasModes('map', ALL_MODES);
    expect(allowed).not.toContain('scene_container');
    expect(allowed).toContain('marker');
  });
});

describe('normalizeCanvasModeForSceneType', () => {
  it('falls back to select when mode is disallowed', () => {
    expect(normalizeCanvasModeForSceneType('marker', 'root_canvas')).toBe('select');
    expect(normalizeCanvasModeForSceneType('scene_container', 'map')).toBe('select');
  });

  it('keeps mode when allowed', () => {
    expect(normalizeCanvasModeForSceneType('polygon', 'root_canvas')).toBe('polygon');
    expect(normalizeCanvasModeForSceneType('marker', 'map')).toBe('marker');
  });
});

describe('scene type helpers', () => {
  it('classifies root_canvas and map', () => {
    expect(isRootCanvasScene('root_canvas')).toBe(true);
    expect(isMapScene('map')).toBe(true);
    expect(isRootCanvasScene(null)).toBe(false);
  });
});
