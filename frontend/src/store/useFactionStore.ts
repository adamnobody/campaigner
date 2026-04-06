import { create } from 'zustand';
import { factionsApi } from '@/api/factions';
import type {
  Faction,
  FactionRank,
  FactionMember,
  FactionRelation,
  CreateFaction,
  UpdateFaction,
  CreateFactionRank,
  UpdateFactionRank,
  CreateFactionMember,
  UpdateFactionMember,
  CreateFactionRelation,
  UpdateFactionRelation,
} from '@campaigner/shared';
import type { FactionsListParams } from '@/api/types';

interface FactionState {
  factions: Faction[];
  total: number;
  loading: boolean;
  loadingMore: boolean;
  currentFaction: Faction | null;
  relations: FactionRelation[];

  fetchFactions: (projectId: number, params?: FactionsListParams) => Promise<void>;
  fetchFaction: (id: number) => Promise<Faction>;
  createFaction: (data: CreateFaction) => Promise<Faction>;
  updateFaction: (id: number, data: UpdateFaction) => Promise<Faction>;
  deleteFaction: (id: number) => Promise<void>;
  uploadImage: (id: number, file: File) => Promise<Faction>;
  uploadBanner: (id: number, file: File) => Promise<Faction>;
  setTags: (id: number, tagIds: number[]) => Promise<void>;

  // Ranks
  createRank: (factionId: number, data: CreateFactionRank) => Promise<FactionRank>;
  updateRank: (factionId: number, rankId: number, data: UpdateFactionRank) => Promise<FactionRank>;
  deleteRank: (factionId: number, rankId: number) => Promise<void>;

  // Members
  addMember: (factionId: number, data: CreateFactionMember) => Promise<FactionMember>;
  updateMember: (factionId: number, memberId: number, data: UpdateFactionMember) => Promise<FactionMember>;
  removeMember: (factionId: number, memberId: number) => Promise<void>;

  // Relations
  fetchRelations: (projectId: number) => Promise<void>;
  createRelation: (data: CreateFactionRelation) => Promise<FactionRelation>;
  updateRelation: (relationId: number, data: UpdateFactionRelation) => Promise<FactionRelation>;
  deleteRelation: (relationId: number) => Promise<void>;

  setCurrentFaction: (f: Faction | null) => void;
  reset: () => void;
}

