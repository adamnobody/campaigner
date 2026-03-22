import axios from 'axios';

const API_BASE_URL = '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      const message = data?.error || data?.message || 'An error occurred';
      console.error(`API Error [${status}]:`, message);

      const enrichedError = new Error(message);
      (enrichedError as any).status = status;
      (enrichedError as any).details = data?.details;
      return Promise.reject(enrichedError);
    }

    if (error.request) {
      console.error('Network Error: No response received');
      return Promise.reject(new Error('Network error. Server may be unavailable.'));
    }

    return Promise.reject(error);
  }
);

// ==================== API методы ====================

export const projectsApi = {
  getAll: () => apiClient.get('/projects'),
  getById: (id: number) => apiClient.get(`/projects/${id}`),
  create: (data: any) => apiClient.post('/projects', data),
  update: (id: number, data: any) => apiClient.put(`/projects/${id}`, data),
  delete: (id: number) => apiClient.delete(`/projects/${id}`),
  uploadMap: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('mapImage', file);
    return apiClient.post(`/projects/${id}/map`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  exportProject: (id: number) =>
    apiClient.get(`/projects/${id}/export`, { responseType: 'blob' }),
  importProject: (data: any) =>
    apiClient.post('/projects/import', data),
};

export const charactersApi = {
  getAll: (projectId: number, params?: any) =>
    apiClient.get('/characters', { params: { projectId, ...params } }),
  getById: (id: number) => apiClient.get(`/characters/${id}`),
  create: (data: any) => apiClient.post('/characters', data),
  update: (id: number, data: any) => apiClient.put(`/characters/${id}`, data),
  delete: (id: number) => apiClient.delete(`/characters/${id}`),
  uploadImage: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('characterImage', file);
    return apiClient.post(`/characters/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  setTags: (id: number, tagIds: number[]) =>
    apiClient.put(`/characters/${id}/tags`, { tagIds }),
  getGraph: (projectId: number) =>
    apiClient.get('/characters/graph', { params: { projectId } }),
  getRelationships: (projectId: number) =>
    apiClient.get('/characters/relationships/list', { params: { projectId } }),
  createRelationship: (data: any) => apiClient.post('/characters/relationships', data),
  updateRelationship: (id: number, data: any) => apiClient.put(`/characters/relationships/${id}`, data),
  deleteRelationship: (id: number) => apiClient.delete(`/characters/relationships/${id}`),
};

export const notesApi = {
  getAll: (projectId: number, params?: any) =>
    apiClient.get('/notes', { params: { projectId, ...params } }),
  getById: (id: number) => apiClient.get(`/notes/${id}`),
  create: (data: any) => apiClient.post('/notes', data),
  update: (id: number, data: any) => apiClient.put(`/notes/${id}`, data),
  delete: (id: number) => apiClient.delete(`/notes/${id}`),
  setTags: (id: number, tagIds: number[]) =>
    apiClient.put(`/notes/${id}/tags`, { tagIds }),
};

export const mapApi = {
  getRootMap: (projectId: number) =>
    apiClient.get(`/projects/${projectId}/maps/root`),
  getMapById: (mapId: number) =>
    apiClient.get(`/maps/${mapId}`),
  getMapTree: (projectId: number) =>
    apiClient.get(`/projects/${projectId}/maps/tree`),
  createMap: (data: any) =>
    apiClient.post('/maps', data),
  updateMap: (mapId: number, data: any) =>
    apiClient.put(`/maps/${mapId}`, data),
  deleteMap: (mapId: number) =>
    apiClient.delete(`/maps/${mapId}`),
  uploadMapImage: (mapId: number, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return apiClient.post(`/maps/${mapId}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getMarkersByMapId: (mapId: number) =>
    apiClient.get(`/maps/${mapId}/markers`),
  createMarker: (mapId: number, data: any) =>
    apiClient.post(`/maps/${mapId}/markers`, data),
  updateMarker: (markerId: number, data: any) =>
    apiClient.put(`/markers/${markerId}`, data),
  deleteMarker: (markerId: number) =>
    apiClient.delete(`/markers/${markerId}`),
};

export const timelineApi = {
  getAll: (projectId: number, era?: string) =>
    apiClient.get('/timeline', { params: { projectId, era } }),
  getById: (id: number) => apiClient.get(`/timeline/${id}`),
  create: (data: any) => apiClient.post('/timeline', data),
  update: (id: number, data: any) => apiClient.put(`/timeline/${id}`, data),
  delete: (id: number) => apiClient.delete(`/timeline/${id}`),
  reorder: (projectId: number, orderedIds: number[]) =>
    apiClient.post('/timeline/reorder', { projectId, orderedIds }),
  setTags: (id: number, tagIds: number[]) =>
    apiClient.put(`/timeline/${id}/tags`, { tagIds }),
};

export const tagsApi = {
  getAll: (projectId: number) =>
    apiClient.get('/tags', { params: { projectId } }),
  create: (data: any) => apiClient.post('/tags', data),
  delete: (id: number) => apiClient.delete(`/tags/${id}`),
};

export const searchApi = {
  search: (projectId: number, query: string) =>
    apiClient.get('/search', { params: { projectId, q: query } }),
};

export const wikiApi = {
  getLinks: (projectId: number, noteId?: number) =>
    apiClient.get('/wiki/links', { params: { projectId, noteId } }),
  createLink: (data: { projectId: number; sourceNoteId: number; targetNoteId: number; label?: string }) =>
    apiClient.post('/wiki/links', data),
  deleteLink: (id: number) => apiClient.delete(`/wiki/links/${id}`),
  getCategories: (projectId: number) =>
    apiClient.get('/wiki/categories', { params: { projectId } }),
};

export const dogmasApi = {
  getAll: (projectId: number, params?: {
    category?: string;
    importance?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) =>
    apiClient.get('/dogmas', { params: { projectId, ...params } }),
  getById: (id: number) => apiClient.get(`/dogmas/${id}`),
  create: (data: any) => apiClient.post('/dogmas', data),
  update: (id: number, data: any) => apiClient.put(`/dogmas/${id}`, data),
  delete: (id: number) => apiClient.delete(`/dogmas/${id}`),
  reorder: (projectId: number, orderedIds: number[]) =>
    apiClient.post('/dogmas/reorder', { projectId, orderedIds }),
  setTags: (id: number, tagIds: number[]) =>
    apiClient.put(`/dogmas/${id}/tags`, { tagIds }),
};

export const factionsApi = {
  getAll: (projectId: number, params?: any) =>
    apiClient.get('/factions', { params: { projectId, ...params } }),
  getById: (id: number) => apiClient.get(`/factions/${id}`),
  create: (data: any) => apiClient.post('/factions', data),
  update: (id: number, data: any) => apiClient.put(`/factions/${id}`, data),
  delete: (id: number) => apiClient.delete(`/factions/${id}`),
  uploadImage: (id: number, file: File) => {
    const fd = new FormData();
    fd.append('image', file);
    return apiClient.post(`/factions/${id}/image`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadBanner: (id: number, file: File) => {
    const fd = new FormData();
    fd.append('banner', file);
    return apiClient.post(`/factions/${id}/banner`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  setTags: (id: number, tagIds: number[]) =>
    apiClient.put(`/factions/${id}/tags`, { tagIds }),
  // Ranks
  getRanks: (factionId: number) => apiClient.get(`/factions/${factionId}/ranks`),
  createRank: (factionId: number, data: any) =>
    apiClient.post(`/factions/${factionId}/ranks`, data),
  updateRank: (factionId: number, rankId: number, data: any) =>
    apiClient.put(`/factions/${factionId}/ranks/${rankId}`, data),
  deleteRank: (factionId: number, rankId: number) =>
    apiClient.delete(`/factions/${factionId}/ranks/${rankId}`),
  // Members
  getMembers: (factionId: number) => apiClient.get(`/factions/${factionId}/members`),
  addMember: (factionId: number, data: any) =>
    apiClient.post(`/factions/${factionId}/members`, data),
  updateMember: (factionId: number, memberId: number, data: any) =>
    apiClient.put(`/factions/${factionId}/members/${memberId}`, data),
  removeMember: (factionId: number, memberId: number) =>
    apiClient.delete(`/factions/${factionId}/members/${memberId}`),
  // Relations
  getRelations: (projectId: number) =>
    apiClient.get('/factions/relations', { params: { projectId } }),
  createRelation: (data: any) => apiClient.post('/factions/relations', data),
  updateRelation: (relationId: number, data: any) =>
    apiClient.put(`/factions/relations/${relationId}`, data),
  deleteRelation: (relationId: number) =>
    apiClient.delete(`/factions/relations/${relationId}`),
  // Graph
  getGraph: (projectId: number) =>
    apiClient.get('/factions/graph', { params: { projectId } }),
};