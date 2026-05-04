import { create } from 'zustand';
import type { CharacterTrait, CreateCharacterTrait } from '@campaigner/shared';
import { characterTraitsApi } from '@/api/characterTraits';
import { getErrorMessage } from '@/utils/error';
import i18n from '@/i18n';

interface CharacterTraitsState {
  traits: CharacterTrait[];
  assignedTraitIds: Set<number>;
  loading: boolean;
  error: string | null;

  fetchTraits: (projectId: number) => Promise<void>;
  fetchAssigned: (characterId: number) => Promise<void>;
  clearAssigned: () => void;
  toggleAssign: (characterId: number, traitId: number) => Promise<void>;
  createTrait: (data: CreateCharacterTrait) => Promise<CharacterTrait>;
  updateExclusions: (id: number, excludedIds: number[]) => Promise<CharacterTrait>;
  deleteTrait: (id: number) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useCharacterTraitsStore = create<CharacterTraitsState>((set, get) => ({
  traits: [],
  assignedTraitIds: new Set<number>(),
  loading: false,
  error: null,

  fetchTraits: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const res = await characterTraitsApi.getAll(projectId);
      set({ traits: res.data.data ?? [], loading: false });
    } catch (error: unknown) {
      set({
        error: getErrorMessage(error, i18n.t('storeErrors.traitsLoad')),
        loading: false,
      });
    }
  },

  fetchAssigned: async (characterId) => {
    if (!Number.isFinite(characterId) || characterId <= 0) {
      set({ assignedTraitIds: new Set<number>() });
      return;
    }
    set({ error: null });
    try {
      const res = await characterTraitsApi.getAssigned(characterId);
      const ids = res.data.data ?? [];
      set({ assignedTraitIds: new Set(ids) });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, i18n.t('storeErrors.traitsAssignedLoad')) });
    }
  },

  clearAssigned: () => set({ assignedTraitIds: new Set<number>() }),

  toggleAssign: async (characterId, traitId) => {
    const prev = new Set(get().assignedTraitIds);
    const was = prev.has(traitId);
    const next = new Set(prev);
    if (was) next.delete(traitId);
    else next.add(traitId);
    set({ assignedTraitIds: next, error: null });
    try {
      if (was) {
        await characterTraitsApi.unassign(characterId, traitId);
      } else {
        await characterTraitsApi.assign(characterId, traitId);
      }
    } catch (error: unknown) {
      set({
        assignedTraitIds: prev,
        error: getErrorMessage(error, i18n.t('storeErrors.traitToggle')),
      });
      throw error;
    }
  },

  createTrait: async (data) => {
    set({ error: null });
    const res = await characterTraitsApi.create(data);
    const trait = res.data.data;
    if (!trait) throw new Error('No trait in response');
    set((state) => {
      const next = [...state.traits, trait];
      return { traits: applyMirroredExclusions(next, trait.id, trait.exclusions ?? []) };
    });
    return trait;
  },

  updateExclusions: async (id, excludedIds) => {
    const previous = get().traits;
    const optimistic = applyMirroredExclusions(previous, id, excludedIds);
    set({ traits: optimistic, error: null });
    try {
      const res = await characterTraitsApi.updateExclusions(id, excludedIds);
      const updated = res.data.data;
      if (!updated) throw new Error('No trait in response');
      set((state) => ({
        traits: applyMirroredExclusions(
          state.traits.map((trait) => (trait.id === id ? updated : trait)),
          id,
          updated.exclusions ?? []
        ),
      }));
      return updated;
    } catch (error: unknown) {
      set({
        traits: previous,
        error: getErrorMessage(error, i18n.t('storeErrors.traitExclusions')),
      });
      throw error;
    }
  },

  deleteTrait: async (id) => {
    set({ error: null });
    await characterTraitsApi.delete(id);
    set((state) => ({
      traits: state.traits.filter((t) => t.id !== id),
      assignedTraitIds: new Set([...state.assignedTraitIds].filter((tid) => tid !== id)),
    }));
  },

  clearError: () => set({ error: null }),
  reset: () =>
    set({
      traits: [],
      assignedTraitIds: new Set<number>(),
      loading: false,
      error: null,
    }),
}));

function applyMirroredExclusions(
  traits: CharacterTrait[],
  traitId: number,
  excludedIds: number[]
): CharacterTrait[] {
  const normalized = Array.from(new Set(excludedIds));
  return traits.map((trait) => {
    if (trait.id === traitId) {
      return { ...trait, exclusions: normalized };
    }
    const hasMirror = normalized.includes(trait.id);
    const current = trait.exclusions ?? [];
    if (hasMirror && !current.includes(traitId)) {
      return { ...trait, exclusions: [...current, traitId].sort((a, b) => a - b) };
    }
    if (!hasMirror && current.includes(traitId)) {
      return { ...trait, exclusions: current.filter((id) => id !== traitId) };
    }
    return trait;
  });
}
