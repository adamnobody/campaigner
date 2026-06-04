/** Engine-agnostic canvas scene navigation (no Pixi / Tauri). */

export type NavigationVia = 'root' | 'marker' | 'parent' | 'container';

export type NavigationEntry = {
  sceneId: number;
  label: string;
  via: NavigationVia;
};

/** Minimal scene fields for trail building (matches CanvasScene DTO). */
export type SceneNavRef = {
  id: number;
  name: string;
  parentSceneId: number | null;
  parentObjectId: number | null;
};

export function inferNavigationVia(scene: SceneNavRef): NavigationVia {
  if (scene.parentSceneId == null) return 'root';
  if (scene.parentObjectId != null) return 'marker';
  return 'parent';
}

/**
 * Builds root → current trail from `parent_scene_id` chain.
 * Stops on unknown scene id or parent cycle.
 */
export function buildSceneTrailFromTree(
  scenes: readonly SceneNavRef[],
  currentSceneId: number,
): NavigationEntry[] {
  const byId = new Map(scenes.map((item) => [item.id, item]));
  const reversed: NavigationEntry[] = [];
  const visited = new Set<number>();
  let id: number | null = currentSceneId;

  while (id != null) {
    if (visited.has(id)) break;
    visited.add(id);
    const item = byId.get(id);
    if (!item) break;
    reversed.push({
      sceneId: item.id,
      label: item.name,
      via: inferNavigationVia(item),
    });
    id = item.parentSceneId;
  }

  return reversed.reverse();
}

export function pushNavigationEntry(
  stack: readonly NavigationEntry[],
  entry: NavigationEntry,
): NavigationEntry[] {
  const last = stack[stack.length - 1];
  if (last?.sceneId === entry.sceneId) return [...stack];
  return [...stack, entry];
}

export function popNavigationEntry(stack: readonly NavigationEntry[]): {
  stack: NavigationEntry[];
  popped: NavigationEntry | null;
} {
  if (stack.length === 0) return { stack: [], popped: null };
  return { stack: stack.slice(0, -1), popped: stack[stack.length - 1] ?? null };
}

export function truncateNavigationStack(
  stack: readonly NavigationEntry[],
  indexInclusive: number,
): NavigationEntry[] {
  if (indexInclusive < 0) return [];
  return stack.slice(0, indexInclusive + 1);
}

export function currentNavigationEntry(stack: readonly NavigationEntry[]): NavigationEntry | null {
  return stack.length > 0 ? (stack[stack.length - 1] ?? null) : null;
}

/**
 * Uses explicit stack when it ends at `currentSceneId`; otherwise rebuilds from the tree.
 */
export function resolveNavigationTrail(
  stack: readonly NavigationEntry[],
  scenes: readonly SceneNavRef[],
  currentSceneId: number,
): NavigationEntry[] {
  const tail = currentNavigationEntry(stack);
  if (tail?.sceneId === currentSceneId && stack.length > 0) {
    return [...stack];
  }
  return buildSceneTrailFromTree(scenes, currentSceneId);
}

export function parentSceneEntry(trail: readonly NavigationEntry[]): NavigationEntry | null {
  if (trail.length < 2) return null;
  return trail[trail.length - 2] ?? null;
}

/** Scene id → scene_type from canvas scene tree DTO. */
export type SceneTypeById = ReadonlyMap<number, string | null | undefined>;

export function sceneTypeForEntry(
  entry: NavigationEntry,
  sceneTypes: SceneTypeById,
): string | null | undefined {
  return sceneTypes.get(entry.sceneId) ?? null;
}

/**
 * Display label for breadcrumbs: root canvas → rootLabel, otherwise scene name.
 */
export function formatNavigationBreadcrumbLabel(
  entry: NavigationEntry,
  sceneTypes: SceneTypeById,
  labels: { root: string; fallbackMap: string },
): string {
  const sceneType = sceneTypeForEntry(entry, sceneTypes);
  if (entry.via === 'root' || sceneType === 'root_canvas') {
    return labels.root;
  }
  const trimmed = entry.label.trim();
  return trimmed.length > 0 ? trimmed : labels.fallbackMap;
}

/**
 * Builds breadcrumb trail with optional explicit stack (e.g. after opening via scene_container).
 */
export function buildCanvasBreadcrumbs(
  stack: readonly NavigationEntry[],
  scenes: readonly SceneNavRef[],
  currentSceneId: number,
): NavigationEntry[] {
  return resolveNavigationTrail(stack, scenes, currentSceneId);
}
