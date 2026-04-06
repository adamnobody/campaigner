import { create } from 'zustand';
import { Tag, CreateTag } from '@campaigner/shared';
import { tagsApi } from '@/api/tags';

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
      throw error;
    }
  },

  createTag: async (projectId, data) => {
    set({ error: null });
    try {
      const res = await tagsApi.create({ ...data, projectId });
      const created = res.data.data as Tag;

      set((state) => {
        const exists = created.id !== undefined && state.tags.some((tag) => tag.id === created.id);
        return {
          tags: exists
            ? state.tags
            : [...state.tags, created].sort((a, b) => a.name.localeCompare(b.name)),
        };
      });

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
    const normalizedNames = Array.from(
      new Set(
        names
          .map((name) => name.trim())
          .filter(Boolean)
      )
    );

    if (normalizedNames.length === 0) return [];

    if (!get().initialized) {
      await get().fetchTags(projectId);
    }

    const resultIds: number[] = [];

    for (const name of normalizedNames) {
      const existing = get().tags.find(
        (tag) => tag.name.trim().toLowerCase() === name.toLowerCase()
      );

      if (existing?.id !== undefined) {
        resultIds.push(existing.id);
        continue;
      }

      const created = await get().createTag(projectId, { name });

      if (created.id === undefined) {
        throw new Error(`Tag "${name}" was created without id`);
      }

      resultIds.push(created.id);
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