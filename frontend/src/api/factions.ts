import type {
  ApiResponse,
  Faction,
  CreateFaction,
  UpdateFaction,
  FactionRank,
  CreateFactionRank,
  UpdateFactionRank,
  FactionMember,
  CreateFactionMember,
  UpdateFactionMember,
  FactionRelation,
  CreateFactionRelation,
  UpdateFactionRelation,
  CustomMetric,
  ReplaceFactionCustomMetrics,
  CompareFactionsInput,
  FactionCompareResult,
  FactionGraph,
  Tag,
  FactionPolicy,
  CreateFactionPolicy,
  UpdateFactionPolicy,
} from '@campaigner/shared';
import type {
  CompareFactionsInput as TauriCompareFactionsInput,
  CreateFactionInput as TauriCreateFactionInput,
  CreateFactionMemberInput as TauriCreateFactionMemberInput,
  CreateFactionPolicyInput as TauriCreateFactionPolicyInput,
  CreateFactionRankInput as TauriCreateFactionRankInput,
  CreateFactionRelationInput as TauriCreateFactionRelationInput,
  DeleteFactionInput as TauriDeleteFactionInput,
  DeleteFactionMemberInput as TauriDeleteFactionMemberInput,
  DeleteFactionPolicyInput as TauriDeleteFactionPolicyInput,
  DeleteFactionRankInput as TauriDeleteFactionRankInput,
  DeleteFactionRelationInput as TauriDeleteFactionRelationInput,
  Faction as TauriFaction,
  FactionCompareResult as TauriFactionCompareResult,
  FactionCustomMetric as TauriFactionCustomMetric,
  FactionGraph as TauriFactionGraph,
  FactionMember as TauriFactionMember,
  FactionPolicy as TauriFactionPolicy,
  FactionRank as TauriFactionRank,
  FactionRelation as TauriFactionRelation,
  FactionsListInput as TauriFactionsListInput,
  FactionsListResult as TauriFactionsListResult,
  FactionsRelationsListInput as TauriFactionsRelationsListInput,
  GetFactionInput as TauriGetFactionInput,
  ListFactionMembersInput as TauriListFactionMembersInput,
  ListFactionPoliciesInput as TauriListFactionPoliciesInput,
  ListFactionRanksInput as TauriListFactionRanksInput,
  ReplaceFactionCustomMetricsInput as TauriReplaceFactionCustomMetricsInput,
  SetFactionTagsInput as TauriSetFactionTagsInput,
  Tag as TauriTag,
  UpdateFactionInput as TauriUpdateFactionInput,
  UpdateFactionMemberInput as TauriUpdateFactionMemberInput,
  UpdateFactionPolicyInput as TauriUpdateFactionPolicyInput,
  UpdateFactionRankInput as TauriUpdateFactionRankInput,
  UpdateFactionRelationInput as TauriUpdateFactionRelationInput,
} from '@/types/generated/bindings';
import type { FactionsListParams, ListWithTotal } from './types';
import { transport } from './transport';
import { uploadFileViaTransport } from './uploadFile';
import { withBranchParams } from './withBranchParams';

type ApiResult<T> = { data: ApiResponse<T> };
type ListResult<T> = { data: ListWithTotal<T> };

const isApiResponse = <T>(value: unknown): value is ApiResponse<T> =>
  Boolean(value && typeof value === 'object' && 'success' in value);

const toTag = (tag: TauriTag): Tag => ({
  id: tag.id,
  name: tag.name,
  color: tag.color,
});

const toMetric = (metric: TauriFactionCustomMetric): CustomMetric => ({
  id: metric.id,
  name: metric.name,
  value: metric.value ?? 0,
  unit: metric.unit ?? null,
  sortOrder: metric.sortOrder,
  createdAt: metric.createdAt,
  updatedAt: metric.updatedAt,
});

