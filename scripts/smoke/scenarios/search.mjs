import { api, assertStatus, getEntityList, logStep, logOk } from '../lib.mjs';

export async function smokeSearch(ctx) {
  logStep('Search');

  const query = encodeURIComponent('Smoke Character');
  const res = await api(`/search?projectId=${ctx.projectId}&q=${query}&limit=20`);

  assertStatus(res, 200, 'search');

  if (!res.data?.success) {
    throw new Error(`search: expected success=true, got ${JSON.stringify(res.data, null, 2)}`);
  }

  const results = getEntityList(res, 'search results');
  if (results.length === 0) {
    throw new Error(`search: expected non-empty results ${JSON.stringify(res.data, null, 2)}`);
  }

  logOk('Search endpoint works and returns results');
}