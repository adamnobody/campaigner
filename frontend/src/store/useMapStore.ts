import { create } from 'zustand';
import { mapApi } from '../api/axiosClient';
import type { Map, MapMarker } from '@campaigner/shared';

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
  createMap: (data: any) => Promise<Map>;
  updateMap: (mapId: number, data: any) => Promise<void>;
  deleteMap: (mapId: number) => Promise<void>;
  createMarker: (mapId: number, data: any) => Promise<MapMarker>;
  updateMarker: (markerId: number, data: any) => Promise<void>;
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
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchMapById: async (mapId: number) => {
    set({ loading: true, error: null });
    try {
      const response = await mapApi.getMapById(mapId);
      set({ currentMap: response.data.data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchMapTree: async (projectId: number) => {
    set({ loading: true, error: null });
    try {
      const response = await mapApi.getMapTree(projectId);
      set({ mapTree: response.data.data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchMarkers: async (mapId: number) => {
    set({ loading: true, error: null });
    try {
      const response = await mapApi.getMarkersByMapId(mapId);
      set({ markers: response.data.data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createMap: async (data: any) => {
    try {
      const response = await mapApi.createMap(data);
      return response.data.data;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  updateMap: async (mapId: number, data: any) => {
    try {
      await mapApi.updateMap(mapId, data);
      set((state) => ({
        currentMap: state.currentMap
          ? { ...state.currentMap, ...data }
          : null,
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteMap: async (mapId: number) => {
    try {
      await mapApi.deleteMap(mapId);
      set({ currentMap: null, markers: [] });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  createMarker: async (mapId: number, data: any) => {
    try {
      const response = await mapApi.createMarker(mapId, data);
      set((state) => ({
        markers: [...state.markers, response.data.data],
      }));
      return response.data.data;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  updateMarker: async (markerId: number, data: any) => {
    try {
      await mapApi.updateMarker(markerId, data);
      set((state) => ({
        markers: state.markers.map((m) =>
          m.id === markerId ? { ...m, ...data } : m
        ),
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteMarker: async (markerId: number) => {
    try {
      await mapApi.deleteMarker(markerId);
      set((state) => ({
        markers: state.markers.filter((m) => m.id !== markerId),
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
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