import { api, assertStatus, ensureOverlayBranch, getEntityId, getEntityList, logStep, logOk } from '../lib.mjs';

export async function smokeDogmas(ctx) {
  logStep('Dogmas CRUD');

  ctx.uniqueDogmaTitle = `Smoke Dogma ${Date.now()}`;

  const createRes = await api('/dogmas', {
    method: 'POST',
    body: JSON.stringify({
      projectId: ctx.projectId,
      title: ctx.uniqueDogmaTitle,
      category: 'magic',
      description: 'Dogma created by smoke test',
      impact: 'Affects the world significantly',
      exceptions: 'Rare exceptions exist',
      isPublic: true,
      importance: 'major',
      status: 'active',
      sortOrder: 0,
      icon: '✨',
      color: '#7c3aed',
    }),
  });

  assertStatus(createRes, 201, 'create dogma');

  const dogmaId = getEntityId(createRes);
  if (!dogmaId) {
    throw new Error(`create dogma: missing dogma id in response ${JSON.stringify(createRes.data, null, 2)}`);
  }

  ctx.dogmaId = dogmaId;
  logOk(`Dogma created: #${dogmaId}`);

  const listRes = await api(`/dogmas?projectId=${ctx.projectId}&limit=50&offset=0`);
  assertStatus(listRes, 200, 'list dogmas');

  const dogmas = getEntityList(listRes, 'list dogmas');
  if (!dogmas.some((d) => d.id === dogmaId)) {
    throw new Error(`list dogmas: created dogma #${dogmaId} not found`);
  }

  logOk('Dogma list works');

  const getRes = await api(`/dogmas/${dogmaId}`);
  assertStatus(getRes, 200, 'get dogma by id');

  const loadedDogma = getRes.data?.data;
  if (!loadedDogma || loadedDogma.id !== dogmaId) {
    throw new Error(`get dogma by id: wrong response ${JSON.stringify(getRes.data, null, 2)}`);
  }

  logOk('Dogma getById works');

  const updateRes = await api(`/dogmas/${dogmaId}`, {
    method: 'PUT',
    body: JSON.stringify({
      title: `Smoke Dogma Updated ${Date.now()}`,
      importance: 'fundamental',
      description: 'Updated by smoke test',
    }),
  });

  assertStatus(updateRes, 200, 'update dogma');
  logOk('Dogma updated');

  if (ctx.tagId) {
    const setTagsRes = await api(`/dogmas/${dogmaId}/tags`, {
      method: 'PUT',
      body: JSON.stringify({
        tagIds: [ctx.tagId],
      }),
    });

    assertStatus(setTagsRes, 200, 'set dogma tags');
    logOk('Dogma tags assigned');
  }

  const branchId = await ensureOverlayBranch(ctx);
  const branchDogmaTitle = `Smoke Dogma Branch Updated ${Date.now()}`;
  const branchUpdateRes = await api(`/dogmas/${dogmaId}`, {
    method: 'PUT',
    body: JSON.stringify({
      branchId,
      title: branchDogmaTitle,
    }),
  });
  assertStatus(branchUpdateRes, 200, 'branch update dogma');

  const branchGetRes = await api(`/dogmas/${dogmaId}?branchId=${branchId}`);
  assertStatus(branchGetRes, 200, 'branch get dogma');
  if (branchGetRes.data?.data?.title !== branchDogmaTitle) {
    throw new Error(`branch get dogma: expected branch title override ${JSON.stringify(branchGetRes.data, null, 2)}`);
  }

  const mainGetRes = await api(`/dogmas/${dogmaId}`);
  assertStatus(mainGetRes, 200, 'main get dogma after branch update');
  if (mainGetRes.data?.data?.title === branchDogmaTitle) {
    throw new Error('main dogma changed after branch update, expected base unchanged');
  }

  const branchDeleteRes = await api(`/dogmas/${dogmaId}?branchId=${branchId}`, {
    method: 'DELETE',
  });
  assertStatus(branchDeleteRes, 200, 'branch delete dogma');

  const branchGetAfterDeleteRes = await api(`/dogmas/${dogmaId}?branchId=${branchId}`);
  assertStatus(branchGetAfterDeleteRes, 404, 'branch get dogma after branch delete');

  const mainGetAfterDeleteRes = await api(`/dogmas/${dogmaId}`);
  assertStatus(mainGetAfterDeleteRes, 200, 'main get dogma after branch delete');
  logOk('Dogmas branch overlay flow works (update/delete override)');
}

