import { create } from 'zustand';
import { dynastiesApi } from '@/api/dynasties';
import type {
  Dynasty,
  DynastyMember,
  DynastyFamilyLink,
  DynastyEvent,
  CreateDynasty,
  UpdateDynasty,
  CreateDynastyMember,
  UpdateDynastyMember,
  CreateDynastyFamilyLink,
  CreateDynastyEvent,
  UpdateDynastyEvent,
} from '@campaigner/shared';

interface DynastyListParams {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

interface DynastyState {
  dynasties: Dynasty[];
  total: number;
  loading: boolean;
  currentDynasty: Dynasty | null;

  fetchDynasties: (projectId: number, params?: DynastyListParams) => Promise<void>;
  fetchDynasty: (id: number) => Promise<Dynasty>;
  createDynasty: (data: CreateDynasty) => Promise<Dynasty>;
  updateDynasty: (id: number, data: UpdateDynasty) => Promise<Dynasty>;
  deleteDynasty: (id: number) => Promise<void>;
  uploadImage: (id: number, file: File) => Promise<Dynasty>;
  setTags: (id: number, tagIds: number[]) => Promise<void>;

  addMember: (dynastyId: number, data: CreateDynastyMember) => Promise<DynastyMember>;
  updateMember: (dynastyId: number, memberId: number, data: UpdateDynastyMember) => Promise<DynastyMember>;
  removeMember: (dynastyId: number, memberId: number) => Promise<void>;

  addFamilyLink: (dynastyId: number, data: CreateDynastyFamilyLink) => Promise<DynastyFamilyLink>;
  deleteFamilyLink: (dynastyId: number, linkId: number) => Promise<void>;

  addEvent: (dynastyId: number, data: CreateDynastyEvent) => Promise<DynastyEvent>;
  updateEvent: (dynastyId: number, eventId: number, data: UpdateDynastyEvent) => Promise<DynastyEvent>;
  deleteEvent: (dynastyId: number, eventId: number) => Promise<void>;

  saveGraphPositions: (dynastyId: number, positions: { characterId: number; graphX: number; graphY: number }[]) => Promise<void>;

