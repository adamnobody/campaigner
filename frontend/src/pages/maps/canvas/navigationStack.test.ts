import { describe, expect, it } from 'vitest';
import {
  buildCanvasBreadcrumbs,
  buildSceneTrailFromTree,
  currentNavigationEntry,
  formatNavigationBreadcrumbLabel,
  inferNavigationVia,
  popNavigationEntry,
  pushNavigationEntry,
  resolveNavigationTrail,
  truncateNavigationStack,
  type SceneNavRef,
} from './navigationStack';

const scenes: SceneNavRef[] = [
  { id: 1, name: 'World', parentSceneId: null, parentObjectId: null },
  { id: 2, name: 'Region Map', parentSceneId: 1, parentObjectId: 10 },
  { id: 3, name: 'City Map', parentSceneId: 2, parentObjectId: 20 },
];

const sceneTypes = new Map<number, string | null>([
  [1, 'root_canvas'],
  [2, 'map'],
  [3, 'map'],
]);

describe('inferNavigationVia', () => {
  it('classifies root, marker, and parent links', () => {
    expect(inferNavigationVia(scenes[0]!)).toBe('root');
    expect(inferNavigationVia(scenes[1]!)).toBe('marker');
    expect(inferNavigationVia({
      id: 9,
      name: 'Sibling',
      parentSceneId: 1,
      parentObjectId: null,
    })).toBe('parent');
  });
});

describe('buildSceneTrailFromTree', () => {
  it('builds root → current trail (happy path)', () => {
    expect(buildSceneTrailFromTree(scenes, 3)).toEqual([
      { sceneId: 1, label: 'World', via: 'root' },
      { sceneId: 2, label: 'Region Map', via: 'marker' },
      { sceneId: 3, label: 'City Map', via: 'marker' },
    ]);
  });

  it('returns single root entry for root scene', () => {
    expect(buildSceneTrailFromTree(scenes, 1)).toEqual([
      { sceneId: 1, label: 'World', via: 'root' },
    ]);
  });

  it('returns empty trail when current scene is unknown', () => {
    expect(buildSceneTrailFromTree(scenes, 999)).toEqual([]);
  });

  it('returns empty trail for empty scene list', () => {
    expect(buildSceneTrailFromTree([], 1)).toEqual([]);
  });

  it('stops on parent cycle instead of looping', () => {
    const cyclic: SceneNavRef[] = [
      { id: 1, name: 'A', parentSceneId: 2, parentObjectId: null },
      { id: 2, name: 'B', parentSceneId: 1, parentObjectId: null },
    ];
    const trail = buildSceneTrailFromTree(cyclic, 1);
    expect(trail.length).toBeGreaterThan(0);
    expect(trail.length).toBeLessThanOrEqual(2);
  });
});

describe('navigation stack helpers', () => {
  const base = buildSceneTrailFromTree(scenes, 2);

  it('push avoids duplicate tail', () => {
    const pushed = pushNavigationEntry(base, { sceneId: 2, label: 'Region Map', via: 'marker' });
    expect(pushed).toEqual(base);
    const next = pushNavigationEntry(base, { sceneId: 3, label: 'City Map', via: 'marker' });
    expect(next).toHaveLength(3);
  });

  it('pop removes the current entry', () => {
    const { stack, popped } = popNavigationEntry(base);
    expect(popped?.sceneId).toBe(2);
    expect(stack).toHaveLength(1);
    expect(currentNavigationEntry(stack)?.sceneId).toBe(1);
  });

  it('pop on empty stack is safe', () => {
    const { stack, popped } = popNavigationEntry([]);
    expect(stack).toEqual([]);
    expect(popped).toBeNull();
    expect(currentNavigationEntry(stack)).toBeNull();
  });

  it('truncate keeps prefix through index', () => {
    const full = buildSceneTrailFromTree(scenes, 3);
    expect(truncateNavigationStack(full, 0)).toEqual([full[0]]);
    expect(truncateNavigationStack(full, 1)).toEqual(full.slice(0, 2));
  });
});

describe('resolveNavigationTrail', () => {
  it('rebuilds from tree when stack tail does not match current scene', () => {
    const stale = [{ sceneId: 1, label: 'World', via: 'root' as const }];
    expect(resolveNavigationTrail(stale, scenes, 3)).toEqual(buildSceneTrailFromTree(scenes, 3));
  });

  it('keeps stack when tail matches current scene', () => {
    const stack = [
      { sceneId: 1, label: 'World', via: 'root' as const },
      { sceneId: 2, label: 'Region Map', via: 'marker' as const },
    ];
    expect(resolveNavigationTrail(stack, scenes, 2)).toEqual(stack);
  });
});

describe('formatNavigationBreadcrumbLabel', () => {
  const labels = { root: 'Холст', fallbackMap: 'Карта' };

  it('uses root label for root_canvas trail entry', () => {
    const trail = buildSceneTrailFromTree(scenes, 2);
    expect(formatNavigationBreadcrumbLabel(trail[0]!, sceneTypes, labels)).toBe('Холст');
    expect(formatNavigationBreadcrumbLabel(trail[1]!, sceneTypes, labels)).toBe('Region Map');
  });

  it('buildCanvasBreadcrumbs resolves root → map trail', () => {
    const trail = buildCanvasBreadcrumbs([], scenes, 2);
    expect(trail).toHaveLength(2);
    expect(trail[0]?.sceneId).toBe(1);
    expect(trail[1]?.sceneId).toBe(2);
  });
});
