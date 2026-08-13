# Wiki Markdown reader
- Wiki articles remain ordinary notes with `noteType: 'wiki'`, `format: 'md'`; no schema or backend format was added.
- Read view route: `/project/:projectId/wiki/:noteId`, implemented by `frontend/src/pages/wiki/WikiArticlePage.tsx`.
- Editing continues through `/project/:projectId/notes/:noteId` and the existing note editor.
- The read view derives an h2–h4 table of contents with stable duplicate-safe Unicode anchors via `frontend/src/pages/wiki/wikiToc.ts`.