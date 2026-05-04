import { create } from 'zustand';
import type { Ambition, CreateAmbition, UpdateAmbition } from '@campaigner/shared';
import { ambitionsApi } from '@/api/ambitions';
import { getErrorMessage } from '@/utils/error';
import i18n from '@/i18n';

interface AmbitionsState {
  catalog: Ambition[];
  factionAmbitionIds: Set<number>;
  loading: boolean;
  error: string | null;

  fetchCatalog: (projectId: number) => Promise<void>;
  fetchFactionAmbitions: (factionId: number) => Promise<void>;
  clearFactionAmbitions: () => void;
  toggleAssign: (factionId: number, ambitionId: number) => Promise<void>;
  createAmbition: (data: CreateAmbition) => Promise<Ambition>;
  updateAmbition: (id: number, data: UpdateAmbition) => Promise<Ambition>;
  updateExclusions: (id: number, excludedIds: number[]) => Promise<Ambition>;
  deleteAmbition: (id: number) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useAmbitionsStore = create<AmbitionsState>((set, get) => ({
  catalog: [],
  factionAmbitionIds: new Set<number>(),
  loading: false,
  error: null,

  fetchCatalog: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const res = await ambitionsApi.getCatalog(projectId);
      set({ catalog: res.data.data ?? [], loading: false });
    } catch (error: unknown) {
      set({
        error: getErrorMessage(error, i18n.t('storeErrors.ambitionsCatalogLoad')),
        loading: false,
      });
    }
  },

  fetchFactionAmbitions: async (factionId) => {
    if (!Number.isFinite(factionId) || factionId <= 0) {
      set({ factionAmbitionIds: new Set<number>() });
      return;
    }
    set({ error: null });
    try {
      const res = await ambitionsApi.getFactionAmbitions(factionId);
      const ambitions = res.data.data ?? [];
      set({ factionAmbitionIds: new Set(ambitions.map((a) => a.id)) });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, i18n.t('storeErrors.factionAmbitionsLoad')) });
    }
  },

  clearFactionAmbitions: () => set({ factionAmbitionIds: new Set<number>() }),

  toggleAssign: async (factionId, ambitionId) => {
    const prev = new Set(get().factionAmbitionIds);
    const wasAssigned = prev.has(ambitionId);
    const next = new Set(prev);
    if (wasAssigned) next.delete(ambitionId);
    else next.add(ambitionId);
    set({ factionAmbitionIds: next, error: null });

    try {
      if (wasAssigned) {
        await ambitionsApi.unassignFactionAmbition(factionId, ambitionId);
      } else {
        await ambitionsApi.assignFactionAmbition(factionId, ambitionId);
      }
    } catch (error: unknown) {
      set({
        factionAmbitionIds: prev,
        error: getErrorMessage(error, i18n.t('storeErrors.ambitionToggle')),
      });
      throw error;
    }
  },

  createAmbition: async (data) => {
    set({ error: null });
    const res = await ambitionsApi.create(data);
    const ambition = res.data.data;
    if (!ambition) throw new Error('No ambition in response');
    set((state) => {
      const next = [...state.catalog, ambition];
      return { catalog: applyMirroredExclusions(next, ambition.id, ambition.exclusions ?? []) };
    });
    return ambition;
  },

  updateAmbition: async (id, data) => {
    set({ error: null });
    const res = await ambitionsApi.update(id, data);
    const ambition = res.data.data;
    if (!ambition) throw new Error('No ambition in response');
    set((state) => ({
      catalog: applyMirroredExclusions(
        state.catalog.map((item) => (item.id === id ? ambition : item)),
        id,
        ambition.exclusions ?? []
      ),
    }));
    return ambition;
  },

  updateExclusions: async (id, excludedIds) => {
    const previous = get().catalog;
    const optimistic = applyMirroredExclusions(previous, id, excludedIds);
    set({ catalog: optimistic, error: null });
    try {
      const res = await ambitionsApi.updateExclusions(id, excludedIds);
      const ambition = res.data.data;
      if (!ambition) throw new Error('No ambition in response');
      set((state) => ({
        catalog: applyMirroredExclusions(
          state.catalog.map((item) => (item.id === id ? ambition : item)),
          id,
          ambition.exclusions ?? []
        ),
      }));
      return ambition;
    } catch (error: unknown) {
      set({
        catalog: previous,
        error: getErrorMessage(error, i18n.t('storeErrors.ambitionExclusions')),
      });
      throw error;
    }
  },

  deleteAmbition: async (id) => {
    set({ error: null });
    await ambitionsApi.delete(id);
    set((state) => ({
      catalog: state.catalog.filter((item) => item.id !== id),
      factionAmbitionIds: new Set([...state.factionAmbitionIds].filter((ambitionId) => ambitionId !== id)),
    }));
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      catalog: [],
      factionAmbitionIds: new Set<number>(),
      loading: false,
      error: null,
    }),
}));

function applyMirroredExclusions(
  ambitions: Ambition[],
  ambitionId: number,
  excludedIds: number[]
): Ambition[] {
  const normalized = Array.from(new Set(excludedIds));
  return ambitions.map((ambition) => {
    if (ambition.id === ambitionId) {
      return { ...ambition, exclusions: normalized };
    }
    const hasMirror = normalized.includes(ambition.id);
    const current = ambition.exclusions ?? [];
    if (hasMirror && !current.includes(ambitionId)) {
      return { ...ambition, exclusions: [...current, ambitionId].sort((a, b) => a - b) };
    }
    if (!hasMirror && current.includes(ambitionId)) {
      return { ...ambition, exclusions: current.filter((id) => id !== ambitionId) };
    }
    return ambition;
  });
}
