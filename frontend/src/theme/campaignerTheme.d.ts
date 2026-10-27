import '@mui/material/styles';

import type { AccentGlow } from './appearanceTokens';

export type CampaignerUiProfile = 'design-system';

declare module '@mui/material/styles' {
  interface Theme {
    campaigner: {
      profile: CampaignerUiProfile;
      surface: {
        base: string;
        raised: string;
        subtle: string;
        border: string;
      };
      glow: {
        mode: AccentGlow;
        strength: number;
      };
      typography: {
        display: string;
        body: string;
        mono: string;
        reading: string;
      };
      density: {
        spacing: number;
      };
      motion: {
        duration: number;
        transition: string;
      };
      reading: {
        fontSize: number;
        lineHeight: number;
        columnWidth: 620 | 760 | 900;
        fontFamily: string;
      };
    };
  }

  interface ThemeOptions {
    campaigner?: Theme['campaigner'];
  }
}
