import type { ApiResponse, CharacterTrait, CreateCharacterTrait } from '@campaigner/shared';
import type {
  AssignCharacterTraitInput as TauriAssignCharacterTraitInput,
  CharacterTrait as TauriCharacterTrait,
  CreateCharacterTraitInput as TauriCreateCharacterTraitInput,
  DeleteCharacterTraitInput as TauriDeleteCharacterTraitInput,
  GetAssignedCharacterTraitsInput as TauriGetAssignedCharacterTraitsInput,
  ListCharacterTraitsInput as TauriListCharacterTraitsInput,
  UnassignCharacterTraitInput as TauriUnassignCharacterTraitInput,
  UpdateCharacterTraitExclusionsInput as TauriUpdateCharacterTraitExclusionsInput,
} from '@/types/generated/bindings';
import { transport } from './transport';

type ApiResult<T> = {
  data: ApiResponse<T>;
};

const isApiResponse = <T>(value: unknown): value is ApiResponse<T> =>
  Boolean(value && typeof value === 'object' && 'success' in value);

const toCharacterTrait = (trait: TauriCharacterTrait): CharacterTrait => ({
  id: trait.id,
  projectId: trait.projectId,
  name: trait.name,
  description: trait.description,
  imagePath: trait.imagePath,
  isPredefined: trait.isPredefined,
  exclusions: trait.exclusions,
  sortOrder: trait.sortOrder,
  createdAt: trait.createdAt ?? undefined,
  updatedAt: trait.updatedAt ?? undefined,
});

const toCharacterTraitResponse = (
  response: ApiResponse<CharacterTrait> | TauriCharacterTrait
): ApiResult<CharacterTrait> => {
  if (isApiResponse<CharacterTrait>(response)) {
    return { data: response };
  }

  return {
    data: {
      success: true,
      data: toCharacterTrait(response),
    },
  };
};

const toCharacterTraitsListResponse = (
  response: ApiResponse<CharacterTrait[]> | TauriCharacterTrait[]
): ApiResult<CharacterTrait[]> => {
  if (isApiResponse<CharacterTrait[]>(response)) {
    return { data: response };
  }

  return {
    data: {
      success: true,
      data: response.map(toCharacterTrait),
    },
  };
};

const toAssignedIdsResponse = (
  response: ApiResponse<number[]> | number[]
): ApiResult<number[]> => {
  if (isApiResponse<number[]>(response)) {
    return { data: response };
  }

  return {
    data: {
      success: true,
      data: response,
    },
  };
};

export const characterTraitsApi = {
  getAll: async (projectId: number): Promise<ApiResult<CharacterTrait[]>> => {
    const input: TauriListCharacterTraitsInput = { projectId };
    const response = await transport.request<ApiResponse<CharacterTrait[]> | TauriCharacterTrait[]>(
      {
        http: {
          method: 'GET',
          path: '/character-traits',
          query: { projectId },
        },
        tauri: {
          command: 'character_traits_list',
          args: { input },
        },
      }
    );

    return toCharacterTraitsListResponse(response);
  },

  getAssigned: async (characterId: number): Promise<ApiResult<number[]>> => {
    const input: TauriGetAssignedCharacterTraitsInput = { characterId };
    const response = await transport.request<ApiResponse<number[]> | number[]>({
      http: {
        method: 'GET',
        path: '/character-traits/assigned',
        query: { characterId },
      },
      tauri: {
        command: 'character_traits_get_assigned',
        args: { input },
      },
    });

    return toAssignedIdsResponse(response);
  },

  assign: async (characterId: number, traitId: number): Promise<{ data: void }> => {
    const input: TauriAssignCharacterTraitInput = { characterId, traitId };
    await transport.request<void>({
      http: {
        method: 'POST',
        path: '/character-traits/assign',
        body: { characterId, traitId },
      },
      tauri: {
        command: 'character_traits_assign',
        args: { input },
      },
    });

    return { data: undefined as void };
  },

  unassign: async (characterId: number, traitId: number): Promise<{ data: void }> => {
    const input: TauriUnassignCharacterTraitInput = { characterId, traitId };
    await transport.request<void>({
      http: {
        method: 'POST',
        path: '/character-traits/unassign',
        body: { characterId, traitId },
      },
      tauri: {
        command: 'character_traits_unassign',
        args: { input },
      },
    });

    return { data: undefined as void };
  },

  create: async (data: CreateCharacterTrait): Promise<ApiResult<CharacterTrait>> => {
    const input: TauriCreateCharacterTraitInput = {
      projectId: data.projectId,
      name: data.name,
      description: data.description ?? null,
      imagePath: data.imagePath ?? null,
      excludedIds: data.excludedIds ?? null,
    };

    const response = await transport.request<ApiResponse<CharacterTrait> | TauriCharacterTrait>({
      http: {
        method: 'POST',
        path: '/character-traits',
        body: data,
      },
      tauri: {
        command: 'character_traits_create',
        args: { input },
      },
    });

    return toCharacterTraitResponse(response);
  },

  updateExclusions: async (id: number, excludedIds: number[]): Promise<ApiResult<CharacterTrait>> => {
    const input: TauriUpdateCharacterTraitExclusionsInput = { id, excludedIds };

    const response = await transport.request<ApiResponse<CharacterTrait> | TauriCharacterTrait>({
      http: {
        method: 'PATCH',
        path: `/character-traits/${id}/exclusions`,
        body: { excludedIds },
      },
      tauri: {
        command: 'character_traits_update_exclusions',
        args: { input },
      },
    });

    return toCharacterTraitResponse(response);
  },

  delete: async (id: number): Promise<{ data: void }> => {
    const input: TauriDeleteCharacterTraitInput = { id };

    await transport.request<void>({
      http: {
        method: 'DELETE',
        path: `/character-traits/${id}`,
      },
      tauri: {
        command: 'character_traits_delete',
        args: { input },
      },
    });

    return { data: undefined as void };
  },
};
