export type FontPresetOption = {
  id: string;
  label: string;
  family: string;
  sample: string;
};

// These families are packaged by @fontsource and loaded in frontend/src/main.tsx.
export const FONT_PRESET_OPTIONS: FontPresetOption[] = [
  {
    id: 'lore-serif',
    label: 'Lore Serif',
    family: '"Cormorant Garamond", Georgia, serif',
    sample: 'Chronicles & lore',
  },
  {
    id: 'clean-sans',
    label: 'Clean Sans',
    family: '"IBM Plex Sans", system-ui, sans-serif',
    sample: 'Wiki & structured data',
  },
  {
    id: 'archive-pair',
    label: 'Archive Pair',
    family: '"Cormorant Garamond", "IBM Plex Sans", serif',
    sample: 'Documents & journals',
  },
  {
    id: 'technical-mono',
    label: 'Technical Mono',
    family: '"IBM Plex Mono", ui-monospace, monospace',
    sample: 'Tables & coordinates',
  },
];

export const getFontPreset = (id: string) =>
  FONT_PRESET_OPTIONS.find((preset) => preset.id === id) ?? FONT_PRESET_OPTIONS[0];
