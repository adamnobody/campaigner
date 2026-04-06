import { create } from 'zustand';
import { Dogma, CreateDogma, UpdateDogma } from '@campaigner/shared';
import { dogmasApi } from '@/api/dogmas';

interface DogmaState {
  dogmas: Dogma[];
  total: number;
  currentDogma: Dogma | null;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;

  fetchDogmas: (projectId: number, params?: {
    category?: string;
    importance?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
    append?: boolean;
  }) => Promise<void>;
  fetchDogma: (id: number) => Promise<void>;
  createDogma: (data: CreateDogma) => Promise<Dogma>;
  updateDogma: (id: number, data: UpdateDogma) => Promise<void>;
  deleteDogma: (id: number) => Promise<void>;
  reorderDogmas: (projectId: number, orderedIds: number[]) => Promise<void>;
  setTags: (id: number, tagIds: number[]) => Promise<void>;
  setCurrentDogma: (dogma: Dogma | null) => void;
  clearError: () => void;
  reset: () => void;
}

export const useDogmaStore = create<DogmaState>((set, get) => ({
  dogmas: [],
  total: 0,
  currentDogma: null,
  loading: false,
  loadingMore: false,
  error: null,

  fetchDogmas: async (projectId, params) => {
    const isAppend = params?.append;
    set({ [isAppend ? 'loadingMore' : 'loading']: true, error: null });
    try {
      const res = await dogmasApi.getAll(projectId, {
        category: params?.category,
        importance: params?.importance,
        status: params?.status,
        search: params?.search,
        limit: params?.limit,
        offset: params?.offset,
      });
      const { items, total } = res.data.data;
      set(state => ({
        dogmas: isAppend ? [...state.dogmas, ...items] : items,
        total,
        loading: false,
        loadingMore: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false, loadingMore: false });
    }
  },

  fetchDogma: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await dogmasApi.getById(id);
      set({ currentDogma: res.data.data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createDogma: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await dogmasApi.create(data);
      const dogma = res.data.data;
      set(state => ({
        dogmas: [...state.dogmas, dogma],
        total: state.total + 1,
        loading: false,
      }));
      return dogma;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateDogma: async (id, data) => {
    set({ error: null });
    try {
      const res = await dogmasApi.update(id, data);
      const updated = res.data.data;
      set(state => ({
        dogmas: state.dogmas.map(d => d.id === id ? updated : d),
        currentDogma: state.currentDogma?.id === id ? updated : state.currentDogma,
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteDogma: async (id) => {
    set({ error: null });
    try {
      await dogmasApi.delete(id);
      set(state => ({
        dogmas: state.dogmas.filter(d => d.id !== id),
        total: state.total - 1,
        currentDogma: state.currentDogma?.id === id ? null : state.currentDogma,
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  reorderDogmas: async (projectId, orderedIds) => {
    set({ error: null });
    try {
      const res = await dogmasApi.reorder(projectId, orderedIds);
      const { items, total } = res.data.data;
      set({ dogmas: items, total });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  setTags: async (id, tagIds) => {
    set({ error: null });
    try {
      await dogmasApi.setTags(id, tagIds);
      const res = await dogmasApi.getById(id);
      const updated = res.data.data;
      set(state => ({
        dogmas: state.dogmas.map(d => d.id === id ? updated : d),
        currentDogma: state.currentDogma?.id === id ? updated : state.currentDogma,
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  setCurrentDogma: (dogma) => set({ currentDogma: dogma }),
  clearError: () => set({ error: null }),
  reset: () => set({ dogmas: [], total: 0, currentDogma: null, loading: false, loadingMore: false, error: null }),
}));