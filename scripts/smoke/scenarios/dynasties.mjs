import { api, assertStatus, getEntityId, getEntityList, logStep, logOk } from '../lib.mjs';

export async function smokeDynasties(ctx) {
  logStep('Dynasties CRUD');

  const createRes = await api('/dynasties', {
    method: 'POST',
    body: JSON.stringify({
      projectId: ctx.projectId,
      name: `Smoke Dynasty ${Date.now()}`,
      motto: 'Blood remembers',
      description: 'Dynasty created by smoke test',
      history: 'Founded during smoke testing.',
      status: 'active',
      color: '#c9a959',
      secondaryColor: '#2a2a4a',
      foundedDate: 'Year 1',
      extinctDate: '',
      founderId: null,
      currentLeaderId: null,
      heirId: null,
      linkedFactionId: ctx.factionId ?? null,
      sortOrder: 0,
    }),
  });

  assertStatus(createRes, 201, 'create dynasty');

  const dynastyId = getEntityId(createRes);
  if (!dynastyId) {
    throw new Error(`create dynasty: missing dynasty id in response ${JSON.stringify(createRes.data, null, 2)}`);
  }

  ctx.dynastyId = dynastyId;
  logOk(`Dynasty created: #${dynastyId}`);

  const listRes = await api(`/dynasties?projectId=${ctx.projectId}&limit=50&offset=0`);
  assertStatus(listRes, 200, 'list dynasties');

  const dynasties = getEntityList(listRes, 'list dynasties');
  if (!dynasties.some((d) => d.id === dynastyId)) {
    throw new Error(`list dynasties: created dynasty #${dynastyId} not found`);
  }

  logOk('Dynasty list works');

  const updateRes = await api(`/dynasties/${dynastyId}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: `Smoke Dynasty Updated ${Date.now()}`,
      motto: 'Updated bloodline',
      linkedFactionId: ctx.factionId ?? null,
    }),
  });

  assertStatus(updateRes, 200, 'update dynasty');
  logOk('Dynasty updated');

  const evA = await api(`/dynasties/${dynastyId}/events`, {
    method: 'POST',
    body: JSON.stringify({
      title: `Smoke Dynasty Event A ${Date.now()}`,
      eventDate: 'Year 1',
      importance: 'normal',
      sortOrder: 0,
    }),
  });
  assertStatus(evA, 201, 'create dynasty event A');
  const idA = getEntityId(evA);
  if (!idA) {
    throw new Error(`create dynasty event A: missing id ${JSON.stringify(evA.data, null, 2)}`);
  }

  const evB = await api(`/dynasties/${dynastyId}/events`, {
    method: 'POST',
    body: JSON.stringify({
      title: `Smoke Dynasty Event B ${Date.now()}`,
      eventDate: 'Year 2',
      importance: 'normal',
      sortOrder: 1,
    }),
  });
  assertStatus(evB, 201, 'create dynasty event B');
  const idB = getEntityId(evB);
  if (!idB) {
    throw new Error(`create dynasty event B: missing id ${JSON.stringify(evB.data, null, 2)}`);
  }

  const evC = await api(`/dynasties/${dynastyId}/events`, {
    method: 'POST',
    body: JSON.stringify({
      title: `Smoke Dynasty Event C ${Date.now()}`,
      eventDate: 'Year 3',
      importance: 'normal',
      sortOrder: 2,
    }),
  });
  assertStatus(evC, 201, 'create dynasty event C');
  const idC = getEntityId(evC);
  if (!idC) {
    throw new Error(`create dynasty event C: missing id ${JSON.stringify(evC.data, null, 2)}`);
  }

  const reorderRes = await api(`/dynasties/${dynastyId}/events/reorder`, {
    method: 'POST',
    body: JSON.stringify({ orderedIds: [idC, idA, idB] }),
  });
  assertStatus(reorderRes, 200, 'dynasty events reorder');
  logOk('dynasty events reorder');

  const getDynastyRes = await api(`/dynasties/${dynastyId}`);
  assertStatus(getDynastyRes, 200, 'get dynasty after events reorder');
  const eventsOrdered = getDynastyRes.data?.data?.events;
  if (!Array.isArray(eventsOrdered)) {
    throw new Error(`expected events array ${JSON.stringify(getDynastyRes.data, null, 2)}`);
  }
  const ids = eventsOrdered.map((e) => e.id);
  if (ids[0] !== idC || ids[1] !== idA || ids[2] !== idB) {
    throw new Error(`dynasty events reorder: expected order [${idC},${idA},${idB}], got [${ids.join(',')}]`);
  }
  logOk('dynasty events order verified');
}