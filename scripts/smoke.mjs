import pc from 'picocolors';
import {
  api,
  assertStatus,
  getEntityId,
  getEntityList,
  logStep,
  logOk,
  logError,
  API_BASE,
} from './smoke-lib.mjs';

async function smokeHealth() {
  logStep('Health check');

  const res = await api('/health');
  assertStatus(res, 200, 'health');

  if (!res.data?.success) {
    throw new Error(`health: expected success=true, got ${JSON.stringify(res.data, null, 2)}`);
  }

  logOk('Health endpoint works');
}

async function smokeProjects(ctx) {
  logStep('Projects CRUD');

  const createRes = await api('/projects', {
    method: 'POST',
    body: JSON.stringify({
      name: `Smoke Project ${Date.now()}`,
      description: 'Temporary smoke test project',
    }),
  });

  assertStatus(createRes, 201, 'create project');

  const projectId = getEntityId(createRes);
  if (!projectId) {
    throw new Error(`create project: missing project id in response ${JSON.stringify(createRes.data, null, 2)}`);
  }

  ctx.projectId = projectId;
  logOk(`Project created: #${projectId}`);

  const listRes = await api('/projects');
  assertStatus(listRes, 200, 'list projects');

  const projects = getEntityList(listRes, 'list projects');
  if (!projects.some((p) => p.id === projectId)) {
    throw new Error(`list projects: created project #${projectId} not found`);
  }

  logOk('Project list includes created project');

  const updateRes = await api(`/projects/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: `Smoke Project Updated ${Date.now()}`,
      description: 'Updated by smoke test',
    }),
  });

  assertStatus(updateRes, 200, 'update project');
  logOk('Project updated');
}

async function smokeTags(ctx) {
  logStep('Tags CRUD');

  const createRes = await api('/tags', {
    method: 'POST',
    body: JSON.stringify({
      projectId: ctx.projectId,
      name: `smoke-tag-${Date.now()}`,
      color: '#ff9900',
    }),
  });

  assertStatus(createRes, 201, 'create tag');

  const tagId = getEntityId(createRes);
  if (!tagId) {
    throw new Error(`create tag: missing tag id in response ${JSON.stringify(createRes.data, null, 2)}`);
  }

  ctx.tagId = tagId;
  logOk(`Tag created: #${tagId}`);

  const listRes = await api(`/tags?projectId=${ctx.projectId}`);
  assertStatus(listRes, 200, 'list tags');

  const tags = getEntityList(listRes, 'list tags');
  if (!tags.some((t) => t.id === tagId)) {
    throw new Error(`list tags: created tag #${tagId} not found`);
  }

  logOk('Tag list works');
}

async function smokeCharacters(ctx) {
  logStep('Characters CRUD');

  const createRes = await api('/characters', {
    method: 'POST',
    body: JSON.stringify({
      projectId: ctx.projectId,
      name: `Smoke Character ${Date.now()}`,
      title: 'The Tester',
      race: 'Human',
      characterClass: 'Wizard',
      level: 5,
      status: 'alive',
      bio: 'Created by smoke test',
      appearance: 'Looks suspiciously automated',
      personality: 'Calm and methodical',
      backstory: 'Born in a CI pipeline',
      notes: 'No additional notes',
    }),
  });

  assertStatus(createRes, 201, 'create character');

  const characterId = getEntityId(createRes);
  if (!characterId) {
    throw new Error(`create character: missing character id in response ${JSON.stringify(createRes.data, null, 2)}`);
  }

  ctx.characterId = characterId;
  logOk(`Character created: #${characterId}`);

  const listRes = await api(`/characters?projectId=${ctx.projectId}&limit=50&page=1`);
  assertStatus(listRes, 200, 'list characters');

  const characters = getEntityList(listRes, 'list characters');
  if (!characters.some((c) => c.id === characterId)) {
    throw new Error(`list characters: created character #${characterId} not found`);
  }

  logOk('Character list works');

  const getRes = await api(`/characters/${characterId}`);
  assertStatus(getRes, 200, 'get character by id');

  const loadedCharacter = getRes.data?.data;
  if (!loadedCharacter || loadedCharacter.id !== characterId) {
    throw new Error(`get character by id: wrong response ${JSON.stringify(getRes.data, null, 2)}`);
  }

  logOk('Character getById works');

  const updateRes = await api(`/characters/${characterId}`, {
    method: 'PUT',
    body: JSON.stringify({
      title: 'The Updated Tester',
      level: 6,
      bio: 'Updated by smoke test',
    }),
  });

  assertStatus(updateRes, 200, 'update character');
  logOk('Character updated');

  if (ctx.tagId) {
    const setTagsRes = await api(`/characters/${characterId}/tags`, {
      method: 'PUT',
      body: JSON.stringify({
        tagIds: [ctx.tagId],
      }),
    });

    assertStatus(setTagsRes, 200, 'set character tags');
    logOk('Character tags assigned');
  }
}

async function smokeNotes(ctx) {
  logStep('Notes CRUD');

  const createRes = await api('/notes', {
    method: 'POST',
    body: JSON.stringify({
      projectId: ctx.projectId,
      folderId: null,
      title: `Smoke Note ${Date.now()}`,
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

async function smokeTimeline(ctx) {
  logStep('Timeline CRUD');

  const createRes = await api('/timeline', {
    method: 'POST',
    body: JSON.stringify({
      projectId: ctx.projectId,
      title: `Smoke Event ${Date.now()}`,
      description: 'Timeline event created by smoke test',
      eventDate: 'Year 100',
      sortOrder: 0,
      era: 'Smoke Era',
      linkedNoteId: ctx.noteId ?? null,
    }),
  });

  assertStatus(createRes, 201, 'create timeline event');

  const timelineEventId = getEntityId(createRes);
  if (!timelineEventId) {
    throw new Error(`create timeline event: missing id in response ${JSON.stringify(createRes.data, null, 2)}`);
  }

  ctx.timelineEventId = timelineEventId;
  logOk(`Timeline event created: #${timelineEventId}`);

  const listRes = await api(`/timeline?projectId=${ctx.projectId}`);
  assertStatus(listRes, 200, 'list timeline events');

  const events = getEntityList(listRes, 'list timeline events');
  if (!events.some((e) => e.id === timelineEventId)) {
    throw new Error(`list timeline: created event #${timelineEventId} not found`);
  }

  logOk('Timeline list works');

  const getRes = await api(`/timeline/${timelineEventId}`);
  assertStatus(getRes, 200, 'get timeline event by id');

  const loadedEvent = getRes.data?.data;
  if (!loadedEvent || loadedEvent.id !== timelineEventId) {
    throw new Error(`get timeline event by id: wrong response ${JSON.stringify(getRes.data, null, 2)}`);
  }

  logOk('Timeline getById works');

  const updateRes = await api(`/timeline/${timelineEventId}`, {
    method: 'PUT',
    body: JSON.stringify({
      title: `Smoke Event Updated ${Date.now()}`,
      description: 'Updated by smoke test',
      sortOrder: 1,
    }),
  });

  assertStatus(updateRes, 200, 'update timeline event');
  logOk('Timeline event updated');

  if (ctx.tagId) {
    const setTagsRes = await api(`/timeline/${timelineEventId}/tags`, {
      method: 'PUT',
      body: JSON.stringify({
        tagIds: [ctx.tagId],
      }),
    });

    assertStatus(setTagsRes, 200, 'set timeline tags');
    logOk('Timeline tags assigned');
  }
}

async function smokeSearch(ctx) {
  logStep('Search');

  const query = encodeURIComponent('Smoke');
  const res = await api(`/search?projectId=${ctx.projectId}&q=${query}&limit=20`);

  assertStatus(res, 200, 'search');

  if (!res.data?.success) {
    throw new Error(`search: expected success=true, got ${JSON.stringify(res.data, null, 2)}`);
  }

  logOk('Search endpoint works');
}

async function smokeFactions(ctx) {
  logStep('Factions CRUD');

  const createRes = await api('/factions', {
    method: 'POST',
    body: JSON.stringify({
      projectId: ctx.projectId,
      name: `Smoke Faction ${Date.now()}`,
      type: 'guild',
      motto: 'Smoke and steel',
      description: 'Faction created by smoke test',
      status: 'active',
      parentFactionId: null,
    }),
  });

  assertStatus(createRes, 201, 'create faction');

  const factionId = getEntityId(createRes);
  if (!factionId) {
    throw new Error(`create faction: missing faction id in response ${JSON.stringify(createRes.data, null, 2)}`);
  }

  ctx.factionId = factionId;
  logOk(`Faction created: #${factionId}`);

  const listRes = await api(`/factions?projectId=${ctx.projectId}&limit=50&offset=0`);
  assertStatus(listRes, 200, 'list factions');

  const factions = getEntityList(listRes, 'list factions');
  if (!factions.some((f) => f.id === factionId)) {
    throw new Error(`list factions: created faction #${factionId} not found`);
  }

  logOk('Faction list works');

  const updateRes = await api(`/factions/${factionId}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: `Smoke Faction Updated ${Date.now()}`,
      motto: 'Updated motto',
      parentFactionId: null,
    }),
  });

  assertStatus(updateRes, 200, 'update faction');
  logOk('Faction updated');
}

async function smokeDynasties(ctx) {
  logStep('Dynasties CRUD');

  const createRes = await api('/dynasties', {
    method: 'POST',
    body: JSON.stringify({
      projectId: ctx.projectId,
      name: `Smoke Dynasty ${Date.now()}`,
      motto: 'Blood remembers',
      description: 'Dynasty created by smoke test',
      history: 'Founded during smoke testing.',
      status: 'active',
      color: '#c9a959',
      secondaryColor: '#2a2a4a',
      foundedDate: 'Year 1',
      extinctDate: '',
      founderId: null,
      currentLeaderId: null,
      heirId: null,
      linkedFactionId: ctx.factionId ?? null,
      sortOrder: 0,
    }),
  });

  assertStatus(createRes, 201, 'create dynasty');

  const dynastyId = getEntityId(createRes);
  if (!dynastyId) {
    throw new Error(`create dynasty: missing dynasty id in response ${JSON.stringify(createRes.data, null, 2)}`);
  }

  ctx.dynastyId = dynastyId;
  logOk(`Dynasty created: #${dynastyId}`);

  const listRes = await api(`/dynasties?projectId=${ctx.projectId}&limit=50&offset=0`);
  assertStatus(listRes, 200, 'list dynasties');

  const dynasties = getEntityList(listRes, 'list dynasties');
  if (!dynasties.some((d) => d.id === dynastyId)) {
    throw new Error(`list dynasties: created dynasty #${dynastyId} not found`);
  }

  logOk('Dynasty list works');

  const updateRes = await api(`/dynasties/${dynastyId}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: `Smoke Dynasty Updated ${Date.now()}`,
      motto: 'Updated bloodline',
      linkedFactionId: ctx.factionId ?? null,
    }),
  });

  assertStatus(updateRes, 200, 'update dynasty');
  logOk('Dynasty updated');
}

async function cleanup(ctx) {
  logStep('Cleanup');

  if (ctx.timelineEventId) {
    const res = await api(`/timeline/${ctx.timelineEventId}`, { method: 'DELETE' });
    if (res.ok) logOk(`Timeline event deleted: #${ctx.timelineEventId}`);
  }

  if (ctx.noteId) {
    const res = await api(`/notes/${ctx.noteId}`, { method: 'DELETE' });
    if (res.ok) logOk(`Note deleted: #${ctx.noteId}`);
  }

  if (ctx.characterId) {
    const res = await api(`/characters/${ctx.characterId}`, { method: 'DELETE' });
    if (res.ok) logOk(`Character deleted: #${ctx.characterId}`);
  }

  if (ctx.dynastyId) {
    const res = await api(`/dynasties/${ctx.dynastyId}`, { method: 'DELETE' });
    if (res.ok) logOk(`Dynasty deleted: #${ctx.dynastyId}`);
  }

  if (ctx.factionId) {
    const res = await api(`/factions/${ctx.factionId}`, { method: 'DELETE' });
    if (res.ok) logOk(`Faction deleted: #${ctx.factionId}`);
  }

  if (ctx.tagId) {
    const res = await api(`/tags/${ctx.tagId}`, { method: 'DELETE' });
    if (res.ok) logOk(`Tag deleted: #${ctx.tagId}`);
  }

  if (ctx.projectId) {
    const res = await api(`/projects/${ctx.projectId}`, { method: 'DELETE' });
    if (res.ok) logOk(`Project deleted: #${ctx.projectId}`);
  }
}

async function main() {
  const ctx = {
    projectId: null,
    tagId: null,
    characterId: null,
    noteId: null,
    timelineEventId: null,
    factionId: null,
    dynastyId: null,
  };

  console.log(pc.bold(pc.magenta(`\nCampaigner Smoke Test`)));
  console.log(pc.dim(`API: ${API_BASE}\n`));

  try {
    await smokeHealth();
    await smokeProjects(ctx);
    await smokeTags(ctx);
    await smokeCharacters(ctx);
    await smokeNotes(ctx);
    await smokeTimeline(ctx);
    await smokeSearch(ctx);
    await smokeFactions(ctx);
    await smokeDynasties(ctx);

    console.log(pc.green(pc.bold('\n✔ Smoke test passed\n')));
    process.exitCode = 0;
  } catch (error) {
    logError(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  } finally {
    try {
      await cleanup(ctx);
    } catch (cleanupError) {
      logError(`Cleanup failed: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`);
    }
  }
}

main();