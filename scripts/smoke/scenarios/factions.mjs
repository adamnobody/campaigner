import { api, assertStatus, getEntityId, getEntityList, logStep, logOk } from '../lib.mjs';

export async function smokeFactions(ctx) {
  logStep('Factions CRUD');

  const createRes = await api('/factions', {
    method: 'POST',
    body: JSON.stringify({
      projectId: ctx.projectId,
      name: `Smoke Faction ${Date.now()}`,
      type: 'guild',
      motto: 'Smoke and steel',
      description: 'Faction created by smoke test',
      status: 'active',
      parentFactionId: null,
    }),
  });

  assertStatus(createRes, 201, 'create faction');

  const factionId = getEntityId(createRes);
  if (!factionId) {
    throw new Error(`create faction: missing faction id in response ${JSON.stringify(createRes.data, null, 2)}`);
  }

  ctx.factionId = factionId;
  logOk(`Faction created: #${factionId}`);

  const listRes = await api(`/factions?projectId=${ctx.projectId}&limit=50&offset=0`);
  assertStatus(listRes, 200, 'list factions');

  const factions = getEntityList(listRes, 'list factions');
  if (!factions.some((f) => f.id === factionId)) {
    throw new Error(`list factions: created faction #${factionId} not found`);
  }

  logOk('Faction list works');

  const getRes = await api(`/factions/${factionId}`);
  assertStatus(getRes, 200, 'get faction by id');

  const loadedFaction = getRes.data?.data;
  if (!loadedFaction || loadedFaction.id !== factionId) {
    throw new Error(`get faction by id: wrong response ${JSON.stringify(getRes.data, null, 2)}`);
  }

  logOk('Faction getById works');

  const updateRes = await api(`/factions/${factionId}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: `Smoke Faction Updated ${Date.now()}`,
      motto: 'Updated motto',
      parentFactionId: null,
    }),
  });

  assertStatus(updateRes, 200, 'update faction');
  logOk('Faction updated');

  if (ctx.tagId) {
    const setTagsRes = await api(`/factions/${factionId}/tags`, {
      method: 'PUT',
      body: JSON.stringify({
        tagIds: [ctx.tagId],
      }),
    });

    assertStatus(setTagsRes, 200, 'set faction tags');
    logOk('Faction tags assigned');
  }
}

export async function smokeFactionRanks(ctx) {
  logStep('Faction Ranks');

  const createRes = await api(`/factions/${ctx.factionId}/ranks`, {
    method: 'POST',
    body: JSON.stringify({
      name: 'Smoke Rank',
      level: 10,
      description: 'Rank created by smoke test',
      permissions: 'all',
      icon: '⚔️',
      color: '#ef4444',
    }),
  });

  assertStatus(createRes, 201, 'create faction rank');

  const rankId = getEntityId(createRes);
  if (!rankId) {
    throw new Error(`create faction rank: missing id ${JSON.stringify(createRes.data, null, 2)}`);
  }

  ctx.factionRankId = rankId;
  logOk(`Faction rank created: #${rankId}`);

  const listRes = await api(`/factions/${ctx.factionId}/ranks`);
  assertStatus(listRes, 200, 'list faction ranks');

  const ranks = getEntityList(listRes, 'list faction ranks');
  if (!ranks.some((r) => r.id === rankId)) {
    throw new Error(`list faction ranks: created rank #${rankId} not found`);
  }

  logOk('Faction ranks list works');

  const updateRes = await api(`/factions/${ctx.factionId}/ranks/${rankId}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: 'Smoke Rank Updated',
      level: 20,
      description: 'Updated by smoke test',
    }),
  });

  assertStatus(updateRes, 200, 'update faction rank');
  logOk('Faction rank updated');
}

export async function smokeFactionMembers(ctx) {
  logStep('Faction Members');

  const createRes = await api(`/factions/${ctx.factionId}/members`, {
    method: 'POST',
    body: JSON.stringify({
      characterId: ctx.characterId,
      rankId: ctx.factionRankId,
      role: 'Smoke operative',
      joinedDate: 'Year 100',
      isActive: true,
      notes: 'Added by smoke test',
    }),
  });

  assertStatus(createRes, 201, 'create faction member');

  const memberId = getEntityId(createRes);
  if (!memberId) {
    throw new Error(`create faction member: missing id ${JSON.stringify(createRes.data, null, 2)}`);
  }

  ctx.factionMemberId = memberId;
  logOk(`Faction member created: #${memberId}`);

  const listRes = await api(`/factions/${ctx.factionId}/members`);
  assertStatus(listRes, 200, 'list faction members');

  const members = getEntityList(listRes, 'list faction members');
  if (!members.some((m) => m.id === memberId)) {
    throw new Error(`list faction members: created member #${memberId} not found`);
  }

  logOk('Faction members list works');

  const updateRes = await api(`/factions/${ctx.factionId}/members/${memberId}`, {
    method: 'PUT',
    body: JSON.stringify({
      role: 'Smoke operative updated',
      isActive: false,
      notes: 'Updated by smoke test',
    }),
  });

  assertStatus(updateRes, 200, 'update faction member');
  logOk('Faction member updated');
}

export async function smokeFactionRelations(ctx) {
  logStep('Faction Relations');

  const secondFactionRes = await api('/factions', {
    method: 'POST',
    body: JSON.stringify({
      projectId: ctx.projectId,
      name: `Smoke Faction Secondary ${Date.now()}`,
      type: 'order',
      motto: 'Second faction',
      description: 'Secondary faction for relation testing',
      status: 'active',
      parentFactionId: null,
    }),
  });

  assertStatus(secondFactionRes, 201, 'create secondary faction');

  const secondaryFactionId = getEntityId(secondFactionRes);
  if (!secondaryFactionId) {
    throw new Error(`create secondary faction: missing id ${JSON.stringify(secondFactionRes.data, null, 2)}`);
  }

  ctx.secondaryFactionId = secondaryFactionId;
  logOk(`Secondary faction created: #${secondaryFactionId}`);

  const createRelRes = await api('/factions/relations', {
    method: 'POST',
    body: JSON.stringify({
      projectId: ctx.projectId,
      sourceFactionId: ctx.factionId,
      targetFactionId: secondaryFactionId,
      relationType: 'alliance',
      customLabel: '',
      description: 'Created by smoke test',
      startedDate: 'Year 101',
      isBidirectional: true,
    }),
  });

  assertStatus(createRelRes, 201, 'create faction relation');

  const relationId = getEntityId(createRelRes);
  if (!relationId) {
    throw new Error(`create faction relation: missing id ${JSON.stringify(createRelRes.data, null, 2)}`);
  }

  ctx.factionRelationId = relationId;
  logOk(`Faction relation created: #${relationId}`);

  const listRes = await api(`/factions/relations?projectId=${ctx.projectId}`);
  assertStatus(listRes, 200, 'list faction relations');

  const relations = getEntityList(listRes, 'list faction relations');
  if (!relations.some((r) => r.id === relationId)) {
    throw new Error(`list faction relations: created relation #${relationId} not found`);
  }

  logOk('Faction relations list works');

  const updateRes = await api(`/factions/relations/${relationId}`, {
    method: 'PUT',
    body: JSON.stringify({
      relationType: 'trade',
      description: 'Updated by smoke test',
      isBidirectional: false,
    }),
  });

  assertStatus(updateRes, 200, 'update faction relation');
  logOk('Faction relation updated');

  const graphRes = await api(`/factions/graph?projectId=${ctx.projectId}`);
  assertStatus(graphRes, 200, 'faction graph');

  const graph = graphRes.data?.data;
  if (!graph) {
    throw new Error(`faction graph: missing graph payload ${JSON.stringify(graphRes.data, null, 2)}`);
  }

  const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
  const edges = Array.isArray(graph.edges) ? graph.edges : [];

  if (!nodes.some((n) => n.id === ctx.factionId) || !nodes.some((n) => n.id === secondaryFactionId)) {
    throw new Error(`faction graph: expected both faction nodes in graph ${JSON.stringify(graphRes.data, null, 2)}`);
  }

  if (!edges.some((e) => e.id === relationId || e.relationId === relationId)) {
    throw new Error(`faction graph: expected relation edge #${relationId} in graph ${JSON.stringify(graphRes.data, null, 2)}`);
  }

  logOk('Faction graph works');
}