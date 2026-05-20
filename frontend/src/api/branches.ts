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
  response: TauriScenarioBranch
): ApiResult<ScenarioBranch> => {
  return {
    data: {
      success: true,
      data: toBranch(response),
    },
  };
};

const toBranchesResponse = (
  response: TauriScenarioBranch[]
): ApiResult<ScenarioBranch[]> => {
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
    const response = await transport.request<TauriScenarioBranch[]>({
      command: 'branches_list',
      args: { input },
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
    const response = await transport.request<TauriScenarioBranch>({
      command: 'branches_create',
      args: { input },
    });

    return toBranchResponse(response);
  },
  update: async (id: number, data: UpdateScenarioBranch): Promise<ApiResult<ScenarioBranch>> => {
    const input: TauriUpdateBranchInput = {
      id,
      name: data.name ?? null,
    };
    const response = await transport.request<TauriScenarioBranch>({
      command: 'branches_update',
      args: { input },
    });

    return toBranchResponse(response);
  },
  delete: async (id: number): Promise<{ data: void }> => {
    const input: TauriDeleteBranchInput = { id };
    await transport.request<void>({
      command: 'branches_delete',
      args: { input },
    });

    return { data: undefined as void };
  },
};
