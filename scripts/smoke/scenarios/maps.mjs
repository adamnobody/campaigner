import { api, assertStatus, getEntityId, getEntityList, logStep, logOk } from '../lib.mjs';

export async function smokeMaps(ctx) {
  logStep('Maps, markers and territories');

  const rootRes = await api(`/projects/${ctx.projectId}/maps/root`);
  assertStatus(rootRes, 200, 'get root map');

  const rootMap = rootRes.data?.data;
  if (!rootMap?.id) {
    throw new Error(`get root map: invalid payload ${JSON.stringify(rootRes.data, null, 2)}`);
  }
  ctx.rootMapId = rootMap.id;
  logOk(`Root map loaded: #${ctx.rootMapId}`);

  const treeRes = await api(`/projects/${ctx.projectId}/maps/tree`);
  assertStatus(treeRes, 200, 'get map tree');
  const tree = getEntityList(treeRes, 'map tree');
  if (!tree.some((m) => m.id === ctx.rootMapId)) {
    throw new Error(`map tree: root map #${ctx.rootMapId} not found`);
  }
  logOk('Map tree works');

  const markerCreateRes = await api(`/maps/${ctx.rootMapId}/markers`, {
    method: 'POST',
    body: JSON.stringify({
      title: `Smoke Marker ${Date.now()}`,
      description: 'Marker created by smoke test',
      positionX: 0.42,
      positionY: 0.38,
      color: '#FF6B6B',
      icon: 'city',
      linkedNoteId: ctx.noteId ?? null,
      childMapId: null,
    }),
  });
  assertStatus(markerCreateRes, 201, 'create marker');

  ctx.markerId = getEntityId(markerCreateRes);
  if (!ctx.markerId) {
    throw new Error(`create marker: missing marker id ${JSON.stringify(markerCreateRes.data, null, 2)}`);
  }
  logOk(`Marker created: #${ctx.markerId}`);

  const markerListRes = await api(`/maps/${ctx.rootMapId}/markers`);
  assertStatus(markerListRes, 200, 'list markers');
  const markers = getEntityList(markerListRes, 'list markers');
  if (!markers.some((m) => m.id === ctx.markerId)) {
    throw new Error(`list markers: marker #${ctx.markerId} not found`);
  }
  logOk('Markers list works');

  const markerUpdateRes = await api(`/markers/${ctx.markerId}`, {
    method: 'PUT',
    body: JSON.stringify({
      description: 'Marker updated by smoke test',
      positionX: 0.47,
      positionY: 0.41,
    }),
  });
  assertStatus(markerUpdateRes, 200, 'update marker');
  logOk('Marker update works');

  const territoryCreateRes = await api(`/maps/${ctx.rootMapId}/territories`, {
    method: 'POST',
    body: JSON.stringify({
      name: `Smoke Territory ${Date.now()}`,
      description: 'Territory created by smoke test',
      color: '#4ECDC4',
      opacity: 0.25,
      borderColor: '#4ECDC4',
      borderWidth: 2,
      smoothing: 0.2,
      factionId: ctx.factionId ?? null,
      sortOrder: 0,
      points: [
        { x: 0.2, y: 0.2 },
        { x: 0.32, y: 0.25 },
        { x: 0.28, y: 0.38 },
      ],
    }),
  });
  assertStatus(territoryCreateRes, 201, 'create territory');

  ctx.territoryId = getEntityId(territoryCreateRes);
  if (!ctx.territoryId) {
    throw new Error(`create territory: missing territory id ${JSON.stringify(territoryCreateRes.data, null, 2)}`);
  }
  logOk(`Territory created: #${ctx.territoryId}`);

  const territoryListRes = await api(`/maps/${ctx.rootMapId}/territories`);
  assertStatus(territoryListRes, 200, 'list territories');
  const territories = getEntityList(territoryListRes, 'list territories');
  if (!territories.some((t) => t.id === ctx.territoryId)) {
    throw new Error(`list territories: territory #${ctx.territoryId} not found`);
  }
  logOk('Territories list works');

  const territoryUpdateRes = await api(`/territories/${ctx.territoryId}`, {
    method: 'PUT',
    body: JSON.stringify({
      description: 'Territory updated by smoke test',
      opacity: 0.33,
      sortOrder: 3,
    }),
  });
  assertStatus(territoryUpdateRes, 200, 'update territory');
  logOk('Territory update works');
}
