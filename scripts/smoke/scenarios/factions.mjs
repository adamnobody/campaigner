import { api, assertStatus, getEntityId, getEntityList, logStep, logOk } from '../lib.mjs';

export async function smokeFactions(ctx) {
  logStep('Factions CRUD');

  const createRes = await api('/factions', {
    method: 'POST',
    body: JSON.stringify({
      projectId: ctx.projectId,
      name: `Smoke Faction ${Date.now()}`,
      kind: 'faction',
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
  if (loadedFaction.kind !== 'faction' || loadedFaction.type !== 'guild') {
    throw new Error(`faction semantic type mismatch: ${JSON.stringify(loadedFaction, null, 2)}`);
  }

  logOk('Faction getById works');

  const updateFactionMetricsRes = await api(`/factions/${factionId}`, {
    method: 'PUT',
    body: JSON.stringify({
      treasury: 120000,
      membersCount: 360,
      influence: 78,
      annualIncome: 45000,
      annualExpenses: 30000,
    }),
  });
  assertStatus(updateFactionMetricsRes, 200, 'update faction base metrics');

  const factionWithMetricsRes = await api(`/factions/${factionId}`);
  assertStatus(factionWithMetricsRes, 200, 'read faction base metrics');
  const factionWithMetrics = factionWithMetricsRes.data?.data;
  if (
    factionWithMetrics?.treasury !== 120000
    || factionWithMetrics?.membersCount !== 360
    || factionWithMetrics?.influence !== 78
  ) {
    throw new Error(`faction base metrics mismatch: ${JSON.stringify(factionWithMetrics, null, 2)}`);
  }
  logOk('Faction base metrics persisted');

  const invalidFactionMetricRes = await api(`/factions/${factionId}`, {
    method: 'PUT',
    body: JSON.stringify({
      armySize: 5000,
    }),
  });
  if (invalidFactionMetricRes.status !== 400) {
    throw new Error(`expected 400 for invalid faction metric, got ${invalidFactionMetricRes.status}`);
  }
  logOk('Invalid metric for kind=faction is rejected');

  const invalidInfluenceRes = await api(`/factions/${factionId}`, {
    method: 'PUT',
    body: JSON.stringify({
      influence: 150,
    }),
  });
  if (invalidInfluenceRes.status !== 400) {
    throw new Error(`expected 400 for influence > 100, got ${invalidInfluenceRes.status}`);
  }
  logOk('Influence range validation works');

  const addCustomMetricsRes = await api(`/factions/${factionId}/custom-metrics`, {
    method: 'PUT',
    body: JSON.stringify({
      metrics: [
        { name: 'Количество драконов', value: 3, unit: 'шт.' },
        { name: 'Рудники', value: 12, unit: 'ед.' },
        { name: 'Караваны', value: 18, unit: null },
      ],
    }),
  });
  assertStatus(addCustomMetricsRes, 200, 'replace custom metrics with three items');

  const factionWithCustomMetricsRes = await api(`/factions/${factionId}`);
  assertStatus(factionWithCustomMetricsRes, 200, 'read custom metrics');
  const customMetrics = factionWithCustomMetricsRes.data?.data?.customMetrics || [];
  if (customMetrics.length !== 3) {
    throw new Error(`expected 3 custom metrics, got ${customMetrics.length}`);
  }
  logOk('Custom metrics persisted');

  const replaceCustomMetricsRes = await api(`/factions/${factionId}/custom-metrics`, {
    method: 'PUT',
    body: JSON.stringify({
      metrics: [{ name: 'Артефакты', value: 42, unit: 'шт.' }],
    }),
  });
  assertStatus(replaceCustomMetricsRes, 200, 'replace custom metrics with one item');
  const factionAfterReplaceCustomRes = await api(`/factions/${factionId}`);
  assertStatus(factionAfterReplaceCustomRes, 200, 'read custom metrics after replace');
  const replacedCustomMetrics = factionAfterReplaceCustomRes.data?.data?.customMetrics || [];
  if (replacedCustomMetrics.length !== 1 || replacedCustomMetrics[0]?.name !== 'Артефакты') {
    throw new Error(`replace custom metrics failed: ${JSON.stringify(replacedCustomMetrics, null, 2)}`);
  }
  logOk('Custom metrics replace-all works');

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

  const createStateOneRes = await api('/factions', {
    method: 'POST',
    body: JSON.stringify({
      projectId: ctx.projectId,
      name: `Smoke State One ${Date.now()}`,
      kind: 'state',
      type: 'empire',
      treasury: 700000,
      population: 1000000,
      armySize: 70000,
      navySize: 5000,
      territoryKm2: 200000,
      annualIncome: 900000,
      annualExpenses: 680000,
    }),
  });
  assertStatus(createStateOneRes, 201, 'create first state with metrics');
  const stateOneId = getEntityId(createStateOneRes);
  if (!stateOneId) throw new Error('missing first state id');

  const stateNullForeignMetricRes = await api(`/factions/${stateOneId}`, {
    method: 'PUT',
    body: JSON.stringify({
      membersCount: null,
    }),
  });
  assertStatus(stateNullForeignMetricRes, 200, 'state accepts null foreign metric');
  logOk('Foreign metric with null value is ignored for state');

  const stateInvalidForeignMetricRes = await api(`/factions/${stateOneId}`, {
    method: 'PUT',
    body: JSON.stringify({
      membersCount: 42,
    }),
  });
  if (stateInvalidForeignMetricRes.status !== 400) {
    throw new Error(`expected 400 for state membersCount=42, got ${stateInvalidForeignMetricRes.status}`);
  }
  logOk('Foreign metric with non-null value is rejected for state');

  const createStateTwoRes = await api('/factions', {
    method: 'POST',
    body: JSON.stringify({
      projectId: ctx.projectId,
      name: `Smoke State Two ${Date.now()}`,
      kind: 'state',
      type: 'kingdom',
      treasury: 350000,
      population: 500000,
      armySize: 30000,
      navySize: 2500,
      territoryKm2: 120000,
      annualIncome: 500000,
      annualExpenses: 450000,
    }),
  });
  assertStatus(createStateTwoRes, 201, 'create second state with metrics');
  const stateTwoId = getEntityId(createStateTwoRes);
  if (!stateTwoId) throw new Error('missing second state id');

  const compareStatesRes = await api('/factions/compare', {
    method: 'POST',
    body: JSON.stringify({
      factionIds: [stateOneId, stateTwoId],
      metricKeys: ['treasury', 'population', 'army_size'],
    }),
  });
  assertStatus(compareStatesRes, 200, 'compare factions metrics');
  const comparePayload = compareStatesRes.data?.data;
  if (!Array.isArray(comparePayload?.factions) || !Array.isArray(comparePayload?.metrics) || comparePayload.metrics.length !== 3) {
    throw new Error(`compare payload invalid: ${JSON.stringify(compareStatesRes.data, null, 2)}`);
  }
  logOk('Factions compare endpoint works');

  const invalidCompareMetricRes = await api('/factions/compare', {
    method: 'POST',
    body: JSON.stringify({
      factionIds: [stateOneId, stateTwoId],
      metricKeys: ['invalid_metric'],
    }),
  });
  if (invalidCompareMetricRes.status !== 400) {
    throw new Error(`expected 400 for invalid metric key, got ${invalidCompareMetricRes.status}`);
  }
  logOk('Invalid compare metric key is rejected');

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
      kind: 'faction',
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

export async function smokeFactionAmbitions(ctx) {
  logStep('Faction Ambitions');

  const catalogRes = await api(`/ambitions?projectId=${ctx.projectId}`);
  assertStatus(catalogRes, 200, 'get ambitions catalog');

  const catalog = getEntityList(catalogRes, 'get ambitions catalog');
  if (catalog.length < 25) {
    throw new Error(`ambitions catalog: expected at least 25 entries, got ${catalog.length}`);
  }
  logOk(`Ambitions catalog loaded: ${catalog.length}`);

  const isolation = catalog.find((item) => item.name === 'Изоляционизм');
  const tradeDominance = catalog.find((item) => item.name === 'Торговая доминация');
  if (!isolation || !tradeDominance) {
    throw new Error('ambitions exclusions: required predefined ambitions not found');
  }

  const updateExclusionsRes = await api(`/ambitions/${isolation.id}/exclusions`, {
    method: 'PATCH',
    body: JSON.stringify({ excludedIds: [tradeDominance.id] }),
  });
  assertStatus(updateExclusionsRes, 200, 'update exclusions for predefined ambition');
  logOk('Predefined ambition exclusions updated');

  const assignIsolationRes = await api(`/factions/${ctx.factionId}/ambitions`, {
    method: 'POST',
    body: JSON.stringify({ ambitionId: isolation.id }),
  });
  assertStatus(assignIsolationRes, 204, 'assign isolation ambition');
  logOk('Assigned first ambition');

  const assignTradeRes = await api(`/factions/${ctx.factionId}/ambitions`, {
    method: 'POST',
    body: JSON.stringify({ ambitionId: tradeDominance.id }),
  });
  if (assignTradeRes.status !== 400) {
    throw new Error(
      `expected assignment conflict for excluded ambition, got status ${assignTradeRes.status}: ${JSON.stringify(assignTradeRes.data, null, 2)}`
    );
  }
  logOk('Excluded ambition assignment is blocked');

  const unassignIsolationRes = await api(`/factions/${ctx.factionId}/ambitions/${isolation.id}`, {
    method: 'DELETE',
  });
  assertStatus(unassignIsolationRes, 204, 'detach isolation ambition');
  logOk('Detached first ambition after conflict check');

  const createRes = await api('/ambitions', {
    method: 'POST',
    body: JSON.stringify({
      projectId: ctx.projectId,
      name: `Smoke Ambition ${Date.now()}`,
      description: 'Custom ambition created by smoke test',
      iconPath: '/ambitions/industrializatsiya.svg',
    }),
  });
  assertStatus(createRes, 201, 'create custom ambition');

  const customAmbitionId = getEntityId(createRes);
  if (!customAmbitionId) {
    throw new Error(`create custom ambition: missing id ${JSON.stringify(createRes.data, null, 2)}`);
  }
  ctx.customAmbitionId = customAmbitionId;
  logOk(`Custom ambition created: #${customAmbitionId}`);

  const attachRes = await api(`/factions/${ctx.factionId}/ambitions`, {
    method: 'POST',
    body: JSON.stringify({ ambitionId: customAmbitionId }),
  });
  assertStatus(attachRes, 204, 'attach ambition to faction');
  logOk('Ambition attached to faction');

  const factionAmbitionsRes = await api(`/factions/${ctx.factionId}/ambitions`);
  assertStatus(factionAmbitionsRes, 200, 'list faction ambitions');

  const factionAmbitions = getEntityList(factionAmbitionsRes, 'list faction ambitions');
  if (!factionAmbitions.some((ambition) => ambition.id === customAmbitionId)) {
    throw new Error(`list faction ambitions: custom ambition #${customAmbitionId} not found`);
  }
  logOk('Faction ambitions list works');

  const detachRes = await api(`/factions/${ctx.factionId}/ambitions/${customAmbitionId}`, {
    method: 'DELETE',
  });
  assertStatus(detachRes, 204, 'detach ambition from faction');
  logOk('Ambition detached from faction');

  const deleteRes = await api(`/ambitions/${customAmbitionId}`, { method: 'DELETE' });
  assertStatus(deleteRes, 204, 'delete custom ambition');
  ctx.customAmbitionId = null;
  logOk('Custom ambition deleted');
}

export async function smokeCharacterFactionAffiliations(ctx) {
  logStep('Character ↔ State/Factions affiliations');

  const createStateRes = await api('/factions', {
    method: 'POST',
    body: JSON.stringify({
      projectId: ctx.projectId,
      name: `Smoke State ${Date.now()}`,
      kind: 'state',
      type: 'empire',
      status: 'active',
    }),
  });
  assertStatus(createStateRes, 201, 'create state');
  const stateId = getEntityId(createStateRes);
  if (!stateId) {
    throw new Error(`create state: missing id ${JSON.stringify(createStateRes.data, null, 2)}`);
  }
  ctx.stateId = stateId;
  logOk(`State created: #${stateId}`);

  const createFactionRes = await api('/factions', {
    method: 'POST',
    body: JSON.stringify({
      projectId: ctx.projectId,
      name: `Smoke Character Faction ${Date.now()}`,
      kind: 'faction',
      type: 'guild',
      status: 'active',
    }),
  });
  assertStatus(createFactionRes, 201, 'create extra faction');
  const extraFactionId = getEntityId(createFactionRes);
  if (!extraFactionId) {
    throw new Error(`create extra faction: missing id ${JSON.stringify(createFactionRes.data, null, 2)}`);
  }
  ctx.extraFactionId = extraFactionId;
  logOk(`Extra faction created: #${extraFactionId}`);

  const setAffiliationsRes = await api(`/characters/${ctx.characterId}`, {
    method: 'PUT',
    body: JSON.stringify({
      stateId,
      factionIds: [ctx.factionId, extraFactionId],
    }),
  });
  assertStatus(setAffiliationsRes, 200, 'set character affiliations');

  const getCharacterRes = await api(`/characters/${ctx.characterId}`);
  assertStatus(getCharacterRes, 200, 'get character with affiliations');
  const loadedCharacter = getCharacterRes.data?.data;
  const factionIds = Array.isArray(loadedCharacter?.factionIds) ? loadedCharacter.factionIds : [];
  if (loadedCharacter?.stateId !== stateId) {
    throw new Error(`character state mismatch: expected ${stateId}, got ${loadedCharacter?.stateId}`);
  }
  if (!factionIds.includes(ctx.factionId) || !factionIds.includes(extraFactionId)) {
    throw new Error(`character factionIds mismatch: ${JSON.stringify(factionIds)}`);
  }
  logOk('Character linked to one state and multiple factions');

  const getExtraFactionMembersRes = await api(`/factions/${extraFactionId}/members`);
  assertStatus(getExtraFactionMembersRes, 200, 'list extra faction members after character update');
  const extraMembersAfterCharacterUpdate = getEntityList(
    getExtraFactionMembersRes,
    'list extra faction members after character update'
  );
  const extraSyncedMember = extraMembersAfterCharacterUpdate.find((member) => member.characterId === ctx.characterId);
  if (!extraSyncedMember) {
    throw new Error('character→faction sync failed: member not created in faction_members');
  }
  if (extraSyncedMember.role !== 'Член фракции') {
    throw new Error(
      `character→faction sync failed: expected default role "Член фракции", got "${extraSyncedMember.role}"`
    );
  }
  logOk('Character → faction sync creates member with default role');

  const removeAffiliationRes = await api(`/characters/${ctx.characterId}`, {
    method: 'PUT',
    body: JSON.stringify({
      factionIds: [ctx.factionId],
    }),
  });
  assertStatus(removeAffiliationRes, 200, 'remove character affiliation');

  const getExtraFactionMembersAfterRemovalRes = await api(`/factions/${extraFactionId}/members`);
  assertStatus(getExtraFactionMembersAfterRemovalRes, 200, 'list extra faction members after affiliation removal');
  const extraMembersAfterRemoval = getEntityList(
    getExtraFactionMembersAfterRemovalRes,
    'list extra faction members after affiliation removal'
  );
  if (extraMembersAfterRemoval.some((member) => member.characterId === ctx.characterId)) {
    throw new Error('character→faction sync failed: removed affiliation still exists in faction_members');
  }
  logOk('Character → faction sync removes member on affiliation delete');

  const addMemberFromFactionRes = await api(`/factions/${extraFactionId}/members`, {
    method: 'POST',
    body: JSON.stringify({
      characterId: ctx.characterId,
      role: 'Смотритель рубежей',
    }),
  });
  assertStatus(addMemberFromFactionRes, 201, 'add member from faction page');
  const extraFactionMemberId = getEntityId(addMemberFromFactionRes);
  if (!extraFactionMemberId) {
    throw new Error(`add member from faction page: missing id ${JSON.stringify(addMemberFromFactionRes.data, null, 2)}`);
  }

  const getCharacterAfterFactionAddRes = await api(`/characters/${ctx.characterId}`);
  assertStatus(getCharacterAfterFactionAddRes, 200, 'get character after faction member add');
  const characterAfterFactionAdd = getCharacterAfterFactionAddRes.data?.data;
  const factionIdsAfterFactionAdd = Array.isArray(characterAfterFactionAdd?.factionIds)
    ? characterAfterFactionAdd.factionIds
    : [];
  if (!factionIdsAfterFactionAdd.includes(extraFactionId)) {
    throw new Error('faction→character sync failed: faction link missing after member add');
  }
  logOk('Faction → character sync adds factionId');

  const removeMemberFromFactionRes = await api(`/factions/${extraFactionId}/members/${extraFactionMemberId}`, {
    method: 'DELETE',
  });
  assertStatus(removeMemberFromFactionRes, 200, 'remove member from faction page');

  const getCharacterAfterFactionRemoveRes = await api(`/characters/${ctx.characterId}`);
  assertStatus(getCharacterAfterFactionRemoveRes, 200, 'get character after faction member remove');
  const characterAfterFactionRemove = getCharacterAfterFactionRemoveRes.data?.data;
  const factionIdsAfterFactionRemove = Array.isArray(characterAfterFactionRemove?.factionIds)
    ? characterAfterFactionRemove.factionIds
    : [];
  if (factionIdsAfterFactionRemove.includes(extraFactionId)) {
    throw new Error('faction→character sync failed: faction link still exists after member delete');
  }
  logOk('Faction → character sync removes factionId');

  const invalidStateRes = await api(`/characters/${ctx.characterId}`, {
    method: 'PUT',
    body: JSON.stringify({
      stateId: ctx.factionId,
    }),
  });
  if (invalidStateRes.status !== 400) {
    throw new Error(
      `expected 400 for invalid state assignment, got ${invalidStateRes.status}: ${JSON.stringify(invalidStateRes.data, null, 2)}`
    );
  }
  logOk('State type validation works');
}