import {
  AMBITION_EXCLUSION_PAIRS,
  BUILTIN_AMBITIONS,
} from './ambitions.js';
import {
  BUILTIN_CHARACTER_TRAITS,
  CHARACTER_TRAIT_EXCLUSION_PAIRS,
} from './characterTraits.js';
import { BUILTIN_POLITICAL_SCALES } from './politicalScales.js';
import { hashManifestSlice } from './stableStringify.js';

export function ambitionsManifestHash(): string {
  return hashManifestSlice({
    ambitions: [...BUILTIN_AMBITIONS],
    exclusions: [...AMBITION_EXCLUSION_PAIRS],
  });
}

export function characterTraitsManifestHash(): string {
  return hashManifestSlice({
    traits: [...BUILTIN_CHARACTER_TRAITS],
    exclusions: [...CHARACTER_TRAIT_EXCLUSION_PAIRS],
  });
}

export function politicalScalesManifestHash(): string {
  return hashManifestSlice({
    scales: [...BUILTIN_POLITICAL_SCALES],
  });
}

export function parseGeneratedManifestHash(source: string): string | null {
  const match = source.match(/\/\/\s*manifest-hash:\s*([a-f0-9]{64})/);
  return match?.[1] ?? null;
}
