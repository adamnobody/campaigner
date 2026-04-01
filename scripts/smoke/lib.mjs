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