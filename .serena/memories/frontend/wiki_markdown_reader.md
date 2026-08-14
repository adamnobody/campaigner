# Wiki article surface

Wiki articles remain ordinary notes with `noteType: 'wiki'`, `format: 'md'`.

Route `/project/:projectId/wiki/:noteId` is now the WYSIWYG wiki editor (`WikiArticlePage`), not a read-only markdown reader. Read mode is a chrome toggle («Читать»). Editing no longer goes through `/notes/:noteId`.

TOC still uses `frontend/src/pages/wiki/wikiToc.ts` against the markdown body after stripping the `<!--campaigner:...-->` meta comment.
