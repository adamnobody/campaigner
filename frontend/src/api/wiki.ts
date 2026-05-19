import type { ApiResponse } from '@campaigner/shared';
import type { WikiLink, CreateWikiLink } from '@campaigner/shared';
import type {
  CreateWikiLinkInput as TauriCreateWikiLinkInput,
  DeleteWikiLinkInput as TauriDeleteWikiLinkInput,
  ListWikiCategoriesInput as TauriListWikiCategoriesInput,
  ListWikiLinksInput as TauriListWikiLinksInput,
  WikiCategory as TauriWikiCategory,
  WikiLink as TauriWikiLink,
} from '@/types/generated/bindings';
import type { VoidResponse } from './client';
import { transport } from './transport';
import { withBranchParams } from './withBranchParams';

type ApiResult<T> = {
  data: ApiResponse<T>;
};

const isApiResponse = <T>(value: unknown): value is ApiResponse<T> =>
  Boolean(value && typeof value === 'object' && 'success' in value);

const toWikiLink = (link: TauriWikiLink): WikiLink => ({
  id: link.id,
  projectId: link.projectId,
  sourceNoteId: link.sourceNoteId,
  targetNoteId: link.targetNoteId,
  label: link.label,
  createdAt: link.createdAt,
  sourceTitle: link.sourceTitle ?? undefined,
  targetTitle: link.targetTitle ?? undefined,
});

const toWikiLinkListResponse = (
  response: ApiResponse<WikiLink[]> | TauriWikiLink[],
): ApiResult<WikiLink[]> => {
  if (isApiResponse<WikiLink[]>(response)) {
    return { data: response };
  }
  return {
    data: {
      success: true,
      data: response.map(toWikiLink),
    },
  };
};

const toWikiLinkResponse = (response: ApiResponse<WikiLink> | TauriWikiLink): ApiResult<WikiLink> => {
  if (isApiResponse<WikiLink>(response)) {
    return { data: response };
  }
  return {
    data: {
      success: true,
      data: toWikiLink(response),
    },
  };
};

const toCategoriesResponse = (
  response: ApiResponse<{ name: string; count: number }[]> | TauriWikiCategory[],
): ApiResult<{ name: string; count: number }[]> => {
  if (isApiResponse<{ name: string; count: number }[]>(response)) {
    return { data: response };
  }
  return {
    data: {
      success: true,
      data: response.map((category) => ({
        name: category.name,
        count: category.count,
      })),
    },
  };
};

export const wikiApi = {
  getLinks: async (projectId: number, noteId?: number): Promise<ApiResult<WikiLink[]>> => {
    const query = withBranchParams({
      projectId,
      ...(noteId != null ? { noteId } : {}),
    });
    const input: TauriListWikiLinksInput = {
      projectId: query.projectId,
      noteId: query.noteId ?? null,
      branchId: query.branchId ?? null,
    };

    const response = await transport.request<ApiResponse<WikiLink[]> | TauriWikiLink[]>({
      http: {
        method: 'GET',
        path: '/wiki/links',
        query,
      },
      tauri: {
        command: 'wiki_links_list',
        args: { input },
      },
    });

    return toWikiLinkListResponse(response);
  },

  createLink: async (data: CreateWikiLink): Promise<ApiResult<WikiLink>> => {
    const payload = withBranchParams({ ...data });
    const input: TauriCreateWikiLinkInput = {
      projectId: payload.projectId,
      sourceNoteId: payload.sourceNoteId,
      targetNoteId: payload.targetNoteId,
      label: payload.label ?? null,
      branchId: payload.branchId ?? null,
    };

    const response = await transport.request<ApiResponse<WikiLink> | TauriWikiLink>({
      http: {
        method: 'POST',
        path: '/wiki/links',
        body: payload,
      },
      tauri: {
        command: 'wiki_links_create',
        args: { input },
      },
    });

    return toWikiLinkResponse(response);
  },

  deleteLink: async (id: number, projectId: number): Promise<{ data: VoidResponse }> => {
    const query = withBranchParams({}, projectId);
    const input: TauriDeleteWikiLinkInput = { id };

    await transport.request<void>({
      http: {
        method: 'DELETE',
        path: `/wiki/links/${id}`,
        query,
      },
      tauri: {
        command: 'wiki_links_delete',
        args: { input },
      },
    });

    return { data: { success: true } as VoidResponse };
  },

  getCategories: async (
    projectId: number,
  ): Promise<ApiResult<{ name: string; count: number }[]>> => {
    const query = withBranchParams({ projectId });
    const input: TauriListWikiCategoriesInput = {
      projectId: query.projectId,
      branchId: query.branchId ?? null,
    };

    const response = await transport.request<
      ApiResponse<{ name: string; count: number }[]> | TauriWikiCategory[]
    >({
      http: {
        method: 'GET',
        path: '/wiki/categories',
        query,
      },
      tauri: {
        command: 'wiki_categories_list',
        args: { input },
      },
    });

    return toCategoriesResponse(response);
  },
};
