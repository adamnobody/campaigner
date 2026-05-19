function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`;
}

function hashString(input: string): string {
  // FNV-1a 64-bit variant (hex-encoded) to avoid Node-only crypto dependency.
  let hash = BigInt('0xcbf29ce484222325');
  const prime = BigInt('0x100000001b3');
  const mod = BigInt('0xffffffffffffffff');
  for (let index = 0; index < input.length; index += 1) {
    hash ^= BigInt(input.charCodeAt(index));
    hash = (hash * prime) & mod;
  }
  return hash.toString(16).padStart(16, '0');
}

export function hashManifestSlice(slice: unknown): string {
  return hashString(stableStringify(slice));
}
