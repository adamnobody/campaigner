import type { StateStorage } from 'zustand/middleware';

const createNoopStorage = (): StateStorage => ({
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
});

export function createDebouncedStateStorage(delayMs = 220): StateStorage {
  if (typeof window === 'undefined') {
    return createNoopStorage();
  }

  let timer: ReturnType<typeof setTimeout> | null = null;
  const pendingWrites = new Map<string, string>();

  const flush = () => {
    if (!pendingWrites.size) return;
    pendingWrites.forEach((value, key) => {
      window.localStorage.setItem(key, value);
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
