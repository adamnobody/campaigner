import { useRef, useCallback, useState } from 'react';

interface HistoryEntry {
  value: string;
  cursorStart: number;
  cursorEnd: number;
  timestamp: number;
}

const MAX_HISTORY = 200;
const MERGE_THRESHOLD_MS = 500; // Объединяем быстрые изменения в одну запись

export function useHistory(initialValue: string = '') {
  const stackRef = useRef<HistoryEntry[]>([{
    value: initialValue,
    cursorStart: 0,
    cursorEnd: 0,
    timestamp: Date.now(),
  }]);
  const indexRef = useRef(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateFlags = useCallback(() => {
    setCanUndo(indexRef.current > 0);
    setCanRedo(indexRef.current < stackRef.current.length - 1);
  }, []);

  const reset = useCallback((value: string) => {
    stackRef.current = [{
      value,
      cursorStart: value.length,
      cursorEnd: value.length,
      timestamp: Date.now(),
    }];
    indexRef.current = 0;
    updateFlags();
  }, [updateFlags]);

  const push = useCallback((value: string, cursorStart: number, cursorEnd: number) => {
    const now = Date.now();
    const current = stackRef.current[indexRef.current];

    // Skip if value hasn't changed
    if (current && current.value === value) return;

    // Merge rapid typing into one history entry
    if (
      current &&
      now - current.timestamp < MERGE_THRESHOLD_MS &&
      Math.abs(value.length - current.value.length) <= 2
    ) {
      stackRef.current[indexRef.current] = {
        value,
        cursorStart,
        cursorEnd,
        timestamp: now,
      };
      updateFlags();
      return;
    }

    // Truncate any redo entries
    stackRef.current = stackRef.current.slice(0, indexRef.current + 1);

    // Push new entry
    stackRef.current.push({
      value,
      cursorStart,
      cursorEnd,
      timestamp: now,
    });

    // Enforce max history size
    if (stackRef.current.length > MAX_HISTORY) {
      stackRef.current = stackRef.current.slice(stackRef.current.length - MAX_HISTORY);
    }

    indexRef.current = stackRef.current.length - 1;
    updateFlags();
  }, [updateFlags]);

  const undo = useCallback((): HistoryEntry | null => {
    if (indexRef.current <= 0) return null;
    indexRef.current--;
    updateFlags();
    return stackRef.current[indexRef.current];
  }, [updateFlags]);

  const redo = useCallback((): HistoryEntry | null => {
    if (indexRef.current >= stackRef.current.length - 1) return null;
    indexRef.current++;
    updateFlags();
    return stackRef.current[indexRef.current];
  }, [updateFlags]);

  return { push, undo, redo, reset, canUndo, canRedo };
}