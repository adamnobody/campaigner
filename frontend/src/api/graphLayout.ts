import type { ApiResponse, GraphLayoutDataV1 } from '@campaigner/shared';
import type {
  DeleteGraphLayoutInput as TauriDeleteGraphLayoutInput,
  GetGraphLayoutInput as TauriGetGraphLayoutInput,
  GraphLayoutDataV1 as TauriGraphLayoutDataV1,
  GraphLayoutDataV1_Serialize as TauriGraphLayoutDataV1Serialize,
  GraphLayoutNodeState as TauriGraphLayoutNodeState,
  GraphLayoutResponse as TauriGraphLayoutResponse,
  GraphLayoutViewport as TauriGraphLayoutViewport,
  UpsertGraphLayoutInput_Serialize as TauriUpsertGraphLayoutInput,
} from '@/types/generated/bindings';
import { transport } from './transport';

type ApiResult<T> = {
  data: ApiResponse<T>;
};

const isApiResponse = <T>(value: unknown): value is ApiResponse<T> =>
  Boolean(value && typeof value === 'object' && 'success' in value);

const toViewport = (viewport: TauriGraphLayoutViewport) => ({
  x: viewport.x ?? 0,
  y: viewport.y ?? 0,
  zoom: viewport.zoom ?? 1,
});

const toNodeState = (node: TauriGraphLayoutNodeState) => ({
  x: node.x ?? 0,
  y: node.y ?? 0,
  pinned: node.pinned ?? undefined,
});

const toGraphLayoutData = (layout: TauriGraphLayoutDataV1): GraphLayoutDataV1 => ({
  version: 1,
  viewport: layout.viewport ? toViewport(layout.viewport) : undefined,
  nodes: Object.fromEntries(
    Object.entries(layout.nodes ?? {}).map(([id, node]) => [id, toNodeState(node)]),
  ),
});

const toGraphLayoutResponse = (
  response: ApiResponse<{ layoutData: GraphLayoutDataV1 }> | TauriGraphLayoutResponse,
): ApiResult<{ layoutData: GraphLayoutDataV1 }> => {
  if (isApiResponse<{ layoutData: GraphLayoutDataV1 }>(response)) {
    return { data: response };
  }

  return {
    data: {
      success: true,
      data: {
        layoutData: toGraphLayoutData(response.layoutData),
      },
    },
  };
};

const toTauriLayoutData = (layout: GraphLayoutDataV1): TauriGraphLayoutDataV1Serialize => ({
  version: layout.version,
  viewport: layout.viewport
    ? {
        x: layout.viewport.x,
        y: layout.viewport.y,
        zoom: layout.viewport.zoom,
      }
    : null,
  nodes: Object.fromEntries(
    Object.entries(layout.nodes).map(([id, node]) => [
      id,
      {
        x: node.x,
        y: node.y,
        pinned: node.pinned ?? null,
      },
    ]),
  ),
});

export const graphLayoutApi = {
  get: async (
    projectId: number,
    params: { graphType: string; branchId?: number },
  ): Promise<ApiResult<{ layoutData: GraphLayoutDataV1 }>> => {
    const input: TauriGetGraphLayoutInput = {
      projectId,
      graphType: params.graphType,
      branchId: params.branchId ?? null,
    };

    const response = await transport.request<
      ApiResponse<{ layoutData: GraphLayoutDataV1 }> | TauriGraphLayoutResponse
    >({
      http: {
        method: 'GET',
        path: `/projects/${projectId}/graph-layout`,
        query: params,
      },
      tauri: {
        command: 'graph_layout_get',
        args: { input },
      },
    });

    return toGraphLayoutResponse(response);
  },

  put: async (
    projectId: number,
    body: { graphType: string; layoutData: GraphLayoutDataV1; branchId?: number },
  ): Promise<ApiResult<{ layoutData: GraphLayoutDataV1 }>> => {
    const input: TauriUpsertGraphLayoutInput = {
      projectId,
      graphType: body.graphType,
      layoutData: toTauriLayoutData(body.layoutData),
      branchId: body.branchId ?? null,
    };

    const response = await transport.request<
      ApiResponse<{ layoutData: GraphLayoutDataV1 }> | TauriGraphLayoutResponse
    >({
      http: {
        method: 'PUT',
        path: `/projects/${projectId}/graph-layout`,
        body,
      },
      tauri: {
        command: 'graph_layout_upsert',
        args: { input },
      },
    });

    return toGraphLayoutResponse(response);
  },

  delete: async (
    projectId: number,
    params: { graphType: string; branchId?: number },
  ): Promise<{ data: void }> => {
    const input: TauriDeleteGraphLayoutInput = {
      projectId,
      graphType: params.graphType,
      branchId: params.branchId ?? null,
    };

    await transport.request<void>({
      http: {
        method: 'DELETE',
        path: `/projects/${projectId}/graph-layout`,
        query: params,
      },
      tauri: {
        command: 'graph_layout_delete',
        args: { input },
      },
    });

    return { data: undefined as void };
  },
};
