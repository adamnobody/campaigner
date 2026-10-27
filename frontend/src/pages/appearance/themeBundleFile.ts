import {
  parseAppearanceThemeBundle,
  type AppearanceThemeBundle,
  type ThemeBundleParseResult,
} from './themeBundleSchema';

const FILE_FILTER = [{ name: 'Campaigner appearance theme', extensions: ['json'] }];

export const exportAppearanceThemeBundle = async (
  bundle: AppearanceThemeBundle,
  filename: string,
): Promise<{ cancelled: boolean; path?: string }> => {
  const [{ save }, { writeTextFile }] = await Promise.all([
    import('@tauri-apps/plugin-dialog'),
    import('@tauri-apps/plugin-fs'),
  ]);
  const path = await save({ defaultPath: filename, filters: FILE_FILTER });
  if (!path) return { cancelled: true };
  await writeTextFile(path, JSON.stringify(bundle, null, 2));
  return { cancelled: false, path };
};

export const chooseAppearanceThemeBundle = async (): Promise<
  ThemeBundleParseResult | { success: false; message: 'cancelled' }
> => {
  const [{ open }, { readTextFile }] = await Promise.all([
    import('@tauri-apps/plugin-dialog'),
    import('@tauri-apps/plugin-fs'),
  ]);
  const selected = await open({ multiple: false, directory: false, filters: FILE_FILTER });
  if (!selected || Array.isArray(selected)) return { success: false, message: 'cancelled' };
  return parseAppearanceThemeBundle(await readTextFile(selected));
};
