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
import type { VoidResponse } from './types';
import { transport } from './transport';
import { withBranchParams } from './withBranchParams';

type ApiResult<T> = {
  data: ApiResponse<T>;
};

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
  response: TauriWikiLink[],
): ApiResult<WikiLink[]> => {
  return {
    data: {
      success: true,
      data: response.map(toWikiLink),
    },
  };
};

const toWikiLinkResponse = (response: TauriWikiLink): ApiResult<WikiLink> => {
  return {
    data: {
      success: true,
      data: toWikiLink(response),
    },
  };
};

const toCategoriesResponse = (
  response: TauriWikiCategory[],
): ApiResult<{ name: string; count: number }[]> => {
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

    const response = await transport.request<TauriWikiLink[]>({
      command: 'wiki_links_list',
      args: { input },
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

    const response = await transport.request<TauriWikiLink>({
      command: 'wiki_links_create',
      args: { input },
    });

    return toWikiLinkResponse(response);
  },

  deleteLink: async (id: number, projectId: number): Promise<{ data: VoidResponse }> => {
    const input: TauriDeleteWikiLinkInput = { id };

    await transport.request<void>({
      command: 'wiki_links_delete',
      args: { input },
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

    const response = await transport.request<TauriWikiCategory[]>({
      command: 'wiki_categories_list',
      args: { input },
    });

    return toCategoriesResponse(response);
  },
};
