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
import { getErrorMessage } from '@/utils/error';

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
  error: string | null;
  initialized: boolean;

  fetchDynasties: (projectId: number, params?: DynastyListParams) => Promise<void>;
  fetchDynasty: (projectId: number, id: number) => Promise<Dynasty>;
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
  reorderEvents: (dynastyId: number, orderedIds: number[], projectId: number) => Promise<void>;

  saveGraphPositions: (
    dynastyId: number,
    positions: { characterId: number; graphX: number; graphY: number }[],
    projectId: number,
  ) => Promise<void>;

  setCurrentDynasty: (d: Dynasty | null) => void;
  clearError: () => void;
  reset: () => void;
}

function dynastyProjectId(get: () => DynastyState, dynastyId: number): number {
  const st = get();
  const pid =
    st.dynasties.find((d) => d.id === dynastyId)?.projectId ??
    (st.currentDynasty?.id === dynastyId ? st.currentDynasty.projectId : undefined);
  if (!pid) {
    throw new Error('Missing project context for dynasty request');
  }
  return pid;
}

export const useDynastyStore = create<DynastyState>((set, get) => ({
  dynasties: [],
  total: 0,
  loading: false,
  currentDynasty: null,
  error: null,
  initialized: false,

  fetchDynasties: async (projectId, params = {}) => {
    set({ loading: true, error: null });
    try {
      const res = await dynastiesApi.getAll(projectId, params);
      set({ dynasties: res.data.data || [], total: res.data.total || 0, initialized: true });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to fetch dynasties') });
    } finally {
      set({ loading: false });
    }
  },

  fetchDynasty: async (projectId, id) => {
    set({ loading: true, error: null });
    try {
      const res = await dynastiesApi.getById(id, projectId);
      const dynasty = res.data.data;
      set({ currentDynasty: dynasty });
      return dynasty;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to fetch dynasty') });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  createDynasty: async (data) => {
    try {
      const res = await dynastiesApi.create(data);
      const dynasty = res.data.data;
      set((state) => ({
        dynasties: [dynasty, ...state.dynasties],
        total: state.total + 1,
      }));
      return dynasty;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to create dynasty') });
      throw error;
    }
  },

  updateDynasty: async (id, data) => {
    try {
      const projectId = dynastyProjectId(get, id);
      const res = await dynastiesApi.update(id, data, projectId);
      const updated = res.data.data;
      set((state) => ({
        dynasties: state.dynasties.map((d) => (d.id === id ? updated : d)),
        currentDynasty: state.currentDynasty?.id === id ? updated : state.currentDynasty,
      }));
      return updated;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to update dynasty') });
      throw error;
    }
  },

  deleteDynasty: async (id) => {
    try {
      const projectId = dynastyProjectId(get, id);
      await dynastiesApi.delete(id, projectId);
      set((state) => ({
        dynasties: state.dynasties.filter((d) => d.id !== id),
        total: state.total - 1,
        currentDynasty: state.currentDynasty?.id === id ? null : state.currentDynasty,
      }));
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to delete dynasty') });
      throw error;
    }
  },

  uploadImage: async (id, file) => {
    try {
      const projectId = dynastyProjectId(get, id);
      const res = await dynastiesApi.uploadImage(id, file, projectId);
      const updated = res.data.data;
      set((state) => ({
        currentDynasty: state.currentDynasty?.id === id ? updated : state.currentDynasty,
        dynasties: state.dynasties.map((d) => (d.id === id ? { ...d, imagePath: updated.imagePath } : d)),
      }));
      return updated;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to upload dynasty image') });
      throw error;
    }
  },

  setTags: async (id, tagIds) => {
    try {
      const projectId = dynastyProjectId(get, id);
      await dynastiesApi.setTags(id, tagIds, projectId);
      const res = await dynastiesApi.getById(id, projectId);
      const updated = res.data.data;
      set((state) => ({
        currentDynasty: state.currentDynasty?.id === id ? updated : state.currentDynasty,
        dynasties: state.dynasties.map((d) => (d.id === id ? updated : d)),
      }));
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to update dynasty tags') });
      throw error;
    }
  },

  addMember: async (dynastyId, data) => {
    try {
      const projectId = dynastyProjectId(get, dynastyId);
      const res = await dynastiesApi.addMember(dynastyId, data, projectId);
      const member = res.data.data;
      const dRes = await dynastiesApi.getById(dynastyId, projectId);
      const refreshed = dRes.data.data;
      set((state) => ({
        currentDynasty: refreshed,
        dynasties: state.dynasties.map((d) => (d.id === dynastyId ? refreshed : d)),
      }));
      return member;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to add dynasty member') });
      throw error;
    }
  },

  updateMember: async (dynastyId, memberId, data) => {
    try {
      const projectId = dynastyProjectId(get, dynastyId);
      const res = await dynastiesApi.updateMember(dynastyId, memberId, data);
      const member = res.data.data;
      const dRes = await dynastiesApi.getById(dynastyId, projectId);
      const refreshed = dRes.data.data;
      set((state) => ({
        currentDynasty: refreshed,
        dynasties: state.dynasties.map((d) => (d.id === dynastyId ? refreshed : d)),
      }));
      return member;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to update dynasty member') });
      throw error;
    }
  },

  removeMember: async (dynastyId, memberId) => {
    try {
      const projectId = dynastyProjectId(get, dynastyId);
      await dynastiesApi.removeMember(dynastyId, memberId);
      const dRes = await dynastiesApi.getById(dynastyId, projectId);
      const refreshed = dRes.data.data;
      set((state) => ({
        currentDynasty: refreshed,
        dynasties: state.dynasties.map((d) => (d.id === dynastyId ? refreshed : d)),
      }));
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to remove dynasty member') });
      throw error;
    }
  },

  addFamilyLink: async (dynastyId, data) => {
    try {
      const projectId = dynastyProjectId(get, dynastyId);
      const res = await dynastiesApi.addFamilyLink(dynastyId, data, projectId);
      const link = res.data.data;
      const dRes = await dynastiesApi.getById(dynastyId, projectId);
      const refreshed = dRes.data.data;
      set((state) => ({
        currentDynasty: refreshed,
        dynasties: state.dynasties.map((d) => (d.id === dynastyId ? refreshed : d)),
      }));
      return link;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to add family link') });
      throw error;
    }
  },

  deleteFamilyLink: async (dynastyId, linkId) => {
    try {
      const projectId = dynastyProjectId(get, dynastyId);
      await dynastiesApi.deleteFamilyLink(dynastyId, linkId);
      const dRes = await dynastiesApi.getById(dynastyId, projectId);
      const refreshed = dRes.data.data;
      set((state) => ({
        currentDynasty: refreshed,
        dynasties: state.dynasties.map((d) => (d.id === dynastyId ? refreshed : d)),
      }));
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to delete family link') });
      throw error;
    }
  },

  addEvent: async (dynastyId, data) => {
    try {
      const projectId = dynastyProjectId(get, dynastyId);
      const res = await dynastiesApi.addEvent(dynastyId, data, projectId);
      const event = res.data.data;
      const dRes = await dynastiesApi.getById(dynastyId, projectId);
      const refreshed = dRes.data.data;
      set((state) => ({
        currentDynasty: refreshed,
        dynasties: state.dynasties.map((d) => (d.id === dynastyId ? refreshed : d)),
      }));
      return event;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to add dynasty event') });
      throw error;
    }
  },

  updateEvent: async (dynastyId, eventId, data) => {
    try {
      const projectId = dynastyProjectId(get, dynastyId);
      const res = await dynastiesApi.updateEvent(dynastyId, eventId, data);
      const event = res.data.data;
      const dRes = await dynastiesApi.getById(dynastyId, projectId);
      const refreshed = dRes.data.data;
      set((state) => ({
        currentDynasty: refreshed,
        dynasties: state.dynasties.map((d) => (d.id === dynastyId ? refreshed : d)),
      }));
      return event;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to update dynasty event') });
      throw error;
    }
  },

  deleteEvent: async (dynastyId, eventId) => {
    try {
      const projectId = dynastyProjectId(get, dynastyId);
      await dynastiesApi.deleteEvent(dynastyId, eventId);
      const dRes = await dynastiesApi.getById(dynastyId, projectId);
      const refreshed = dRes.data.data;
      set((state) => ({
        currentDynasty: refreshed,
        dynasties: state.dynasties.map((d) => (d.id === dynastyId ? refreshed : d)),
      }));
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to delete dynasty event') });
      throw error;
    }
  },

  reorderEvents: async (dynastyId, orderedIds, projectId) => {
    const prevCurrent = get().currentDynasty;
    const prevEvents =
      prevCurrent?.id === dynastyId && prevCurrent.events
        ? prevCurrent.events.map((e) => ({ ...e }))
        : undefined;

    if (prevCurrent?.id === dynastyId && prevCurrent.events) {
      const byId = new Map(prevCurrent.events.map((e) => [e.id, e]));
      const nextEvents: DynastyEvent[] = [];
      for (let i = 0; i < orderedIds.length; i++) {
        const e = byId.get(orderedIds[i]);
        if (e) nextEvents.push({ ...e, sortOrder: i });
      }
      for (const e of prevCurrent.events) {
        if (!orderedIds.includes(e.id)) {
          nextEvents.push(e);
        }
      }
      set({ currentDynasty: { ...prevCurrent, events: nextEvents } });
    }

    try {
      const res = await dynastiesApi.reorderEvents(dynastyId, orderedIds, projectId);
      const updated = res.data.data;
      if (updated) {
        set((state) => ({
          currentDynasty:
            state.currentDynasty?.id === dynastyId ? updated : state.currentDynasty,
          dynasties: state.dynasties.map((d) => (d.id === dynastyId ? updated : d)),
        }));
      }
    } catch (error: unknown) {
      if (prevEvents !== undefined && prevCurrent?.id === dynastyId) {
        set({ currentDynasty: { ...prevCurrent, events: prevEvents } });
      }
      try {
        await get().fetchDynasty(projectId, dynastyId);
      } catch {
        // ignore secondary refresh failure
      }
      set({ error: getErrorMessage(error, 'Failed to reorder dynasty events') });
      throw error;
    }
  },

  saveGraphPositions: async (dynastyId, positions, projectId) => {
    try {
      await dynastiesApi.saveGraphPositions(dynastyId, positions, projectId);
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to save graph positions') });
      throw error;
    }
  },

  setCurrentDynasty: (d) => set({ currentDynasty: d }),

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      dynasties: [],
      total: 0,
      loading: false,
      currentDynasty: null,
      error: null,
      initialized: false,
    }),
}));
