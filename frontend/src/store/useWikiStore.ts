import { create } from 'zustand';
import { wikiApi } from '@/api/axiosClient';

export interface WikiLink {
  id: number;
  projectId: number;
  sourceNoteId: number;
  targetNoteId: number;
  label: string;
  createdAt?: string;
  sourceTitle?: string;
  targetTitle?: string;
}

export interface WikiCategory {
  name: string;
  count: number;
}

interface CreateWikiLinkData {
  projectId: number;
  sourceNoteId: number;
  targetNoteId: number;
  label?: string;
}

interface WikiState {
  links: WikiLink[];
  categories: WikiCategory[];
  loading: boolean;
  initialized: boolean;
  error: string | null;

  fetchLinks: (projectId: number, noteId?: number) => Promise<void>;
  fetchCategories: (projectId: number) => Promise<void>;
  createLink: (data: CreateWikiLinkData) => Promise<WikiLink>;
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
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch wiki links',
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
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch wiki categories' });
    }
  },

  createLink: async (data) => {
    set({ error: null });
    try {
      const res = await wikiApi.createLink(data);
      const created = res.data.data as WikiLink;
      set((state) => ({
        links: [created, ...state.links],
      }));
      return created;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create wiki link' });
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
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete wiki link' });
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