export async function smokeDogmaReorder(ctx) {
  logStep('Dogma Reorder');

  const secondRes = await api('/dogmas', {
    method: 'POST',
    body: JSON.stringify({
      projectId: ctx.projectId,
      title: `Smoke Dogma Secondary ${Date.now()}`,
      category: 'history',
      description: 'Second dogma for reorder test',
      impact: '',
      exceptions: '',
      isPublic: true,
      importance: 'minor',
      status: 'active',
      sortOrder: 1,
      icon: '📜',
      color: '#2563eb',
    }),
  });

  assertStatus(secondRes, 201, 'create secondary dogma');

  const secondaryDogmaId = getEntityId(secondRes);
  if (!secondaryDogmaId) {
    throw new Error(`create secondary dogma: missing id ${JSON.stringify(secondRes.data, null, 2)}`);
  }

  ctx.secondaryDogmaId = secondaryDogmaId;
  logOk(`Secondary dogma created: #${secondaryDogmaId}`);

  const reorderRes = await api('/dogmas/reorder', {
    method: 'POST',
    body: JSON.stringify({
      projectId: ctx.projectId,
      orderedIds: [secondaryDogmaId, ctx.dogmaId],
    }),
  });

  assertStatus(reorderRes, 200, 'dogma reorder');

  const reordered = getEntityList(reorderRes, 'dogma reorder response');
  if (!reordered.some((d) => d.id === secondaryDogmaId) || !reordered.some((d) => d.id === ctx.dogmaId)) {
    throw new Error(`dogma reorder: expected both dogmas in response ${JSON.stringify(reorderRes.data, null, 2)}`);
  }

  logOk('Dogma reorder works');

  const branchId = await ensureOverlayBranch(ctx);
  const mainBeforeBranchReorderRes = await api(`/dogmas?projectId=${ctx.projectId}&limit=50&offset=0`);
  assertStatus(mainBeforeBranchReorderRes, 200, 'main list dogmas before branch reorder');
  const mainBeforeBranchReorder = getEntityList(mainBeforeBranchReorderRes, 'main list before branch reorder');
  const beforePrimary = mainBeforeBranchReorder.find((d) => d.id === ctx.dogmaId)?.sortOrder;
  const beforeSecondary = mainBeforeBranchReorder.find((d) => d.id === secondaryDogmaId)?.sortOrder;

  const branchReorderRes = await api('/dogmas/reorder', {
    method: 'POST',
    body: JSON.stringify({
      projectId: ctx.projectId,
      branchId,
      orderedIds: [ctx.dogmaId, secondaryDogmaId],
    }),
  });
  assertStatus(branchReorderRes, 200, 'branch dogma reorder');

  const branchListRes = await api(`/dogmas?projectId=${ctx.projectId}&limit=50&offset=0&branchId=${branchId}`);
  assertStatus(branchListRes, 200, 'branch list dogmas after branch reorder');
  const branchList = getEntityList(branchListRes, 'branch dogma list after reorder');
  const branchPrimary = branchList.find((d) => d.id === ctx.dogmaId)?.sortOrder;
  const branchSecondary = branchList.find((d) => d.id === secondaryDogmaId)?.sortOrder;
  if (!(branchPrimary === 1 && branchSecondary === 2)) {
    throw new Error(`branch reorder not applied as expected: ${JSON.stringify(branchListRes.data, null, 2)}`);
  }

  const mainAfterBranchReorderRes = await api(`/dogmas?projectId=${ctx.projectId}&limit=50&offset=0`);
  assertStatus(mainAfterBranchReorderRes, 200, 'main list dogmas after branch reorder');
  const mainAfterBranchReorder = getEntityList(mainAfterBranchReorderRes, 'main list after branch reorder');
  const afterPrimary = mainAfterBranchReorder.find((d) => d.id === ctx.dogmaId)?.sortOrder;
  const afterSecondary = mainAfterBranchReorder.find((d) => d.id === secondaryDogmaId)?.sortOrder;
  if (beforePrimary !== afterPrimary || beforeSecondary !== afterSecondary) {
    throw new Error('main reorder changed after branch reorder, expected base unchanged');
  }

  logOk('Dogma branch reorder works without changing main');
}