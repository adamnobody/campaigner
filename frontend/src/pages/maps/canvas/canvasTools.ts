import type { CanvasMode } from './canvasModel';

/** Tools that only make sense on geographic map scenes. */
const MAP_ONLY_TOOLS: readonly CanvasMode[] = ['marker', 'draw_territory'];

/** Tools that only make sense on the project root canvas. */
const ROOT_ONLY_TOOLS: readonly CanvasMode[] = ['scene_container'];

/** Overlay image tool — map background uses scene.background_path instead. */
const MAP_EXCLUDED_TOOLS: readonly CanvasMode[] = ['image'];

export function isRootCanvasScene(sceneType: string | null | undefined): boolean {
  return sceneType === 'root_canvas';
}

export function isMapScene(sceneType: string | null | undefined): boolean {
  return sceneType === 'map';
}

/**
 * Legacy scenes without scene_type keep all tools visible (parity with pre-0.3.2 behaviour).
 */
export function isToolAllowedForSceneType(
  mode: CanvasMode,
  sceneType: string | null | undefined,
): boolean {
  if (isRootCanvasScene(sceneType)) {
    return !MAP_ONLY_TOOLS.includes(mode);
  }
  if (isMapScene(sceneType)) {
    return !ROOT_ONLY_TOOLS.includes(mode) && !MAP_EXCLUDED_TOOLS.includes(mode);
  }
  return true;
}

export function listAllowedCanvasModes(
  sceneType: string | null | undefined,
  allModes: readonly CanvasMode[],
): CanvasMode[] {
  return allModes.filter((mode) => isToolAllowedForSceneType(mode, sceneType));
}

/** First allowed mode when current mode is invalid for scene_type. */
export function normalizeCanvasModeForSceneType(
  mode: CanvasMode,
  sceneType: string | null | undefined,
): CanvasMode {
  return isToolAllowedForSceneType(mode, sceneType) ? mode : 'select';
}
