import { api, assertStatus, logStep, logOk } from '../lib.mjs';

export async function smokePerfMetrics(ctx) {
  logStep('Performance metrics and limits');

  const rejectedLimitRes = await api(`/search?projectId=${ctx.projectId}&q=Smoke&limit=999`);
  assertStatus(rejectedLimitRes, 400, 'search validation for too high limit');

  const validLimitRes = await api(`/search?projectId=${ctx.projectId}&q=Smoke&limit=50`);
  assertStatus(validLimitRes, 200, 'search with valid max limit');
  const searchResults = validLimitRes.data?.data;
  if (!Array.isArray(searchResults)) {
    throw new Error(`search with valid max limit: invalid payload ${JSON.stringify(validLimitRes.data, null, 2)}`);
  }
  if (searchResults.length > 50) {
    throw new Error(`search max-limit guard expected <= 50 results, got ${searchResults.length}`);
  }
  logOk('Search validation and max-limit guard work');

  const metricsRes = await api('/metrics/perf');
  assertStatus(metricsRes, 200, 'perf metrics endpoint');
  if (!metricsRes.data?.success) {
    throw new Error(`perf metrics endpoint: expected success=true ${JSON.stringify(metricsRes.data, null, 2)}`);
  }
  const endpoints = metricsRes.data?.data?.endpoints;
  if (!Array.isArray(endpoints)) {
    throw new Error(`perf metrics endpoint: invalid endpoints payload ${JSON.stringify(metricsRes.data, null, 2)}`);
  }
  if (endpoints.length === 0) {
    throw new Error('perf metrics endpoint: empty endpoints array');
  }
  logOk('Perf metrics endpoint works and has endpoint stats');
}
