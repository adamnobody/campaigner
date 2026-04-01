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
}