  setCurrentDynasty: (d: Dynasty | null) => void;
  reset: () => void;
}

export const useDynastyStore = create<DynastyState>((set) => ({
  dynasties: [],
  total: 0,
  loading: false,
  currentDynasty: null,

  fetchDynasties: async (projectId, params = {}) => {
    set({ loading: true });
    try {
      const res = await dynastiesApi.getAll(projectId, params);
      set({ dynasties: res.data.data || [], total: res.data.total || 0 });
    } finally {
      set({ loading: false });
    }
  },

  fetchDynasty: async (id) => {
    set({ loading: true });
    try {
      const res = await dynastiesApi.getById(id);
      const dynasty = res.data.data;
      set({ currentDynasty: dynasty });
      return dynasty;
    } finally {
      set({ loading: false });
    }
  },

  createDynasty: async (data) => {
    const res = await dynastiesApi.create(data);
    const dynasty = res.data.data;
    set(state => ({
      dynasties: [dynasty, ...state.dynasties],
      total: state.total + 1,
    }));
    return dynasty;
  },

  updateDynasty: async (id, data) => {
    const res = await dynastiesApi.update(id, data);
    const updated = res.data.data;
    set(state => ({
      dynasties: state.dynasties.map(d => d.id === id ? updated : d),
      currentDynasty: state.currentDynasty?.id === id ? updated : state.currentDynasty,
    }));
    return updated;
  },

  deleteDynasty: async (id) => {
    await dynastiesApi.delete(id);
    set(state => ({
      dynasties: state.dynasties.filter(d => d.id !== id),
      total: state.total - 1,
      currentDynasty: state.currentDynasty?.id === id ? null : state.currentDynasty,
    }));
  },

  uploadImage: async (id, file) => {
    const res = await dynastiesApi.uploadImage(id, file);
    const updated = res.data.data;
    set(state => ({
      currentDynasty: state.currentDynasty?.id === id ? updated : state.currentDynasty,
      dynasties: state.dynasties.map(d => d.id === id ? { ...d, imagePath: updated.imagePath } : d),
    }));
    return updated;
  },

  setTags: async (id, tagIds) => {
    await dynastiesApi.setTags(id, tagIds);
    const res = await dynastiesApi.getById(id);
    const updated = res.data.data;
    set(state => ({
      currentDynasty: state.currentDynasty?.id === id ? updated : state.currentDynasty,
      dynasties: state.dynasties.map(d => d.id === id ? updated : d),
    }));
  },

  // Members
  addMember: async (dynastyId, data) => {
    const res = await dynastiesApi.addMember(dynastyId, data);
    const member = res.data.data;
    const dRes = await dynastiesApi.getById(dynastyId);
    const refreshed = dRes.data.data;
    set(state => ({
      currentDynasty: refreshed,
      dynasties: state.dynasties.map(d => d.id === dynastyId ? refreshed : d),
    }));
    return member;
  },

  updateMember: async (dynastyId, memberId, data) => {
    const res = await dynastiesApi.updateMember(dynastyId, memberId, data);
    const member = res.data.data;
    const dRes = await dynastiesApi.getById(dynastyId);
    const refreshed = dRes.data.data;
    set(state => ({
      currentDynasty: refreshed,
      dynasties: state.dynasties.map(d => d.id === dynastyId ? refreshed : d),
    }));
    return member;
  },

  removeMember: async (dynastyId, memberId) => {
    await dynastiesApi.removeMember(dynastyId, memberId);
    const dRes = await dynastiesApi.getById(dynastyId);
    const refreshed = dRes.data.data;
    set(state => ({
      currentDynasty: refreshed,
      dynasties: state.dynasties.map(d => d.id === dynastyId ? refreshed : d),
    }));
  },

  // Family links
  addFamilyLink: async (dynastyId, data) => {
    const res = await dynastiesApi.addFamilyLink(dynastyId, data);
    const link = res.data.data;
    const dRes = await dynastiesApi.getById(dynastyId);
    const refreshed = dRes.data.data;
    set(state => ({
      currentDynasty: refreshed,
      dynasties: state.dynasties.map(d => d.id === dynastyId ? refreshed : d),
    }));
    return link;
  },

  deleteFamilyLink: async (dynastyId, linkId) => {
    await dynastiesApi.deleteFamilyLink(dynastyId, linkId);
    const dRes = await dynastiesApi.getById(dynastyId);
    const refreshed = dRes.data.data;
    set(state => ({
      currentDynasty: refreshed,
      dynasties: state.dynasties.map(d => d.id === dynastyId ? refreshed : d),
    }));
  },

  // Events
  addEvent: async (dynastyId, data) => {
    const res = await dynastiesApi.addEvent(dynastyId, data);
    const event = res.data.data;
    const dRes = await dynastiesApi.getById(dynastyId);
    const refreshed = dRes.data.data;
    set(state => ({
      currentDynasty: refreshed,
      dynasties: state.dynasties.map(d => d.id === dynastyId ? refreshed : d),
    }));
    return event;
  },

  updateEvent: async (dynastyId, eventId, data) => {
    const res = await dynastiesApi.updateEvent(dynastyId, eventId, data);
    const event = res.data.data;
    const dRes = await dynastiesApi.getById(dynastyId);
    const refreshed = dRes.data.data;
    set(state => ({
      currentDynasty: refreshed,
      dynasties: state.dynasties.map(d => d.id === dynastyId ? refreshed : d),
    }));
    return event;
  },

  deleteEvent: async (dynastyId, eventId) => {
    await dynastiesApi.deleteEvent(dynastyId, eventId);
    const dRes = await dynastiesApi.getById(dynastyId);
    const refreshed = dRes.data.data;
    set(state => ({
      currentDynasty: refreshed,
      dynasties: state.dynasties.map(d => d.id === dynastyId ? refreshed : d),
    }));
  },

  saveGraphPositions: async (dynastyId, positions) => {
    await dynastiesApi.saveGraphPositions(dynastyId, positions);
  },

  setCurrentDynasty: (d) => set({ currentDynasty: d }),

  reset: () => set({
    dynasties: [], total: 0, loading: false, currentDynasty: null,
  }),
}));