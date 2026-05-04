import { create } from 'zustand';
import { TimelineEvent, CreateTimelineEvent, UpdateTimelineEvent } from '@campaigner/shared';
import { timelineApi } from '@/api/timeline';
import { getErrorMessage } from '@/utils/error';
import { useProjectStore } from '@/store/useProjectStore';

function activeProjectId(): number | undefined {
  const id = useProjectStore.getState().currentProject?.id;
  return typeof id === 'number' && id > 0 ? id : undefined;
}

interface TimelineState {
  events: TimelineEvent[];
  currentEvent: TimelineEvent | null;
  loading: boolean;
  error: string | null;

  fetchEvents: (projectId: number, era?: string) => Promise<void>;
  fetchEvent: (id: number) => Promise<void>;
  createEvent: (data: CreateTimelineEvent) => Promise<TimelineEvent>;
  updateEvent: (id: number, data: UpdateTimelineEvent) => Promise<void>;
  deleteEvent: (id: number) => Promise<void>;
  reorderEvents: (projectId: number, orderedIds: number[]) => Promise<void>;
  setTags: (id: number, tagIds: number[]) => Promise<void>;
  setCurrentEvent: (event: TimelineEvent | null) => void;
  clearError: () => void;
  reset: () => void;
}

export const useTimelineStore = create<TimelineState>((set) => ({
  events: [],
  currentEvent: null,
  loading: false,
  error: null,

  fetchEvents: async (projectId, era) => {
    set({ loading: true, error: null });
    try {
      const res = await timelineApi.getAll(projectId, era);
      set({ events: res.data.data, loading: false });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to fetch timeline events'), loading: false });
    }
  },

  fetchEvent: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await timelineApi.getById(id, activeProjectId());
      set({ currentEvent: res.data.data, loading: false });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to fetch timeline event'), loading: false });
    }
  },

  createEvent: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await timelineApi.create(data);
      const event = res.data.data;
      set(state => ({
        events: [...state.events, event].sort((a, b) => a.sortOrder - b.sortOrder),
        loading: false,
      }));
      return event;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to create timeline event'), loading: false });
      throw error;
    }
  },

  updateEvent: async (id, data) => {
    set({ error: null });
    try {
      const res = await timelineApi.update(id, data, activeProjectId());
      const updated = res.data.data;
      set(state => ({
        events: state.events.map(e => e.id === id ? updated : e),
        currentEvent: state.currentEvent?.id === id ? updated : state.currentEvent,
      }));
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to update timeline event') });
      throw error;
    }
  },

  deleteEvent: async (id) => {
    set({ error: null });
    try {
      await timelineApi.delete(id, activeProjectId());
      set(state => ({
        events: state.events.filter(e => e.id !== id),
        currentEvent: state.currentEvent?.id === id ? null : state.currentEvent,
      }));
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to delete timeline event') });
      throw error;
    }
  },

  reorderEvents: async (projectId, orderedIds) => {
    set({ error: null });
    try {
      const res = await timelineApi.reorder(projectId, orderedIds);
      set({ events: res.data.data });
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to reorder timeline events') });
      throw error;
    }
  },

  setTags: async (id, tagIds) => {
    set({ error: null });
    try {
      await timelineApi.setTags(id, tagIds);
      const res = await timelineApi.getById(id, activeProjectId());
      const updated = res.data.data;
      set(state => ({
        events: state.events.map(e => e.id === id ? updated : e),
        currentEvent: state.currentEvent?.id === id ? updated : state.currentEvent,
      }));
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Failed to update timeline event tags') });
    }
  },

  setCurrentEvent: (event) => set({ currentEvent: event }),
  clearError: () => set({ error: null }),

  reset: () => set({
    events: [], currentEvent: null, loading: false, error: null,
  }),
}));
