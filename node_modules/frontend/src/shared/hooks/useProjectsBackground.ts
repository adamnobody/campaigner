// src/shared/hooks/useProjectsBackground.ts
import * as React from 'react';

export type ProjectsBgSettings = {
  enabled: boolean;
  imageDataUrl: string | null; // data:image/...
  blurPx: number;              // 0..20
  brightnessPct: number;       // 50..150
  contrastPct: number;         // 50..150
};

const LS_KEY = 'projectsBg:v1';

const DEFAULTS: ProjectsBgSettings = {
  enabled: false,
  imageDataUrl: null,
  blurPx: 0,
  brightnessPct: 100,
  contrastPct: 100,
};

function safeParse(json: string | null): ProjectsBgSettings | null {
  if (!json) return null;
  try {
    const obj = JSON.parse(json);
    if (typeof obj !== 'object' || obj === null) return null;
    return {
      enabled: Boolean(obj.enabled),
      imageDataUrl: typeof obj.imageDataUrl === 'string' ? obj.imageDataUrl : null,
      blurPx: Number.isFinite(obj.blurPx) ? obj.blurPx : DEFAULTS.blurPx,
      brightnessPct: Number.isFinite(obj.brightnessPct) ? obj.brightnessPct : DEFAULTS.brightnessPct,
      contrastPct: Number.isFinite(obj.contrastPct) ? obj.contrastPct : DEFAULTS.contrastPct,
    };
  } catch {
    return null;
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function useProjectsBackground() {
  const [settings, setSettings] = React.useState<ProjectsBgSettings>(() => {
    const loaded = safeParse(localStorage.getItem(LS_KEY));
    if (!loaded) return DEFAULTS;
    return {
      ...DEFAULTS,
      ...loaded,
      blurPx: clamp(loaded.blurPx ?? 0, 0, 20),
      brightnessPct: clamp(loaded.brightnessPct ?? 100, 50, 150),
      contrastPct: clamp(loaded.contrastPct ?? 100, 50, 150),
      enabled: Boolean(loaded.enabled) && Boolean(loaded.imageDataUrl),
    };
  });

  React.useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(settings));
  }, [settings]);

  const setImageDataUrl = React.useCallback((dataUrl: string | null) => {
    setSettings((s) => ({
      ...s,
      imageDataUrl: dataUrl,
      enabled: Boolean(dataUrl),
    }));
  }, []);

  const reset = React.useCallback(() => setSettings(DEFAULTS), []);

  const patch = React.useCallback((partial: Partial<ProjectsBgSettings>) => {
    setSettings((s) => {
      const next = { ...s, ...partial };
      next.blurPx = clamp(next.blurPx, 0, 20);
      next.brightnessPct = clamp(next.brightnessPct, 50, 150);
      next.contrastPct = clamp(next.contrastPct, 50, 150);
      // enabled нельзя держать true без картинки
      if (!next.imageDataUrl) next.enabled = false;
      return next;
    });
  }, []);

  return { settings, patch, setImageDataUrl, reset };
}
