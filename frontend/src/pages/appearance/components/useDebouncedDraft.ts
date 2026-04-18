import { useCallback, useEffect, useRef, useState } from 'react';

export const DRAFT_DEBOUNCE_MS = 220;

export function useDebouncedDraft(
  externalValue: string,
  commit: (value: string) => void,
  debounceMs = DRAFT_DEBOUNCE_MS
) {
  const [draft, setDraft] = useState(externalValue);
  const [isPending, setIsPending] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsPending(false);
    setDraft(externalValue);
  }, [externalValue]);

  const setDraftValue = useCallback((nextValue: string) => {
    setDraft(nextValue);
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsPending(true);
    timerRef.current = setTimeout(() => {
      commit(nextValue);
      timerRef.current = null;
      setIsPending(false);
    }, debounceMs);
  }, [commit, debounceMs]);

  const flushDraft = useCallback((nextValue?: string) => {
    const valueToCommit = nextValue ?? draft;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsPending(false);
    if (valueToCommit !== externalValue) {
      commit(valueToCommit);
    }
  }, [commit, draft, externalValue]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return {
    draft,
    isPending,
    setDraftImmediately: setDraft,
    setDraftValue,
    flushDraft,
  };
}
