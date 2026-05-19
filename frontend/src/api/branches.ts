import type {
  ApiResponse,
  ScenarioBranch,
  CreateScenarioBranch,
  UpdateScenarioBranch,
} from '@campaigner/shared';
import type {
  CreateBranchInput as TauriCreateBranchInput,
  DeleteBranchInput as TauriDeleteBranchInput,
  ListBranchesInput as TauriListBranchesInput,
  ScenarioBranch as TauriScenarioBranch,
  UpdateBranchInput as TauriUpdateBranchInput,
} from '@/types/generated/bindings';
import { transport } from './transport';

type ApiResult<T> = {
  data: ApiResponse<T>;
};

const isApiResponse = <T>(value: unknown): value is ApiResponse<T> =>
  Boolean(value && typeof value === 'object' && 'success' in value);

const toBranch = (branch: TauriScenarioBranch): ScenarioBranch => ({
  id: branch.id,
  projectId: branch.projectId,
  name: branch.name,
  parentBranchId: branch.parentBranchId ?? null,
  baseRevision: branch.baseRevision,
  isMain: branch.isMain,
  createdAt: branch.createdAt,
  updatedAt: branch.updatedAt,
});

const toBranchResponse = (
  response: ApiResponse<ScenarioBranch> | TauriScenarioBranch
): ApiResult<ScenarioBranch> => {
  if (isApiResponse<ScenarioBranch>(response)) {
    return { data: response };
  }

  return {
    data: {
      success: true,
      data: toBranch(response),
    },
  };
};

const toBranchesResponse = (
  response: ApiResponse<ScenarioBranch[]> | TauriScenarioBranch[]
): ApiResult<ScenarioBranch[]> => {
  if (isApiResponse<ScenarioBranch[]>(response)) {
    return { data: response };
  }

  return {
    data: {
      success: true,
      data: response.map(toBranch),
    },
  };
};

export const branchesApi = {
  getAll: async (projectId: number): Promise<ApiResult<ScenarioBranch[]>> => {
    const input: TauriListBranchesInput = { projectId };
    const response = await transport.request<ApiResponse<ScenarioBranch[]> | TauriScenarioBranch[]>({
      http: {
        method: 'GET',
        path: '/branches',
        query: { projectId },
      },
      tauri: {
        command: 'branches_list',
        args: { input },
      },
    });

    return toBranchesResponse(response);
  },
  create: async (data: CreateScenarioBranch): Promise<ApiResult<ScenarioBranch>> => {
    const input: TauriCreateBranchInput = {
      projectId: data.projectId,
      name: data.name,
      parentBranchId: data.parentBranchId ?? null,
      baseRevision: data.baseRevision ?? null,
    };
    const response = await transport.request<ApiResponse<ScenarioBranch> | TauriScenarioBranch>({
      http: {
        method: 'POST',
        path: '/branches',
        body: data,
      },
      tauri: {
        command: 'branches_create',
        args: { input },
      },
    });

    return toBranchResponse(response);
  },
  update: async (id: number, data: UpdateScenarioBranch): Promise<ApiResult<ScenarioBranch>> => {
    const input: TauriUpdateBranchInput = {
      id,
      name: data.name ?? null,
    };
    const response = await transport.request<ApiResponse<ScenarioBranch> | TauriScenarioBranch>({
      http: {
        method: 'PUT',
        path: `/branches/${id}`,
        body: data,
      },
      tauri: {
        command: 'branches_update',
        args: { input },
      },
    });

    return toBranchResponse(response);
  },
  delete: async (id: number): Promise<{ data: void }> => {
    const input: TauriDeleteBranchInput = { id };
    await transport.request<void>({
      http: {
        method: 'DELETE',
        path: `/branches/${id}`,
      },
      tauri: {
        command: 'branches_delete',
        args: { input },
      },
    });

    return { data: undefined as void };
  },
};
