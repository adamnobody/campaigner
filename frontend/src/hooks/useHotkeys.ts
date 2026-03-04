import { useEffect } from 'react';

interface Hotkey {
  /** Physical key code (e.g. 'KeyK', 'KeyS', 'Slash') or logical key (e.g. 'Escape') */
  code?: string;
  /** Logical key — fallback if code not set (e.g. 'k', 'Escape') */
  key?: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: () => void;
  description?: string;
}

export function useHotkeys(hotkeys: Hotkey[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      for (const hk of hotkeys) {
        const ctrlMatch = hk.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey);
        const shiftMatch = hk.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = hk.alt ? e.altKey : !e.altKey;

        // Match by physical code first (layout-independent), fallback to logical key
        let keyMatch = false;
        if (hk.code) {
          keyMatch = e.code === hk.code;
        } else if (hk.key) {
          keyMatch = e.key.toLowerCase() === hk.key.toLowerCase() || e.code === `Key${hk.key.toUpperCase()}`;
        }

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          if (isInput && !hk.ctrl && !hk.alt) continue;

          e.preventDefault();
          e.stopPropagation();
          hk.handler();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hotkeys]);
}