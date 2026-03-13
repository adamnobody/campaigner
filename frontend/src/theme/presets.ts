import type { ThemePreset } from '@/store/usePreferencesStore';

export interface ThemePresetDefinition {
  id: ThemePreset;
  label: string;
  background: string;
  backgroundAccent: string;
  panelBaseRgb: string;
  borderRgb: string;
  textPrimary: string;
  textSecondary: string;
  muted: string;
  accentMain: string;
  accentSoft: string;
  accentStrong: string;
  success: string;
  warning: string;
  error: string;
}

export const THEME_PRESETS: Record<ThemePreset, ThemePresetDefinition> = {
  'obsidian-gold': {
    id: 'obsidian-gold',
    label: 'Obsidian Gold',
    background: '#0b1020',
    backgroundAccent: 'radial-gradient(circle at top left, rgba(201,169,89,0.18), transparent 32%)',
    panelBaseRgb: '20, 24, 38',
    borderRgb: '201, 169, 89',
    textPrimary: '#F8F4EA',
    textSecondary: 'rgba(248,244,234,0.78)',
    muted: 'rgba(248,244,234,0.42)',
    accentMain: '#C9A959',
    accentSoft: 'rgba(201,169,89,0.16)',
    accentStrong: '#E5C97A',
    success: '#7BD88F',
    warning: '#F6C177',
    error: '#FF7A7A',
  },
  'midnight-cyan': {
    id: 'midnight-cyan',
    label: 'Midnight Cyan',
    background: '#09131A',
    backgroundAccent: 'radial-gradient(circle at top left, rgba(78,205,196,0.18), transparent 32%)',
    panelBaseRgb: '12, 26, 32',
    borderRgb: '78, 205, 196',
    textPrimary: '#EAFBFA',
    textSecondary: 'rgba(234,251,250,0.78)',
    muted: 'rgba(234,251,250,0.42)',
    accentMain: '#4ECDC4',
    accentSoft: 'rgba(78,205,196,0.16)',
    accentStrong: '#7FE7E0',
    success: '#7BD88F',
    warning: '#F6C177',
    error: '#FF7A7A',
  },
  'royal-violet': {
    id: 'royal-violet',
    label: 'Royal Violet',
    background: '#0D0B1A',
    backgroundAccent: 'radial-gradient(circle at top left, rgba(155,124,255,0.18), transparent 32%)',
    panelBaseRgb: '24, 18, 40',
    borderRgb: '155, 124, 255',
    textPrimary: '#F5F0FF',
    textSecondary: 'rgba(245,240,255,0.78)',
    muted: 'rgba(245,240,255,0.42)',
    accentMain: '#9B7CFF',
    accentSoft: 'rgba(155,124,255,0.16)',
    accentStrong: '#C2AFFF',
    success: '#7BD88F',
    warning: '#F6C177',
    error: '#FF7A7A',
  },
  'ember-crimson': {
    id: 'ember-crimson',
    label: 'Ember Crimson',
    background: '#140B0D',
    backgroundAccent: 'radial-gradient(circle at top left, rgba(214,93,93,0.18), transparent 32%)',
    panelBaseRgb: '32, 16, 18',
    borderRgb: '214, 93, 93',
    textPrimary: '#FFF0F0',
    textSecondary: 'rgba(255,240,240,0.78)',
    muted: 'rgba(255,240,240,0.42)',
    accentMain: '#D65D5D',
    accentSoft: 'rgba(214,93,93,0.16)',
    accentStrong: '#F08A8A',
    success: '#7BD88F',
    warning: '#F6C177',
    error: '#FF7A7A',
  },
};