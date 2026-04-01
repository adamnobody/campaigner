import { api, assertStatus, getEntityId, getEntityList, logStep, logOk } from '../lib.mjs';

export async function smokeWiki(ctx) {
  logStep('Wiki Links');

  const secondNoteRes = await api('/notes', {
    method: 'POST',
    body: JSON.stringify({
      projectId: ctx.projectId,
      folderId: null,
      title: `Smoke Wiki Note ${Date.now()}`,
      content: '# Smoke Wiki Target\n\nUsed for wiki link testing.',
      format: 'md',
      noteType: 'wiki',
      isPinned: false,
    }),
  });

  assertStatus(secondNoteRes, 201, 'create secondary wiki note');

  const secondaryWikiNoteId = getEntityId(secondNoteRes);
  if (!secondaryWikiNoteId) {
    throw new Error(`create secondary wiki note: missing id ${JSON.stringify(secondNoteRes.data, null, 2)}`);
  }

  ctx.secondaryWikiNoteId = secondaryWikiNoteId;
  logOk(`Secondary wiki note created: #${secondaryWikiNoteId}`);

  const createLinkRes = await api('/wiki/links', {
    method: 'POST',
    body: JSON.stringify({
      projectId: ctx.projectId,
      sourceNoteId: ctx.noteId,
      targetNoteId: secondaryWikiNoteId,
      label: 'smoke-link',
    }),
  });

  assertStatus(createLinkRes, 201, 'create wiki link');

  const wikiLinkId = getEntityId(createLinkRes);
  if (!wikiLinkId) {
    throw new Error(`create wiki link: missing id ${JSON.stringify(createLinkRes.data, null, 2)}`);
  }

  ctx.wikiLinkId = wikiLinkId;
  logOk(`Wiki link created: #${wikiLinkId}`);

  const listAllRes = await api(`/wiki/links?projectId=${ctx.projectId}`);
  assertStatus(listAllRes, 200, 'list wiki links');

  const allLinks = getEntityList(listAllRes, 'list wiki links');
  if (!allLinks.some((link) => link.id === wikiLinkId)) {
    throw new Error(`list wiki links: created link #${wikiLinkId} not found`);
  }

  logOk('Wiki link list works');

  const listForNoteRes = await api(`/wiki/links?projectId=${ctx.projectId}&noteId=${ctx.noteId}`);
  assertStatus(listForNoteRes, 200, 'list wiki links for note');

  const noteLinks = getEntityList(listForNoteRes, 'list wiki links for note');
  if (!noteLinks.some((link) => link.id === wikiLinkId)) {
    throw new Error(`list wiki links for note: created link #${wikiLinkId} not found`);
  }

  logOk('Wiki note link list works');

  const categoriesRes = await api(`/wiki/categories?projectId=${ctx.projectId}`);
  assertStatus(categoriesRes, 200, 'wiki categories');

  if (!categoriesRes.data?.success) {
    throw new Error(`wiki categories: expected success=true, got ${JSON.stringify(categoriesRes.data, null, 2)}`);
  }

  const categories = categoriesRes.data?.data;
  if (!Array.isArray(categories)) {
    throw new Error(`wiki categories: expected array, got ${JSON.stringify(categoriesRes.data, null, 2)}`);
  }

  logOk('Wiki categories work');
}