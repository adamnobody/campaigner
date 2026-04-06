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
  FactionAsset,
  CreateFactionAsset,
  UpdateFactionAsset,
} from '@campaigner/shared';
import type { FactionsListParams } from '@/api/types';
import { getErrorMessage } from '@/utils/error';

interface FactionState {
  factions: Faction[];
  total: number;
  loading: boolean;
  loadingMore: boolean;
  initialized: boolean;
  error: string | null;
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

  // Assets
  createAsset: (factionId: number, data: CreateFactionAsset) => Promise<FactionAsset>;
  updateAsset: (factionId: number, assetId: number, data: UpdateFactionAsset) => Promise<FactionAsset>;
  deleteAsset: (factionId: number, assetId: number) => Promise<void>;
  bootstrapDefaultAssets: (factionId: number) => Promise<{ created: FactionAsset[]; skipped: string[] }>;

  // Relations
  fetchRelations: (projectId: number) => Promise<void>;
  createRelation: (data: CreateFactionRelation) => Promise<FactionRelation>;
  updateRelation: (relationId: number, data: UpdateFactionRelation) => Promise<FactionRelation>;
  deleteRelation: (relationId: number) => Promise<void>;

  setCurrentFaction: (f: Faction | null) => void;
  clearError: () => void;
  reset: () => void;
}

