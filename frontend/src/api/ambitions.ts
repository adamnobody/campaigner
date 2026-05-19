import type { Ambition, ApiResponse, CreateAmbition, UpdateAmbition } from '@campaigner/shared';
import type {
  Ambition as TauriAmbition,
  AssignFactionAmbitionInput as TauriAssignFactionAmbitionInput,
  CreateAmbitionInput as TauriCreateAmbitionInput,
  DeleteAmbitionInput as TauriDeleteAmbitionInput,
  GetAmbitionsCatalogInput as TauriGetAmbitionsCatalogInput,
  GetFactionAmbitionsInput as TauriGetFactionAmbitionsInput,
  UnassignFactionAmbitionInput as TauriUnassignFactionAmbitionInput,
  UpdateAmbitionExclusionsInput as TauriUpdateAmbitionExclusionsInput,
  UpdateAmbitionInput as TauriUpdateAmbitionInput,
} from '@/types/generated/bindings';
import { transport } from './transport';

type ApiResult<T> = {
  data: ApiResponse<T>;
};

const isApiResponse = <T>(value: unknown): value is ApiResponse<T> =>
  Boolean(value && typeof value === 'object' && 'success' in value);

const toAmbition = (ambition: TauriAmbition): Ambition => ({
  id: ambition.id,
  name: ambition.name,
  description: ambition.description,
  iconPath: ambition.iconPath,
  isCustom: ambition.isCustom,
  exclusions: ambition.exclusions,
  projectId: ambition.projectId ?? null,
  createdAt: ambition.createdAt ?? undefined,
  updatedAt: ambition.updatedAt ?? undefined,
});

const toAmbitionResponse = (response: ApiResponse<Ambition> | TauriAmbition): ApiResult<Ambition> => {
  if (isApiResponse<Ambition>(response)) {
    return { data: response };
  }

  return {
    data: {
      success: true,
      data: toAmbition(response),
    },
  };
};

const toAmbitionsListResponse = (
  response: ApiResponse<Ambition[]> | TauriAmbition[]
): ApiResult<Ambition[]> => {
  if (isApiResponse<Ambition[]>(response)) {
    return { data: response };
  }

  return {
    data: {
      success: true,
      data: response.map(toAmbition),
    },
  };
};

export const ambitionsApi = {
  getCatalog: async (projectId: number): Promise<ApiResult<Ambition[]>> => {
    const input: TauriGetAmbitionsCatalogInput = { projectId };
    const response = await transport.request<ApiResponse<Ambition[]> | TauriAmbition[]>({
      http: {
        method: 'GET',
        path: '/ambitions',
        query: { projectId },
      },
      tauri: {
        command: 'ambitions_get_catalog',
        args: { input },
      },
    });

    return toAmbitionsListResponse(response);
  },

  create: async (data: CreateAmbition): Promise<ApiResult<Ambition>> => {
    const input: TauriCreateAmbitionInput = {
      projectId: data.projectId,
      name: data.name,
      description: data.description ?? null,
      iconPath: data.iconPath ?? null,
      excludedIds: data.excludedIds ?? null,
    };

    const response = await transport.request<ApiResponse<Ambition> | TauriAmbition>({
      http: {
        method: 'POST',
        path: '/ambitions',
        body: data,
      },
      tauri: {
        command: 'ambitions_create',
        args: { input },
      },
    });

    return toAmbitionResponse(response);
  },

  update: async (id: number, data: UpdateAmbition): Promise<ApiResult<Ambition>> => {
    const input: TauriUpdateAmbitionInput = {
      id,
      name: data.name ?? null,
      description: data.description ?? null,
      iconPath: data.iconPath ?? null,
    };

    const response = await transport.request<ApiResponse<Ambition> | TauriAmbition>({
      http: {
        method: 'PATCH',
        path: `/ambitions/${id}`,
        body: data,
      },
      tauri: {
        command: 'ambitions_update',
        args: { input },
      },
    });

    return toAmbitionResponse(response);
  },

  updateExclusions: async (id: number, excludedIds: number[]): Promise<ApiResult<Ambition>> => {
    const input: TauriUpdateAmbitionExclusionsInput = { id, excludedIds };

    const response = await transport.request<ApiResponse<Ambition> | TauriAmbition>({
      http: {
        method: 'PATCH',
        path: `/ambitions/${id}/exclusions`,
        body: { excludedIds },
      },
      tauri: {
        command: 'ambitions_update_exclusions',
        args: { input },
      },
    });

    return toAmbitionResponse(response);
  },

  delete: async (id: number): Promise<{ data: void }> => {
    const input: TauriDeleteAmbitionInput = { id };

    await transport.request<void>({
      http: {
        method: 'DELETE',
        path: `/ambitions/${id}`,
      },
      tauri: {
        command: 'ambitions_delete',
        args: { input },
      },
    });

    return { data: undefined as void };
  },

  getFactionAmbitions: async (factionId: number): Promise<ApiResult<Ambition[]>> => {
    const input: TauriGetFactionAmbitionsInput = { factionId };

    const response = await transport.request<ApiResponse<Ambition[]> | TauriAmbition[]>({
      http: {
        method: 'GET',
        path: `/factions/${factionId}/ambitions`,
      },
      tauri: {
        command: 'ambitions_get_faction_ambitions',
        args: { input },
      },
    });

    return toAmbitionsListResponse(response);
  },

  assignFactionAmbition: async (
    factionId: number,
    ambitionId: number
  ): Promise<{ data: void }> => {
    const input: TauriAssignFactionAmbitionInput = { factionId, ambitionId };

    await transport.request<void>({
      http: {
        method: 'POST',
        path: `/factions/${factionId}/ambitions`,
        body: { ambitionId },
      },
      tauri: {
        command: 'ambitions_assign_faction_ambition',
        args: { input },
      },
    });

    return { data: undefined as void };
  },

  unassignFactionAmbition: async (
    factionId: number,
    ambitionId: number
  ): Promise<{ data: void }> => {
    const input: TauriUnassignFactionAmbitionInput = { factionId, ambitionId };

    await transport.request<void>({
      http: {
        method: 'DELETE',
        path: `/factions/${factionId}/ambitions/${ambitionId}`,
      },
      tauri: {
        command: 'ambitions_unassign_faction_ambition',
        args: { input },
      },
    });

    return { data: undefined as void };
  },
};
