import { api, assertStatus, ensureOverlayBranch, getEntityId, getEntityList, logStep, logOk } from '../lib.mjs';

export async function smokeTimeline(ctx) {
  logStep('Timeline CRUD');

  ctx.uniqueTimelineTitle = `Smoke Event ${Date.now()}`;

  const createRes = await api('/timeline', {
    method: 'POST',
    body: JSON.stringify({
      projectId: ctx.projectId,
      title: ctx.uniqueTimelineTitle,
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

  const branchId = await ensureOverlayBranch(ctx);
  const branchTitle = `Smoke Timeline Branch Updated ${Date.now()}`;
  const branchUpdateRes = await api(`/timeline/${timelineEventId}`, {
    method: 'PUT',
    body: JSON.stringify({
      branchId,
      title: branchTitle,
    }),
  });
  assertStatus(branchUpdateRes, 200, 'branch update timeline');

  const branchGetRes = await api(`/timeline/${timelineEventId}?branchId=${branchId}`);
  assertStatus(branchGetRes, 200, 'branch get timeline');
  if (branchGetRes.data?.data?.title !== branchTitle) {
    throw new Error(`branch get timeline: expected branch title override ${JSON.stringify(branchGetRes.data, null, 2)}`);
  }

  const mainGetRes = await api(`/timeline/${timelineEventId}`);
  assertStatus(mainGetRes, 200, 'main get timeline after branch update');
  if (mainGetRes.data?.data?.title === branchTitle) {
    throw new Error('main timeline changed after branch update, expected base unchanged');
  }

  const branchDeleteRes = await api(`/timeline/${timelineEventId}?branchId=${branchId}`, {
    method: 'DELETE',
  });
  assertStatus(branchDeleteRes, 200, 'branch delete timeline');

  const branchGetAfterDeleteRes = await api(`/timeline/${timelineEventId}?branchId=${branchId}`);
  assertStatus(branchGetAfterDeleteRes, 404, 'branch get timeline after branch delete');

  const mainGetAfterDeleteRes = await api(`/timeline/${timelineEventId}`);
  assertStatus(mainGetAfterDeleteRes, 200, 'main get timeline after branch delete');
  logOk('Timeline branch overlay flow works (update/delete override)');
}

export async function smokeTimelineReorder(ctx) {
  logStep('Timeline Reorder');

  const secondEventRes = await api('/timeline', {
    method: 'POST',
    body: JSON.stringify({
      projectId: ctx.projectId,
      title: `Smoke Event Secondary ${Date.now()}`,
      description: 'Second timeline event for reorder test',
      eventDate: 'Year 101',
      sortOrder: 2,
      era: 'Smoke Era',
      linkedNoteId: null,
    }),
  });

  assertStatus(secondEventRes, 201, 'create secondary timeline event');

  const secondaryTimelineEventId = getEntityId(secondEventRes);
  if (!secondaryTimelineEventId) {
    throw new Error(`create secondary timeline event: missing id ${JSON.stringify(secondEventRes.data, null, 2)}`);
  }

  ctx.secondaryTimelineEventId = secondaryTimelineEventId;
  logOk(`Secondary timeline event created: #${secondaryTimelineEventId}`);

  const reorderRes = await api('/timeline/reorder', {
    method: 'POST',
    body: JSON.stringify({
      projectId: ctx.projectId,
      orderedIds: [secondaryTimelineEventId, ctx.timelineEventId],
    }),
  });

  assertStatus(reorderRes, 200, 'timeline reorder');

  const reordered = getEntityList(reorderRes, 'timeline reorder response');
  if (!reordered.some((e) => e.id === secondaryTimelineEventId) || !reordered.some((e) => e.id === ctx.timelineEventId)) {
    throw new Error(`timeline reorder: expected both events in response ${JSON.stringify(reorderRes.data, null, 2)}`);
  }

  logOk('Timeline reorder works');
}