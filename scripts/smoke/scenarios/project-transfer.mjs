import { api, assertStatus, getEntityId, getEntityList, logStep, logOk } from '../lib.mjs';

export async function smokeProjectTransfer(ctx) {
  logStep('Project export/import');

  const exportRes = await api(`/projects/${ctx.projectId}/export`);
  assertStatus(exportRes, 200, 'project export');

  const payload = exportRes.data?.data;
  if (!payload?.project?.name) {
    throw new Error(`project export: invalid payload ${JSON.stringify(exportRes.data, null, 2)}`);
  }
  const expectedCollections = [
    'characters',
    'relationships',
    'notes',
    'folders',
    'maps',
    'markers',
    'territories',
    'timelineEvents',
    'tags',
    'tagAssociations',
    'wikiLinks',
    'dogmas',
    'factions',
    'factionRanks',
    'factionMembers',
    'factionRelations',
    'dynasties',
    'dynastyMembers',
    'dynastyFamilyLinks',
    'dynastyEvents',
  ];
  for (const key of expectedCollections) {
    if (payload[key] !== undefined && !Array.isArray(payload[key])) {
      throw new Error(`project export: expected "${key}" to be an array when present`);
    }
  }
  logOk('Project export works');

  const buildTagAssocSignature = (projectPayload, entityType) => {
    const tags = Array.isArray(projectPayload?.tags) ? projectPayload.tags : [];
    const tagAssociations = Array.isArray(projectPayload?.tagAssociations) ? projectPayload.tagAssociations : [];
    const tagNameById = new Map(tags.map((tag) => [tag?.id, tag?.name]));

    return tagAssociations
      .filter((item) => item?.entityType === entityType)
      .map((item) => {
        const tagName = tagNameById.get(item?.tagId);
        return `${entityType}:${tagName || '__missing_tag__'}`;
      })
      .sort();
  };

  const sourceTimelineSignature = buildTagAssocSignature(payload, 'timeline_event');
  const sourceDogmaSignature = buildTagAssocSignature(payload, 'dogma');

  const importRes = await api('/projects/import', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  assertStatus(importRes, 201, 'project import');

  const importedProjectId = getEntityId(importRes);
  if (!importedProjectId) {
    throw new Error(`project import: missing project id ${JSON.stringify(importRes.data, null, 2)}`);
  }
  ctx.importedProjectId = importedProjectId;
  logOk(`Project imported: #${importedProjectId}`);

  // Point check for transfer v2.1: timeline_event/dogma tag associations survive round-trip.
  const importedExportRes = await api(`/projects/${importedProjectId}/export`);
  assertStatus(importedExportRes, 200, 'imported project re-export');
  const importedPayload = importedExportRes.data?.data;
  const importedTimelineSignature = buildTagAssocSignature(importedPayload, 'timeline_event');
  const importedDogmaSignature = buildTagAssocSignature(importedPayload, 'dogma');

  if (JSON.stringify(importedTimelineSignature) !== JSON.stringify(sourceTimelineSignature)) {
    throw new Error(
      `project import: timeline_event tag associations mismatch ` +
      `(source=${JSON.stringify(sourceTimelineSignature)}, imported=${JSON.stringify(importedTimelineSignature)})`
    );
  }

  if (JSON.stringify(importedDogmaSignature) !== JSON.stringify(sourceDogmaSignature)) {
    throw new Error(
      `project import: dogma tag associations mismatch ` +
      `(source=${JSON.stringify(sourceDogmaSignature)}, imported=${JSON.stringify(importedDogmaSignature)})`
    );
  }
  logOk('Timeline/Dogma tag associations preserved after import (entityType + tagName)');

  const projectsRes = await api('/projects');
  assertStatus(projectsRes, 200, 'list projects after import');
  const projects = getEntityList(projectsRes, 'list projects after import');
  if (!projects.some((p) => p.id === importedProjectId)) {
    throw new Error(`list projects after import: imported project #${importedProjectId} not found`);
  }
  logOk('Imported project appears in projects list');
}
