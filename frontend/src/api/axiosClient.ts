import axios from 'axios';

const API_BASE_URL = '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Interceptor для обработки ошибок
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      const message = data?.error || data?.message || 'An error occurred';
      console.error(`API Error [${status}]:`, message);

      // Создаём ошибку с более полезной информацией
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

// Projects
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
};

// Characters
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

// Notes
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

// Map markers
export const mapApi = {
  getMarkers: (projectId: number) =>
    apiClient.get('/maps', { params: { projectId } }),
  getById: (id: number) => apiClient.get(`/maps/${id}`),
  create: (data: any) => apiClient.post('/maps', data),
  update: (id: number, data: any) => apiClient.put(`/maps/${id}`, data),
  delete: (id: number) => apiClient.delete(`/maps/${id}`),
};

// Timeline
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

// Folders
export const foldersApi = {
  getAll: (projectId: number) =>
    apiClient.get('/folders', { params: { projectId } }),
  getTree: (projectId: number) =>
    apiClient.get('/folders/tree', { params: { projectId } }),
  create: (data: any) => apiClient.post('/folders', data),
  update: (id: number, name: string) => apiClient.put(`/folders/${id}`, { name }),
  delete: (id: number) => apiClient.delete(`/folders/${id}`),
};

// Tags
export const tagsApi = {
  getAll: (projectId: number) =>
    apiClient.get('/tags', { params: { projectId } }),
  create: (data: any) => apiClient.post('/tags', data),
  delete: (id: number) => apiClient.delete(`/tags/${id}`),
};