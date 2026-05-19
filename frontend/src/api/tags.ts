import type { ApiResponse, Tag } from '@campaigner/shared';
import type {
  CreateTagInput as TauriCreateTagInput,
  DeleteTagInput as TauriDeleteTagInput,
  Tag as TauriTag,
  TagsListInput,
} from '@/types/generated/bindings';
import { transport } from './transport';
import type { CreateTagRequest } from './types';

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

const toTagResponse = (response: ApiResponse<Tag> | TauriTag): ApiResult<Tag> => {
  if (isApiResponse<Tag>(response)) {
    return { data: response };
  }

  return {
    data: {
      success: true,
      data: toTag(response),
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

export const tagsApi = {
  getAll: async (projectId: number): Promise<ApiResult<Tag[]>> => {
    const response = await transport.request<ApiResponse<Tag[]> | TauriTag[], TagsListInput>({
      http: {
        method: 'GET',
        path: '/tags',
        query: { projectId },
      },
      tauri: {
        command: 'tags_list',
        args: { input: { projectId } },
      },
    });

    return toTagsResponse(response);
  },

  create: async (data: CreateTagRequest): Promise<ApiResult<Tag>> => {
    const input: TauriCreateTagInput = {
      projectId: data.projectId,
      name: data.name,
      color: data.color ?? null,
    };

    const response = await transport.request<ApiResponse<Tag> | TauriTag, CreateTagRequest>({
      http: {
        method: 'POST',
        path: '/tags',
        body: data,
      },
      tauri: {
        command: 'tags_create',
        args: { input },
      },
    });

    return toTagResponse(response);
  },

  delete: async (id: number): Promise<{ data: void }> => {
    const input: TauriDeleteTagInput = { id };

    await transport.request<void, TauriDeleteTagInput>({
      http: {
        method: 'DELETE',
        path: `/tags/${id}`,
      },
      tauri: {
        command: 'tags_delete',
        args: { input },
      },
    });

    return { data: undefined as void };
  },
};
