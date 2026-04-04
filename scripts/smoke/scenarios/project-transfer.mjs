import { api, assertStatus, getEntityId, getEntityList, logStep, logOk } from '../lib.mjs';

export async function smokeProjectTransfer(ctx) {
  logStep('Project export/import');

  const exportRes = await api(`/projects/${ctx.projectId}/export`);
  assertStatus(exportRes, 200, 'project export');

  const payload = exportRes.data?.data;
  if (!payload?.project?.name) {
    throw new Error(`project export: invalid payload ${JSON.stringify(exportRes.data, null, 2)}`);
  }
  logOk('Project export works');

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

  const projectsRes = await api('/projects');
  assertStatus(projectsRes, 200, 'list projects after import');
  const projects = getEntityList(projectsRes, 'list projects after import');
  if (!projects.some((p) => p.id === importedProjectId)) {
    throw new Error(`list projects after import: imported project #${importedProjectId} not found`);
  }
  logOk('Imported project appears in projects list');
}
