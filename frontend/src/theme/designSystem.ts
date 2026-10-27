import type { Theme } from '@mui/material/styles';
import { FONT_PRESETS } from './appearanceTokens';

export const campaignerFonts = {
  ...FONT_PRESETS['clean-sans'],
  mono: '"IBM Plex Mono", ui-monospace, monospace',
} as const;

export const campaignerLayout = {
  sidebarExpanded: 268,
  sidebarCollapsed: 68,
  contextBarHeight: 52,
  pageGutter: 40,
} as const;

export function getCampaignerGlowStrength(theme: Theme): number {
  return theme.campaigner.glow.strength;
}
