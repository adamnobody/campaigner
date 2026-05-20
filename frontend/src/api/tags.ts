import type { ApiResponse, Tag } from '@campaigner/shared';
import type {
  CreateTagInput as TauriCreateTagInput,
  DeleteTagInput as TauriDeleteTagInput,
  Tag as TauriTag,
} from '@/types/generated/bindings';
import { transport } from './transport';
import type { CreateTagRequest } from './types';

type ApiResult<T> = {
  data: ApiResponse<T>;
};

const toTag = (tag: TauriTag): Tag => ({
  id: tag.id,
  name: tag.name,
  color: tag.color,
});

const toTagResponse = (response: TauriTag): ApiResult<Tag> => {
  return {
    data: {
      success: true,
      data: toTag(response),
    },
  };
};

const toTagsResponse = (response: TauriTag[]): ApiResult<Tag[]> => {
  return {
    data: {
      success: true,
      data: response.map(toTag),
    },
  };
};

export const tagsApi = {
  getAll: async (projectId: number): Promise<ApiResult<Tag[]>> => {
    const response = await transport.request<TauriTag[]>({
      command: 'tags_list',
      args: { input: { projectId } },
    });

    return toTagsResponse(response);
  },

  create: async (data: CreateTagRequest): Promise<ApiResult<Tag>> => {
    const input: TauriCreateTagInput = {
      projectId: data.projectId,
      name: data.name,
      color: data.color ?? null,
    };

    const response = await transport.request<TauriTag>({
      command: 'tags_create',
      args: { input },
    });

    return toTagResponse(response);
  },

  delete: async (id: number): Promise<{ data: void }> => {
    const input: TauriDeleteTagInput = { id };

    await transport.request<void>({
      command: 'tags_delete',
      args: { input },
    });

    return { data: undefined as void };
  },
};
