import { api, assertStatus, logStep, logOk } from '../lib.mjs';

export async function smokeHealth() {
  logStep('Health check');

  const res = await api('/health');
  assertStatus(res, 200, 'health');

  if (!res.data?.success) {
    throw new Error(`health: expected success=true, got ${JSON.stringify(res.data, null, 2)}`);
  }

  logOk('Health endpoint works');
}