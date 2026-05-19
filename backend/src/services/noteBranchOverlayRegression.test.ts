import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

test('branch update on note keeps main/base note unchanged', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'campaigner-note-overlay-'));
  const dbPath = path.join(tempDir, 'campaigner.sqlite');
  process.env.DATABASE_PATH = dbPath;

  const { initializeDatabase, closeDatabase, getDb } = await import('../db/connection.js');
  const { NoteService } = await import('./note.service.js');
  const { BranchService } = await import('./branch.service.js');

  try {
    initializeDatabase();
    const db = getDb();

    db.prepare(
      `
      INSERT INTO projects (name, description, status)
      VALUES (?, '', 'active')
      `,
    ).run('Overlay Regression Project');

    const projectId = db.prepare('SELECT id FROM projects LIMIT 1').get() as { id: number };

    db.prepare(
      `
      INSERT INTO scenario_branches (project_id, name, parent_branch_id, base_revision, is_main)
      VALUES (?, 'main', NULL, 0, 1)
      `,
    ).run(projectId.id);
    const mainId = db.prepare(
      'SELECT id FROM scenario_branches WHERE project_id = ? AND is_main = 1 LIMIT 1',
    ).get(projectId.id) as { id: number };

    db.prepare(
      `
      INSERT INTO scenario_branches (project_id, name, parent_branch_id, base_revision, is_main)
      VALUES (?, 'child', ?, 0, 0)
      `,
    ).run(projectId.id, mainId.id);

    const note = NoteService.create({
      projectId: projectId.id,
      folderId: null,
      title: 'Base title',
      content: 'Base content',
      format: 'md',
      noteType: 'note',
      isPinned: false,
    });

    const listedBranches = BranchService.getAll(projectId.id);
    const selectedOverlayBranch = listedBranches.find((branch) => branch.isMain !== true);
    assert.ok(selectedOverlayBranch, 'Expected non-main branch for overlay update');

    const overlayTitle = 'Overlay title';
    NoteService.update(note.id, { title: overlayTitle }, selectedOverlayBranch.id);

    const branchView = NoteService.getById(note.id, selectedOverlayBranch.id);
    const mainView = NoteService.getById(note.id);

    assert.equal(branchView.title, overlayTitle);
    assert.notEqual(mainView.title, overlayTitle);
    assert.equal(mainView.title, 'Base title');
  } finally {
    closeDatabase();
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
