import { z } from 'zod';

const hexColorSchema = z.string().regex(/^#[\da-f]{6}$/i);
const safeIdSchema = z.string().min(1).max(120).regex(/^[a-z0-9][a-z0-9-_]*$/i);

export const interfaceStyleSchema = z.enum([
  'dark-fantasy',
  'high-fantasy',
  'sci-fi',
  'cyberpunk',
  'solarpunk',
  'steampunk',
  'noir-detective',
  'arcane-mystic',
  'imperial-chronicle',
  'industrial-brutal',
  'holographic',
  'scholar-manuscript',
]);

export const appearanceSnapshotSchema = z.object({
  interfaceStyle: interfaceStyleSchema,
  themePreset: safeIdSchema,
  backgroundTone: z.enum(['ink', 'graphite', 'warm', 'blue']),
  accentGlow: z.enum(['none', 'soft', 'strong']),
  fontMode: z.enum(['serif', 'sans', 'custom']),
  fontPresetId: safeIdSchema,
  uiDensity: z.enum(['compact', 'comfortable', 'spacious']),
  motionMode: z.enum(['full', 'reduced']),
  readingFontSize: z.number().int().min(16).max(24),
  readingLineHeight: z.enum(['tight', 'normal', 'loose']),
  readingColumnWidth: z.union([z.literal(620), z.literal(760), z.literal(900)]),
}).strict();

export const portablePaletteSchema = z.object({
  id: safeIdSchema.refine((id) => id.startsWith('custom-'), 'Custom palette id must start with custom-'),
  name: z.string().trim().min(1).max(80),
  background: hexColorSchema,
  accent: hexColorSchema,
  text: hexColorSchema,
}).strict();

export const savedThemeBundleItemSchema = z.object({
  name: z.string().trim().min(1).max(100),
  settings: appearanceSnapshotSchema,
}).strict();

export const appearanceThemeBundleSchema = z.object({
  format: z.literal('campaigner.appearance-theme-bundle'),
  version: z.literal(1),
  exportedAt: z.string().datetime(),
  active: appearanceSnapshotSchema,
  customThemes: z.array(savedThemeBundleItemSchema).max(20),
  customColorThemes: z.array(portablePaletteSchema).max(40),
}).strict();

export type AppearanceSnapshot = z.infer<typeof appearanceSnapshotSchema>;
export type AppearanceThemeBundle = z.infer<typeof appearanceThemeBundleSchema>;

export type ThemeBundleParseResult =
  | { success: true; data: AppearanceThemeBundle }
  | { success: false; message: string };

export const parseAppearanceThemeBundle = (source: string): ThemeBundleParseResult => {
  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch {
    return { success: false, message: 'invalid-json' };
  }

  const parsed = appearanceThemeBundleSchema.safeParse(value);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues
        .slice(0, 4)
        .map((issue) => `${issue.path.join('.') || 'bundle'}: ${issue.message}`)
        .join('; '),
    };
  }
  return { success: true, data: parsed.data };
};

export const createAppearanceThemeBundle = (
  input: Omit<AppearanceThemeBundle, 'format' | 'version' | 'exportedAt'>,
  exportedAt = new Date().toISOString(),
): AppearanceThemeBundle => appearanceThemeBundleSchema.parse({
  format: 'campaigner.appearance-theme-bundle',
  version: 1,
  exportedAt,
  ...input,
});
