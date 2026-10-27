import { useCallback, useEffect, useRef, useState } from 'react';
import { shallow } from 'zustand/shallow';
import { useNoteStore } from '@/store/useNoteStore';
import { useBranchStore } from '@/store/useBranchStore';
import { isNotFoundError } from '@/utils/error';
import {
  countWords,
  parseDocument,
  serializeDocument,
  type DocumentMeta,
} from './documentMeta';

const AUTOSAVE_DELAY = 3000;

export function useNoteDocument(noteId: number, untitled: string) {
  const { currentNote, fetchNote, updateNote, setCurrentNote } = useNoteStore((state) => ({
    currentNote: state.currentNote,
    fetchNote: state.fetchNote,
    updateNote: state.updateNote,
    setCurrentNote: state.setCurrentNote,
  }), shallow);
  const activeBranchId = useBranchStore((state) => state.activeBranchId);

  const [title, setTitleState] = useState('');
  const [body, setBodyState] = useState('');
  const [meta, setMetaState] = useState<DocumentMeta>({});
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving' | 'error'>('saved');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [missing, setMissing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [ready, setReady] = useState(false);

  const dirtyRef = useRef(false);
  const titleRef = useRef('');
  const bodyRef = useRef('');
  const metaRef = useRef<DocumentMeta>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initializedId = useRef<number | null>(null);

  useEffect(() => {
    titleRef.current = title;
    bodyRef.current = body;
    metaRef.current = meta;
  }, [title, body, meta]);

  const persist = useCallback(async () => {
    if (!dirtyRef.current) return;
    setSaveStatus('saving');
    try {
      const nextTitle = titleRef.current.trim() || untitled;
      await updateNote(noteId, {
        title: nextTitle,
        content: serializeDocument(metaRef.current, bodyRef.current),
      });
      dirtyRef.current = false;
      setSaveStatus('saved');
      setLastSaved(new Date());
    } catch {
      setSaveStatus('error');
    }
  }, [noteId, untitled, updateNote]);

  const schedule = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void persist();
    }, AUTOSAVE_DELAY);
  }, [persist]);

  const markDirty = useCallback(() => {
    dirtyRef.current = true;
    setSaveStatus('unsaved');
    schedule();
  }, [schedule]);

  const setTitle = useCallback((value: string) => {
    setTitleState(value);
    markDirty();
  }, [markDirty]);

  const setBody = useCallback((value: string) => {
    setBodyState(value);
    markDirty();
  }, [markDirty]);

  const setMeta = useCallback((value: DocumentMeta | ((prev: DocumentMeta) => DocumentMeta)) => {
    setMetaState((prev) => (typeof value === 'function' ? value(prev) : value));
    markDirty();
  }, [markDirty]);

  useEffect(() => {
    setReady(false);
    setMissing(false);
    setLoadError(false);
    initializedId.current = null;
    fetchNote(noteId).catch((error: unknown) => {
      if (isNotFoundError(error)) {
        dirtyRef.current = false;
        setCurrentNote(null);
        setMissing(true);
        return;
      }
      setLoadError(true);
    });
  }, [activeBranchId, fetchNote, noteId, setCurrentNote]);

  useEffect(() => {
    if (!currentNote || currentNote.id !== noteId) return;
    if (initializedId.current === currentNote.id) return;
    initializedId.current = currentNote.id;
    const parsed = parseDocument(currentNote.content);
    setTitleState(currentNote.title);
    setBodyState(parsed.body);
    setMetaState(parsed.meta);
    dirtyRef.current = false;
    setSaveStatus('saved');
    setLastSaved(new Date(currentNote.updatedAt));
    setReady(true);
  }, [currentNote, noteId]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (dirtyRef.current && !missing) {
      void updateNote(noteId, {
        title: titleRef.current.trim() || untitled,
        content: serializeDocument(metaRef.current, bodyRef.current),
      }).catch(() => {});
    }
  }, [missing, noteId, untitled, updateNote]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  return {
    note: currentNote?.id === noteId ? currentNote : null,
    title,
    setTitle,
    body,
    setBody,
    meta,
    setMeta,
    saveStatus,
    lastSaved,
    missing,
    loadError,
    ready,
    words: countWords(body),
    chars: body.length,
    persist,
  };
}
