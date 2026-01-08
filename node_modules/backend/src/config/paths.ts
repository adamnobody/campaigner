import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';

export const DEFAULT_PORT = 3000;
export const DEFAULT_PROJECTS_DIRNAME = 'DnDCampaigns';

export function getDefaultProjectsRoot(): string {
  // Windows-friendly default: %USERPROFILE%\Documents\DnDCampaigns
  const home = os.homedir();
  return path.join(home, 'Documents', DEFAULT_PROJECTS_DIRNAME);
}

export async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

export function nowIso() {
  return new Date().toISOString();
}
