import { useEffect } from 'react';

interface Hotkey {
  code?: string;
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
      const target = e.target;
      const element = target instanceof HTMLElement ? target : null;

      const tagName = element?.tagName?.toLowerCase?.() ?? '';
      const isInput =
        tagName === 'input' ||
        tagName === 'textarea' ||
        element?.isContentEditable === true;

      const eventKey = typeof e.key === 'string' ? e.key.toLowerCase() : '';
      const eventCode = typeof e.code === 'string' ? e.code : '';

      for (const hk of hotkeys) {
        const ctrlMatch = hk.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey);
        const shiftMatch = hk.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = hk.alt ? e.altKey : !e.altKey;

        let keyMatch = false;

        if (hk.code) {
          keyMatch = eventCode === hk.code;
        } else if (hk.key) {
          const hotkey = hk.key.toLowerCase();
          // Одна латинская буква: только по физ. клавише, иначе на русской раскладке
          // e.key — другой символ (например «к» вместо «k»).
          if (/^[a-z]$/i.test(hk.key)) {
            keyMatch = eventCode === `Key${hk.key.toUpperCase()}`;
          } else if (/^[0-9]$/.test(hk.key)) {
            keyMatch = eventCode === `Digit${hk.key}`;
          } else {
            keyMatch = eventKey === hotkey;
          }
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