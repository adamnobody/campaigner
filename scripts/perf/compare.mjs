import { promises as fs } from 'node:fs';
import path from 'node:path';
import pc from 'picocolors';

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [k, v] = arg.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);

const basePath = String(args.base || '');
const headPath = String(args.head || '');
const threshold = Number(args.threshold ?? 0.15); // 15% by default

if (!basePath || !headPath) {
  console.log('Usage: node scripts/perf/compare.mjs --base=<file> --head=<file> [--threshold=0.15]');
  process.exit(1);
}

function pctDelta(base, head) {
  if (!Number.isFinite(base) || base <= 0) return 0;
  return (head - base) / base;
}

function fmtPct(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function collectClientRegressions(baseReport, headReport) {
  const regressions = [];
  const baseByName = new Map((baseReport.clientScenarios || []).map((s) => [s.name, s]));

  for (const scenario of headReport.clientScenarios || []) {
    const base = baseByName.get(scenario.name);
    if (!base) continue;
    for (const metric of ['avgMs', 'p95Ms', 'p99Ms']) {
      const delta = pctDelta(base[metric], scenario[metric]);
      if (delta > threshold) {
        regressions.push({
          scope: `client:${scenario.name}`,
          metric,
          base: base[metric],
          head: scenario[metric],
          delta,
        });
      }
    }
  }

  return regressions;
}

function collectServerRegressions(baseReport, headReport) {
  const regressions = [];
  const baseByEndpoint = new Map((baseReport.serverSnapshot?.endpoints || []).map((e) => [e.endpoint, e]));

  for (const endpoint of headReport.serverSnapshot?.endpoints || []) {
    const base = baseByEndpoint.get(endpoint.endpoint);
    if (!base) continue;
    for (const metric of ['avgMs', 'p95Ms', 'p99Ms']) {
      const delta = pctDelta(base[metric], endpoint[metric]);
      if (delta > threshold) {
        regressions.push({
          scope: `server:${endpoint.endpoint}`,
          metric,
          base: base[metric],
          head: endpoint[metric],
          delta,
        });
      }
    }
  }

  return regressions;
}

async function readJson(filePath) {
  const absolute = path.resolve(filePath);
  const raw = await fs.readFile(absolute, 'utf8');
  return JSON.parse(raw);
}

async function main() {
  const baseReport = await readJson(basePath);
  const headReport = await readJson(headPath);

  console.log(pc.bold('\nCampaigner perf compare'));
  console.log(pc.dim(`base: ${path.resolve(basePath)}`));
  console.log(pc.dim(`head: ${path.resolve(headPath)}`));
  console.log(pc.dim(`threshold: ${fmtPct(threshold)}\n`));

  const regressions = [
    ...collectClientRegressions(baseReport, headReport),
    ...collectServerRegressions(baseReport, headReport),
  ].sort((a, b) => b.delta - a.delta);

  if (!regressions.length) {
    console.log(pc.green('✔ No regressions above threshold'));
    return;
  }

  console.log(pc.red(`✖ Regressions detected: ${regressions.length}`));
  regressions.slice(0, 40).forEach((r) => {
    console.log(
      `${pc.yellow(r.scope)} ${r.metric} ` +
      `base=${r.base} head=${r.head} delta=${fmtPct(r.delta)}`
    );
  });

  process.exitCode = 1;
}

main().catch((error) => {
  console.error(pc.red(error.stack || error.message));
  process.exitCode = 1;
});
