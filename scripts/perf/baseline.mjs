import pc from 'picocolors';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const API_BASE = process.env.API_BASE || 'http://localhost:3001/api';
const PROJECT_ID = process.env.PROJECT_ID ? Number(process.env.PROJECT_ID) : null;
const SEARCH_QUERY = process.env.PERF_QUERY || 'test';

const rounds = Number(process.env.PERF_ROUNDS || 30);
const timeoutMs = Number(process.env.PERF_TIMEOUT_MS || 10000);
const REPORT_DIR = process.env.PERF_REPORT_DIR || 'scripts/perf/reports';
const REPORT_FILE = process.env.PERF_REPORT_FILE || '';

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const start = performance.now();
  try {
    const res = await fetch(url, { signal: controller.signal });
    const elapsed = performance.now() - start;
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    return { elapsed, data };
  } finally {
    clearTimeout(timeout);
  }
}

async function runScenario(name, url) {
  const samples = [];
  for (let i = 0; i < rounds; i += 1) {
    try {
      const { elapsed } = await fetchJson(url);
      samples.push(elapsed);
    } catch (error) {
      console.log(pc.red(`✖ ${name} failed on round ${i + 1}: ${error.message}`));
      return;
    }
  }

  if (!samples.length) return null;
  samples.sort((a, b) => a - b);
  const avg = samples.reduce((sum, ms) => sum + ms, 0) / samples.length;
  const p95 = samples[Math.max(0, Math.ceil(samples.length * 0.95) - 1)];
  const p99 = samples[Math.max(0, Math.ceil(samples.length * 0.99) - 1)];
  const summary = {
    name,
    rounds: samples.length,
    avgMs: Number(avg.toFixed(2)),
    p95Ms: Number(p95.toFixed(2)),
    p99Ms: Number(p99.toFixed(2)),
    minMs: Number(samples[0].toFixed(2)),
    maxMs: Number(samples[samples.length - 1].toFixed(2)),
  };
  console.log(
    `${pc.cyan(name)} avg=${summary.avgMs.toFixed(2)}ms p95=${summary.p95Ms.toFixed(2)}ms p99=${summary.p99Ms.toFixed(2)}ms`
  );
  return summary;
}

async function printServerSnapshot() {
  try {
    const { data } = await fetchJson(`${API_BASE}/metrics/perf`);
    const endpoints = data?.data?.endpoints || [];
    if (!endpoints.length) {
      console.log(pc.yellow('Server metrics are empty. Run app interactions first.'));
      return;
    }

    console.log(pc.bold('\nTop endpoints by p95 (server-side):'));
    endpoints.slice(0, 12).forEach((entry) => {
      console.log(
        `${pc.gray(entry.endpoint.padEnd(40))} count=${String(entry.count).padStart(4)} ` +
        `avg=${String(entry.avgMs).padStart(7)}ms p95=${String(entry.p95Ms).padStart(7)}ms p99=${String(entry.p99Ms).padStart(7)}ms`
      );
    });
    return data?.data ?? null;
  } catch (error) {
    console.log(pc.red(`Could not read /metrics/perf: ${error.message}`));
    return null;
  }
}

async function writeReport(report) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = REPORT_FILE
    ? path.resolve(REPORT_FILE)
    : path.resolve(REPORT_DIR, `baseline-${timestamp}.json`);

  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
  return reportPath;
}

async function main() {
  console.log(pc.bold(pc.magenta('\nCampaigner perf baseline')));
  console.log(pc.dim(`API: ${API_BASE}`));
  console.log(pc.dim(`Rounds: ${rounds}\n`));

  const clientScenarios = [];
  const health = await runScenario('health', `${API_BASE}/health`);
  if (health) clientScenarios.push(health);
  if (PROJECT_ID) {
    const notesList = await runScenario('notes:list', `${API_BASE}/notes?projectId=${PROJECT_ID}&limit=100`);
    const search = await runScenario('search', `${API_BASE}/search?projectId=${PROJECT_ID}&q=${encodeURIComponent(SEARCH_QUERY)}&limit=20`);
    if (notesList) clientScenarios.push(notesList);
    if (search) clientScenarios.push(search);
  } else {
    console.log(pc.yellow('PROJECT_ID is not set, skipping project-specific scenarios.'));
  }

  const serverSnapshot = await printServerSnapshot();
  const report = {
    generatedAt: new Date().toISOString(),
    apiBase: API_BASE,
    projectId: PROJECT_ID,
    rounds,
    timeoutMs,
    searchQuery: SEARCH_QUERY,
    clientScenarios,
    serverSnapshot,
  };
  const reportPath = await writeReport(report);
  console.log(pc.green(`\nReport saved: ${reportPath}`));
  console.log();
}

main().catch((error) => {
  console.error(pc.red(error.stack || error.message));
  process.exitCode = 1;
});
