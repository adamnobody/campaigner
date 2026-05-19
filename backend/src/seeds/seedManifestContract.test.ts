import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import {
  ambitionsManifestHash,
  characterTraitsManifestHash,
  parseGeneratedManifestHash,
  politicalScalesManifestHash,
} from '@campaigner/shared/seeds';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../..');

function assertGeneratedHash(relativePath: string, expectedHash: string): void {
  const source = readFileSync(path.join(repoRoot, relativePath), 'utf8');
  const actual = parseGeneratedManifestHash(source);
  assert.equal(
    actual,
    expectedHash,
    `Rust seed out of sync with manifest (${relativePath}). Run: npm run tauri:codegen`,
  );
}

test('ambitions rust seed matches shared manifest', () => {
  assertGeneratedHash(
    'src-tauri/src/repositories/ambitions_seed.rs',
    ambitionsManifestHash(),
  );
});

test('character traits rust seed matches shared manifest', () => {
  assertGeneratedHash(
    'src-tauri/src/repositories/character_traits_seed.rs',
    characterTraitsManifestHash(),
  );
});

test('political scales rust seed matches shared manifest', () => {
  assertGeneratedHash(
    'src-tauri/src/repositories/political_scales_seed.rs',
    politicalScalesManifestHash(),
  );
});
