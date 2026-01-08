import { create } from 'zustand';
import {
  api,
  type MapDTO,
  type ProjectDTO,
  type MarkerDTO,
  type MarkerType,
  type NoteDTO,
  type NoteType,
  type GameSystemType
} from './api';

type CreateMarkerPayload = {
  title: string;
  description: string;
  x: number;
  y: number;

  marker_type: MarkerType;
  color: string;

  link_type?: null | 'note' | 'map';
  link_note_id?: string | null;
  link_map_id?: string | null;
};

type PatchMarkerPayload = Partial<
  Pick<
    CreateMarkerPayload,
    'title' | 'description' | 'x' | 'y' | 'marker_type' | 'color' | 'link_type' | 'link_note_id' | 'link_map_id'
  >
>;

type MarkerFiltersState = {
  markerTypeVisibility: Record<MarkerType, boolean>;
  markerSearchQuery: string;
  markerOnlyLinked: boolean;

  setMarkerTypeVisibility: (type: MarkerType, visible: boolean) => void;
  setAllMarkerTypesVisibility: (visible: boolean) => void;
  setMarkerSearchQuery: (q: string) => void;
  setMarkerOnlyLinked: (v: boolean) => void;
  resetMarkerFilters: () => void;

  getVisibleMarkersForMap: (mapId: string) => MarkerDTO[];
};

type AppState = {
  // Projects
  projects: ProjectDTO[];
  projectsLoading: boolean;
  currentProjectId: string | null;

  loadProjects: () => Promise<void>;
  createProject: (input: { name: string; rootPath?: string; system: GameSystemType }) => Promise<ProjectDTO>;
  setCurrentProjectId: (id: string | null) => void;
  deleteProject: (projectId: string) => Promise<void>;

  // Maps
  maps: MapDTO[];
  mapsLoading: boolean;
  currentMapId: string | null;

  loadMaps: (projectId: string) => Promise<void>;
  createMap: (projectId: string, input: { title: string; parent_map_id?: string; file: File }) => Promise<MapDTO>;
  setCurrentMapId: (id: string | null) => void;

  // Markers
  markersByMapId: Record<string, MarkerDTO[]>;
  markersLoadingByMapId: Record<string, boolean>;

  loadMarkers: (mapId: string) => Promise<void>;
  createMarker: (mapId: string, input: CreateMarkerPayload) => Promise<MarkerDTO>;
  patchMarker: (markerId: string, patch: PatchMarkerPayload) => Promise<MarkerDTO>;
  deleteMarker: (markerId: string, mapId: string) => Promise<void>;

  // Notes
  notes: NoteDTO[];
  notesLoading: boolean;
  selectedNoteId: string | null;

  noteContentById: Record<string, string>;
  noteContentLoadingById: Record<string, boolean>;

  loadNotes: (projectId: string) => Promise<void>;
  createNote: (projectId: string, input: { title: string; type: NoteType }) => Promise<NoteDTO>;
  openNote: (noteId: string | null) => void;

  loadNoteContent: (noteId: string) => Promise<void>;
  saveNoteContent: (noteId: string, content: string) => Promise<void>;
  deleteNote: (noteId: string, projectId: string) => Promise<void>;

  // Draft helper (важно для NoteEditorDrawer)
  setNoteDraftContent: (noteId: string, content: string) => void;
  deleteMap: (projectId: string, mapId: string) => Promise<void>;
  createNoteSilent: (projectId: string, input: { title: string; type: NoteType }) => Promise<NoteDTO>;
} & MarkerFiltersState;

const defaultMarkerTypeVisibility: Record<MarkerType, boolean> = {
  location: true,
  event: true,
  character: true
};

function norm(s: string) {
  return s.trim().toLowerCase();
}

