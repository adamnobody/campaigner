import { create } from 'zustand';
import { TimelineEvent, CreateTimelineEvent, UpdateTimelineEvent } from '@campaigner/shared';
import { timelineApi } from '@/api/timeline';

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
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchEvent: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await timelineApi.getById(id);
      set({ currentEvent: res.data.data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
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
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateEvent: async (id, data) => {
    set({ error: null });
    try {
      const res = await timelineApi.update(id, data);
      const updated = res.data.data;
      set(state => ({
        events: state.events.map(e => e.id === id ? updated : e),
        currentEvent: state.currentEvent?.id === id ? updated : state.currentEvent,
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteEvent: async (id) => {
    set({ error: null });
    try {
      await timelineApi.delete(id);
      set(state => ({
        events: state.events.filter(e => e.id !== id),
        currentEvent: state.currentEvent?.id === id ? null : state.currentEvent,
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  reorderEvents: async (projectId, orderedIds) => {
    set({ error: null });
    try {
      const res = await timelineApi.reorder(projectId, orderedIds);
      set({ events: res.data.data });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  setTags: async (id, tagIds) => {
    set({ error: null });
    try {
      await timelineApi.setTags(id, tagIds);
      const res = await timelineApi.getById(id);
      const updated = res.data.data;
      set(state => ({
        events: state.events.map(e => e.id === id ? updated : e),
        currentEvent: state.currentEvent?.id === id ? updated : state.currentEvent,
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  setCurrentEvent: (event) => set({ currentEvent: event }),
  clearError: () => set({ error: null }),
}));