const toRank = (rank: TauriFactionRank): FactionRank => ({
  id: rank.id,
  factionId: rank.factionId,
  name: rank.name,
  level: rank.level,
  description: rank.description,
  permissions: rank.permissions,
  icon: rank.icon,
  color: rank.color,
});

const toMember = (member: TauriFactionMember): FactionMember => ({
  id: member.id,
  factionId: member.factionId,
  characterId: member.characterId,
  rankId: member.rankId ?? undefined,
  role: member.role,
  joinedDate: member.joinedDate,
  leftDate: member.leftDate,
  isActive: member.isActive,
  notes: member.notes,
  characterName: member.characterName,
  characterImagePath: member.characterImagePath,
  rankName: member.rankName,
  rankLevel: member.rankLevel ?? undefined,
});

const toRelation = (relation: TauriFactionRelation): FactionRelation => ({
  id: relation.id,
  projectId: relation.projectId,
  sourceFactionId: relation.sourceFactionId,
  targetFactionId: relation.targetFactionId,
  relationType: relation.relationType,
  customLabel: relation.customLabel,
  description: relation.description,
  startedDate: relation.startedDate,
  isBidirectional: relation.isBidirectional,
  createdAt: relation.createdAt,
  sourceFactionName: relation.sourceFactionName,
  targetFactionName: relation.targetFactionName,
});

const toPolicy = (policy: TauriFactionPolicy): FactionPolicy => ({
  id: policy.id,
  factionId: policy.factionId,
  title: policy.title,
  type: policy.type as FactionPolicy['type'],
  status: policy.status as FactionPolicy['status'],
  category: policy.category as FactionPolicy['category'],
  enactedDate: policy.enactedDate ?? null,
  description: policy.description,
  sortOrder: policy.sortOrder,
  createdAt: policy.createdAt,
  updatedAt: policy.updatedAt,
});

const toFaction = (faction: TauriFaction): Faction => ({
  id: faction.id,
  projectId: faction.projectId,
  name: faction.name,
  kind: faction.kind === 'state' ? 'state' : 'faction',
  type: faction.type ?? null,
  motto: faction.motto,
  description: faction.description,
  history: faction.history,
  goals: faction.goals,
  headquarters: faction.headquarters,
  territory: faction.territory,
  rulingDynastyId: faction.rulingDynastyId ?? null,
  rulerCharacterId: faction.rulerCharacterId ?? null,
  treasury: faction.treasury ?? null,
  population: faction.population ?? null,
  armySize: faction.armySize ?? null,
  navySize: faction.navySize ?? null,
  territoryKm2: faction.territoryKm2 ?? null,
  annualIncome: faction.annualIncome ?? null,
  annualExpenses: faction.annualExpenses ?? null,
  membersCount: faction.membersCount ?? null,
  influence: faction.influence ?? null,
  status: faction.status,
  color: faction.color,
  secondaryColor: faction.secondaryColor,
  imagePath: faction.imagePath,
  bannerPath: faction.bannerPath,
  foundedDate: faction.foundedDate,
  disbandedDate: faction.disbandedDate,
  parentFactionId: faction.parentFactionId ?? undefined,
  sortOrder: faction.sortOrder,
  createdAt: faction.createdAt,
  updatedAt: faction.updatedAt,
  tags: faction.tags.map(toTag),
  customMetrics: faction.customMetrics.map(toMetric),
  ranks: faction.ranks.map(toRank),
  members: faction.members.map(toMember),
  memberCount: faction.memberCount,
  parentFaction: faction.parentFaction
    ? { id: faction.parentFaction.id, name: faction.parentFaction.name }
    : undefined,
  childFactions: faction.childFactions.map((item) => ({ id: item.id, name: item.name })),
  rulingDynasty: faction.rulingDynasty
    ? { id: faction.rulingDynasty.id, name: faction.rulingDynasty.name }
    : null,
  ruler: faction.ruler ? { id: faction.ruler.id, name: faction.ruler.name } : null,
  territories: faction.territories.map((item) => ({ id: item.id, name: item.name })),
});

