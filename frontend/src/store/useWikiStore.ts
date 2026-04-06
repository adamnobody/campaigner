import { create } from 'zustand';
import { wikiApi } from '@/api/wiki';
import type { WikiLink, CreateWikiLink } from '@campaigner/shared';
import { getErrorMessage } from '@/utils/error';

export interface WikiCategory {
  name: string;
  count: number;
}

interface WikiState {
  links: WikiLink[];
  categories: WikiCategory[];
  loading: boolean;
  initialized: boolean;
  error: string | null;

  fetchLinks: (projectId: number, noteId?: number) => Promise<void>;
  fetchCategories: (projectId: number) => Promise<void>;
  createLink: (data: CreateWikiLink) => Promise<WikiLink>;
  deleteLink: (id: number) => Promise<void>;

  clearError: () => void;
  reset: () => void;
}

export const useWikiStore = create<WikiState>((set) => ({
  links: [],
  categories: [],
  loading: false,
  initialized: false,
  error: null,

  fetchLinks: async (projectId, noteId) => {
    set({ loading: true, error: null });
    try {
      const res = await wikiApi.getLinks(projectId, noteId);
      set({
        links: res.data.data || [],
        loading: false,
        initialized: true,
      });
    } catch (error: unknown) {
      set({
        error: getErrorMessage(error, 'Failed to fetch wiki links'),
        loading: false,
        initialized: true,
      });
    }
  },

  fetchCategories: async (projectId) => {
    set({ error: null });
    try {
      const res = await wikiApi.getCategories(projectId);
      set({
        categories: res.data.data || [],
      });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to fetch wiki categories') });
    }
  },

  createLink: async (data) => {
    set({ error: null });
    try {
      const res = await wikiApi.createLink(data);
      const created = res.data.data;
      set((state) => ({
        links: [created, ...state.links],
      }));
      return created;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to create wiki link') });
      throw error;
    }
  },

  deleteLink: async (id) => {
    set({ error: null });
    try {
      await wikiApi.deleteLink(id);
      set((state) => ({
        links: state.links.filter((link) => link.id !== id),
      }));
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to delete wiki link') });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      links: [],
      categories: [],
      loading: false,
      initialized: false,
      error: null,
    }),
}));