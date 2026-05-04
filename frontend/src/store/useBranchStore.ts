import { create } from 'zustand';
import type { ScenarioBranch } from '@campaigner/shared';
import { branchesApi } from '@/api/branches';
import { getErrorMessage } from '@/utils/error';
import {
  getActiveBranchId as getStoredActiveBranchId,
  setActiveBranchId as setStoredActiveBranchId,
  clearActiveBranchId as clearStoredActiveBranchId,
} from './branchStorage';
import { useProjectStore } from './useProjectStore';

interface BranchState {
  branches: ScenarioBranch[];
  activeProjectId: number | null;
  activeBranchId: number | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  fetchBranches: (projectId: number) => Promise<void>;
  /** Persist to per-project storage using explicit projectId, activeProjectId from fetchBranches, or current project from project store. */
  setActiveBranchId: (branchId: number | null, projectId?: number | null) => void;
  clearError: () => void;
  reset: () => void;
}

export const useBranchStore = create<BranchState>((set) => ({
  branches: [],
  activeProjectId: null,
  activeBranchId: getStoredActiveBranchId() ?? null,
  loading: false,
  initialized: false,
  error: null,
  fetchBranches: async (projectId) => {
    set({ loading: true, error: null, activeProjectId: projectId });
    try {
      const res = await branchesApi.getAll(projectId);
      const branches = res.data.data ?? [];
      const mainBranch = branches.find((branch) => branch.isMain);
      set((state) => {
        const storedForProject = getStoredActiveBranchId(projectId) ?? null;
        const activeCandidate = state.activeProjectId === projectId ? state.activeBranchId : storedForProject;
        const activeExists = branches.some((b) => b.id === activeCandidate);
        const fallback = mainBranch?.id ?? branches[0]?.id ?? null;
        const activeBranchId = activeExists ? activeCandidate : fallback;
        if (activeBranchId) {
          setStoredActiveBranchId(projectId, activeBranchId);
        } else {
          clearStoredActiveBranchId(projectId);
        }
        return { branches, activeBranchId, loading: false, initialized: true };
      });
    } catch (error: unknown) {
      set({
        loading: false,
        initialized: true,
        error: getErrorMessage(error, 'Failed to fetch branches'),
      });
    }
  },
  setActiveBranchId: (branchId, explicitProjectId) => {
    set((state) => {
      const projectId =
        explicitProjectId !== undefined && explicitProjectId !== null
          ? explicitProjectId
          : state.activeProjectId ?? useProjectStore.getState().currentProject?.id ?? null;

      if (typeof projectId === 'number' && projectId > 0) {
        if (branchId) {
          setStoredActiveBranchId(projectId, branchId);
        } else {
          clearStoredActiveBranchId(projectId);
        }
      }

      return { activeBranchId: branchId };
    });
  },
  clearError: () => set({ error: null }),
  reset: () =>
    set({
      branches: [],
      activeProjectId: null,
      activeBranchId: null,
      loading: false,
      initialized: false,
      error: null,
    }),
}));
