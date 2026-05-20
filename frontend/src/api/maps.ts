import type {
  ApiResponse,
  Map,
  CreateMap,
  UpdateMap,
  MapMarker,
  CreateMarker,
  UpdateMarker,
  MapTerritory,
  MapTerritorySummary,
  CreateTerritory,
  UpdateTerritory,
} from '@campaigner/shared';
import type {
  CreateMapInput as TauriCreateMapInput,
  CreateMapMarkerInput as TauriCreateMapMarkerInput,
  CreateMapTerritoryInput as TauriCreateMapTerritoryInput,
  DeleteMapInput as TauriDeleteMapInput,
  DeleteMapMarkerInput as TauriDeleteMapMarkerInput,
  DeleteMapTerritoryInput as TauriDeleteMapTerritoryInput,
  GetMapInput as TauriGetMapInput,
  GetMapTreeInput as TauriGetMapTreeInput,
  GetRootMapInput as TauriGetRootMapInput,
  ListMapMarkersInput as TauriListMapMarkersInput,
  ListMapTerritoriesInput as TauriListMapTerritoriesInput,
  ListTerritorySummariesInput as TauriListTerritorySummariesInput,
  MapMarker as TauriMapMarker,
  MapRecord as TauriMapRecord,
  MapTerritory as TauriMapTerritory,
  MapTerritoryPoint as TauriMapTerritoryPoint,
  MapTerritorySummary as TauriMapTerritorySummary,
  UpdateMapInput as TauriUpdateMapInput,
  UpdateMapMarkerInput as TauriUpdateMapMarkerInput,
  UpdateMapTerritoryInput as TauriUpdateMapTerritoryInput,
} from '@/types/generated/bindings';
import type { VoidResponse } from './types';
import { transport } from './transport';
import { uploadFileViaTransport } from './uploadFile';
import { withBranchParams } from './withBranchParams';

type ApiResult<T> = {
  data: ApiResponse<T>;
};

const toMap = (map: TauriMapRecord): Map => ({
  id: map.id,
  projectId: map.projectId,
  parentMapId: map.parentMapId ?? undefined,
  parentMarkerId: map.parentMarkerId ?? undefined,
  name: map.name,
  imagePath: map.imagePath ?? undefined,
  createdAt: map.createdAt,
  updatedAt: map.updatedAt,
});

const toMarker = (marker: TauriMapMarker): MapMarker => ({
  id: marker.id,
  mapId: marker.mapId,
  title: marker.title,
  description: marker.description,
  positionX: marker.positionX ?? 0,
  positionY: marker.positionY ?? 0,
  color: marker.color,
  icon: marker.icon as MapMarker['icon'],
  linkedNoteId: marker.linkedNoteId ?? undefined,
  childMapId: marker.childMapId ?? undefined,
  createdAt: marker.createdAt,
  updatedAt: marker.updatedAt,
});

const toTerritoryPoint = (point: { x: number; y: number }): TauriMapTerritoryPoint => ({
  x: point.x,
  y: point.y,
});

const toTerritoryRings = (
  rings: { x: number; y: number }[][] | undefined,
): TauriMapTerritoryPoint[][] | null => {
  if (!rings || rings.length === 0) {
    return null;
  }
  return rings.map((ring) => ring.map(toTerritoryPoint));
};

const territoryRingsFromPayload = (
  data: CreateTerritory | UpdateTerritory,
): TauriMapTerritoryPoint[][] | null => {
  const body = data as CreateTerritory & {
    points?: { x: number; y: number }[];
    rings?: { x: number; y: number }[][];
  };
  if (Array.isArray(body.rings) && body.rings.length > 0) {
    return toTerritoryRings(body.rings);
  }
  if (Array.isArray(body.points) && body.points.length >= 3) {
    return toTerritoryRings([body.points]);
  }
  return null;
};

