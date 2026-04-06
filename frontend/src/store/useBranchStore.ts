import { create } from 'zustand';
import type { ScenarioBranch } from '@campaigner/shared';
import { branchesApi } from '@/api/branches';

interface BranchState {
  branches: ScenarioBranch[];
  activeBranchId: number | null;
  loading: boolean;
  fetchBranches: (projectId: number) => Promise<void>;
  setActiveBranchId: (branchId: number | null) => void;
}

const ACTIVE_BRANCH_STORAGE_KEY = 'campaigner.activeBranchId';

function getStoredActiveBranchId(): number | null {
  const raw = localStorage.getItem(ACTIVE_BRANCH_STORAGE_KEY);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export const useBranchStore = create<BranchState>((set) => ({
  branches: [],
  activeBranchId: getStoredActiveBranchId(),
  loading: false,
  fetchBranches: async (projectId) => {
    set({ loading: true });
    try {
      const res = await branchesApi.getAll(projectId);
      const branches = res.data.data ?? [];
      const mainBranch = branches.find((branch) => branch.isMain);
      set((state) => {
        const activeExists = branches.some((b) => b.id === state.activeBranchId);
        const fallback = mainBranch?.id ?? branches[0]?.id ?? null;
        const activeBranchId = activeExists ? state.activeBranchId : fallback;
        if (activeBranchId) {
          localStorage.setItem(ACTIVE_BRANCH_STORAGE_KEY, String(activeBranchId));
        } else {
          localStorage.removeItem(ACTIVE_BRANCH_STORAGE_KEY);
        }
        return { branches, activeBranchId, loading: false };
      });
    } catch {
      set({ loading: false });
    }
  },
  setActiveBranchId: (branchId) => {
    if (branchId) {
      localStorage.setItem(ACTIVE_BRANCH_STORAGE_KEY, String(branchId));
    } else {
      localStorage.removeItem(ACTIVE_BRANCH_STORAGE_KEY);
    }
    set({ activeBranchId: branchId });
  },
}));
