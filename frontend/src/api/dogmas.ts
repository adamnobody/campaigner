import type { ApiResponse, Dogma, CreateDogma, UpdateDogma, Tag } from '@campaigner/shared';
import type {
  CreateDogmaInput as TauriCreateDogmaInput,
  DeleteDogmaInput as TauriDeleteDogmaInput,
  Dogma as TauriDogma,
  DogmasListInput as TauriDogmasListInput,
  DogmasListResult as TauriDogmasListResult,
  GetDogmaInput as TauriGetDogmaInput,
  ReorderDogmasInput as TauriReorderDogmasInput,
  SetDogmaTagsInput as TauriSetDogmaTagsInput,
  Tag as TauriTag,
  UpdateDogmaInput as TauriUpdateDogmaInput,
} from '@/types/generated/bindings';
import { transport } from './transport';
import type { DogmaListParams } from './types';
import { withBranchParams } from './withBranchParams';

type ApiResult<T> = {
  data: ApiResponse<T>;
};

const isApiResponse = <T>(value: unknown): value is ApiResponse<T> =>
  Boolean(value && typeof value === 'object' && 'success' in value);

const toTag = (tag: TauriTag): Tag => ({
  id: tag.id,
  name: tag.name,
  color: tag.color,
});

const toDogma = (dogma: TauriDogma): Dogma => ({
  id: dogma.id,
  projectId: dogma.projectId,
  title: dogma.title,
  category: dogma.category as Dogma['category'],
  description: dogma.description,
  impact: dogma.impact,
  exceptions: dogma.exceptions,
  isPublic: dogma.isPublic,
  importance: dogma.importance as Dogma['importance'],
  status: dogma.status as Dogma['status'],
  sortOrder: dogma.sortOrder,
  icon: dogma.icon,
  color: dogma.color,
  tags: dogma.tags.map(toTag),
  createdAt: dogma.createdAt,
  updatedAt: dogma.updatedAt,
});

const toDogmaResponse = (response: ApiResponse<Dogma> | TauriDogma): ApiResult<Dogma> => {
  if (isApiResponse<Dogma>(response)) {
    return { data: response };
  }

  return {
    data: {
      success: true,
      data: toDogma(response),
    },
  };
};

const toDogmasListResponse = (
  response: ApiResponse<{ items: Dogma[]; total: number }> | TauriDogmasListResult
): ApiResult<{ items: Dogma[]; total: number }> => {
  if (isApiResponse<{ items: Dogma[]; total: number }>(response)) {
    return { data: response };
  }

  return {
    data: {
      success: true,
      data: {
        items: response.items.map(toDogma),
        total: response.total,
      },
    },
  };
};

const toTagsResponse = (response: ApiResponse<Tag[]> | TauriTag[]): ApiResult<Tag[]> => {
  if (isApiResponse<Tag[]>(response)) {
    return { data: response };
  }

  return {
    data: {
      success: true,
      data: response.map(toTag),
    },
  };
};

