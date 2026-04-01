import { api, assertStatus, getEntityId, getEntityList, logStep, logOk } from '../lib.mjs';

export async function smokeTags(ctx) {
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