const toTerritory = (territory: TauriMapTerritory): MapTerritory => ({
  id: territory.id,
  mapId: territory.mapId,
  name: territory.name,
  description: territory.description,
  color: territory.color,
  opacity: territory.opacity ?? 0.25,
  borderColor: territory.borderColor,
  borderWidth: territory.borderWidth ?? 2,
  smoothing: territory.smoothing ?? 0,
  rings: territory.rings.map((ring) =>
    ring.map((point) => ({
      x: point.x ?? 0,
      y: point.y ?? 0,
    })),
  ),
  factionId: territory.factionId ?? undefined,
  sortOrder: territory.sortOrder,
  createdAt: territory.createdAt,
  updatedAt: territory.updatedAt,
});

const toTerritorySummary = (summary: TauriMapTerritorySummary): MapTerritorySummary => ({
  id: summary.id,
  name: summary.name,
  mapId: summary.mapId,
  mapName: summary.mapName,
  factionId: summary.factionId,
  occupantName: summary.occupantName,
  occupantKind: summary.occupantKind as MapTerritorySummary['occupantKind'],
});

const toMapResponse = (response: TauriMapRecord | null): ApiResult<Map | null> => {
  if (response === null) {
    return { data: { success: true, data: null } };
  }
  return {
    data: {
      success: true,
      data: toMap(response),
    },
  };
};

const toSingleMapResponse = (response: TauriMapRecord): ApiResult<Map> => {
  return {
    data: {
      success: true,
      data: toMap(response),
    },
  };
};

const toMapListResponse = (response: TauriMapRecord[]): ApiResult<Map[]> => {
  return {
    data: {
      success: true,
      data: response.map(toMap),
    },
  };
};

const toMarkerResponse = (response: TauriMapMarker): ApiResult<MapMarker> => {
  return {
    data: {
      success: true,
      data: toMarker(response),
    },
  };
};

const toMarkerListResponse = (
  response: TauriMapMarker[],
): ApiResult<MapMarker[]> => {
  return {
    data: {
      success: true,
      data: response.map(toMarker),
    },
  };
};

const toTerritoryResponse = (
  response: TauriMapTerritory,
): ApiResult<MapTerritory> => {
  return {
    data: {
      success: true,
      data: toTerritory(response),
    },
  };
};

const toTerritoryListResponse = (
  response: TauriMapTerritory[],
): ApiResult<MapTerritory[]> => {
  return {
    data: {
      success: true,
      data: response.map(toTerritory),
    },
  };
};

const toTerritorySummaryListResponse = (
  response: TauriMapTerritorySummary[],
): ApiResult<MapTerritorySummary[]> => {
  return {
    data: {
      success: true,
      data: response.map(toTerritorySummary),
    },
  };
};

