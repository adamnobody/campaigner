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
import type { DynastiesListParams, ListWithTotal } from './types';
import { transport } from './transport';
import { uploadFileViaTransport } from './uploadFile';
import { withBranchParams } from './withBranchParams';

type ApiResult<T> = {
  data: ApiResponse<T>;
};

type ListResult<T> = { data: ListWithTotal<T> };

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

const toDynastyResponse = (response: TauriDynasty): ApiResult<Dynasty> => {
  return {
    data: {
      success: true,
      data: toDynasty(response),
    },
  };
};

const toDynastyMemberResponse = (
  response: TauriDynastyMember,
): ApiResult<DynastyMember> => {
  return {
    data: {
      success: true,
      data: toDynastyMember(response),
    },
  };
};

const toDynastyFamilyLinkResponse = (
  response: TauriDynastyFamilyLink,
): ApiResult<DynastyFamilyLink> => {
  return {
    data: {
      success: true,
      data: toDynastyFamilyLink(response),
    },
  };
};

const toDynastyEventResponse = (
  response: TauriDynastyEvent,
): ApiResult<DynastyEvent> => {
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

    const response = await transport.request<TauriDynastiesListResult>({
      command: 'dynasties_list',
      args: { input },
    });

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
    const response = await transport.request<TauriDynasty>({
      command: 'dynasties_get',
      args: { input },
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
    const response = await transport.request<TauriDynasty>({
      command: 'dynasties_create',
      args: { input },
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
    const response = await transport.request<TauriDynasty>({
      command: 'dynasties_update',
      args: { input },
    });
    return toDynastyResponse(response);
  },

  delete: async (id: number, projectId: number): Promise<ApiResult<undefined>> => {
    const query = withBranchParams({}, projectId);
    const input: TauriDeleteDynastyInput = { id, branchId: query.branchId ?? null };
    await transport.request<void>({
      command: 'dynasties_delete',
      args: { input },
    });
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
    const response = await uploadFileViaTransport<TauriDynasty>('dynasties_upload_image', file, {
      id,
      branchId: query.branchId ?? null,
    });
    return { data: { success: true, data: toDynasty(response) } };
  },

  setTags: async (id: number, tagIds: number[], projectId: number): Promise<ApiResult<Dynasty>> => {
    const query = withBranchParams({}, projectId);
    const input: TauriSetDynastyTagsInput = {
      id,
      tagIds,
      branchId: query.branchId ?? null,
    };
    const response = await transport.request<TauriDynasty>({
      command: 'dynasties_set_tags',
      args: { input },
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
    const response = await transport.request<TauriDynastyMember>({
      command: 'dynasties_add_member',
      args: { input },
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
    const response = await transport.request<TauriDynastyMember>({
      command: 'dynasties_update_member',
      args: { input },
    });
    return toDynastyMemberResponse(response);
  },

  removeMember: async (dynastyId: number, memberId: number): Promise<ApiResult<undefined>> => {
    const input: TauriRemoveDynastyMemberInput = { dynastyId, memberId };
    await transport.request<void>({
      command: 'dynasties_remove_member',
      args: { input },
    });
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
    const response = await transport.request<TauriDynastyFamilyLink>({
      command: 'dynasties_add_family_link',
      args: { input },
    });
    return toDynastyFamilyLinkResponse(response);
  },

  deleteFamilyLink: async (
    dynastyId: number,
    linkId: number,
  ): Promise<ApiResult<undefined>> => {
    const input: TauriDeleteDynastyFamilyLinkInput = { dynastyId, linkId };
    await transport.request<void>({
      command: 'dynasties_delete_family_link',
      args: { input },
    });
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
    await transport.request<void>({
      command: 'dynasties_save_graph_positions',
      args: { input },
    });
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
    const response = await transport.request<TauriDynastyEvent>({
      command: 'dynasties_add_event',
      args: { input },
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
    const response = await transport.request<TauriDynastyEvent>({
      command: 'dynasties_update_event',
      args: { input },
    });
    return toDynastyEventResponse(response);
  },

  deleteEvent: async (dynastyId: number, eventId: number): Promise<ApiResult<undefined>> => {
    const input: TauriDeleteDynastyEventInput = { dynastyId, eventId };
    await transport.request<void>({
      command: 'dynasties_delete_event',
      args: { input },
    });
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
    const response = await transport.request<TauriDynasty>({
      command: 'dynasties_reorder_events',
      args: { input },
    });
    return toDynastyResponse(response);
  },
};
