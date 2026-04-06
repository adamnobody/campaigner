import { api, assertStatus, ensureOverlayBranch, getEntityId, getEntityList, logStep, logOk } from '../lib.mjs';

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

  const branchId = await ensureOverlayBranch(ctx);
  const branchMarkerDescription = `Marker branch override ${Date.now()}`;
  const branchMarkerUpdateRes = await api(`/markers/${ctx.markerId}`, {
    method: 'PUT',
    body: JSON.stringify({
      branchId,
      description: branchMarkerDescription,
    }),
  });
  assertStatus(branchMarkerUpdateRes, 200, 'branch update marker');

  const branchMarkersRes = await api(`/maps/${ctx.rootMapId}/markers?branchId=${branchId}`);
  assertStatus(branchMarkersRes, 200, 'branch list markers');
  const branchMarkers = getEntityList(branchMarkersRes, 'branch list markers');
  const branchMarker = branchMarkers.find((m) => m.id === ctx.markerId);
  if (!branchMarker || branchMarker.description !== branchMarkerDescription) {
    throw new Error('branch list markers: expected marker description override');
  }

  const mainMarkersRes = await api(`/maps/${ctx.rootMapId}/markers`);
  assertStatus(mainMarkersRes, 200, 'main list markers after branch update');
  const mainMarkers = getEntityList(mainMarkersRes, 'main list markers after branch update');
  const mainMarker = mainMarkers.find((m) => m.id === ctx.markerId);
  if (!mainMarker || mainMarker.description === branchMarkerDescription) {
    throw new Error('main marker changed after branch update, expected base unchanged');
  }

  const branchDeleteMarkerRes = await api(`/markers/${ctx.markerId}?branchId=${branchId}`, {
    method: 'DELETE',
  });
  assertStatus(branchDeleteMarkerRes, 200, 'branch delete marker');

  const branchMarkersAfterDeleteRes = await api(`/maps/${ctx.rootMapId}/markers?branchId=${branchId}`);
  assertStatus(branchMarkersAfterDeleteRes, 200, 'branch list markers after branch delete');
  const branchMarkersAfterDelete = getEntityList(branchMarkersAfterDeleteRes, 'branch list markers after delete');
  if (branchMarkersAfterDelete.some((m) => m.id === ctx.markerId)) {
    throw new Error('branch marker still visible after branch delete');
  }

  const mainMarkersAfterDeleteRes = await api(`/maps/${ctx.rootMapId}/markers`);
  assertStatus(mainMarkersAfterDeleteRes, 200, 'main list markers after branch delete');
  const mainMarkersAfterDelete = getEntityList(mainMarkersAfterDeleteRes, 'main list markers after branch delete');
  if (!mainMarkersAfterDelete.some((m) => m.id === ctx.markerId)) {
    throw new Error('main marker removed after branch delete, expected base unchanged');
  }

  const branchTerritoryDescription = `Territory branch override ${Date.now()}`;
  const branchTerritoryUpdateRes = await api(`/territories/${ctx.territoryId}`, {
    method: 'PUT',
    body: JSON.stringify({
      branchId,
      description: branchTerritoryDescription,
    }),
  });
  assertStatus(branchTerritoryUpdateRes, 200, 'branch update territory');

  const branchTerritoriesRes = await api(`/maps/${ctx.rootMapId}/territories?branchId=${branchId}`);
  assertStatus(branchTerritoriesRes, 200, 'branch list territories');
  const branchTerritories = getEntityList(branchTerritoriesRes, 'branch list territories');
  const branchTerritory = branchTerritories.find((t) => t.id === ctx.territoryId);
  if (!branchTerritory || branchTerritory.description !== branchTerritoryDescription) {
    throw new Error('branch list territories: expected territory description override');
  }

  const mainTerritoriesRes = await api(`/maps/${ctx.rootMapId}/territories`);
  assertStatus(mainTerritoriesRes, 200, 'main list territories after branch update');
  const mainTerritories = getEntityList(mainTerritoriesRes, 'main list territories after branch update');
  const mainTerritory = mainTerritories.find((t) => t.id === ctx.territoryId);
  if (!mainTerritory || mainTerritory.description === branchTerritoryDescription) {
    throw new Error('main territory changed after branch update, expected base unchanged');
  }

  const branchDeleteTerritoryRes = await api(`/territories/${ctx.territoryId}?branchId=${branchId}`, {
    method: 'DELETE',
  });
  assertStatus(branchDeleteTerritoryRes, 200, 'branch delete territory');

  const branchTerritoriesAfterDeleteRes = await api(`/maps/${ctx.rootMapId}/territories?branchId=${branchId}`);
  assertStatus(branchTerritoriesAfterDeleteRes, 200, 'branch list territories after branch delete');
  const branchTerritoriesAfterDelete = getEntityList(branchTerritoriesAfterDeleteRes, 'branch list territories after delete');
  if (branchTerritoriesAfterDelete.some((t) => t.id === ctx.territoryId)) {
    throw new Error('branch territory still visible after branch delete');
  }

  const mainTerritoriesAfterDeleteRes = await api(`/maps/${ctx.rootMapId}/territories`);
  assertStatus(mainTerritoriesAfterDeleteRes, 200, 'main list territories after branch delete');
  const mainTerritoriesAfterDelete = getEntityList(mainTerritoriesAfterDeleteRes, 'main list territories after branch delete');
  if (!mainTerritoriesAfterDelete.some((t) => t.id === ctx.territoryId)) {
    throw new Error('main territory removed after branch delete, expected base unchanged');
  }

  logOk('Maps branch overlay flow works (marker/territory update/delete override)');
}
