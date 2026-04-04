import type { NextFunction, Request, Response } from 'express';

type EndpointMetric = {
  count: number;
  totalMs: number;
  minMs: number;
  maxMs: number;
  samples: number[];
};

const MAX_SAMPLES_PER_ENDPOINT = 400;
const endpointStats = new Map<string, EndpointMetric>();

function normalizePath(path: string): string {
  return path
    .replace(/\/\d+/g, '/:id')
    .replace(/\/custom-[a-z0-9_-]+/gi, '/:id');
}

function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}

function updateStats(key: string, elapsedMs: number) {
  const existing = endpointStats.get(key);
  if (!existing) {
    endpointStats.set(key, {
      count: 1,
      totalMs: elapsedMs,
      minMs: elapsedMs,
      maxMs: elapsedMs,
      samples: [elapsedMs],
    });
    return;
  }

  existing.count += 1;
  existing.totalMs += elapsedMs;
  existing.minMs = Math.min(existing.minMs, elapsedMs);
  existing.maxMs = Math.max(existing.maxMs, elapsedMs);
  existing.samples.push(elapsedMs);
  if (existing.samples.length > MAX_SAMPLES_PER_ENDPOINT) {
    existing.samples.splice(0, existing.samples.length - MAX_SAMPLES_PER_ENDPOINT);
  }
}

export function requestMetricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startNs = process.hrtime.bigint();
  res.on('finish', () => {
    const elapsedMs = Number(process.hrtime.bigint() - startNs) / 1_000_000;
    const normalizedPath = normalizePath(req.path || req.originalUrl || '');
    const key = `${req.method} ${normalizedPath}`;
    updateStats(key, elapsedMs);
  });
  next();
}

export function getRequestMetricsSnapshot() {
  const endpoints = [...endpointStats.entries()]
    .map(([endpoint, value]) => ({
      endpoint,
      count: value.count,
      avgMs: Number((value.totalMs / value.count).toFixed(2)),
      minMs: Number(value.minMs.toFixed(2)),
      maxMs: Number(value.maxMs.toFixed(2)),
      p95Ms: Number(percentile(value.samples, 95).toFixed(2)),
      p99Ms: Number(percentile(value.samples, 99).toFixed(2)),
    }))
    .sort((a, b) => b.p95Ms - a.p95Ms);

  return {
    capturedAt: new Date().toISOString(),
    endpointCount: endpoints.length,
    endpoints,
  };
}
