import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { getAppDb } from '../db/appDB.js';
import { ensureDir, getDefaultProjectsRoot, nowIso } from '../config/paths.js';
import { initProjectDb, openProjectDb } from '../db/projectDB.js';
import { slugify } from './files.service.js';

export type ProjectDTO = {
  id: string;
  name: string;
  path: string;
  system: string;
  created_at: string;
};

async function pathExists(p: string) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function listProjects(): Promise<ProjectDTO[]> {
  const db = await getAppDb();
  const rows = db
    .prepare('SELECT id, name, path, system, created_at FROM app_projects ORDER BY created_at DESC')
    .all();
  return rows as ProjectDTO[];
}

export async function getProjectById(projectId: string): Promise<ProjectDTO | null> {
  const db = await getAppDb();
  const row = db
    .prepare('SELECT id, name, path, system, created_at FROM app_projects WHERE id = ?')
    .get(projectId);
  return (row as ProjectDTO) ?? null;
}

export async function createProject(input: { name: string; rootPath?: string; system: string }): Promise<ProjectDTO> {
  const appDb = await getAppDb();

  const root = input.rootPath
    ? path.isAbsolute(input.rootPath)
      ? input.rootPath
      : (() => {
          throw Object.assign(new Error('rootPath must be absolute.'), {
            status: 400,
            code: 'ROOT_NOT_ABSOLUTE'
          });
        })()
    : getDefaultProjectsRoot();

  await ensureDir(root);

  const baseSlug = slugify(input.name);
  let projectDir = path.join(root, baseSlug);

  if (await pathExists(projectDir)) {
    let i = 2;
    while (await pathExists(path.join(root, `${baseSlug}-${i}`))) i++;
    projectDir = path.join(root, `${baseSlug}-${i}`);
  }

  await ensureDir(projectDir);
  await ensureDir(path.join(projectDir, 'assets', 'maps'));
  await ensureDir(path.join(projectDir, 'notes'));

  const projectDb = openProjectDb(projectDir);
  initProjectDb(projectDb);
  projectDb.close();

  const id = crypto.randomUUID();
  const created_at = nowIso();
  const system = input.system || 'generic';

  appDb
    .prepare('INSERT INTO app_projects (id, name, path, system, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(id, input.name.trim(), projectDir, system, created_at);

  await fs.writeFile(
    path.join(projectDir, 'project.json'),
    JSON.stringify({ id, name: input.name.trim(), system, created_at }, null, 2),
    'utf8'
  );

  return { id, name: input.name.trim(), path: projectDir, system, created_at };
}

export async function deleteProject(
  projectId: string,
  opts: { deleteFiles: boolean } = { deleteFiles: true }
): Promise<void> {
  const appDb = await getAppDb();

  const project = await getProjectById(projectId);
  if (!project) {
    throw Object.assign(new Error('Project not found'), { status: 404, code: 'PROJECT_NOT_FOUND' });
  }

  const projectDir = project.path;

  // Safety: path должен быть абсолютным, и не "слишком коротким"
  if (!projectDir || !path.isAbsolute(projectDir) || projectDir.trim().length < 3) {
    throw Object.assign(new Error('Refusing to delete: invalid project path'), {
      status: 500,
      code: 'BAD_PROJECT_PATH'
    });
  }

  // Если удаляем файлы — проверим маркеры папки ДО удаления записи из app.sqlite.
  // Это позволяет "не потерять" проект из списка, если выяснится что папка подозрительная.
  if (opts.deleteFiles) {
    const markerFile = path.join(projectDir, 'project.json');

    try {
      await fs.access(markerFile);
    } catch {
      throw Object.assign(new Error('Refusing to delete: project.json not found in project folder'), {
        status: 400,
        code: 'PROJECT_MARKER_NOT_FOUND'
      });
    }
  }

  // 1) удаляем запись из глобальной БД
  appDb.prepare('DELETE FROM app_projects WHERE id = ?').run(projectId);

  // 2) удаляем папку проекта (и всё внутри)
  if (opts.deleteFiles) {
    await fs.rm(projectDir, { recursive: true, force: true });
  }
}
