import { api, logStep, logOk } from './lib.mjs';

export async function cleanup(ctx) {
  logStep('Cleanup');

  if (ctx.relationshipId) {
    const res = await api(`/characters/relationships/${ctx.relationshipId}`, { method: 'DELETE' });
    if (res.ok) logOk(`Relationship deleted: #${ctx.relationshipId}`);
  }

  if (ctx.territoryId) {
    const res = await api(`/territories/${ctx.territoryId}`, { method: 'DELETE' });
    if (res.ok) logOk(`Territory deleted: #${ctx.territoryId}`);
  }

  if (ctx.markerId) {
    const res = await api(`/markers/${ctx.markerId}`, { method: 'DELETE' });
    if (res.ok) logOk(`Marker deleted: #${ctx.markerId}`);
  }

  if (ctx.wikiLinkId) {
    const res = await api(`/wiki/links/${ctx.wikiLinkId}`, { method: 'DELETE' });
    if (res.ok) logOk(`Wiki link deleted: #${ctx.wikiLinkId}`);
  }

  if (ctx.factionRelationId) {
    const res = await api(`/factions/relations/${ctx.factionRelationId}`, { method: 'DELETE' });
    if (res.ok) logOk(`Faction relation deleted: #${ctx.factionRelationId}`);
  }

  if (ctx.secondaryTimelineEventId) {
    const res = await api(`/timeline/${ctx.secondaryTimelineEventId}`, { method: 'DELETE' });
    if (res.ok) logOk(`Secondary timeline event deleted: #${ctx.secondaryTimelineEventId}`);
  }

  if (ctx.timelineEventId) {
    const res = await api(`/timeline/${ctx.timelineEventId}`, { method: 'DELETE' });
    if (res.ok) logOk(`Timeline event deleted: #${ctx.timelineEventId}`);
  }

  if (ctx.secondaryWikiNoteId) {
    const res = await api(`/notes/${ctx.secondaryWikiNoteId}`, { method: 'DELETE' });
    if (res.ok) logOk(`Secondary wiki note deleted: #${ctx.secondaryWikiNoteId}`);
  }

  if (ctx.noteId) {
    const res = await api(`/notes/${ctx.noteId}`, { method: 'DELETE' });
    if (res.ok) logOk(`Note deleted: #${ctx.noteId}`);
  }

  if (ctx.factionMemberId) {
    const res = await api(`/factions/${ctx.factionId}/members/${ctx.factionMemberId}`, { method: 'DELETE' });
    if (res.ok) logOk(`Faction member deleted: #${ctx.factionMemberId}`);
  }

  if (ctx.factionRankId) {
    const res = await api(`/factions/${ctx.factionId}/ranks/${ctx.factionRankId}`, { method: 'DELETE' });
    if (res.ok) logOk(`Faction rank deleted: #${ctx.factionRankId}`);
  }

  if (ctx.secondaryCharacterId) {
    const res = await api(`/characters/${ctx.secondaryCharacterId}`, { method: 'DELETE' });
    if (res.ok) logOk(`Secondary character deleted: #${ctx.secondaryCharacterId}`);
  }

  if (ctx.characterId) {
    const res = await api(`/characters/${ctx.characterId}`, { method: 'DELETE' });
    if (res.ok) logOk(`Character deleted: #${ctx.characterId}`);
  }

  if (ctx.secondaryDogmaId) {
    const res = await api(`/dogmas/${ctx.secondaryDogmaId}`, { method: 'DELETE' });
    if (res.ok) logOk(`Secondary dogma deleted: #${ctx.secondaryDogmaId}`);
  }

  if (ctx.dogmaId) {
    const res = await api(`/dogmas/${ctx.dogmaId}`, { method: 'DELETE' });
    if (res.ok) logOk(`Dogma deleted: #${ctx.dogmaId}`);
  }

  if (ctx.dynastyId) {
    const res = await api(`/dynasties/${ctx.dynastyId}`, { method: 'DELETE' });
    if (res.ok) logOk(`Dynasty deleted: #${ctx.dynastyId}`);
  }

  if (ctx.secondaryFactionId) {
    const res = await api(`/factions/${ctx.secondaryFactionId}`, { method: 'DELETE' });
    if (res.ok) logOk(`Secondary faction deleted: #${ctx.secondaryFactionId}`);
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

  if (ctx.importedProjectId) {
    const res = await api(`/projects/${ctx.importedProjectId}`, { method: 'DELETE' });
    if (res.ok) logOk(`Imported project deleted: #${ctx.importedProjectId}`);
  }
}