export const useAppStore = create<AppState>((set, get) => ({
  // --------------------
  // Marker filters + search
  // --------------------
  markerTypeVisibility: defaultMarkerTypeVisibility,
  markerSearchQuery: '',
  markerOnlyLinked: false,

  setMarkerTypeVisibility: (type, visible) =>
    set((s) => ({ markerTypeVisibility: { ...s.markerTypeVisibility, [type]: visible } })),

  setAllMarkerTypesVisibility: (visible) =>
    set(() => ({
      markerTypeVisibility: {
        location: visible,
        event: visible,
        character: visible
      }
    })),

  setMarkerSearchQuery: (q) => set({ markerSearchQuery: q }),

  setMarkerOnlyLinked: (v) => set({ markerOnlyLinked: v }),

  resetMarkerFilters: () =>
    set({
      markerTypeVisibility: defaultMarkerTypeVisibility,
      markerSearchQuery: '',
      markerOnlyLinked: false
    }),

  getVisibleMarkersForMap: (mapId) => {
    const s = get();
    const list = s.markersByMapId[mapId] ?? [];

    const q = norm(s.markerSearchQuery);
    const typeVis = s.markerTypeVisibility;

    return list.filter((m) => {
      if (!typeVis[m.marker_type]) return false;

      if (s.markerOnlyLinked) {
        const hasLink = m.link_type === 'note' || m.link_type === 'map';
        if (!hasLink) return false;
      }

      if (!q) return true;

      const hay = `${m.title ?? ''}\n${m.description ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  },

  // --------------------
  // Projects
  // --------------------
  projects: [],
  projectsLoading: false,
  currentProjectId: null,

  loadProjects: async () => {
    set({ projectsLoading: true });
    try {
      const res = await api.get<ProjectDTO[]>('/projects');
      set({ projects: res.data });
    } finally {
      set({ projectsLoading: false });
    }
  },

  createProject: async (input) => {
    const res = await api.post<ProjectDTO>('/projects', input);
    await get().loadProjects();
    return res.data;
  },

  deleteProject: async (projectId) => {
    await api.delete(`/projects/${projectId}`, { params: { deleteFiles: 1 } });
    await get().loadProjects();
    if (get().currentProjectId === projectId) get().setCurrentProjectId(null);
  },


  deleteMap: async (projectId, mapId) => {
    await api.delete(`/maps/${mapId}`);
    await get().loadMaps(projectId);

    // очистим маркеры удалённой карты из кэша
    set((s) => {
      const nextMarkers = { ...s.markersByMapId };
      const nextLoading = { ...s.markersLoadingByMapId };
      delete nextMarkers[mapId];
      delete nextLoading[mapId];
      return { markersByMapId: nextMarkers, markersLoadingByMapId: nextLoading };
    });
  },

  setCurrentProjectId: (id) =>
    set({
      currentProjectId: id,

      // сбрасываем проектные данные, чтобы не было "протечек" между проектами
      maps: [],
      mapsLoading: false,
      currentMapId: null,

      markersByMapId: {},
      markersLoadingByMapId: {},

      notes: [],
      notesLoading: false,
      selectedNoteId: null,
      noteContentById: {},
      noteContentLoadingById: {},

      // и фильтры тоже
      markerTypeVisibility: defaultMarkerTypeVisibility,
      markerSearchQuery: '',
      markerOnlyLinked: false
    }),

  // --------------------
  // Maps
  // --------------------
  maps: [],
  mapsLoading: false,
  currentMapId: null,

  setCurrentMapId: (id) => set({ currentMapId: id }),

  loadMaps: async (projectId) => {
    set({ mapsLoading: true });
    try {
      const res = await api.get<MapDTO[]>(`/projects/${projectId}/maps`);
      set({ maps: res.data });
    } finally {
      set({ mapsLoading: false });
    }
  },

  createNoteSilent: async (projectId, input) => {
    const res = await api.post<NoteDTO>(`/projects/${projectId}/notes`, input);
    await get().loadNotes(projectId);
    return res.data;
  },

  createMap: async (projectId, input) => {
    const form = new FormData();
    form.append('title', input.title);
    if (input.parent_map_id) form.append('parent_map_id', input.parent_map_id);
    form.append('file', input.file);

    const res = await api.post<MapDTO>(`/projects/${projectId}/maps`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    await get().loadMaps(projectId);
    return res.data;
  },

  // --------------------
  // Markers
  // --------------------
  markersByMapId: {},
  markersLoadingByMapId: {},

  loadMarkers: async (mapId) => {
    set((s) => ({ markersLoadingByMapId: { ...s.markersLoadingByMapId, [mapId]: true } }));
    try {
      const res = await api.get<MarkerDTO[]>(`/maps/${mapId}/markers`);
      set((s) => ({ markersByMapId: { ...s.markersByMapId, [mapId]: res.data } }));
    } finally {
      set((s) => ({ markersLoadingByMapId: { ...s.markersLoadingByMapId, [mapId]: false } }));
    }
  },

  createMarker: async (mapId, input) => {
    const res = await api.post<MarkerDTO>(`/maps/${mapId}/markers`, input);
    set((s) => ({
      markersByMapId: {
        ...s.markersByMapId,
        [mapId]: [res.data, ...(s.markersByMapId[mapId] ?? [])]
      }
    }));
    return res.data;
  },

  patchMarker: async (markerId, patch) => {
    const res = await api.patch<MarkerDTO>(`/markers/${markerId}`, patch);

    const updated = res.data;
    const mapId = updated.map_id;

    set((s) => ({
      markersByMapId: {
        ...s.markersByMapId,
        [mapId]: (s.markersByMapId[mapId] ?? []).map((m) => (m.id === markerId ? updated : m))
      }
    }));

    return updated;
  },

  deleteMarker: async (markerId, mapId) => {
    await api.delete(`/markers/${markerId}`);
    set((s) => ({
      markersByMapId: {
        ...s.markersByMapId,
        [mapId]: (s.markersByMapId[mapId] ?? []).filter((m) => m.id !== markerId)
      }
    }));
  },

  // --------------------
  // Notes
  // --------------------
  notes: [],
  notesLoading: false,
  selectedNoteId: null,

  noteContentById: {},
  noteContentLoadingById: {},

  openNote: (noteId) => set({ selectedNoteId: noteId }),

  setNoteDraftContent: (noteId, content) =>
    set((s) => ({ noteContentById: { ...s.noteContentById, [noteId]: content } })),

  loadNotes: async (projectId) => {
    set({ notesLoading: true });
    try {
      const res = await api.get<NoteDTO[]>(`/projects/${projectId}/notes`);
      set({ notes: res.data });
    } finally {
      set({ notesLoading: false });
    }
  },

  createNote: async (projectId, input) => {
    const res = await api.post<NoteDTO>(`/projects/${projectId}/notes`, input);
    await get().loadNotes(projectId);
    set({ selectedNoteId: res.data.id });
    return res.data;
  },

  loadNoteContent: async (noteId) => {
    set((s) => ({ noteContentLoadingById: { ...s.noteContentLoadingById, [noteId]: true } }));
    try {
      const res = await api.get<{ note: NoteDTO; content: string }>(`/notes/${noteId}/content`);
      set((s) => ({
        noteContentById: { ...s.noteContentById, [noteId]: res.data.content }
      }));
    } finally {
      set((s) => ({ noteContentLoadingById: { ...s.noteContentLoadingById, [noteId]: false } }));
    }
  },

  saveNoteContent: async (noteId, content) => {
    await api.put(`/notes/${noteId}/content`, { content });
    set((s) => ({ noteContentById: { ...s.noteContentById, [noteId]: content } }));
  },

  deleteNote: async (noteId, projectId) => {
    await api.delete(`/notes/${noteId}`);
    await get().loadNotes(projectId);

    set((s) => {
      const next = { ...s.noteContentById };
      delete next[noteId];

      const nextLoading = { ...s.noteContentLoadingById };
      delete nextLoading[noteId];

      return {
        selectedNoteId: s.selectedNoteId === noteId ? null : s.selectedNoteId,
        noteContentById: next,
        noteContentLoadingById: nextLoading
      };
    });
  }
}));