export const useFactionStore = create<FactionState>((set, get) => ({
  factions: [],
  total: 0,
  loading: false,
  loadingMore: false,
  currentFaction: null,
  relations: [],

  fetchFactions: async (projectId, params = {}) => {
    const isAppend = params.append;
    const { append, ...queryParams } = params;

    set({ [isAppend ? 'loadingMore' : 'loading']: true });
    try {
      const res = await factionsApi.getAll(projectId, queryParams);
      const items = res.data.data || [];
      const total = res.data.total || 0;
      set(state => ({
        factions: isAppend ? [...state.factions, ...items] : items,
        total,
      }));
    } finally {
      set({ loading: false, loadingMore: false });
    }
  },

  fetchFaction: async (id) => {
    set({ loading: true });
    try {
      const res = await factionsApi.getById(id);
      const faction = res.data.data;
      set({ currentFaction: faction });
      return faction;
    } finally {
      set({ loading: false });
    }
  },

  createFaction: async (data) => {
    const res = await factionsApi.create(data);
    const faction = res.data.data;
    set(state => ({
      factions: [faction, ...state.factions],
      total: state.total + 1,
    }));
    return faction;
  },

  updateFaction: async (id, data) => {
    const res = await factionsApi.update(id, data);
    const updated = res.data.data;
    set(state => ({
      factions: state.factions.map(f => f.id === id ? updated : f),
      currentFaction: state.currentFaction?.id === id ? updated : state.currentFaction,
    }));
    return updated;
  },

  deleteFaction: async (id) => {
    await factionsApi.delete(id);
    set(state => ({
      factions: state.factions.filter(f => f.id !== id),
      total: state.total - 1,
      currentFaction: state.currentFaction?.id === id ? null : state.currentFaction,
    }));
  },

  uploadImage: async (id, file) => {
    const res = await factionsApi.uploadImage(id, file);
    const updated = res.data.data;
    set(state => ({
      currentFaction: state.currentFaction?.id === id ? updated : state.currentFaction,
      factions: state.factions.map(f => f.id === id ? { ...f, imagePath: updated.imagePath } : f),
    }));
    return updated;
  },

  uploadBanner: async (id, file) => {
    const res = await factionsApi.uploadBanner(id, file);
    const updated = res.data.data;
    set(state => ({
      currentFaction: state.currentFaction?.id === id ? updated : state.currentFaction,
    }));
    return updated;
  },

  setTags: async (id, tagIds) => {
    await factionsApi.setTags(id, tagIds);
    // Refetch to update tags
    const res = await factionsApi.getById(id);
    const updated = res.data.data;
    set(state => ({
      currentFaction: state.currentFaction?.id === id ? updated : state.currentFaction,
      factions: state.factions.map(f => f.id === id ? updated : f),
    }));
  },

  // Ranks
  createRank: async (factionId, data) => {
    const res = await factionsApi.createRank(factionId, data);
    const rank = res.data.data;
    const fRes = await factionsApi.getById(factionId);
    const refreshed = fRes.data.data;
    set(state => ({
      currentFaction: refreshed,
      factions: state.factions.map(f => f.id === factionId ? refreshed : f),
    }));
    return rank;
  },

  updateRank: async (factionId, rankId, data) => {
    const res = await factionsApi.updateRank(factionId, rankId, data);
    const rank = res.data.data;
    const fRes = await factionsApi.getById(factionId);
    const refreshed = fRes.data.data;
    set(state => ({
      currentFaction: refreshed,
      factions: state.factions.map(f => f.id === factionId ? refreshed : f),
    }));
    return rank;
  },

  deleteRank: async (factionId, rankId) => {
    await factionsApi.deleteRank(factionId, rankId);
    const fRes = await factionsApi.getById(factionId);
    const refreshed = fRes.data.data;
    set(state => ({
      currentFaction: refreshed,
      factions: state.factions.map(f => f.id === factionId ? refreshed : f),
    }));
  },

  // Members
  addMember: async (factionId, data) => {
    const res = await factionsApi.addMember(factionId, data);
    const member = res.data.data;
    const fRes = await factionsApi.getById(factionId);
    const refreshed = fRes.data.data;
    set(state => ({
      currentFaction: refreshed,
      factions: state.factions.map(f => f.id === factionId ? refreshed : f),
    }));
    return member;
  },

  updateMember: async (factionId, memberId, data) => {
    const res = await factionsApi.updateMember(factionId, memberId, data);
    const member = res.data.data;
    const fRes = await factionsApi.getById(factionId);
    const refreshed = fRes.data.data;
    set(state => ({
      currentFaction: refreshed,
      factions: state.factions.map(f => f.id === factionId ? refreshed : f),
    }));
    return member;
  },

  removeMember: async (factionId, memberId) => {
    await factionsApi.removeMember(factionId, memberId);
    const fRes = await factionsApi.getById(factionId);
    const refreshed = fRes.data.data;
    set(state => ({
      currentFaction: refreshed,
      factions: state.factions.map(f => f.id === factionId ? refreshed : f),
    }));
  },

  // Relations
  fetchRelations: async (projectId) => {
    const res = await factionsApi.getRelations(projectId);
    set({ relations: res.data.data || [] });
  },

  createRelation: async (data) => {
    const res = await factionsApi.createRelation(data);
    const relation = res.data.data;
    set(state => ({ relations: [relation, ...state.relations] }));
    return relation;
  },

  updateRelation: async (relationId, data) => {
    const res = await factionsApi.updateRelation(relationId, data);
    const updated = res.data.data;
    set(state => ({
      relations: state.relations.map(r => r.id === relationId ? updated : r),
    }));
    return updated;
  },

  deleteRelation: async (relationId) => {
    await factionsApi.deleteRelation(relationId);
    set(state => ({
      relations: state.relations.filter(r => r.id !== relationId),
    }));
  },

  setCurrentFaction: (f) => set({ currentFaction: f }),

  reset: () => set({
    factions: [], total: 0, loading: false, loadingMore: false,
    currentFaction: null, relations: [],
  }),
}));