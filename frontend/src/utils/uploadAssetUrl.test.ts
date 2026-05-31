import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const convertFileSrc = vi.fn((filePath: string) => `https://asset.localhost/${encodeURIComponent(filePath)}`);
const invoke = vi.fn(async () => 'C:\\AppData\\uploads\\maps\\test.jpg');

vi.mock('@tauri-apps/api/core', () => ({
  convertFileSrc: (filePath: string) => convertFileSrc(filePath),
  invoke: (command: string, args: { relativePath: string }) => invoke(command, args),
}));

import { resolveUploadAssetUrl } from './uploadAssetUrl';

describe('resolveUploadAssetUrl', () => {
  beforeEach(() => {
    convertFileSrc.mockClear();
    invoke.mockClear();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns undefined for null/empty', async () => {
    await expect(resolveUploadAssetUrl(null)).resolves.toBeUndefined();
    await expect(resolveUploadAssetUrl('')).resolves.toBeUndefined();
  });

  it('passthrough bundled public paths (branch 4)', async () => {
    const cases = ['/traits/ambitsioznost.jpg', '/ambitions/torgovaya-dominatsiya.jpg', '/fonts/my.woff2', '/campaigner.png'];
    for (const path of cases) {
      await expect(resolveUploadAssetUrl(path)).resolves.toBe(path);
    }
    expect(convertFileSrc).not.toHaveBeenCalled();
    expect(invoke).not.toHaveBeenCalled();
  });

  it('resolves /uploads via invoke + convertFileSrc (branch 2)', async () => {
    const path = '/uploads/maps/photo.jpg';
    const result = await resolveUploadAssetUrl(path);
    expect(invoke).toHaveBeenCalledWith('uploads_resolve_path', { relativePath: path });
    expect(convertFileSrc).toHaveBeenCalledWith('C:\\AppData\\uploads\\maps\\test.jpg');
    expect(result).toContain('asset.localhost');
  });

  it('convertFileSrc for Windows drive paths (branch 3 legacy)', async () => {
    const path = 'C:\\Users\\Nobody\\image.jpg';
    await resolveUploadAssetUrl(path);
    expect(invoke).not.toHaveBeenCalled();
    expect(convertFileSrc).toHaveBeenCalledWith(path);
  });

  it('convertFileSrc for UNC paths (branch 3 legacy)', async () => {
    const path = '\\\\server\\share\\image.jpg';
    await resolveUploadAssetUrl(path);
    expect(invoke).not.toHaveBeenCalled();
    expect(convertFileSrc).toHaveBeenCalledWith(path);
  });

  it('passthrough http(s) URLs (branch 1)', async () => {
    const http = 'http://example.com/a.jpg';
    const https = 'https://example.com/a.jpg';
    await expect(resolveUploadAssetUrl(http)).resolves.toBe(http);
    await expect(resolveUploadAssetUrl(https)).resolves.toBe(https);
    expect(convertFileSrc).not.toHaveBeenCalled();
  });

  it('warns and returns undefined for persisted asset.localhost URLs (branch 1)', async () => {
    const path = 'https://asset.localhost/%2Fuploads%2Fmaps%2Fa.jpg';
    await expect(resolveUploadAssetUrl(path)).resolves.toBeUndefined();
    expect(console.warn).toHaveBeenCalled();
    expect(convertFileSrc).not.toHaveBeenCalled();
  });

  it('passthrough relative paths without leading slash (branch 5)', async () => {
    const path = 'campaigner.png';
    await expect(resolveUploadAssetUrl(path)).resolves.toBe(path);
    expect(convertFileSrc).not.toHaveBeenCalled();
  });

  it('Unix absolute paths use branch 4 passthrough (canvas stores /uploads only)', async () => {
    const path = '/Users/nobody/Pictures/image.jpg';
    await expect(resolveUploadAssetUrl(path)).resolves.toBe(path);
    expect(convertFileSrc).not.toHaveBeenCalled();
    expect(invoke).not.toHaveBeenCalled();
  });
});
