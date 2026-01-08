import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { openProjectDb } from '../db/projectDB.js';
import { getProjectById, listProjects } from './projects.service.js';
import { assertInsideRoot, atomicWriteFile, slugify } from './files.service.js';
import { nowIso } from '../config/paths.js';
import { NOTE_MAX_BYTES } from '../validation/notes.zod.js';

export type NoteDTO = {
  id: string;
  project_id: string;
  title: string;
  path: string; // relative: notes/xxx.md
  type: 'md' | 'txt';
  created_at: string;
  updated_at: string;
};

function byteLengthUtf8(s: string) {
  return Buffer.byteLength(s, 'utf8');
}

async function readNoteRowById(noteId: string): Promise<{ projectPath: string; note: NoteDTO } | null> {
  const projects = await listProjects();
  for (const p of projects) {
    const db = openProjectDb(p.path);
    const row = db.prepare(`
      SELECT id, project_id, title, path, type, created_at, updated_at
      FROM notes WHERE id = ?
    `).get(noteId) as NoteDTO | undefined;
    db.close();

    if (row?.id) return { projectPath: p.path, note: row };
  }
  return null;
}

export async function listNotes(projectId: string): Promise<NoteDTO[]> {
  const project = await getProjectById(projectId);
  if (!project) throw Object.assign(new Error('Project not found'), { status: 404, code: 'PROJECT_NOT_FOUND' });

  const db = openProjectDb(project.path);
  const rows = db.prepare(`
    SELECT id, project_id, title, path, type, created_at, updated_at
    FROM notes
    WHERE project_id = ?
    ORDER BY updated_at DESC
  `).all(projectId);
  db.close();

  return rows as NoteDTO[];
}

export async function createNote(projectId: string, input: { title: string; type: 'md' | 'txt' }): Promise<NoteDTO> {
  const project = await getProjectById(projectId);
  if (!project) throw Object.assign(new Error('Project not found'), { status: 404, code: 'PROJECT_NOT_FOUND' });

  const id = crypto.randomUUID();
  const created_at = nowIso();
  const updated_at = created_at;

  const safeBase = slugify(input.title);
  const filename = `${safeBase}-${id}.${input.type}`;
  const relPath = path.join('notes', filename).replaceAll('\\', '/');
  const absPath = path.join(project.path, relPath);

  assertInsideRoot(project.path, absPath);

  // создаём файл заметки пустым (атомарно)
  await atomicWriteFile(absPath, '');

  const db = openProjectDb(project.path);
  db.prepare(`
    INSERT INTO notes (id, project_id, title, path, type, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, projectId, input.title.trim(), relPath, input.type, created_at, updated_at);
  db.close();

  return { id, project_id: projectId, title: input.title.trim(), path: relPath, type: input.type, created_at, updated_at };
}

export async function getNoteContent(noteId: string): Promise<{ note: NoteDTO; content: string }> {
  const found = await readNoteRowById(noteId);
  if (!found) throw Object.assign(new Error('Note not found'), { status: 404, code: 'NOTE_NOT_FOUND' });

  const { projectPath, note } = found;
  const absPath = path.join(projectPath, note.path);
  assertInsideRoot(projectPath, absPath);

  const content = await fs.readFile(absPath, 'utf8');
  return { note, content };
}

export async function saveNoteContent(noteId: string, content: string): Promise<NoteDTO> {
  const found = await readNoteRowById(noteId);
  if (!found) throw Object.assign(new Error('Note not found'), { status: 404, code: 'NOTE_NOT_FOUND' });

  if (byteLengthUtf8(content) > NOTE_MAX_BYTES) {
    throw Object.assign(new Error('Note content too large'), { status: 400, code: 'NOTE_TOO_LARGE' });
  }

  const { projectPath, note } = found;

  const absPath = path.join(projectPath, note.path);
  assertInsideRoot(projectPath, absPath);

  await atomicWriteFile(absPath, content);

  const updated_at = nowIso();

  const db = openProjectDb(projectPath);
  db.prepare(`UPDATE notes SET updated_at = ? WHERE id = ?`).run(updated_at, noteId);
  const updated = db.prepare(`
    SELECT id, project_id, title, path, type, created_at, updated_at
    FROM notes WHERE id = ?
  `).get(noteId) as NoteDTO;
  db.close();

  return updated;
}

export async function deleteNote(noteId: string): Promise<void> {
  const found = await readNoteRowById(noteId);
  if (!found) throw Object.assign(new Error('Note not found'), { status: 404, code: 'NOTE_NOT_FOUND' });

  const { projectPath, note } = found;
  const absPath = path.join(projectPath, note.path);
  assertInsideRoot(projectPath, absPath);

  const db = openProjectDb(projectPath);
  const tx = db.transaction(() => {
    // заранее отвяжем маркеры (на будущее; поле уже есть в schema)
    db.prepare(`
      UPDATE markers
      SET link_type = NULL, link_note_id = NULL
      WHERE link_note_id = ?
    `).run(noteId);

    db.prepare(`DELETE FROM notes WHERE id = ?`).run(noteId);
  });

  tx();
  db.close();

  // удалить файл после БД (если файла нет — не валим всё)
  try {
    await fs.unlink(absPath);
  } catch {
    // ignore
  }
}
