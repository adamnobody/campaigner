import type {
  ApiResponse,
  Dynasty,
  CreateDynasty,
  UpdateDynasty,
  DynastyMember,
  CreateDynastyMember,
  UpdateDynastyMember,
  DynastyFamilyLink,
  CreateDynastyFamilyLink,
  DynastyEvent,
  CreateDynastyEvent,
  UpdateDynastyEvent,
  Tag,
} from '@campaigner/shared';
import type {
  AddDynastyEventInput as TauriAddDynastyEventInput,
  AddDynastyFamilyLinkInput as TauriAddDynastyFamilyLinkInput,
  AddDynastyMemberInput as TauriAddDynastyMemberInput,
  CreateDynastyInput as TauriCreateDynastyInput,
  DeleteDynastyEventInput as TauriDeleteDynastyEventInput,
  DeleteDynastyFamilyLinkInput as TauriDeleteDynastyFamilyLinkInput,
  DeleteDynastyInput as TauriDeleteDynastyInput,
  Dynasty as TauriDynasty,
  DynastyEvent as TauriDynastyEvent,
  DynastyFamilyLink as TauriDynastyFamilyLink,
  DynastyMember as TauriDynastyMember,
  DynastiesListInput as TauriDynastiesListInput,
  DynastiesListResult as TauriDynastiesListResult,
  GetDynastyInput as TauriGetDynastyInput,
  ReorderDynastyEventsInput as TauriReorderDynastyEventsInput,
  RemoveDynastyMemberInput as TauriRemoveDynastyMemberInput,
  SaveDynastyGraphPositionsInput as TauriSaveDynastyGraphPositionsInput,
  SetDynastyTagsInput as TauriSetDynastyTagsInput,
  Tag as TauriTag,
  UpdateDynastyEventInput as TauriUpdateDynastyEventInput,
  UpdateDynastyInput as TauriUpdateDynastyInput,
  UpdateDynastyMemberInput as TauriUpdateDynastyMemberInput,
} from '@/types/generated/bindings';
import { apiClient, type ListWithTotal, type VoidResponse } from './client';
import { transport } from './transport';
import { uploadFileViaTransport } from './uploadFile';
import type { DynastiesListParams } from './types';
import { withBranchParams } from './withBranchParams';

type ApiResult<T> = {
  data: ApiResponse<T>;
};

type ListResult<T> = { data: ListWithTotal<T> };

const isApiResponse = <T>(value: unknown): value is ApiResponse<T> =>
  Boolean(value && typeof value === 'object' && 'success' in value);

const isListWithTotal = <T>(value: unknown): value is ListWithTotal<T> =>
  Boolean(
    value &&
      typeof value === 'object' &&
      'success' in value &&
      'total' in value &&
      'data' in value,
  );

const toTag = (tag: TauriTag): Tag => ({
  id: tag.id,
  name: tag.name,
  color: tag.color,
});

const toDynastyMember = (member: TauriDynastyMember): DynastyMember => ({
  id: member.id,
  dynastyId: member.dynastyId,
  characterId: member.characterId,
  generation: member.generation,
  role: member.role,
  birthDate: member.birthDate,
  deathDate: member.deathDate,
  isMainLine: member.isMainLine,
  notes: member.notes,
  graphX: member.graphX,
  graphY: member.graphY,
  characterName: member.characterName ?? undefined,
  characterImagePath: member.characterImagePath ?? undefined,
  characterStatus: member.characterStatus ?? undefined,
});

const toDynastyFamilyLink = (link: TauriDynastyFamilyLink): DynastyFamilyLink => ({
  id: link.id,
  dynastyId: link.dynastyId,
  sourceCharacterId: link.sourceCharacterId,
  targetCharacterId: link.targetCharacterId,
  relationType: link.relationType,
  customLabel: link.customLabel,
  sourceCharacterName: link.sourceCharacterName ?? undefined,
  targetCharacterName: link.targetCharacterName ?? undefined,
});

const toDynastyEvent = (event: TauriDynastyEvent): DynastyEvent => ({
  id: event.id,
  dynastyId: event.dynastyId,
  title: event.title,
  description: event.description,
  eventDate: event.eventDate,
  importance: event.importance,
  sortOrder: event.sortOrder,
  createdAt: event.createdAt,
});