export const dogmasApi = {
  getAll: async (
    projectId: number,
    params?: DogmaListParams
  ): Promise<ApiResult<{ items: Dogma[]; total: number }>> => {
    const query = withBranchParams({ projectId, ...(params ?? {}) });
    const input: TauriDogmasListInput = {
      projectId: query.projectId,
      category: query.category ?? null,
      importance: query.importance ?? null,
      status: query.status ?? null,
      search: query.search ?? null,
      limit: query.limit ?? null,
      offset: query.offset ?? null,
      branchId: query.branchId ?? null,
    };

    const response = await transport.request<
      ApiResponse<{ items: Dogma[]; total: number }> | TauriDogmasListResult
    >({
      http: {
        method: 'GET',
        path: '/dogmas',
        query,
      },
      tauri: {
        command: 'dogmas_list',
        args: { input },
      },
    });

    return toDogmasListResponse(response);
  },
  getById: async (id: number, projectId?: number): Promise<ApiResult<Dogma>> => {
    const query = withBranchParams({}, projectId);
    const input: TauriGetDogmaInput = {
      id,
      branchId: query.branchId ?? null,
    };

    const response = await transport.request<ApiResponse<Dogma> | TauriDogma>({
      http: {
        method: 'GET',
        path: `/dogmas/${id}`,
        query,
      },
      tauri: {
        command: 'dogmas_get',
        args: { input },
      },
    });

    return toDogmaResponse(response);
  },
  create: async (data: CreateDogma): Promise<ApiResult<Dogma>> => {
    const payload = withBranchParams({ ...data });
    const input: TauriCreateDogmaInput = {
      projectId: payload.projectId,
      title: payload.title,
      category: payload.category,
      description: payload.description ?? null,
      impact: payload.impact ?? null,
      exceptions: payload.exceptions ?? null,
      isPublic: payload.isPublic ?? null,
      importance: payload.importance ?? null,
      status: payload.status ?? null,
      sortOrder: payload.sortOrder ?? null,
      icon: payload.icon ?? null,
      color: payload.color ?? null,
      branchId: payload.branchId ?? null,
    };

    const response = await transport.request<ApiResponse<Dogma> | TauriDogma>({
      http: {
        method: 'POST',
        path: '/dogmas',
        body: payload,
      },
      tauri: {
        command: 'dogmas_create',
        args: { input },
      },
    });

    return toDogmaResponse(response);
  },
  update: async (id: number, data: UpdateDogma, projectId?: number): Promise<ApiResult<Dogma>> => {
    const payload = withBranchParams({ ...data }, projectId);
    const input: TauriUpdateDogmaInput = {
      id,
      title: payload.title ?? null,
      category: payload.category ?? null,
      description: payload.description ?? null,
      impact: payload.impact ?? null,
      exceptions: payload.exceptions ?? null,
      isPublic: payload.isPublic ?? null,
      importance: payload.importance ?? null,
      status: payload.status ?? null,
      sortOrder: payload.sortOrder ?? null,
      icon: payload.icon ?? null,
      color: payload.color ?? null,
      branchId: payload.branchId ?? null,
    };

    const response = await transport.request<ApiResponse<Dogma> | TauriDogma>({
      http: {
        method: 'PUT',
        path: `/dogmas/${id}`,
        body: payload,
      },
      tauri: {
        command: 'dogmas_update',
        args: { input },
      },
    });

    return toDogmaResponse(response);
  },
  delete: async (id: number, projectId?: number): Promise<{ data: void }> => {
    const query = withBranchParams({}, projectId);
    const input: TauriDeleteDogmaInput = {
      id,
      branchId: query.branchId ?? null,
    };

    await transport.request<void>({
      http: {
        method: 'DELETE',
        path: `/dogmas/${id}`,
        query,
      },
      tauri: {
        command: 'dogmas_delete',
        args: { input },
      },
    });

    return { data: undefined as void };
  },
  reorder: async (
    projectId: number,
    orderedIds: number[]
  ): Promise<ApiResult<{ items: Dogma[]; total: number }>> => {
    const payload = withBranchParams({ projectId, orderedIds });
    const input: TauriReorderDogmasInput = {
      projectId: payload.projectId,
      orderedIds: payload.orderedIds,
      branchId: payload.branchId ?? null,
    };

    const response = await transport.request<
      ApiResponse<{ items: Dogma[]; total: number }> | TauriDogmasListResult
    >({
      http: {
        method: 'POST',
        path: '/dogmas/reorder',
        body: payload,
      },
      tauri: {
        command: 'dogmas_reorder',
        args: { input },
      },
    });

    return toDogmasListResponse(response);
  },
  setTags: async (id: number, tagIds: number[], projectId?: number): Promise<ApiResult<Tag[]>> => {
    const query = withBranchParams({}, projectId);
    const input: TauriSetDogmaTagsInput = {
      id,
      tagIds,
      branchId: query.branchId ?? null,
    };

    const response = await transport.request<ApiResponse<Tag[]> | TauriTag[]>({
      http: {
        method: 'PUT',
        path: `/dogmas/${id}/tags`,
        body: { tagIds },
        query,
      },
      tauri: {
        command: 'dogmas_set_tags',
        args: { input },
      },
    });

    return toTagsResponse(response);
  },
};
