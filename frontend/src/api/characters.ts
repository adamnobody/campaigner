import type {
  ApiResponse,
  PaginatedResponse,
  Character,
  CreateCharacter,
  UpdateCharacter,
  CharacterRelationship,
  CharacterGraph,
  CreateRelationship,
  UpdateRelationship,
  Tag,
} from '@campaigner/shared';
import type {
  Character as TauriCharacter,
  CharacterGraph as TauriCharacterGraph,
  CharacterRelationship as TauriCharacterRelationship,
  CharactersListInput as TauriCharactersListInput,
  CharactersListResult as TauriCharactersListResult,
  CreateCharacterInput as TauriCreateCharacterInput,
  CreateRelationshipInput as TauriCreateRelationshipInput,
  DeleteCharacterInput as TauriDeleteCharacterInput,
  DeleteRelationshipInput as TauriDeleteRelationshipInput,
  GetCharacterInput as TauriGetCharacterInput,
  RelationshipsListInput as TauriRelationshipsListInput,
  SetCharacterTagsInput as TauriSetCharacterTagsInput,
  Tag as TauriTag,
  UpdateCharacterInput as TauriUpdateCharacterInput,
  UpdateRelationshipInput as TauriUpdateRelationshipInput,
} from '@/types/generated/bindings';
import { transport } from './transport';
import { uploadFileViaTransport } from './uploadFile';
import type { CharacterListParams } from './types';
import { withBranchParams } from './withBranchParams';

type ApiResult<T> = { data: ApiResponse<T> };
type PaginatedApiResult<T> = { data: PaginatedResponse<T> };

const toTag = (tag: TauriTag): Tag => ({
  id: tag.id,
  name: tag.name,
  color: tag.color,
});

const toCharacter = (character: TauriCharacter): Character => ({
  id: character.id,
  projectId: character.projectId,
  stateId: character.stateId ?? null,
  name: character.name,
  title: character.title,
  race: character.race,
  characterClass: character.characterClass,
  level: character.level ?? null,
  status:
    character.status === 'dead' ||
    character.status === 'unknown' ||
    character.status === 'missing'
      ? character.status
      : 'alive',
  bio: character.bio,
  appearance: character.appearance,
  personality: character.personality,
  backstory: character.backstory,
  notes: character.notes,
  imagePath: character.imagePath ?? null,
  createdAt: character.createdAt,
  updatedAt: character.updatedAt,
  tags: character.tags.map(toTag),
  factionIds: character.factionIds ?? [],
});

const toRelationship = (relationship: TauriCharacterRelationship): CharacterRelationship => ({
  id: relationship.id,
  projectId: relationship.projectId,
  sourceCharacterId: relationship.sourceCharacterId,
  targetCharacterId: relationship.targetCharacterId,
  relationshipType: relationship.relationshipType as CharacterRelationship['relationshipType'],
  customLabel: relationship.customLabel,
  description: relationship.description,
  isBidirectional: relationship.isBidirectional,
  createdAt: relationship.createdAt,
});

const toGraph = (graph: TauriCharacterGraph): CharacterGraph => ({
  nodes: graph.nodes.map((node) => ({
    id: node.id,
    name: node.name,
    title: node.title,
    status: node.status,
    imagePath: node.imagePath ?? null,
  })),
  edges: graph.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    relationshipType: edge.relationshipType,
    customLabel: edge.customLabel,
    isBidirectional: edge.isBidirectional,
  })),
});

