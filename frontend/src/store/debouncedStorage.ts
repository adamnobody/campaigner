import type { StateStorage } from 'zustand/middleware';

const PREFERENCES_KEY = 'campaigner-preferences';

const createNoopStorage = (): StateStorage => ({
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
});

const prunePreferencesPayload = (rawValue: string): string | null => {
  try {
    const parsed = JSON.parse(rawValue) as { state?: Record<string, unknown> };
    const state = parsed?.state;
    if (!state || typeof state !== 'object') return null;

    const prunedState: Record<string, unknown> = { ...state };

    if (Array.isArray(prunedState.customThemes)) {
      prunedState.customThemes = prunedState.customThemes.slice(0, 20);
    }

    if (Array.isArray(prunedState.customColorThemes)) {
      prunedState.customColorThemes = prunedState.customColorThemes.slice(-40);
    }

    return JSON.stringify({ ...parsed, state: prunedState });
  } catch {
    return null;
  }
};

const pickMinimalPreferencesPayload = (rawValue: string): string | null => {
  try {
    const parsed = JSON.parse(rawValue) as { state?: Record<string, unknown> };
    const state = parsed?.state;
    if (!state || typeof state !== 'object') return null;

    const minimal = {
      interfaceStyle: state.interfaceStyle,
      themePreset: state.themePreset,
      backgroundTone: state.backgroundTone,
      accentGlow: state.accentGlow,
      fontMode: state.fontMode,
      fontPresetId: state.fontPresetId,
      uiDensity: state.uiDensity,
      motionMode: state.motionMode,
      readingFontSize: state.readingFontSize,
      readingLineHeight: state.readingLineHeight,
      readingColumnWidth: state.readingColumnWidth,
      customThemes: [],
      customColorThemes: [],
      selectedCustomThemeId: null,
    };

    return JSON.stringify({ ...parsed, state: minimal });
  } catch {
    return null;
  }
};

export function createDebouncedStateStorage(delayMs = 220): StateStorage {
  if (typeof window === 'undefined') {
    return createNoopStorage();
  }

  let timer: ReturnType<typeof setTimeout> | null = null;
  const pendingWrites = new Map<string, string>();

  const flush = () => {
    if (!pendingWrites.size) return;
    pendingWrites.forEach((value, key) => {
      try {
        window.localStorage.setItem(key, value);
      } catch (error) {
        const isQuotaError = error instanceof DOMException && error.name === 'QuotaExceededError';
        if (!isQuotaError || key !== PREFERENCES_KEY) {
          throw error;
        }

        const pruned = prunePreferencesPayload(value);
        if (pruned) {
          try {
            window.localStorage.setItem(key, pruned);
            return;
          } catch {
            // Fallback to minimal persisted preferences if pruned payload is still too large.
          }
        }

        const minimal = pickMinimalPreferencesPayload(value);
        if (minimal) {
          window.localStorage.setItem(key, minimal);
          return;
        }

        throw error;
      }
    });
    pendingWrites.clear();
    timer = null;
  };

  const scheduleFlush = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, delayMs);
  };

  const flushOnVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      flush();
    }
  };

  const flushOnPageHide = () => flush();

  document.addEventListener('visibilitychange', flushOnVisibilityChange);
  window.addEventListener('pagehide', flushOnPageHide);

  return {
    getItem: (name) => {
      return pendingWrites.get(name) ?? window.localStorage.getItem(name);
    },
    setItem: (name, value) => {
      pendingWrites.set(name, value);
      scheduleFlush();
    },
    removeItem: (name) => {
      pendingWrites.delete(name);
      window.localStorage.removeItem(name);
    },
  };
}