export const useFactionStore = create<FactionState>((set, get) => ({
  factions: [],
  total: 0,
  loading: false,
  loadingMore: false,
  initialized: false,
  error: null,
  currentFaction: null,
  relations: [],

  fetchFactions: async (projectId, params = {}) => {
    const isAppend = params.append;
    const { append, ...queryParams } = params;

    set({ [isAppend ? 'loadingMore' : 'loading']: true, error: null } as Pick<FactionState, 'loading' | 'loadingMore' | 'error'>);
    try {
      const res = await factionsApi.getAll(projectId, queryParams);
      const items = res.data.data || [];
      const total = res.data.total || 0;
      set(state => ({
        factions: isAppend ? [...state.factions, ...items] : items,
        total,
        initialized: true,
      }));
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to fetch factions'), initialized: true });
      throw error;
    } finally {
      set({ loading: false, loadingMore: false });
    }
  },

  fetchFaction: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await factionsApi.getById(id);
      const faction = res.data.data;
      set({ currentFaction: faction });
      return faction;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to fetch faction') });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  createFaction: async (data) => {
    set({ error: null });
    try {
      const res = await factionsApi.create(data);
      const faction = res.data.data;
      set(state => ({
        factions: [faction, ...state.factions],
        total: state.total + 1,
      }));
      return faction;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to create faction') });
      throw error;
    }
  },

  updateFaction: async (id, data) => {
    set({ error: null });
    try {
      const res = await factionsApi.update(id, data);
      const updated = res.data.data;
      set(state => ({
        factions: state.factions.map(f => f.id === id ? updated : f),
        currentFaction: state.currentFaction?.id === id ? updated : state.currentFaction,
      }));
      return updated;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to update faction') });
      throw error;
    }
  },

  deleteFaction: async (id) => {
    set({ error: null });
    try {
      await factionsApi.delete(id);
      set(state => ({
        factions: state.factions.filter(f => f.id !== id),
        total: state.total - 1,
        currentFaction: state.currentFaction?.id === id ? null : state.currentFaction,
      }));
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to delete faction') });
      throw error;
    }
  },

  uploadImage: async (id, file) => {
    set({ error: null });
    try {
      const res = await factionsApi.uploadImage(id, file);
      const updated = res.data.data;
      set(state => ({
        currentFaction: state.currentFaction?.id === id ? updated : state.currentFaction,
        factions: state.factions.map(f => f.id === id ? { ...f, imagePath: updated.imagePath } : f),
      }));
      return updated;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to upload faction image') });
      throw error;
    }
  },

  uploadBanner: async (id, file) => {
    set({ error: null });
    try {
      const res = await factionsApi.uploadBanner(id, file);
      const updated = res.data.data;
      set(state => ({
        currentFaction: state.currentFaction?.id === id ? updated : state.currentFaction,
      }));
      return updated;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to upload faction banner') });
      throw error;
    }
  },

  setTags: async (id, tagIds) => {
    set({ error: null });
    try {
      await factionsApi.setTags(id, tagIds);
      // Refetch to update tags
      const res = await factionsApi.getById(id);
      const updated = res.data.data;
      set(state => ({
        currentFaction: state.currentFaction?.id === id ? updated : state.currentFaction,
        factions: state.factions.map(f => f.id === id ? updated : f),
      }));
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to update faction tags') });
      throw error;
    }
  },

  // Ranks
  createRank: async (factionId, data) => {
    set({ error: null });
    try {
      const res = await factionsApi.createRank(factionId, data);
      const rank = res.data.data;
      const fRes = await factionsApi.getById(factionId);
      const refreshed = fRes.data.data;
      set(state => ({
        currentFaction: refreshed,
        factions: state.factions.map(f => f.id === factionId ? refreshed : f),
      }));
      return rank;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to create faction rank') });
      throw error;
    }
  },

  updateRank: async (factionId, rankId, data) => {
    set({ error: null });
    try {
      const res = await factionsApi.updateRank(factionId, rankId, data);
      const rank = res.data.data;
      const fRes = await factionsApi.getById(factionId);
      const refreshed = fRes.data.data;
      set(state => ({
        currentFaction: refreshed,
        factions: state.factions.map(f => f.id === factionId ? refreshed : f),
      }));
      return rank;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to update faction rank') });
      throw error;
    }
  },

  deleteRank: async (factionId, rankId) => {
    set({ error: null });
    try {
      await factionsApi.deleteRank(factionId, rankId);
      const fRes = await factionsApi.getById(factionId);
      const refreshed = fRes.data.data;
      set(state => ({
        currentFaction: refreshed,
        factions: state.factions.map(f => f.id === factionId ? refreshed : f),
      }));
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to delete faction rank') });
      throw error;
    }
  },

  // Members
  addMember: async (factionId, data) => {
    set({ error: null });
    try {
      const res = await factionsApi.addMember(factionId, data);
      const member = res.data.data;
      const fRes = await factionsApi.getById(factionId);
      const refreshed = fRes.data.data;
      set(state => ({
        currentFaction: refreshed,
        factions: state.factions.map(f => f.id === factionId ? refreshed : f),
      }));
      return member;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to add faction member') });
      throw error;
    }
  },

  updateMember: async (factionId, memberId, data) => {
    set({ error: null });
    try {
      const res = await factionsApi.updateMember(factionId, memberId, data);
      const member = res.data.data;
      const fRes = await factionsApi.getById(factionId);
      const refreshed = fRes.data.data;
      set(state => ({
        currentFaction: refreshed,
        factions: state.factions.map(f => f.id === factionId ? refreshed : f),
      }));
      return member;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to update faction member') });
      throw error;
    }
  },

  removeMember: async (factionId, memberId) => {
    set({ error: null });
    try {
      await factionsApi.removeMember(factionId, memberId);
      const fRes = await factionsApi.getById(factionId);
      const refreshed = fRes.data.data;
      set(state => ({
        currentFaction: refreshed,
        factions: state.factions.map(f => f.id === factionId ? refreshed : f),
      }));
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to remove faction member') });
      throw error;
    }
  },

  // Assets
  createAsset: async (factionId, data) => {
    set({ error: null });
    try {
      const res = await factionsApi.createAsset(factionId, data);
      const asset = res.data.data;
      const fRes = await factionsApi.getById(factionId);
      const refreshed = fRes.data.data;
      set(state => ({
        currentFaction: refreshed,
        factions: state.factions.map(f => f.id === factionId ? refreshed : f),
      }));
      return asset;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to create faction asset') });
      throw error;
    }
  },

  updateAsset: async (factionId, assetId, data) => {
    set({ error: null });
    try {
      const res = await factionsApi.updateAsset(factionId, assetId, data);
      const asset = res.data.data;
      const fRes = await factionsApi.getById(factionId);
      const refreshed = fRes.data.data;
      set(state => ({
        currentFaction: refreshed,
        factions: state.factions.map(f => f.id === factionId ? refreshed : f),
      }));
      return asset;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to update faction asset') });
      throw error;
    }
  },

  deleteAsset: async (factionId, assetId) => {
    set({ error: null });
    try {
      await factionsApi.deleteAsset(factionId, assetId);
      const fRes = await factionsApi.getById(factionId);
      const refreshed = fRes.data.data;
      set(state => ({
        currentFaction: refreshed,
        factions: state.factions.map(f => f.id === factionId ? refreshed : f),
      }));
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to delete faction asset') });
      throw error;
    }
  },

  bootstrapDefaultAssets: async (factionId) => {
    set({ error: null });
    try {
      const res = await factionsApi.bootstrapDefaultAssets(factionId);
      const result = res.data.data;
      const fRes = await factionsApi.getById(factionId);
      const refreshed = fRes.data.data;
      set(state => ({
        currentFaction: refreshed,
        factions: state.factions.map(f => f.id === factionId ? refreshed : f),
      }));
      return result;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to bootstrap faction assets') });
      throw error;
    }
  },

  // Relations
  fetchRelations: async (projectId) => {
    set({ error: null });
    try {
      const res = await factionsApi.getRelations(projectId);
      set({ relations: res.data.data || [] });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to fetch faction relations') });
      throw error;
    }
  },

  createRelation: async (data) => {
    set({ error: null });
    try {
      const res = await factionsApi.createRelation(data);
      const relation = res.data.data;
      set(state => ({ relations: [relation, ...state.relations] }));
      return relation;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to create faction relation') });
      throw error;
    }
  },

  updateRelation: async (relationId, data) => {
    set({ error: null });
    try {
      const res = await factionsApi.updateRelation(relationId, data);
      const updated = res.data.data;
      set(state => ({
        relations: state.relations.map(r => r.id === relationId ? updated : r),
      }));
      return updated;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to update faction relation') });
      throw error;
    }
  },

  deleteRelation: async (relationId) => {
    set({ error: null });
    try {
      await factionsApi.deleteRelation(relationId);
      set(state => ({
        relations: state.relations.filter(r => r.id !== relationId),
      }));
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to delete faction relation') });
      throw error;
    }
  },

  setCurrentFaction: (f) => set({ currentFaction: f }),
  clearError: () => set({ error: null }),

  reset: () => set({
    factions: [], total: 0, loading: false, loadingMore: false,
    initialized: false, error: null, currentFaction: null, relations: [],
  }),
}));