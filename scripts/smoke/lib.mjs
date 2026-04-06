import pc from 'picocolors';

export const API_BASE = process.env.API_URL || 'http://localhost:3001/api';

export function logStep(message) {
  console.log(pc.cyan(`\n▶ ${message}`));
}

export function logOk(message) {
  console.log(pc.green(`✔ ${message}`));
}

export function logWarn(message) {
  console.log(pc.yellow(`⚠ ${message}`));
}

export function logError(message) {
  console.error(pc.red(`✖ ${message}`));
}

export async function api(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  let data = null;
  const text = await response.text();

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
    url,
  };
}

export function assertStatus(result, expectedStatus, context = '') {
  if (result.status !== expectedStatus) {
    throw new Error(
      `${context ? `${context}: ` : ''}expected ${expectedStatus}, got ${result.status}\nURL: ${result.url}\nResponse: ${JSON.stringify(result.data, null, 2)}`
    );
  }
}

export function getEntityId(result) {
  return result?.data?.data?.id;
}

export function getEntityList(result, context = 'list') {
  const data = result?.data?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.rows)) {
    return data.rows;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  throw new Error(
    `${context}: expected list response, got ${JSON.stringify(result?.data, null, 2)}`
  );
}

export async function ensureOverlayBranch(ctx) {
  if (ctx.overlayBranchId) return ctx.overlayBranchId;
  if (!ctx.projectId) {
    throw new Error('ensureOverlayBranch: projectId is required in smoke context');
  }

  const listRes = await api(`/branches?projectId=${ctx.projectId}`);
  assertStatus(listRes, 200, 'list branches');
  const branches = getEntityList(listRes, 'list branches');
  const existing = branches.find((b) => b && b.isMain !== true);
  if (existing?.id) {
    ctx.overlayBranchId = existing.id;
    return existing.id;
  }

  const createRes = await api('/branches', {
    method: 'POST',
    body: JSON.stringify({
      projectId: ctx.projectId,
      name: `Smoke Branch ${Date.now()}`,
    }),
  });
  assertStatus(createRes, 201, 'create overlay branch');
  const branchId = getEntityId(createRes);
  if (!branchId) {
    throw new Error(`create overlay branch: missing id ${JSON.stringify(createRes.data, null, 2)}`);
  }
  ctx.overlayBranchId = branchId;
  return branchId;
}