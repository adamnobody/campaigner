import type {
  ApiResponse,
  Project,
  CreateProject,
  UpdateProject,
  ImportedProjectPayload,
} from '@campaigner/shared';
import type { AppLanguage } from '@/i18n/types';
import type {
  CreateProjectInput,
  DeleteProjectInput,
  GetProjectInput,
  Project as TauriProject,
  UpdateProjectInput,
} from '@/types/generated/bindings';
import { transport } from './transport';
import { uploadFileViaTransport } from './uploadFile';
import { apiClient } from './client';

type ApiResult<T> = {
  data: ApiResponse<T>;
};

const isApiResponse = <T>(value: unknown): value is ApiResponse<T> =>
  Boolean(value && typeof value === 'object' && 'success' in value);

const normalizeProjectStatus = (status: string): Project['status'] =>
  status === 'archived' ? 'archived' : 'active';

const toProject = (project: TauriProject): Project => ({
  id: project.id,
  name: project.name,
  description: project.description,
  status: normalizeProjectStatus(project.status),
  mapImagePath: project.mapImagePath ?? null,
  createdAt: project.createdAt,
  updatedAt: project.updatedAt,
});

const toProjectResponse = (response: ApiResponse<Project> | TauriProject): ApiResult<Project> => {
  if (isApiResponse<Project>(response)) {
    return { data: response };
  }

  return {
    data: {
      success: true,
      data: toProject(response),
    },
  };
};

const toProjectsResponse = (
  response: ApiResponse<Project[]> | TauriProject[]
): ApiResult<Project[]> => {
  if (isApiResponse<Project[]>(response)) {
    return { data: response };
  }

  return {
    data: {
      success: true,
      data: response.map(toProject),
    },
  };
};

export const projectsApi = {
  getAll: async (): Promise<ApiResult<Project[]>> => {
    const response = await transport.request<ApiResponse<Project[]> | TauriProject[]>({
      http: {
        method: 'GET',
        path: '/projects',
      },
      tauri: {
        command: 'projects_list',
      },
    });

    return toProjectsResponse(response);
  },

  getById: async (id: number): Promise<ApiResult<Project>> => {
    const input: GetProjectInput = { id };

    const response = await transport.request<ApiResponse<Project> | TauriProject, GetProjectInput>({
      http: {
        method: 'GET',
        path: `/projects/${id}`,
      },
      tauri: {
        command: 'projects_get',
        args: { input },
      },
    });

    return toProjectResponse(response);
  },

  create: async (data: CreateProject): Promise<ApiResult<Project>> => {
    const input: CreateProjectInput = {
      name: data.name,
      description: data.description ?? null,
      status: data.status ?? null,
      mainBranchName: data.mainBranchName ?? null,
    };

    const response = await transport.request<ApiResponse<Project> | TauriProject, CreateProject>({
      http: {
        method: 'POST',
        path: '/projects',
        body: data,
      },
      tauri: {
        command: 'projects_create',
        args: { input },
      },
    });

    return toProjectResponse(response);
  },

  update: async (id: number, data: UpdateProject): Promise<ApiResult<Project>> => {
    const input: UpdateProjectInput = {
      id,
      name: data.name ?? null,
      description: data.description ?? null,
      status: data.status ?? null,
      mapImagePath: data.mapImagePath ?? null,
    };

    const response = await transport.request<ApiResponse<Project> | TauriProject, UpdateProject>({
      http: {
        method: 'PUT',
        path: `/projects/${id}`,
        body: data,
      },
      tauri: {
        command: 'projects_update',
        args: { input },
      },
    });

    return toProjectResponse(response);
  },

  delete: async (id: number): Promise<{ data: void }> => {
    const input: DeleteProjectInput = { id };

    await transport.request<void, DeleteProjectInput>({
      http: {
        method: 'DELETE',
        path: `/projects/${id}`,
      },
      tauri: {
        command: 'projects_delete',
        args: { input },
      },
    });

    return { data: undefined as void };
  },

  uploadMap: async (id: number, file: File) => {
    if (import.meta.env.VITE_TRANSPORT === 'tauri') {
      const response = await uploadFileViaTransport<TauriProject>('projects_upload_map_image', file, {
        projectId: id,
      });
      return toProjectResponse(response);
    }

    const formData = new FormData();
    formData.append('mapImage', file);
    const response = await apiClient.post<ApiResponse<Project>>(`/projects/${id}/map`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { data: response.data };
  },
  exportProject: (id: number) => apiClient.get<Blob>(`/projects/${id}/export`, { responseType: 'blob' }),
  importProject: (data: ImportedProjectPayload, opts?: { locale?: AppLanguage }) =>
    apiClient.post<ApiResponse<Project>>('/projects/import', {
      ...data,
      ...(opts?.locale ? { importLocale: opts.locale } : {}),
    }),
  createDemoProject: (body?: { locale?: AppLanguage }) =>
    apiClient.post<ApiResponse<Project>>('/projects/demo', body ?? {}),
};
