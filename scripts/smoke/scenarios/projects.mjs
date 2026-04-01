import { api, assertStatus, getEntityId, getEntityList, logStep, logOk } from '../lib.mjs';

export async function smokeProjects(ctx) {
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