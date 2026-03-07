import { create } from 'zustand';
import { Tag, CreateTag } from '@campaigner/shared';
import { tagsApi } from '@/api/axiosClient';

interface TagState {
  tags: Tag[];
  loading: boolean;
  initialized: boolean;
  error: string | null;

  fetchTags: (projectId: number) => Promise<void>;
  createTag: (projectId: number, data: CreateTag) => Promise<Tag>;
  deleteTag: (id: number) => Promise<void>;
  findOrCreateTagsByNames: (projectId: number, names: string[]) => Promise<number[]>;
  clearError: () => void;
  reset: () => void;
}

export const useTagStore = create<TagState>((set, get) => ({
  tags: [],
  loading: false,
  initialized: false,
  error: null,

  fetchTags: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const res = await tagsApi.getAll(projectId);
      set({
        tags: res.data.data || [],
        loading: false,
        initialized: true,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch tags',
        loading: false,
        initialized: true,
      });
    }
  },

  createTag: async (projectId, data) => {
    set({ error: null });
    try {
      const res = await tagsApi.create({ ...data, projectId });
      const created = res.data.data as Tag;
      set((state) => ({
        tags: [...state.tags, created].sort((a, b) => a.name.localeCompare(b.name)),
      }));
      return created;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create tag' });
      throw error;
    }
  },

  deleteTag: async (id) => {
    set({ error: null });
    try {
      await tagsApi.delete(id);
      set((state) => ({
        tags: state.tags.filter((tag) => tag.id !== id),
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete tag' });
      throw error;
    }
  },

  findOrCreateTagsByNames: async (projectId, names) => {
    const normalized = names.map((n) => n.trim()).filter(Boolean);
    if (normalized.length === 0) return [];

    const { tags, fetchTags, createTag } = get();

    if (!get().initialized) {
      await fetchTags(projectId);
    }

    const resultIds: number[] = [];
    let currentTags = get().tags.length > 0 ? get().tags : tags;

    for (const name of normalized) {
      const existing = currentTags.find(
        (tag) => tag.name.trim().toLowerCase() === name.toLowerCase()
      );

      if (existing?.id) {
        resultIds.push(existing.id);
        continue;
      }

      const created = await createTag(projectId, { name });
      if (created.id) {
        resultIds.push(created.id);
      }

      currentTags = get().tags;
    }

    return resultIds;
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      tags: [],
      loading: false,
      initialized: false,
      error: null,
    }),
}));