import { create } from 'zustand';
import { Note, CreateNote, UpdateNote } from '@campaigner/shared';
import { notesApi } from '@/api/axiosClient';

interface NoteState {
  notes: Note[];
  currentNote: Note | null;
  total: number;
  loading: boolean;
  error: string | null;

  fetchNotes: (projectId: number, params?: any) => Promise<void>;
  fetchNote: (id: number) => Promise<void>;
  createNote: (data: CreateNote) => Promise<Note>;
  updateNote: (id: number, data: UpdateNote) => Promise<void>;
  deleteNote: (id: number) => Promise<void>;
  setTags: (id: number, tagIds: number[]) => Promise<void>;
  setCurrentNote: (note: Note | null) => void;
  clearError: () => void;
}

export const useNoteStore = create<NoteState>((set) => ({
  notes: [],
  currentNote: null,
  total: 0,
  loading: false,
  error: null,

  fetchNotes: async (projectId, params) => {
    set({ loading: true, error: null });
    try {
      const res = await notesApi.getAll(projectId, params);
      set({
        notes: res.data.data.items,
        total: res.data.data.total,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchNote: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await notesApi.getById(id);
      set({ currentNote: res.data.data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createNote: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await notesApi.create(data);
      const note = res.data.data;
      set(state => ({
        notes: [note, ...state.notes],
        total: state.total + 1,
        loading: false,
      }));
      return note;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateNote: async (id, data) => {
    set({ error: null });
    try {
      const res = await notesApi.update(id, data);
      const updated = res.data.data;
      set(state => ({
        notes: state.notes.map(n => n.id === id ? updated : n),
        currentNote: state.currentNote?.id === id ? updated : state.currentNote,
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteNote: async (id) => {
    set({ error: null });
    try {
      await notesApi.delete(id);
      set(state => ({
        notes: state.notes.filter(n => n.id !== id),
        total: state.total - 1,
        currentNote: state.currentNote?.id === id ? null : state.currentNote,
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  setTags: async (id, tagIds) => {
    set({ error: null });
    try {
      await notesApi.setTags(id, tagIds);
      const res = await notesApi.getById(id);
      const updated = res.data.data;
      set(state => ({
        notes: state.notes.map(n => n.id === id ? updated : n),
        currentNote: state.currentNote?.id === id ? updated : state.currentNote,
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  setCurrentNote: (note) => set({ currentNote: note }),
  clearError: () => set({ error: null }),
}));