import test from 'node:test';
import assert from 'node:assert/strict';
import { noteListQuerySchema, NOTE_LIST_MAX_LIMIT } from './querySchemas.js';

test('notes list query accepts branchId with wiki noteType and limit up to NOTE_LIST_MAX_LIMIT', () => {
  const parsed = noteListQuerySchema.parse({
    projectId: '24',
    branchId: '25',
    limit: String(NOTE_LIST_MAX_LIMIT),
    noteType: 'wiki',
  });
  assert.equal(parsed.projectId, 24);
  assert.equal(parsed.branchId, 25);
  assert.equal(parsed.limit, NOTE_LIST_MAX_LIMIT);
  assert.equal(parsed.noteType, 'wiki');
});

test('notes list query rejects limit above NOTE_LIST_MAX_LIMIT', () => {
  assert.throws(() =>
    noteListQuerySchema.parse({
      projectId: 1,
      branchId: 1,
      limit: NOTE_LIST_MAX_LIMIT + 1,
    }),
  );
});