const toDynasty = (dynasty: TauriDynasty): Dynasty => ({
  id: dynasty.id,
  projectId: dynasty.projectId,
  name: dynasty.name,
  motto: dynasty.motto,
  description: dynasty.description,
  history: dynasty.history,
  status: dynasty.status,
  color: dynasty.color,
  secondaryColor: dynasty.secondaryColor,
  imagePath: dynasty.imagePath ?? undefined,
  foundedDate: dynasty.foundedDate,
  extinctDate: dynasty.extinctDate,
  founderId: dynasty.founderId ?? undefined,
  currentLeaderId: dynasty.currentLeaderId ?? undefined,
  heirId: dynasty.heirId ?? undefined,
  linkedFactionId: dynasty.linkedFactionId ?? undefined,
  sortOrder: dynasty.sortOrder,
  createdAt: dynasty.createdAt,
  updatedAt: dynasty.updatedAt,
  memberCount: dynasty.memberCount ?? undefined,
  tags: dynasty.tags?.map(toTag),
  members: dynasty.members?.map(toDynastyMember),
  familyLinks: dynasty.familyLinks?.map(toDynastyFamilyLink),
  events: dynasty.events?.map(toDynastyEvent),
  founderName: dynasty.founderName ?? undefined,
  currentLeaderName: dynasty.currentLeaderName ?? undefined,
  heirName: dynasty.heirName ?? undefined,
  linkedFactionName: dynasty.linkedFactionName ?? undefined,
});

const toDynastyResponse = (response: ApiResponse<Dynasty> | TauriDynasty): ApiResult<Dynasty> => {
  if (isApiResponse<Dynasty>(response)) {
    return { data: response };
  }
  return {
    data: {
      success: true,
      data: toDynasty(response),
    },
  };
};

const toDynastyMemberResponse = (
  response: ApiResponse<DynastyMember> | TauriDynastyMember,
): ApiResult<DynastyMember> => {
  if (isApiResponse<DynastyMember>(response)) {
    return { data: response };
  }
  return {
    data: {
      success: true,
      data: toDynastyMember(response),
    },
  };
};

const toDynastyFamilyLinkResponse = (
  response: ApiResponse<DynastyFamilyLink> | TauriDynastyFamilyLink,
): ApiResult<DynastyFamilyLink> => {
  if (isApiResponse<DynastyFamilyLink>(response)) {
    return { data: response };
  }
  return {
    data: {
      success: true,
      data: toDynastyFamilyLink(response),
    },
  };
};

const toDynastyEventResponse = (
  response: ApiResponse<DynastyEvent> | TauriDynastyEvent,
): ApiResult<DynastyEvent> => {
  if (isApiResponse<DynastyEvent>(response)) {
    return { data: response };
  }
  return {
    data: {
      success: true,
      data: toDynastyEvent(response),
    },
  };
};

