import { describe, expect, it } from 'vitest';
import {
  isMapScene,
  isRootCanvasScene,
  isToolbarToolVisible,
  isToolAllowedForSceneType,
  listAllowedCanvasModes,
  listToolbarCanvasModes,
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

  it('map hides create-map / scene_container and overlay image tool', () => {
    expect(isToolAllowedForSceneType('scene_container', 'map')).toBe(false);
    expect(isToolAllowedForSceneType('image', 'map')).toBe(false);
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

  it('map list excludes scene_container and image', () => {
    const allowed = listAllowedCanvasModes('map', ALL_MODES);
    expect(allowed).not.toContain('scene_container');
    expect(allowed).not.toContain('image');
    expect(allowed).toContain('marker');
  });
});

describe('normalizeCanvasModeForSceneType', () => {
  it('falls back to select when mode is disallowed', () => {
    expect(normalizeCanvasModeForSceneType('marker', 'root_canvas')).toBe('select');
    expect(normalizeCanvasModeForSceneType('scene_container', 'map')).toBe('select');
  });

  it('keeps mode when allowed', () => {
    expect(normalizeCanvasModeForSceneType('text', 'root_canvas')).toBe('text');
    expect(normalizeCanvasModeForSceneType('marker', 'map')).toBe('marker');
  });
});

describe('toolbar visibility', () => {
  it('hides curve_text from primary toolbar while keeping kind allowed', () => {
    expect(isToolbarToolVisible('text')).toBe(true);
    expect(isToolbarToolVisible('curve_text')).toBe(false);
    expect(isToolAllowedForSceneType('curve_text', 'root_canvas')).toBe(true);
    expect(isToolAllowedForSceneType('curve_text', 'map')).toBe(true);
  });

  it('lists text but not curve_text for toolbar on root_canvas and map', () => {
    expect(listToolbarCanvasModes('root_canvas', ALL_MODES)).toContain('text');
    expect(listToolbarCanvasModes('root_canvas', ALL_MODES)).not.toContain('curve_text');
    expect(listToolbarCanvasModes('map', ALL_MODES)).toContain('text');
    expect(listToolbarCanvasModes('map', ALL_MODES)).not.toContain('curve_text');
  });

  it('hides legacy shape tools from primary toolbar', () => {
    for (const mode of ['polygon', 'polyline', 'rectangle', 'ellipse'] as const) {
      expect(isToolbarToolVisible(mode)).toBe(false);
      expect(isToolAllowedForSceneType(mode, 'root_canvas')).toBe(true);
    }
    expect(listToolbarCanvasModes('root_canvas', ALL_MODES)).not.toContain('rectangle');
  });

  it('normalizes hidden toolbar modes to select', () => {
    expect(normalizeCanvasModeForSceneType('curve_text', 'root_canvas')).toBe('select');
    expect(normalizeCanvasModeForSceneType('rectangle', 'root_canvas')).toBe('select');
    expect(normalizeCanvasModeForSceneType('text', 'root_canvas')).toBe('text');
  });
});

describe('scene type helpers', () => {
  it('classifies root_canvas and map', () => {
    expect(isRootCanvasScene('root_canvas')).toBe(true);
    expect(isMapScene('map')).toBe(true);
    expect(isRootCanvasScene(null)).toBe(false);
  });
});
