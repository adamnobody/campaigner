import { alpha, type Theme } from '@mui/material/styles';

export const campaignerFonts = {
  display: '"Cormorant Garamond", "Crimson Text", Georgia, serif',
  body: '"IBM Plex Sans", Roboto, sans-serif',
  mono: '"IBM Plex Mono", ui-monospace, monospace',
} as const;

export const campaignerLayout = {
  sidebarExpanded: 296,
  sidebarCollapsed: 88,
  contextBarHeight: 66,
  pageGutter: 40,
} as const;

export function getCampaignerSurface(theme: Theme) {
  return {
    base: theme.palette.background.default,
    raised: alpha(theme.palette.common.white, 0.025),
    subtle: alpha(theme.palette.common.white, 0.015),
    border: alpha(theme.palette.common.white, 0.075),
  };
}

export function isDesignSystemTheme(theme: Theme): boolean {
  return theme.campaigner?.profile === 'design-system';
}
