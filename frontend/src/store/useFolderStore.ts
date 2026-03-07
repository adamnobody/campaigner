import { create } from 'zustand';
import { ProjectFolder, CreateFolder } from '@campaigner/shared';
import { foldersApi } from '@/api/axiosClient';

export interface FolderTreeNode extends ProjectFolder {
  children: FolderTreeNode[];
}

interface FolderState {
  folders: ProjectFolder[];
  tree: FolderTreeNode[];
  currentFolderId: number | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;

  fetchFolders: (projectId: number) => Promise<void>;
  fetchTree: (projectId: number) => Promise<void>;
  createFolder: (data: CreateFolder) => Promise<ProjectFolder>;
  updateFolder: (id: number, name: string) => Promise<void>;
  deleteFolder: (id: number) => Promise<void>;

  setCurrentFolderId: (folderId: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

export const useFolderStore = create<FolderState>((set) => ({
  folders: [],
  tree: [],
  currentFolderId: null,
  loading: false,
  initialized: false,
  error: null,

  fetchFolders: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const res = await foldersApi.getAll(projectId);
      set({
        folders: res.data.data || [],
        loading: false,
        initialized: true,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch folders',
        loading: false,
        initialized: true,
      });
    }
  },

  fetchTree: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const res = await foldersApi.getTree(projectId);
      set({
        tree: res.data.data || [],
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch folder tree',
        loading: false,
      });
    }
  },

  createFolder: async (data) => {
    set({ error: null });
    try {
      const res = await foldersApi.create(data);
      const created = res.data.data as ProjectFolder;
      set((state) => ({
        folders: [...state.folders, created].sort((a, b) => a.name.localeCompare(b.name)),
      }));
      return created;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create folder' });
      throw error;
    }
  },

  updateFolder: async (id, name) => {
    set({ error: null });
    try {
      const res = await foldersApi.update(id, name);
      const updated = res.data.data as ProjectFolder;
      set((state) => ({
        folders: state.folders.map((folder) => (folder.id === id ? updated : folder)),
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to update folder' });
      throw error;
    }
  },

  deleteFolder: async (id) => {
    set({ error: null });
    try {
      await foldersApi.delete(id);
      set((state) => ({
        folders: state.folders.filter((folder) => folder.id !== id),
        currentFolderId: state.currentFolderId === id ? null : state.currentFolderId,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete folder' });
      throw error;
    }
  },

  setCurrentFolderId: (folderId) => set({ currentFolderId: folderId }),

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      folders: [],
      tree: [],
      currentFolderId: null,
      loading: false,
      initialized: false,
      error: null,
    }),
}));