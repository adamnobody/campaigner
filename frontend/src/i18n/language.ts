import type { AppLanguage } from './types';

export const STORAGE_KEY = 'app.language';

export function getStoredLanguage(): AppLanguage | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'en' || raw === 'ru') return raw;
    return null;
  } catch {
    return null;
  }
}

export function saveLanguage(language: AppLanguage): void {
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    /* ignore quota / privacy mode */
  }
}

export function isSupportedLanguage(value: string): value is AppLanguage {
  return value === 'en' || value === 'ru';
}

/** Lowercase trimmed BCP47 tag fragment for comparisons (e.g. `RU-ru` → `ru-ru`). */
export function normalizeSystemLocale(locale: string): string {
  return locale.trim().toLowerCase();
}

/**
 * Stored `en`|`ru` wins; otherwise first system locale starting with `ru` → Russian; else English.
 */
export function detectDefaultLanguage(): AppLanguage {
  const stored = getStoredLanguage();
  if (stored) return stored;

  if (typeof navigator === 'undefined') return 'en';

  const fromNavigator = [...(navigator.languages ?? []), navigator.language].filter(Boolean);
  for (const locale of fromNavigator) {
    if (normalizeSystemLocale(locale).startsWith('ru')) return 'ru';
  }

  return 'en';
}
