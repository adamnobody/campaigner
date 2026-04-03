import { create } from 'zustand';
import { mapApi } from '@/api/axiosClient';
import type { Map, MapMarker, CreateMap, UpdateMap, CreateMarker, UpdateMarker } from '@campaigner/shared';

interface MapState {
  currentMap: Map | null;
  markers: MapMarker[];
  mapTree: Map[];
  loading: boolean;
  error: string | null;

  fetchRootMap: (projectId: number) => Promise<void>;
  fetchMapById: (mapId: number) => Promise<void>;
  fetchMapTree: (projectId: number) => Promise<void>;
  fetchMarkers: (mapId: number) => Promise<void>;
  createMap: (data: CreateMap) => Promise<Map>;
  updateMap: (mapId: number, data: UpdateMap) => Promise<void>;
  deleteMap: (mapId: number) => Promise<void>;
  createMarker: (mapId: number, data: CreateMarker) => Promise<MapMarker>;
  updateMarker: (markerId: number, data: UpdateMarker) => Promise<void>;
  deleteMarker: (markerId: number) => Promise<void>;
  setCurrentMap: (map: Map | null) => void;
  clearMapState: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  currentMap: null,
  markers: [],
  mapTree: [],
  loading: false,
  error: null,

  fetchRootMap: async (projectId: number) => {
    set({ loading: true, error: null });
    try {
      const response = await mapApi.getRootMap(projectId);
      set({ currentMap: response.data.data, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchMapById: async (mapId) => {
    set({ loading: true, error: null });
    try {
      const response = await mapApi.getMapById(mapId);
      set({ currentMap: response.data.data, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchMapTree: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const response = await mapApi.getMapTree(projectId);
      set({ mapTree: response.data.data, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchMarkers: async (mapId) => {
    set({ loading: true, error: null });
    try {
      const response = await mapApi.getMarkersByMapId(mapId);
      set({ markers: response.data.data, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  createMap: async (data) => {
    try {
      const response = await mapApi.createMap(data);
      return response.data.data;
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  updateMap: async (mapId, data) => {
    try {
      await mapApi.updateMap(mapId, data);
      set((state) => ({
        currentMap: state.currentMap
          ? { ...state.currentMap, ...data }
          : null,
      }));
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  deleteMap: async (mapId) => {
    try {
      await mapApi.deleteMap(mapId);
      set({ currentMap: null, markers: [] });
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  createMarker: async (mapId, data) => {
    try {
      const response = await mapApi.createMarker(mapId, data);
      set((state) => ({
        markers: [...state.markers, response.data.data],
      }));
      return response.data.data;
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  updateMarker: async (markerId, data) => {
    try {
      await mapApi.updateMarker(markerId, data);
      set((state) => ({
        markers: state.markers.map((m) =>
          m.id === markerId ? { ...m, ...data } : m
        ),
      }));
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  deleteMarker: async (markerId) => {
    try {
      await mapApi.deleteMarker(markerId);
      set((state) => ({
        markers: state.markers.filter((m) => m.id !== markerId),
      }));
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  setCurrentMap: (map: Map | null) => {
    set({ currentMap: map });
  },

  clearMapState: () => {
    set({
      currentMap: null,
      markers: [],
      mapTree: [],
      loading: false,
      error: null,
    });
  },
}));