export const dynastiesApi = {
  getAll: async (
    projectId: number,
    params?: DynastiesListParams,
  ): Promise<ListResult<Dynasty[]>> => {
    const query = withBranchParams({ projectId, ...params });
    const input: TauriDynastiesListInput = {
      projectId: query.projectId,
      search: query.search ?? null,
      status: query.status ?? null,
      limit: query.limit ?? null,
      offset: query.offset ?? null,
      branchId: query.branchId ?? null,
    };

    const response = await transport.request<ListWithTotal<Dynasty[]> | TauriDynastiesListResult>({
      http: {
        method: 'GET',
        path: '/dynasties',
        query,
      },
      tauri: {
        command: 'dynasties_list',
        args: { input },
      },
    });

    if (isListWithTotal<Dynasty[]>(response)) {
      return { data: response };
    }

    return {
      data: {
        success: true,
        data: response.items.map(toDynasty),
        total: response.total,
      },
    };
  },

  getById: async (id: number, projectId: number): Promise<ApiResult<Dynasty>> => {
    const query = withBranchParams({}, projectId);
    const input: TauriGetDynastyInput = { id, branchId: query.branchId ?? null };
    const response = await transport.request<ApiResponse<Dynasty> | TauriDynasty>({
      http: {
        method: 'GET',
        path: `/dynasties/${id}`,
        query,
      },
      tauri: {
        command: 'dynasties_get',
        args: { input },
      },
    });
    return toDynastyResponse(response);
  },

  create: async (data: CreateDynasty): Promise<ApiResult<Dynasty>> => {
    const body = withBranchParams({ ...data });
    const input: TauriCreateDynastyInput = {
      projectId: body.projectId,
      name: body.name,
      motto: body.motto ?? null,
      description: body.description ?? null,
      history: body.history ?? null,
      status: body.status ?? null,
      color: body.color ?? null,
      secondaryColor: body.secondaryColor ?? null,
      foundedDate: body.foundedDate ?? null,
      extinctDate: body.extinctDate ?? null,
      founderId: body.founderId ?? null,
      currentLeaderId: body.currentLeaderId ?? null,
      heirId: body.heirId ?? null,
      linkedFactionId: body.linkedFactionId ?? null,
      sortOrder: body.sortOrder ?? null,
      branchId: body.branchId ?? null,
    };
    const response = await transport.request<ApiResponse<Dynasty> | TauriDynasty>({
      http: {
        method: 'POST',
        path: '/dynasties',
        body,
      },
      tauri: {
        command: 'dynasties_create',
        args: { input },
      },
    });
    return toDynastyResponse(response);
  },

  update: async (
    id: number,
    data: UpdateDynasty,
    projectId: number,
  ): Promise<ApiResult<Dynasty>> => {
    const body = withBranchParams({ ...data }, projectId);
    const input: TauriUpdateDynastyInput = {
      id,
      name: body.name ?? null,
      motto: body.motto ?? null,
      description: body.description ?? null,
      history: body.history ?? null,
      status: body.status ?? null,
      color: body.color ?? null,
      secondaryColor: body.secondaryColor ?? null,
      foundedDate: body.foundedDate ?? null,
      extinctDate: body.extinctDate ?? null,
      founderId: body.founderId ?? null,
      currentLeaderId: body.currentLeaderId ?? null,
      heirId: body.heirId ?? null,
      linkedFactionId: body.linkedFactionId ?? null,
      sortOrder: body.sortOrder ?? null,
      branchId: body.branchId ?? null,
    };
    const response = await transport.request<ApiResponse<Dynasty> | TauriDynasty>({
      http: {
        method: 'PUT',
        path: `/dynasties/${id}`,
        body,
      },
      tauri: {
        command: 'dynasties_update',
        args: { input },
      },
    });
    return toDynastyResponse(response);
  },

  delete: async (id: number, projectId: number): Promise<ApiResult<undefined>> => {
    const query = withBranchParams({}, projectId);
    const input: TauriDeleteDynastyInput = { id, branchId: query.branchId ?? null };
    const response = await transport.request<VoidResponse | void>({
      http: {
        method: 'DELETE',
        path: `/dynasties/${id}`,
        query,
      },
      tauri: {
        command: 'dynasties_delete',
        args: { input },
      },
    });
    if (isApiResponse<undefined>(response)) {
      return { data: response };
    }
    return {
      data: {
        success: true,
        data: undefined,
        message: 'Dynasty deleted',
      },
    };
  },

  uploadImage: async (id: number, file: File, projectId: number) => {
    const query = withBranchParams({}, projectId);
    if (import.meta.env.VITE_TRANSPORT === 'tauri') {
      const response = await uploadFileViaTransport<TauriDynasty>('dynasties_upload_image', file, {
        id,
        branchId: query.branchId ?? null,
      });
      return { data: { success: true, data: toDynasty(response) } };
    }

    const fd = new FormData();
    fd.append('image', file);
    return apiClient.post<ApiResponse<Dynasty>>(`/dynasties/${id}/image`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: query,
    });
  },

  setTags: async (id: number, tagIds: number[], projectId: number): Promise<ApiResult<Dynasty>> => {
    const query = withBranchParams({}, projectId);
    const input: TauriSetDynastyTagsInput = {
      id,
      tagIds,
      branchId: query.branchId ?? null,
    };
    const response = await transport.request<ApiResponse<Dynasty> | TauriDynasty>({
      http: {
        method: 'PUT',
        path: `/dynasties/${id}/tags`,
        body: { tagIds },
        query,
      },
      tauri: {
        command: 'dynasties_set_tags',
        args: { input },
      },
    });
    return toDynastyResponse(response);
  },

  addMember: async (
    dynastyId: number,
    data: CreateDynastyMember,
    projectId: number,
  ): Promise<ApiResult<DynastyMember>> => {
    const body = withBranchParams({ ...data }, projectId);
    const input: TauriAddDynastyMemberInput = {
      dynastyId,
      characterId: body.characterId,
      generation: body.generation ?? null,
      role: body.role ?? null,
      birthDate: body.birthDate ?? null,
      deathDate: body.deathDate ?? null,
      isMainLine: body.isMainLine ?? null,
      notes: body.notes ?? null,
      branchId: body.branchId ?? null,
    };
    const response = await transport.request<ApiResponse<DynastyMember> | TauriDynastyMember>({
      http: {
        method: 'POST',
        path: `/dynasties/${dynastyId}/members`,
        body,
      },
      tauri: {
        command: 'dynasties_add_member',
        args: { input },
      },
    });
    return toDynastyMemberResponse(response);
  },

  updateMember: async (
    dynastyId: number,
    memberId: number,
    data: UpdateDynastyMember,
  ): Promise<ApiResult<DynastyMember>> => {
    const input: TauriUpdateDynastyMemberInput = {
      dynastyId,
      memberId,
      generation: data.generation ?? null,
      role: data.role ?? null,
      birthDate: data.birthDate ?? null,
      deathDate: data.deathDate ?? null,
      isMainLine: data.isMainLine ?? null,
      notes: data.notes ?? null,
    };
    const response = await transport.request<ApiResponse<DynastyMember> | TauriDynastyMember>({
      http: {
        method: 'PUT',
        path: `/dynasties/${dynastyId}/members/${memberId}`,
        body: data,
      },
      tauri: {
        command: 'dynasties_update_member',
        args: { input },
      },
    });
    return toDynastyMemberResponse(response);
  },

  removeMember: async (dynastyId: number, memberId: number): Promise<ApiResult<undefined>> => {
    const input: TauriRemoveDynastyMemberInput = { dynastyId, memberId };
    const response = await transport.request<VoidResponse | void>({
      http: {
        method: 'DELETE',
        path: `/dynasties/${dynastyId}/members/${memberId}`,
      },
      tauri: {
        command: 'dynasties_remove_member',
        args: { input },
      },
    });
    if (isApiResponse<undefined>(response)) {
      return { data: response };
    }
    return {
      data: {
        success: true,
        data: undefined,
        message: 'Member removed',
      },
    };
  },

  addFamilyLink: async (
    dynastyId: number,
    data: CreateDynastyFamilyLink,
    projectId: number,
  ): Promise<ApiResult<DynastyFamilyLink>> => {
    const body = withBranchParams({ ...data }, projectId);
    const input: TauriAddDynastyFamilyLinkInput = {
      dynastyId,
      sourceCharacterId: body.sourceCharacterId,
      targetCharacterId: body.targetCharacterId,
      relationType: body.relationType,
      customLabel: body.customLabel ?? null,
      branchId: body.branchId ?? null,
    };
    const response = await transport.request<ApiResponse<DynastyFamilyLink> | TauriDynastyFamilyLink>(
      {
        http: {
          method: 'POST',
          path: `/dynasties/${dynastyId}/family-links`,
          body,
        },
        tauri: {
          command: 'dynasties_add_family_link',
          args: { input },
        },
      },
    );
    return toDynastyFamilyLinkResponse(response);
  },

  deleteFamilyLink: async (
    dynastyId: number,
    linkId: number,
  ): Promise<ApiResult<undefined>> => {
    const input: TauriDeleteDynastyFamilyLinkInput = { dynastyId, linkId };
    const response = await transport.request<VoidResponse | void>({
      http: {
        method: 'DELETE',
        path: `/dynasties/${dynastyId}/family-links/${linkId}`,
      },
      tauri: {
        command: 'dynasties_delete_family_link',
        args: { input },
      },
    });
    if (isApiResponse<undefined>(response)) {
      return { data: response };
    }
    return {
      data: {
        success: true,
        data: undefined,
        message: 'Family link deleted',
      },
    };
  },

  saveGraphPositions: async (
    dynastyId: number,
    positions: { characterId: number; graphX: number; graphY: number }[],
    projectId: number,
  ): Promise<ApiResult<undefined>> => {
    const body = withBranchParams({ positions }, projectId);
    const input: TauriSaveDynastyGraphPositionsInput = {
      dynastyId,
      positions: body.positions.map((position) => ({
        characterId: position.characterId,
        graphX: position.graphX,
        graphY: position.graphY,
      })),
      branchId: body.branchId ?? null,
    };
    const response = await transport.request<VoidResponse | void>({
      http: {
        method: 'PUT',
        path: `/dynasties/${dynastyId}/graph-positions`,
        body,
      },
      tauri: {
        command: 'dynasties_save_graph_positions',
        args: { input },
      },
    });
    if (isApiResponse<undefined>(response)) {
      return { data: response };
    }
    return {
      data: {
        success: true,
        data: undefined,
        message: 'Positions saved',
      },
    };
  },

  addEvent: async (
    dynastyId: number,
    data: CreateDynastyEvent,
    projectId: number,
  ): Promise<ApiResult<DynastyEvent>> => {
    const body = withBranchParams({ ...data }, projectId);
    const input: TauriAddDynastyEventInput = {
      dynastyId,
      title: body.title,
      description: body.description ?? null,
      eventDate: body.eventDate,
      importance: body.importance ?? null,
      sortOrder: body.sortOrder ?? null,
      branchId: body.branchId ?? null,
    };
    const response = await transport.request<ApiResponse<DynastyEvent> | TauriDynastyEvent>({
      http: {
        method: 'POST',
        path: `/dynasties/${dynastyId}/events`,
        body,
      },
      tauri: {
        command: 'dynasties_add_event',
        args: { input },
      },
    });
    return toDynastyEventResponse(response);
  },

  updateEvent: async (
    dynastyId: number,
    eventId: number,
    data: UpdateDynastyEvent,
  ): Promise<ApiResult<DynastyEvent>> => {
    const input: TauriUpdateDynastyEventInput = {
      dynastyId,
      eventId,
      title: data.title ?? null,
      description: data.description ?? null,
      eventDate: data.eventDate ?? null,
      importance: data.importance ?? null,
      sortOrder: data.sortOrder ?? null,
    };
    const response = await transport.request<ApiResponse<DynastyEvent> | TauriDynastyEvent>({
      http: {
        method: 'PUT',
        path: `/dynasties/${dynastyId}/events/${eventId}`,
        body: data,
      },
      tauri: {
        command: 'dynasties_update_event',
        args: { input },
      },
    });
    return toDynastyEventResponse(response);
  },

  deleteEvent: async (dynastyId: number, eventId: number): Promise<ApiResult<undefined>> => {
    const input: TauriDeleteDynastyEventInput = { dynastyId, eventId };
    const response = await transport.request<VoidResponse | void>({
      http: {
        method: 'DELETE',
        path: `/dynasties/${dynastyId}/events/${eventId}`,
      },
      tauri: {
        command: 'dynasties_delete_event',
        args: { input },
      },
    });
    if (isApiResponse<undefined>(response)) {
      return { data: response };
    }
    return {
      data: {
        success: true,
        data: undefined,
        message: 'Event deleted',
      },
    };
  },

  reorderEvents: async (
    dynastyId: number,
    orderedIds: number[],
    projectId: number,
  ): Promise<ApiResult<Dynasty>> => {
    const body = withBranchParams({ orderedIds }, projectId);
    const input: TauriReorderDynastyEventsInput = {
      dynastyId,
      orderedIds: body.orderedIds,
      branchId: body.branchId ?? null,
    };
    const response = await transport.request<ApiResponse<Dynasty> | TauriDynasty>({
      http: {
        method: 'POST',
        path: `/dynasties/${dynastyId}/events/reorder`,
        body,
      },
      tauri: {
        command: 'dynasties_reorder_events',
        args: { input },
      },
    });
    return toDynastyResponse(response);
  },
};
