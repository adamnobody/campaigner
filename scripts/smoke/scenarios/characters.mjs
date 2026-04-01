import { api, assertStatus, getEntityId, getEntityList, logStep, logOk } from '../lib.mjs';

export async function smokeCharacters(ctx) {
  logStep('Characters CRUD');

  ctx.uniqueCharacterName = `Smoke Character ${Date.now()}`;

  const createRes = await api('/characters', {
    method: 'POST',
    body: JSON.stringify({
      projectId: ctx.projectId,
      name: ctx.uniqueCharacterName,
      title: 'The Tester',
      race: 'Human',
      characterClass: 'Wizard',
      level: 5,
      status: 'alive',
      bio: 'Created by smoke test',
      appearance: 'Looks suspiciously automated',
      personality: 'Calm and methodical',
      backstory: 'Born in a CI pipeline',
      notes: 'No additional notes',
    }),
  });

  assertStatus(createRes, 201, 'create character');

  const characterId = getEntityId(createRes);
  if (!characterId) {
    throw new Error(`create character: missing character id in response ${JSON.stringify(createRes.data, null, 2)}`);
  }

  ctx.characterId = characterId;
  logOk(`Character created: #${characterId}`);

  const listRes = await api(`/characters?projectId=${ctx.projectId}&limit=50&page=1`);
  assertStatus(listRes, 200, 'list characters');

  const characters = getEntityList(listRes, 'list characters');
  if (!characters.some((c) => c.id === characterId)) {
    throw new Error(`list characters: created character #${characterId} not found`);
  }

  logOk('Character list works');

  const getRes = await api(`/characters/${characterId}`);
  assertStatus(getRes, 200, 'get character by id');

  const loadedCharacter = getRes.data?.data;
  if (!loadedCharacter || loadedCharacter.id !== characterId) {
    throw new Error(`get character by id: wrong response ${JSON.stringify(getRes.data, null, 2)}`);
  }

  logOk('Character getById works');

  const updateRes = await api(`/characters/${characterId}`, {
    method: 'PUT',
    body: JSON.stringify({
      title: 'The Updated Tester',
      level: 6,
      bio: 'Updated by smoke test',
    }),
  });

  assertStatus(updateRes, 200, 'update character');
  logOk('Character updated');

  if (ctx.tagId) {
    const setTagsRes = await api(`/characters/${characterId}/tags`, {
      method: 'PUT',
      body: JSON.stringify({
        tagIds: [ctx.tagId],
      }),
    });

    assertStatus(setTagsRes, 200, 'set character tags');
    logOk('Character tags assigned');
  }
}

export async function smokeCharacterRelationships(ctx) {
  logStep('Character Relationships');

  ctx.uniqueSecondaryCharacterName = `Smoke Character Secondary ${Date.now()}`;

  const secondCharacterRes = await api('/characters', {
    method: 'POST',
    body: JSON.stringify({
      projectId: ctx.projectId,
      name: ctx.uniqueSecondaryCharacterName,
      title: 'The Counterpart',
      race: 'Elf',
      characterClass: 'Rogue',
      level: 4,
      status: 'alive',
      bio: 'Second character for relationship testing',
      appearance: '',
      personality: '',
      backstory: '',
      notes: '',
    }),
  });

  assertStatus(secondCharacterRes, 201, 'create secondary character');

  const secondaryCharacterId = getEntityId(secondCharacterRes);
  if (!secondaryCharacterId) {
    throw new Error(`create secondary character: missing id ${JSON.stringify(secondCharacterRes.data, null, 2)}`);
  }

  ctx.secondaryCharacterId = secondaryCharacterId;
  logOk(`Secondary character created: #${secondaryCharacterId}`);

  const createRelRes = await api('/characters/relationships', {
    method: 'POST',
    body: JSON.stringify({
      projectId: ctx.projectId,
      sourceCharacterId: ctx.characterId,
      targetCharacterId: secondaryCharacterId,
      relationshipType: 'ally',
      customLabel: '',
      description: 'Created by smoke test',
      isBidirectional: true,
    }),
  });

  assertStatus(createRelRes, 201, 'create relationship');

  const relationshipId = getEntityId(createRelRes);
  if (!relationshipId) {
    throw new Error(`create relationship: missing id ${JSON.stringify(createRelRes.data, null, 2)}`);
  }

  ctx.relationshipId = relationshipId;
  logOk(`Relationship created: #${relationshipId}`);

  const listRes = await api(`/characters/relationships/list?projectId=${ctx.projectId}`);
  assertStatus(listRes, 200, 'list relationships');

  const relationships = getEntityList(listRes, 'list relationships');
  if (!relationships.some((r) => r.id === relationshipId)) {
    throw new Error(`list relationships: created relationship #${relationshipId} not found`);
  }

  logOk('Relationship list works');

  const graphRes = await api(`/characters/graph?projectId=${ctx.projectId}`);
  assertStatus(graphRes, 200, 'character graph');

  const graph = graphRes.data?.data;
  if (!graph) {
    throw new Error(`character graph: missing graph payload ${JSON.stringify(graphRes.data, null, 2)}`);
  }

  const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
  const edges = Array.isArray(graph.edges) ? graph.edges : [];

  if (!nodes.some((n) => n.id === ctx.characterId) || !nodes.some((n) => n.id === secondaryCharacterId)) {
    throw new Error(`character graph: expected both character nodes in graph ${JSON.stringify(graphRes.data, null, 2)}`);
  }

  if (!edges.some((e) => e.id === relationshipId || e.relationshipId === relationshipId)) {
    throw new Error(`character graph: expected relationship edge #${relationshipId} in graph ${JSON.stringify(graphRes.data, null, 2)}`);
  }

  logOk('Character graph works');

  const updateRelRes = await api(`/characters/relationships/${relationshipId}`, {
    method: 'PUT',
    body: JSON.stringify({
      relationshipType: 'friend',
      description: 'Updated by smoke test',
      isBidirectional: false,
    }),
  });

  assertStatus(updateRelRes, 200, 'update relationship');
  logOk('Relationship updated');
}