import '@mui/material/styles';

export type CampaignerUiProfile = 'design-system' | 'appearance-legacy';

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
      typography: {
        display: string;
        body: string;
        mono: string;
      };
    };
  }

  interface ThemeOptions {
    campaigner?: Theme['campaigner'];
  }
}