export const charactersApi = {
  getAll: async (
    projectId: number,
    params?: CharacterListParams
  ): Promise<PaginatedApiResult<Character>> => {
    const query = withBranchParams({ projectId, ...params });
    const input: TauriCharactersListInput = {
      projectId: query.projectId,
      page: query.page ?? null,
      limit: query.limit ?? null,
      search: query.search ?? null,
      sortBy: query.sortBy ?? null,
      sortOrder: query.sortOrder ?? null,
      branchId: query.branchId ?? null,
    };

    const response = await transport.request<TauriCharactersListResult>({
      command: 'characters_list',
      args: { input },
    });

    return {
      data: {
        success: true,
        data: {
          items: response.items.map(toCharacter),
          total: response.total,
          page: response.page,
          limit: response.limit,
          totalPages: response.totalPages,
        },
      },
    };
  },
  getById: async (id: number, projectId: number): Promise<ApiResult<Character>> => {
    const query = withBranchParams({}, projectId);
    const input: TauriGetCharacterInput = {
      id,
      branchId: query.branchId ?? null,
    };

    const response = await transport.request<TauriCharacter>({
      command: 'characters_get',
      args: { input },
    });

    return { data: { success: true, data: toCharacter(response) } };
  },
  create: async (data: CreateCharacter): Promise<ApiResult<Character>> => {
    const payload = withBranchParams({ ...data });
    const input: TauriCreateCharacterInput = {
      projectId: payload.projectId,
      name: payload.name,
      title: payload.title ?? null,
      race: payload.race ?? null,
      characterClass: payload.characterClass ?? null,
      level: payload.level ?? null,
      status: payload.status ?? null,
      bio: payload.bio ?? null,
      appearance: payload.appearance ?? null,
      personality: payload.personality ?? null,
      backstory: payload.backstory ?? null,
      notes: payload.notes ?? null,
      stateId: payload.stateId ?? null,
      factionIds: payload.factionIds ?? null,
      branchId: payload.branchId ?? null,
    };

    const response = await transport.request<TauriCharacter>({
      command: 'characters_create',
      args: { input },
    });

    return { data: { success: true, data: toCharacter(response) } };
  },
  update: async (id: number, data: UpdateCharacter, projectId: number): Promise<ApiResult<Character>> => {
    const payload = withBranchParams({ ...data }, projectId);
    const input: TauriUpdateCharacterInput = {
      id,
      name: payload.name ?? null,
      title: payload.title ?? null,
      race: payload.race ?? null,
      characterClass: payload.characterClass ?? null,
      level: payload.level ?? null,
      status: payload.status ?? null,
      bio: payload.bio ?? null,
      appearance: payload.appearance ?? null,
      personality: payload.personality ?? null,
      backstory: payload.backstory ?? null,
      notes: payload.notes ?? null,
      stateId: payload.stateId ?? null,
      factionIds: payload.factionIds ?? null,
      branchId: payload.branchId ?? null,
    };

    const response = await transport.request<TauriCharacter>({
      command: 'characters_update',
      args: { input },
    });

    return { data: { success: true, data: toCharacter(response) } };
  },
  delete: async (id: number, projectId: number) => {
    const query = withBranchParams({}, projectId);
    const input: TauriDeleteCharacterInput = {
      id,
      branchId: query.branchId ?? null,
    };

    await transport.request<void>({
      command: 'characters_delete',
      args: { input },
    });

    return { data: undefined as void };
  },
  uploadImage: async (id: number, file: File, projectId: number) => {
    const query = withBranchParams({}, projectId);
    const response = await uploadFileViaTransport<TauriCharacter>('characters_upload_image', file, {
      id,
      branchId: query.branchId ?? null,
    });
    return { data: { success: true, data: toCharacter(response) } };
  },
  setTags: async (id: number, tagIds: number[], projectId: number): Promise<ApiResult<Tag[]>> => {
    const query = withBranchParams({}, projectId);
    const input: TauriSetCharacterTagsInput = {
      id,
      tagIds,
      branchId: query.branchId ?? null,
    };
    const response = await transport.request<TauriTag[]>({
      command: 'characters_set_tags',
      args: { input },
    });
    return { data: { success: true, data: response.map(toTag) } };
  },
  getGraph: async (projectId: number): Promise<ApiResult<CharacterGraph>> => {
    const query = withBranchParams({ projectId });
    const input: TauriRelationshipsListInput = {
      projectId: query.projectId,
      branchId: query.branchId ?? null,
    };
    const response = await transport.request<TauriCharacterGraph>({
      command: 'characters_graph',
      args: { input },
    });
    return { data: { success: true, data: toGraph(response) } };
  },
  getRelationships: async (projectId: number): Promise<ApiResult<CharacterRelationship[]>> => {
    const query = withBranchParams({ projectId });
    const input: TauriRelationshipsListInput = {
      projectId: query.projectId,
      branchId: query.branchId ?? null,
    };
    const response = await transport.request<TauriCharacterRelationship[]>({
      command: 'characters_relationships_list',
      args: { input },
    });
    return { data: { success: true, data: response.map(toRelationship) } };
  },
  createRelationship: async (data: CreateRelationship): Promise<ApiResult<CharacterRelationship>> => {
    const payload = withBranchParams({ ...data });
    const input: TauriCreateRelationshipInput = {
      projectId: payload.projectId,
      sourceCharacterId: payload.sourceCharacterId,
      targetCharacterId: payload.targetCharacterId,
      relationshipType: payload.relationshipType,
      customLabel: payload.customLabel ?? null,
      description: payload.description ?? null,
      isBidirectional: payload.isBidirectional ?? null,
      branchId: payload.branchId ?? null,
    };
    const response = await transport.request<TauriCharacterRelationship>({
      command: 'characters_relationships_create',
      args: { input },
    });
    return { data: { success: true, data: toRelationship(response) } };
  },
  updateRelationship: async (
    id: number,
    data: UpdateRelationship,
    projectId: number
  ): Promise<ApiResult<CharacterRelationship>> => {
    const payload = withBranchParams({ ...data }, projectId);
    const input: TauriUpdateRelationshipInput = {
      id,
      relationshipType: payload.relationshipType ?? null,
      customLabel: payload.customLabel ?? null,
      description: payload.description ?? null,
      isBidirectional: payload.isBidirectional ?? null,
      branchId: payload.branchId ?? null,
    };
    const response = await transport.request<TauriCharacterRelationship>({
      command: 'characters_relationships_update',
      args: { input },
    });
    return { data: { success: true, data: toRelationship(response) } };
  },
  deleteRelationship: async (id: number, projectId: number) => {
    const query = withBranchParams({}, projectId);
    const input: TauriDeleteRelationshipInput = {
      id,
      branchId: query.branchId ?? null,
    };
    await transport.request<void>({
      command: 'characters_relationships_delete',
      args: { input },
    });
    return { data: undefined as void };
  },
};
