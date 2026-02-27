import { create } from 'zustand';
import { MapMarker, CreateMarker, UpdateMarker } from '@campaigner/shared';
import { mapApi } from '@/api/axiosClient';

interface MapState {
  markers: MapMarker[];
  selectedMarker: MapMarker | null;
  loading: boolean;
  error: string | null;

  fetchMarkers: (projectId: number) => Promise<void>;
  createMarker: (data: CreateMarker) => Promise<MapMarker>;
  updateMarker: (id: number, data: UpdateMarker) => Promise<void>;
  deleteMarker: (id: number) => Promise<void>;
  setSelectedMarker: (marker: MapMarker | null) => void;
  clearError: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  markers: [],
  selectedMarker: null,
  loading: false,
  error: null,

  fetchMarkers: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const res = await mapApi.getMarkers(projectId);
      set({ markers: res.data.data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createMarker: async (data) => {
    set({ error: null });
    try {
      const res = await mapApi.create(data);
      const marker = res.data.data;
      set(state => ({ markers: [...state.markers, marker] }));
      return marker;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  updateMarker: async (id, data) => {
    set({ error: null });
    try {
      const res = await mapApi.update(id, data);
      const updated = res.data.data;
      set(state => ({
        markers: state.markers.map(m => m.id === id ? updated : m),
        selectedMarker: state.selectedMarker?.id === id ? updated : state.selectedMarker,
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteMarker: async (id) => {
    set({ error: null });
    try {
      await mapApi.delete(id);
      set(state => ({
        markers: state.markers.filter(m => m.id !== id),
        selectedMarker: state.selectedMarker?.id === id ? null : state.selectedMarker,
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  setSelectedMarker: (marker) => set({ selectedMarker: marker }),
  clearError: () => set({ error: null }),
}));