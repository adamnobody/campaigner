import type { ApiResponse, SearchResult } from '@campaigner/shared';
import type {
  SearchQueryInput as TauriSearchQueryInput,
  SearchResult as TauriSearchResult,
} from '@/types/generated/bindings';
import { transport } from './transport';
import { withBranchParams } from './withBranchParams';

type ApiResult<T> = {
  data: ApiResponse<T>;
};

const toSearchResult = (result: TauriSearchResult): SearchResult => ({
  type: result.type,
  id: result.id,
  title: result.title,
  subtitle: result.subtitle,
  icon: result.icon,
  url: result.url,
});

const toSearchResponse = (
  response: TauriSearchResult[],
): ApiResult<SearchResult[]> => {
  return {
    data: {
      success: true,
      data: response.map(toSearchResult),
    },
  };
};

export type SearchOptions = {
  limit?: number;
  branchId?: number;
};

export const searchApi = {
  search: async (projectId: number, query: string, options?: SearchOptions) => {
    const trimmed = query.trim();
    if (!projectId || !trimmed) {
      return {
        data: {
          success: true,
          data: [] as SearchResult[],
        },
      } satisfies ApiResult<SearchResult[]>;
    }

    const params = withBranchParams(
      {
        projectId,
        q: trimmed,
        ...(options?.limit !== undefined ? { limit: options.limit } : {}),
        ...(options?.branchId !== undefined ? { branchId: options.branchId } : {}),
      },
      projectId,
    );

    const input: TauriSearchQueryInput = {
      projectId,
      q: trimmed,
      branchId: params.branchId ?? null,
      limit: options?.limit ?? null,
    };

    const response = await transport.request<TauriSearchResult[]>({
      command: 'search_query',
      args: { input },
    });

    return toSearchResponse(response);
  },
};
