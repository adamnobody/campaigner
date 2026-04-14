import { create } from 'zustand';
import { Project, CreateProject, UpdateProject } from '@campaigner/shared';
import { projectsApi } from '@/api/projects';
import { getErrorMessage } from '@/utils/error';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;

  fetchProjects: () => Promise<void>;
  fetchProject: (id: number) => Promise<void>;
  createProject: (data: CreateProject) => Promise<Project>;
  updateProject: (id: number, data: UpdateProject) => Promise<void>;
  deleteProject: (id: number) => Promise<void>;
  uploadMap: (id: number, file: File) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  clearError: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProject: null,
  loading: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      const res = await projectsApi.getAll();
      set({ projects: res.data.data, loading: false });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to fetch projects'), loading: false });
    }
  },

  fetchProject: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const res = await projectsApi.getById(id);
      set({ currentProject: res.data.data, loading: false });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to fetch project'), loading: false });
    }
  },

  createProject: async (data: CreateProject) => {
    set({ loading: true, error: null });
    try {
      const res = await projectsApi.create(data);
      const project = res.data.data;
      set(state => ({
        projects: [project, ...state.projects],
        loading: false,
      }));
      return project;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to create project'), loading: false });
      throw error;
    }
  },

  updateProject: async (id: number, data: UpdateProject) => {
    set({ error: null });
    try {
      const res = await projectsApi.update(id, data);
      const updated = res.data.data;
      set(state => ({
        projects: state.projects.map(p => p.id === id ? updated : p),
        currentProject: state.currentProject?.id === id ? updated : state.currentProject,
      }));
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to update project') });
      throw error;
    }
  },

  deleteProject: async (id: number) => {
    set({ error: null });
    try {
      await projectsApi.delete(id);
      set(state => ({
        projects: state.projects.filter(p => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
      }));
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to delete project') });
      throw error;
    }
  },

  uploadMap: async (id: number, file: File) => {
    set({ error: null });
    try {
      const res = await projectsApi.uploadMap(id, file);
      const updated = res.data.data;
      set(state => ({
        currentProject: state.currentProject?.id === id ? updated : state.currentProject,
        projects: state.projects.map(p => p.id === id ? updated : p),
      }));
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to upload map') });
      throw error;
    }
  },

  setCurrentProject: (project) => set({ currentProject: project }),
  clearError: () => set({ error: null }),
}));