export const mapApi = {
  getRootMap: async (projectId: number): Promise<ApiResult<Map | null>> => {
    const query = withBranchParams({ projectId });
    const input: TauriGetRootMapInput = {
      projectId: query.projectId,
      branchId: query.branchId ?? null,
    };

    const response = await transport.request<TauriMapRecord | null>({
      command: 'maps_get_root',
      args: { input },
    });

    return toMapResponse(response);
  },

  getMapById: async (mapId: number, projectId?: number): Promise<ApiResult<Map>> => {
    const input: TauriGetMapInput = { id: mapId };

    const response = await transport.request<TauriMapRecord>({
      command: 'maps_get',
      args: { input },
    });

    return toSingleMapResponse(response);
  },

  getMapTree: async (projectId: number): Promise<ApiResult<Map[]>> => {
    const query = withBranchParams({ projectId });
    const input: TauriGetMapTreeInput = {
      projectId: query.projectId,
      branchId: query.branchId ?? null,
    };

    const response = await transport.request<TauriMapRecord[]>({
      command: 'maps_get_tree',
      args: { input },
    });

    return toMapListResponse(response);
  },

  getTerritorySummariesForProject: async (
    projectId: number,
  ): Promise<ApiResult<MapTerritorySummary[]>> => {
    const query = withBranchParams({ projectId });
    const input: TauriListTerritorySummariesInput = {
      projectId: query.projectId,
      branchId: query.branchId ?? null,
    };

    const response = await transport.request<TauriMapTerritorySummary[]>({
      command: 'maps_territory_summaries_list',
      args: { input },
    });

    return toTerritorySummaryListResponse(response);
  },

  createMap: async (data: CreateMap): Promise<ApiResult<Map>> => {
    const payload = withBranchParams({ ...data });
    const input: TauriCreateMapInput = {
      projectId: payload.projectId,
      parentMapId: payload.parentMapId ?? null,
      parentMarkerId: payload.parentMarkerId ?? null,
      name: payload.name,
      imagePath: payload.imagePath ?? null,
      branchId: payload.branchId ?? null,
    };

    const response = await transport.request<TauriMapRecord>({
      command: 'maps_create',
      args: { input },
    });

    return toSingleMapResponse(response);
  },

  updateMap: async (mapId: number, data: UpdateMap, projectId?: number): Promise<ApiResult<Map>> => {
    const payload = withBranchParams({ ...data }, projectId);
    const input: TauriUpdateMapInput = {
      id: mapId,
      name: payload.name ?? null,
      imagePath: payload.imagePath ?? null,
    };

    const response = await transport.request<TauriMapRecord>({
      command: 'maps_update',
      args: { input },
    });

    return toSingleMapResponse(response);
  },

  deleteMap: async (mapId: number): Promise<{ data: VoidResponse }> => {
    const input: TauriDeleteMapInput = { id: mapId };

    await transport.request<void>({
      command: 'maps_delete',
      args: { input },
    });

    return { data: { success: true } as VoidResponse };
  },

  uploadMapImage: async (mapId: number, file: File) => {
    const response = await uploadFileViaTransport<TauriMapRecord>('maps_upload_image', file, {
      mapId,
    });
    return toSingleMapResponse(response);
  },

  getMarkersByMapId: async (mapId: number, projectId?: number): Promise<ApiResult<MapMarker[]>> => {
    const query = withBranchParams({}, projectId);
    const input: TauriListMapMarkersInput = {
      mapId,
      branchId: query.branchId ?? null,
    };

    const response = await transport.request<TauriMapMarker[]>({
      command: 'maps_markers_list',
      args: { input },
    });

    return toMarkerListResponse(response);
  },

  createMarker: async (
    mapId: number,
    data: CreateMarker,
    projectId?: number,
  ): Promise<ApiResult<MapMarker>> => {
    const payload = withBranchParams({ ...data }, projectId);
    const input: TauriCreateMapMarkerInput = {
      mapId,
      title: payload.title,
      description: payload.description ?? null,
      positionX: payload.positionX ?? null,
      positionY: payload.positionY ?? null,
      color: payload.color ?? null,
      icon: payload.icon ?? null,
      linkedNoteId: payload.linkedNoteId ?? null,
      childMapId: payload.childMapId ?? null,
      branchId: payload.branchId ?? null,
    };

    const response = await transport.request<TauriMapMarker>({
      command: 'maps_markers_create',
      args: { input },
    });

    return toMarkerResponse(response);
  },

  updateMarker: async (
    markerId: number,
    data: UpdateMarker,
    projectId?: number,
  ): Promise<ApiResult<MapMarker>> => {
    const payload = withBranchParams({ ...data }, projectId);
    const input: TauriUpdateMapMarkerInput = {
      id: markerId,
      title: payload.title ?? null,
      description: payload.description ?? null,
      positionX: payload.positionX ?? null,
      positionY: payload.positionY ?? null,
      color: payload.color ?? null,
      icon: payload.icon ?? null,
      linkedNoteId: payload.linkedNoteId ?? null,
      childMapId: payload.childMapId ?? null,
      branchId: payload.branchId ?? null,
    };

    const response = await transport.request<TauriMapMarker>({
      command: 'maps_markers_update',
      args: { input },
    });

    return toMarkerResponse(response);
  },

  deleteMarker: async (markerId: number, projectId?: number): Promise<{ data: VoidResponse }> => {
    const query = withBranchParams({}, projectId);
    const input: TauriDeleteMapMarkerInput = {
      id: markerId,
      branchId: query.branchId ?? null,
    };

    await transport.request<void>({
      command: 'maps_markers_delete',
      args: { input },
    });

    return { data: { success: true } as VoidResponse };
  },

  getTerritoriesByMapId: async (
    mapId: number,
    projectId?: number,
  ): Promise<ApiResult<MapTerritory[]>> => {
    const query = withBranchParams({}, projectId);
    const input: TauriListMapTerritoriesInput = {
      mapId,
      branchId: query.branchId ?? null,
    };

    const response = await transport.request<TauriMapTerritory[]>({
      command: 'maps_territories_list',
      args: { input },
    });

    return toTerritoryListResponse(response);
  },

  createTerritory: async (
    mapId: number,
    data: CreateTerritory,
    projectId?: number,
  ): Promise<ApiResult<MapTerritory>> => {
    const payload = withBranchParams(data as Record<string, unknown>, projectId);
    const rings = territoryRingsFromPayload(data);
    const input: TauriCreateMapTerritoryInput = {
      mapId,
      name: String(payload.name ?? ''),
      description: (payload.description as string | undefined) ?? null,
      color: (payload.color as string | undefined) ?? null,
      opacity: (payload.opacity as number | undefined) ?? null,
      borderColor: (payload.borderColor as string | undefined) ?? null,
      borderWidth: (payload.borderWidth as number | undefined) ?? null,
      smoothing: (payload.smoothing as number | undefined) ?? null,
      rings: rings ?? [],
      factionId: (payload.factionId as number | undefined) ?? null,
      sortOrder: (payload.sortOrder as number | undefined) ?? null,
      branchId: (payload.branchId as number | undefined) ?? null,
    };

    const response = await transport.request<TauriMapTerritory>({
      command: 'maps_territories_create',
      args: { input },
    });

    return toTerritoryResponse(response);
  },

  updateTerritory: async (
    territoryId: number,
    data: UpdateTerritory,
    projectId?: number,
  ): Promise<ApiResult<MapTerritory>> => {
    const payload = withBranchParams(data as Record<string, unknown>, projectId);
    const rings = territoryRingsFromPayload(data);
    const input: TauriUpdateMapTerritoryInput = {
      id: territoryId,
      name: (payload.name as string | undefined) ?? null,
      description: (payload.description as string | undefined) ?? null,
      color: (payload.color as string | undefined) ?? null,
      opacity: (payload.opacity as number | undefined) ?? null,
      borderColor: (payload.borderColor as string | undefined) ?? null,
      borderWidth: (payload.borderWidth as number | undefined) ?? null,
      smoothing: (payload.smoothing as number | undefined) ?? null,
      rings,
      factionId: (payload.factionId as number | undefined) ?? null,
      sortOrder: (payload.sortOrder as number | undefined) ?? null,
      branchId: (payload.branchId as number | undefined) ?? null,
    };

    const response = await transport.request<TauriMapTerritory>({
      command: 'maps_territories_update',
      args: { input },
    });

    return toTerritoryResponse(response);
  },

  deleteTerritory: async (
    territoryId: number,
    projectId?: number,
  ): Promise<{ data: VoidResponse }> => {
    const query = withBranchParams({}, projectId);
    const input: TauriDeleteMapTerritoryInput = {
      id: territoryId,
      branchId: query.branchId ?? null,
    };

    await transport.request<void>({
      command: 'maps_territories_delete',
      args: { input },
    });

    return { data: { success: true } as VoidResponse };
  },
};
