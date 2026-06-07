import { describe, expect, it } from 'vitest';
import type { CanvasObject } from '@/api/canvas';
import {
  canEditCurveTextBezierHandles,
  curveTextGeometryJsonEquals,
  getCurveTextBezierGeometry,
  getCurveTextHandleWorldPositions,
  hitCurveTextHandle,
  mergeCurveTextGeometryDraft,
  withUpdatedCurveTextHandle,
} from './curveTextHandles';

const curveObject = (overrides: Partial<CanvasObject> = {}): CanvasObject => ({
  id: 1,
  sceneId: 1,
  layerId: 1,
  kind: 'curve_text',
  name: 'Curve text',
  zIndex: 0,
  transformJson: { x: 100, y: 200 },
  geometryJson: {
    start: { x: 0, y: 0 },
    control: { x: 140, y: -80 },
    end: { x: 280, y: 0 },
    legacy: true,
  },
  styleJson: { fill: '#fff', fontSize: 24 },
  contentJson: { text: 'Arc' },
  resourcePath: null,
  linkedNoteId: null,
  linkedSceneId: null,
  isHidden: false,
  isLocked: false,
  ...overrides,
});

describe('curveTextHandles', () => {
  it('detects point-path curves as non-bezier editable', () => {
    const object = curveObject({
      geometryJson: {
        points: [{ x: 0, y: 0 }, { x: 50, y: 10 }],
        start: { x: 0, y: 0 },
      },
    });
    expect(canEditCurveTextBezierHandles(object)).toBe(false);
  });

  it('maps handle positions to world coordinates', () => {
    const positions = getCurveTextHandleWorldPositions(curveObject());
    expect(positions.start).toEqual({ x: 100, y: 200 });
    expect(positions.control).toEqual({ x: 240, y: 120 });
    expect(positions.end).toEqual({ x: 380, y: 200 });
  });

  it('updates start while preserving control, end, content, style, and kind', () => {
    const updated = withUpdatedCurveTextHandle(curveObject(), 'start', { x: 110, y: 210 });
    expect(updated.kind).toBe('curve_text');
    expect(updated.contentJson).toMatchObject({ text: 'Arc' });
    expect(updated.styleJson).toMatchObject({ fill: '#fff', fontSize: 24 });
    expect(updated.geometryJson).toMatchObject({
      legacy: true,
      start: { x: 10, y: 10 },
      control: { x: 140, y: -80 },
      end: { x: 280, y: 0 },
    });
  });

  it('updates control and end independently', () => {
    const base = curveObject();
    const controlUpdated = withUpdatedCurveTextHandle(base, 'control', { x: 250, y: 100 });
    expect(getCurveTextBezierGeometry(controlUpdated).control).toEqual({ x: 150, y: -100 });
    const endUpdated = withUpdatedCurveTextHandle(base, 'end', { x: 500, y: 220 });
    expect(getCurveTextBezierGeometry(endUpdated).end).toEqual({ x: 400, y: 20 });
    expect(getCurveTextBezierGeometry(endUpdated).start).toEqual({ x: 0, y: 0 });
  });

  it('hits nearest handle within tolerance', () => {
    const object = curveObject();
    const handles = getCurveTextHandleWorldPositions(object);
    expect(hitCurveTextHandle(handles.start, object, 12, 1)).toBe('start');
    expect(hitCurveTextHandle(handles.control, object, 12, 1)).toBe('control');
    expect(hitCurveTextHandle({ x: 0, y: 0 }, object, 12, 1)).toBeNull();
  });

  it('merges draft geometry without mutating originals or unrelated objects', () => {
    const base = curveObject();
    const other = curveObject({ id: 2, name: 'Other' });
    const draft = withUpdatedCurveTextHandle(base, 'control', { x: 250, y: 100 });
    const merged = mergeCurveTextGeometryDraft([base, other], draft);

    expect(merged).not.toBe([base, other]);
    expect(merged[0].geometryJson).toMatchObject({
      control: { x: 150, y: -100 },
    });
    expect(merged[0].kind).toBe('curve_text');
    expect(merged[0].contentJson).toEqual(base.contentJson);
    expect(merged[0].styleJson).toEqual(base.styleJson);
    expect(merged[0].transformJson).toEqual(base.transformJson);
    expect(merged[1]).toBe(other);
    expect(base.geometryJson).toMatchObject({
      control: { x: 140, y: -80 },
    });
    expect(mergeCurveTextGeometryDraft([base, other], null)).toEqual([base, other]);
  });

  it('detects matching curve geometry for draft cleanup', () => {
    const base = curveObject();
    const moved = withUpdatedCurveTextHandle(base, 'control', { x: 250, y: 100 });
    expect(curveTextGeometryJsonEquals(base, moved)).toBe(false);
    expect(curveTextGeometryJsonEquals(moved, moved)).toBe(true);
    expect(curveTextGeometryJsonEquals(moved, { ...moved, contentJson: { text: 'Changed' } })).toBe(true);
    expect(curveTextGeometryJsonEquals(base, curveObject({ id: 2 }))).toBe(false);
  });
});
