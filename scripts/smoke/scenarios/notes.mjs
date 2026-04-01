import { api, assertStatus, getEntityId, getEntityList, logStep, logOk } from '../lib.mjs';

export async function smokeNotes(ctx) {
  logStep('Notes CRUD');

  ctx.uniqueNoteTitle = `Smoke Note ${Date.now()}`;

  const createRes = await api('/notes', {
    method: 'POST',
    body: JSON.stringify({
      projectId: ctx.projectId,
      folderId: null,
      title: ctx.uniqueNoteTitle,
      content: '# Smoke Note\n\nCreated by automated test.',
      format: 'md',
      noteType: 'note',
      isPinned: false,
    }),
  });

  assertStatus(createRes, 201, 'create note');

  const noteId = getEntityId(createRes);
  if (!noteId) {
    throw new Error(`create note: missing note id in response ${JSON.stringify(createRes.data, null, 2)}`);
  }

  ctx.noteId = noteId;
  logOk(`Note created: #${noteId}`);

  const listRes = await api(`/notes?projectId=${ctx.projectId}&limit=50&page=1`);
  assertStatus(listRes, 200, 'list notes');

  const notes = getEntityList(listRes, 'list notes');
  if (!notes.some((n) => n.id === noteId)) {
    throw new Error(`list notes: created note #${noteId} not found`);
  }

  logOk('Note list works');

  const getRes = await api(`/notes/${noteId}`);
  assertStatus(getRes, 200, 'get note by id');

  const loadedNote = getRes.data?.data;
  if (!loadedNote || loadedNote.id !== noteId) {
    throw new Error(`get note by id: wrong response ${JSON.stringify(getRes.data, null, 2)}`);
  }

  logOk('Note getById works');

  const updateRes = await api(`/notes/${noteId}`, {
    method: 'PUT',
    body: JSON.stringify({
      title: `Smoke Note Updated ${Date.now()}`,
      content: 'Updated content from smoke test.',
      isPinned: true,
    }),
  });

  assertStatus(updateRes, 200, 'update note');
  logOk('Note updated');

  if (ctx.tagId) {
    const setTagsRes = await api(`/notes/${noteId}/tags`, {
      method: 'PUT',
      body: JSON.stringify({
        tagIds: [ctx.tagId],
      }),
    });

    assertStatus(setTagsRes, 200, 'set note tags');
    logOk('Note tags assigned');
  }
}