const toGraph = (graph: TauriFactionGraph): FactionGraph => ({
  nodes: graph.nodes.map((node) => ({
    id: node.id,
    name: node.name,
    kind: node.kind as 'state' | 'faction',
    type: node.type ?? null,
    status: node.status,
    color: node.color,
    imagePath: node.imagePath,
    memberCount: node.memberCount,
  })),
  edges: graph.edges.map(toRelation),
});

const toCompare = (result: TauriFactionCompareResult): FactionCompareResult => ({
  factions: result.factions.map((item) => ({
    id: item.id,
    name: item.name,
    kind: item.kind === 'state' ? 'state' : 'faction',
  })),
  metrics: result.metrics.map((metric) => ({
    key: metric.key,
    label: metric.label,
    unit: metric.unit ?? null,
    values: metric.values.map((value) => ({ factionId: value.factionId, value: value.value ?? null })),
  })),
});

export const factionsApi = {
  getAll: async (projectId: number, params?: FactionsListParams): Promise<ListResult<Faction[]>> => {
    const query = withBranchParams({ projectId, ...params });
    const input: TauriFactionsListInput = {
      projectId: query.projectId,
      kind: query.kind ?? null,
      status: query.status ?? null,
      search: query.search ?? null,
      limit: query.limit ?? null,
      offset: query.offset ?? null,
      branchId: query.branchId ?? null,
    };

    const response = await transport.request<ListWithTotal<Faction[]> | TauriFactionsListResult>({
      http: {
        method: 'GET',
        path: '/factions',
        query,
      },
      tauri: {
        command: 'factions_list',
        args: { input },
      },
    });

    if ('success' in response) {
      return { data: response };
    }
    return {
      data: {
        success: true,
        data: response.items.map(toFaction),
        total: response.total,
      },
    };
  },
  getById: async (id: number, projectId: number): Promise<ApiResult<Faction>> => {
    const query = withBranchParams({}, projectId);
    const input: TauriGetFactionInput = { id, branchId: query.branchId ?? null };
    const response = await transport.request<ApiResponse<Faction> | TauriFaction>({
      http: {
        method: 'GET',
        path: `/factions/${id}`,
        query,
      },
      tauri: {
        command: 'factions_get',
        args: { input },
      },
    });
    if (isApiResponse<Faction>(response)) {
      return { data: response };
    }
    return { data: { success: true, data: toFaction(response) } };
  },
  create: async (data: CreateFaction): Promise<ApiResult<Faction>> => {
    const payload = withBranchParams({ ...data });
    const input: TauriCreateFactionInput = {
      projectId: payload.projectId,
      name: payload.name,
      kind: payload.kind ?? null,
      type: payload.type ?? null,
      motto: payload.motto ?? null,
      description: payload.description ?? null,
      history: payload.history ?? null,
      goals: payload.goals ?? null,
      headquarters: payload.headquarters ?? null,
      territory: payload.territory ?? null,
      rulingDynastyId: payload.rulingDynastyId ?? null,
      rulerCharacterId: payload.rulerCharacterId ?? null,
      territoryIds: payload.territoryIds ?? null,
      treasury: payload.treasury ?? null,
      population: payload.population ?? null,
      armySize: payload.armySize ?? null,
      navySize: payload.navySize ?? null,
      territoryKm2: payload.territoryKm2 ?? null,
      annualIncome: payload.annualIncome ?? null,
      annualExpenses: payload.annualExpenses ?? null,
      membersCount: payload.membersCount ?? null,
      influence: payload.influence ?? null,
      status: payload.status ?? null,
      color: payload.color ?? null,
      secondaryColor: payload.secondaryColor ?? null,
      foundedDate: payload.foundedDate ?? null,
      disbandedDate: payload.disbandedDate ?? null,
      parentFactionId: payload.parentFactionId ?? null,
      sortOrder: payload.sortOrder ?? null,
      branchId: payload.branchId ?? null,
    };
    const response = await transport.request<ApiResponse<Faction> | TauriFaction>({
      http: {
        method: 'POST',
        path: '/factions',
        body: payload,
      },
      tauri: {
        command: 'factions_create',
        args: { input },
      },
    });
    if (isApiResponse<Faction>(response)) {
      return { data: response };
    }
    return { data: { success: true, data: toFaction(response) } };
  },
  update: async (id: number, data: UpdateFaction, projectId: number): Promise<ApiResult<Faction>> => {
    const payload = withBranchParams({ ...data }, projectId);
    const input: TauriUpdateFactionInput = {
      id,
      name: payload.name ?? null,
      kind: payload.kind ?? null,
      type: payload.type ?? null,
      motto: payload.motto ?? null,
      description: payload.description ?? null,
      history: payload.history ?? null,
      goals: payload.goals ?? null,
      headquarters: payload.headquarters ?? null,
      territory: payload.territory ?? null,
      rulingDynastyId: payload.rulingDynastyId ?? null,
      rulerCharacterId: payload.rulerCharacterId ?? null,
      territoryIds: payload.territoryIds ?? null,
      treasury: payload.treasury ?? null,
      population: payload.population ?? null,
      armySize: payload.armySize ?? null,
      navySize: payload.navySize ?? null,
      territoryKm2: payload.territoryKm2 ?? null,
      annualIncome: payload.annualIncome ?? null,
      annualExpenses: payload.annualExpenses ?? null,
      membersCount: payload.membersCount ?? null,
      influence: payload.influence ?? null,
      status: payload.status ?? null,
      color: payload.color ?? null,
      secondaryColor: payload.secondaryColor ?? null,
      foundedDate: payload.foundedDate ?? null,
      disbandedDate: payload.disbandedDate ?? null,
      parentFactionId: payload.parentFactionId ?? null,
      sortOrder: payload.sortOrder ?? null,
      branchId: payload.branchId ?? null,
    };
    const response = await transport.request<ApiResponse<Faction> | TauriFaction>({
      http: {
        method: 'PUT',
        path: `/factions/${id}`,
        body: payload,
      },
      tauri: {
        command: 'factions_update',
        args: { input },
      },
    });
    if (isApiResponse<Faction>(response)) {
      return { data: response };
    }
    return { data: { success: true, data: toFaction(response) } };
  },
  delete: async (id: number, projectId: number): Promise<{ data: void }> => {
    const query = withBranchParams({}, projectId);
    const input: TauriDeleteFactionInput = {
      id,
      branchId: query.branchId ?? null,
    };
    await transport.request<void>({
      http: {
        method: 'DELETE',
        path: `/factions/${id}`,
        query,
      },
      tauri: {
        command: 'factions_delete',
        args: { input },
      },
    });
    return { data: undefined as void };
  },
  uploadImage: async (id: number, file: File, projectId: number) => {
    const query = withBranchParams({}, projectId);
    const response = await uploadFileViaTransport<TauriFaction>('factions_upload_image', file, {
      id,
      branchId: query.branchId ?? null,
    });
    return { data: { success: true, data: toFaction(response) } };
  },
  uploadBanner: async (id: number, file: File, projectId: number) => {
    const query = withBranchParams({}, projectId);
    const response = await uploadFileViaTransport<TauriFaction>('factions_upload_banner', file, {
      id,
      branchId: query.branchId ?? null,
    });
    return { data: { success: true, data: toFaction(response) } };
  },
  setTags: async (id: number, tagIds: number[], projectId: number): Promise<ApiResult<Tag[]>> => {
    const query = withBranchParams({}, projectId);
    const input: TauriSetFactionTagsInput = {
      id,
      tagIds,
      branchId: query.branchId ?? null,
    };
    const response = await transport.request<ApiResponse<Tag[]> | TauriTag[]>({
      http: {
        method: 'PUT',
        path: `/factions/${id}/tags`,
        body: { tagIds },
        query,
      },
      tauri: {
        command: 'factions_set_tags',
        args: { input },
      },
    });
    if (isApiResponse<Tag[]>(response)) {
      return { data: response };
    }
    return { data: { success: true, data: response.map(toTag) } };
  },
  getRanks: async (factionId: number, projectId: number): Promise<ApiResult<FactionRank[]>> => {
    const query = withBranchParams({}, projectId);
    const input: TauriListFactionRanksInput = {
      factionId,
      branchId: query.branchId ?? null,
    };
    const response = await transport.request<ApiResponse<FactionRank[]> | TauriFactionRank[]>({
      http: {
        method: 'GET',
        path: `/factions/${factionId}/ranks`,
        query,
      },
      tauri: {
        command: 'factions_ranks_list',
        args: { input },
      },
    });
    if (isApiResponse<FactionRank[]>(response)) {
      return { data: response };
    }
    return { data: { success: true, data: response.map(toRank) } };
  },
  createRank: async (factionId: number, data: CreateFactionRank, projectId: number): Promise<ApiResult<FactionRank>> => {
    const query = withBranchParams({}, projectId);
    const input: TauriCreateFactionRankInput = {
      factionId,
      name: data.name,
      level: data.level ?? null,
      description: data.description ?? null,
      permissions: data.permissions ?? null,
      icon: data.icon ?? null,
      color: data.color ?? null,
      branchId: query.branchId ?? null,
    };
    const response = await transport.request<ApiResponse<FactionRank> | TauriFactionRank>({
      http: {
        method: 'POST',
        path: `/factions/${factionId}/ranks`,
        body: data,
        query,
      },
      tauri: {
        command: 'factions_ranks_create',
        args: { input },
      },
    });
    if (isApiResponse<FactionRank>(response)) {
      return { data: response };
    }
    return { data: { success: true, data: toRank(response) } };
  },
  updateRank: async (
    factionId: number,
    rankId: number,
    data: UpdateFactionRank,
    projectId: number
  ): Promise<ApiResult<FactionRank>> => {
    const query = withBranchParams({}, projectId);
    const input: TauriUpdateFactionRankInput = {
      factionId,
      rankId,
      name: data.name ?? null,
      level: data.level ?? null,
      description: data.description ?? null,
      permissions: data.permissions ?? null,
      icon: data.icon ?? null,
      color: data.color ?? null,
      branchId: query.branchId ?? null,
    };
    const response = await transport.request<ApiResponse<FactionRank> | TauriFactionRank>({
      http: {
        method: 'PUT',
        path: `/factions/${factionId}/ranks/${rankId}`,
        body: data,
        query,
      },
      tauri: {
        command: 'factions_ranks_update',
        args: { input },
      },
    });
    if (isApiResponse<FactionRank>(response)) {
      return { data: response };
    }
    return { data: { success: true, data: toRank(response) } };
  },
  deleteRank: async (factionId: number, rankId: number, projectId: number): Promise<{ data: void }> => {
    const query = withBranchParams({}, projectId);
    const input: TauriDeleteFactionRankInput = {
      factionId,
      rankId,
      branchId: query.branchId ?? null,
    };
    await transport.request<void>({
      http: {
        method: 'DELETE',
        path: `/factions/${factionId}/ranks/${rankId}`,
        query,
      },
      tauri: {
        command: 'factions_ranks_delete',
        args: { input },
      },
    });
    return { data: undefined as void };
  },
  getMembers: async (factionId: number, projectId: number): Promise<ApiResult<FactionMember[]>> => {
    const query = withBranchParams({}, projectId);
    const input: TauriListFactionMembersInput = {
      factionId,
      branchId: query.branchId ?? null,
    };
    const response = await transport.request<ApiResponse<FactionMember[]> | TauriFactionMember[]>({
      http: {
        method: 'GET',
        path: `/factions/${factionId}/members`,
        query,
      },
      tauri: {
        command: 'factions_members_list',
        args: { input },
      },
    });
    if (isApiResponse<FactionMember[]>(response)) {
      return { data: response };
    }
    return { data: { success: true, data: response.map(toMember) } };
  },
  addMember: async (
    factionId: number,
    data: CreateFactionMember,
    projectId: number
  ): Promise<ApiResult<FactionMember>> => {
    const query = withBranchParams({}, projectId);
    const input: TauriCreateFactionMemberInput = {
      factionId,
      characterId: data.characterId,
      rankId: data.rankId ?? null,
      role: data.role ?? null,
      joinedDate: data.joinedDate ?? null,
      leftDate: data.leftDate ?? null,
      isActive: data.isActive ?? null,
      notes: data.notes ?? null,
      branchId: query.branchId ?? null,
    };
    const response = await transport.request<ApiResponse<FactionMember> | TauriFactionMember>({
      http: {
        method: 'POST',
        path: `/factions/${factionId}/members`,
        body: data,
        query,
      },
      tauri: {
        command: 'factions_members_create',
        args: { input },
      },
    });
    if (isApiResponse<FactionMember>(response)) {
      return { data: response };
    }
    return { data: { success: true, data: toMember(response) } };
  },
  updateMember: async (
    factionId: number,
    memberId: number,
    data: UpdateFactionMember
  ): Promise<ApiResult<FactionMember>> => {
    const input: TauriUpdateFactionMemberInput = {
      factionId,
      memberId,
      rankId: data.rankId ?? null,
      role: data.role ?? null,
      joinedDate: data.joinedDate ?? null,
      leftDate: data.leftDate ?? null,
      isActive: data.isActive ?? null,
      notes: data.notes ?? null,
    };
    const response = await transport.request<ApiResponse<FactionMember> | TauriFactionMember>({
      http: {
        method: 'PUT',
        path: `/factions/${factionId}/members/${memberId}`,
        body: data,
      },
      tauri: {
        command: 'factions_members_update',
        args: { input },
      },
    });
    if (isApiResponse<FactionMember>(response)) {
      return { data: response };
    }
    return { data: { success: true, data: toMember(response) } };
  },
  removeMember: async (factionId: number, memberId: number): Promise<{ data: void }> => {
    const input: TauriDeleteFactionMemberInput = { factionId, memberId };
    await transport.request<void>({
      http: {
        method: 'DELETE',
        path: `/factions/${factionId}/members/${memberId}`,
      },
      tauri: {
        command: 'factions_members_delete',
        args: { input },
      },
    });
    return { data: undefined as void };
  },
  replaceCustomMetrics: async (
    factionId: number,
    data: ReplaceFactionCustomMetrics,
    projectId: number
  ): Promise<ApiResult<CustomMetric[]>> => {
    const query = withBranchParams({}, projectId);
    const input: TauriReplaceFactionCustomMetricsInput = {
      factionId,
      metrics: data.metrics.map((metric) => ({
        id: metric.id ?? null,
        name: metric.name,
        value: metric.value,
        unit: metric.unit ?? null,
        sortOrder: metric.sortOrder ?? null,
      })),
      branchId: query.branchId ?? null,
    };
    const response = await transport.request<ApiResponse<CustomMetric[]> | TauriFactionCustomMetric[]>({
      http: {
        method: 'PUT',
        path: `/factions/${factionId}/custom-metrics`,
        body: data,
        query,
      },
      tauri: {
        command: 'factions_custom_metrics_replace',
        args: { input },
      },
    });
    if (isApiResponse<CustomMetric[]>(response)) {
      return { data: response };
    }
    return { data: { success: true, data: response.map(toMetric) } };
  },
  compare: async (data: CompareFactionsInput): Promise<ApiResult<FactionCompareResult>> => {
    const input: TauriCompareFactionsInput = {
      factionIds: data.factionIds,
      metricKeys: data.metricKeys,
    };
    const response = await transport.request<ApiResponse<FactionCompareResult> | TauriFactionCompareResult>({
      http: {
        method: 'POST',
        path: '/factions/compare',
        body: data,
      },
      tauri: {
        command: 'factions_compare',
        args: { input },
      },
    });
    if (isApiResponse<FactionCompareResult>(response)) {
      return { data: response };
    }
    return { data: { success: true, data: toCompare(response) } };
  },
  getRelations: async (projectId: number): Promise<ApiResult<FactionRelation[]>> => {
    const query = withBranchParams({ projectId });
    const input: TauriFactionsRelationsListInput = {
      projectId: query.projectId,
      branchId: query.branchId ?? null,
    };
    const response = await transport.request<ApiResponse<FactionRelation[]> | TauriFactionRelation[]>({
      http: {
        method: 'GET',
        path: '/factions/relations',
        query,
      },
      tauri: {
        command: 'factions_relations_list',
        args: { input },
      },
    });
    if (isApiResponse<FactionRelation[]>(response)) {
      return { data: response };
    }
    return { data: { success: true, data: response.map(toRelation) } };
  },
  createRelation: async (data: CreateFactionRelation): Promise<ApiResult<FactionRelation>> => {
    const payload = withBranchParams({ ...data });
    const input: TauriCreateFactionRelationInput = {
      projectId: payload.projectId,
      sourceFactionId: payload.sourceFactionId,
      targetFactionId: payload.targetFactionId,
      relationType: payload.relationType ?? null,
      customLabel: payload.customLabel ?? null,
      description: payload.description ?? null,
      startedDate: payload.startedDate ?? null,
      isBidirectional: payload.isBidirectional ?? null,
      branchId: payload.branchId ?? null,
    };
    const response = await transport.request<ApiResponse<FactionRelation> | TauriFactionRelation>({
      http: {
        method: 'POST',
        path: '/factions/relations',
        body: payload,
      },
      tauri: {
        command: 'factions_relations_create',
        args: { input },
      },
    });
    if (isApiResponse<FactionRelation>(response)) {
      return { data: response };
    }
    return { data: { success: true, data: toRelation(response) } };
  },
  updateRelation: async (relationId: number, data: UpdateFactionRelation): Promise<ApiResult<FactionRelation>> => {
    const input: TauriUpdateFactionRelationInput = {
      relationId,
      relationType: data.relationType ?? null,
      customLabel: data.customLabel ?? null,
      description: data.description ?? null,
      startedDate: data.startedDate ?? null,
      isBidirectional: data.isBidirectional ?? null,
    };
    const response = await transport.request<ApiResponse<FactionRelation> | TauriFactionRelation>({
      http: {
        method: 'PUT',
        path: `/factions/relations/${relationId}`,
        body: data,
      },
      tauri: {
        command: 'factions_relations_update',
        args: { input },
      },
    });
    if (isApiResponse<FactionRelation>(response)) {
      return { data: response };
    }
    return { data: { success: true, data: toRelation(response) } };
  },
  deleteRelation: async (relationId: number): Promise<{ data: void }> => {
    const input: TauriDeleteFactionRelationInput = { relationId };
    await transport.request<void>({
      http: {
        method: 'DELETE',
        path: `/factions/relations/${relationId}`,
      },
      tauri: {
        command: 'factions_relations_delete',
        args: { input },
      },
    });
    return { data: undefined as void };
  },
  getGraph: async (projectId: number): Promise<ApiResult<FactionGraph>> => {
    const query = withBranchParams({ projectId });
    const input: TauriFactionsRelationsListInput = {
      projectId: query.projectId,
      branchId: query.branchId ?? null,
    };
    const response = await transport.request<ApiResponse<FactionGraph> | TauriFactionGraph>({
      http: {
        method: 'GET',
        path: '/factions/graph',
        query,
      },
      tauri: {
        command: 'factions_graph',
        args: { input },
      },
    });
    if (isApiResponse<FactionGraph>(response)) {
      return { data: response };
    }
    return { data: { success: true, data: toGraph(response) } };
  },
  getPolicies: async (factionId: number, projectId: number): Promise<ApiResult<FactionPolicy[]>> => {
    const query = withBranchParams({}, projectId);
    const input: TauriListFactionPoliciesInput = {
      factionId,
      branchId: query.branchId ?? null,
    };
    const response = await transport.request<ApiResponse<FactionPolicy[]> | TauriFactionPolicy[]>({
      http: {
        method: 'GET',
        path: `/factions/${factionId}/policies`,
        query,
      },
      tauri: {
        command: 'factions_policies_list',
        args: { input },
      },
    });
    if (isApiResponse<FactionPolicy[]>(response)) {
      return { data: response };
    }
    return { data: { success: true, data: response.map(toPolicy) } };
  },
  createPolicy: async (
    factionId: number,
    data: CreateFactionPolicy,
    projectId: number
  ): Promise<ApiResult<FactionPolicy>> => {
    const query = withBranchParams({}, projectId);
    const input: TauriCreateFactionPolicyInput = {
      factionId,
      title: data.title,
      type: data.type,
      status: data.status ?? null,
      category: data.category ?? null,
      enactedDate: data.enactedDate ?? null,
      description: data.description ?? null,
      sortOrder: data.sortOrder ?? null,
      branchId: query.branchId ?? null,
    };
    const response = await transport.request<ApiResponse<FactionPolicy> | TauriFactionPolicy>({
      http: {
        method: 'POST',
        path: `/factions/${factionId}/policies`,
        body: data,
        query,
      },
      tauri: {
        command: 'factions_policies_create',
        args: { input },
      },
    });
    if (isApiResponse<FactionPolicy>(response)) {
      return { data: response };
    }
    return { data: { success: true, data: toPolicy(response) } };
  },
  updatePolicy: async (
    factionId: number,
    policyId: number,
    data: UpdateFactionPolicy,
    projectId: number
  ): Promise<ApiResult<FactionPolicy>> => {
    const query = withBranchParams({}, projectId);
    const input: TauriUpdateFactionPolicyInput = {
      factionId,
      policyId,
      title: data.title ?? null,
      type: data.type ?? null,
      status: data.status ?? null,
      category: data.category ?? null,
      enactedDate: data.enactedDate ?? null,
      description: data.description ?? null,
      sortOrder: data.sortOrder ?? null,
      branchId: query.branchId ?? null,
    };
    const response = await transport.request<ApiResponse<FactionPolicy> | TauriFactionPolicy>({
      http: {
        method: 'PUT',
        path: `/factions/${factionId}/policies/${policyId}`,
        body: data,
        query,
      },
      tauri: {
        command: 'factions_policies_update',
        args: { input },
      },
    });
    if (isApiResponse<FactionPolicy>(response)) {
      return { data: response };
    }
    return { data: { success: true, data: toPolicy(response) } };
  },
  deletePolicy: async (factionId: number, policyId: number, projectId: number): Promise<{ data: void }> => {
    const query = withBranchParams({}, projectId);
    const input: TauriDeleteFactionPolicyInput = {
      factionId,
      policyId,
      branchId: query.branchId ?? null,
    };
    await transport.request<void>({
      http: {
        method: 'DELETE',
        path: `/factions/${factionId}/policies/${policyId}`,
        query,
      },
      tauri: {
        command: 'factions_policies_delete',
        args: { input },
      },
    });
    return { data: undefined as void };
  },
};
