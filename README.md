
```
campaigner
├─ .cursor
├─ backend
│  ├─ data
│  ├─ package.json
│  ├─ src
│  │  ├─ controllers
│  │  │  ├─ character.controller.ts
│  │  │  ├─ dogma.controller.ts
│  │  │  ├─ dynasty.controller.ts
│  │  │  ├─ faction.controller.ts
│  │  │  ├─ map.controller.ts
│  │  │  ├─ note.controller.ts
│  │  │  ├─ project.controller.ts
│  │  │  ├─ search.controller.ts
│  │  │  ├─ tag.controller.ts
│  │  │  ├─ timeline.controller.ts
│  │  │  └─ wiki.controller.ts
│  │  ├─ db
│  │  │  ├─ connection.ts
│  │  │  ├─ migrate.ts
│  │  │  ├─ migrations
│  │  │  │  ├─ 001_create_maps_table.ts
│  │  │  │  ├─ 002_tag_associations_dynasty.ts
│  │  │  │  └─ 003_dynasty_members_graph.ts
│  │  │  └─ schema.ts
│  │  ├─ index.ts
│  │  ├─ middleware
│  │  │  ├─ createUpload.ts
│  │  │  ├─ errorHandler.ts
│  │  │  ├─ requestMetrics.ts
│  │  │  ├─ upload.ts
│  │  │  └─ validateRequest.ts
│  │  ├─ routes
│  │  │  ├─ character.routes.ts
│  │  │  ├─ commonSchemas.ts
│  │  │  ├─ dogma.routes.ts
│  │  │  ├─ dynasty.routes.ts
│  │  │  ├─ faction.routes.ts
│  │  │  ├─ map.routes.ts
│  │  │  ├─ note.routes.ts
│  │  │  ├─ project.routes.ts
│  │  │  ├─ search.routes.ts
│  │  │  ├─ tag.routes.ts
│  │  │  ├─ timeline.routes.ts
│  │  │  ├─ upload.routes.ts
│  │  │  └─ wiki.routes.ts
│  │  ├─ services
│  │  │  ├─ character.service.ts
│  │  │  ├─ dogma.service.ts
│  │  │  ├─ dynasty
│  │  │  │  ├─ dynasty.mappers.ts
│  │  │  │  └─ dynasty.types.ts
│  │  │  ├─ dynasty.service.ts
│  │  │  ├─ faction
│  │  │  │  ├─ faction.mappers.ts
│  │  │  │  └─ faction.types.ts
│  │  │  ├─ faction.service.ts
│  │  │  ├─ map
│  │  │  │  └─ map.types.ts
│  │  │  ├─ map.service.ts
│  │  │  ├─ note.service.ts
│  │  │  ├─ project
│  │  │  │  ├─ assetHelpers.ts
│  │  │  │  ├─ project.types.ts
│  │  │  │  ├─ projectExport.service.ts
│  │  │  │  └─ projectImport.service.ts
│  │  │  ├─ project.service.ts
│  │  │  ├─ search.service.ts
│  │  │  ├─ tag.service.ts
│  │  │  ├─ timeline.service.ts
│  │  │  └─ wiki.service.ts
│  │  └─ utils
│  │     ├─ apiResponse.ts
│  │     ├─ asyncHandler.ts
│  │     ├─ dbHelpers.ts
│  │     └─ parseId.ts
│  ├─ tsconfig.json
│  └─ uploads
│     └─ factions
│        └─ faction-1774159645120-b70l7n.png
├─ data
├─ docs
│  └─ performance-regression-checklist.md
├─ frontend
│  ├─ index.html
│  ├─ package.json
│  ├─ public
│  │  └─ fonts
│  │     ├─ my-local-font.css
│  │     └─ README.md
│  ├─ src
│  │  ├─ api
│  │  │  ├─ axiosClient.ts
│  │  │  ├─ characters.ts
│  │  │  ├─ client.ts
│  │  │  ├─ dogmas.ts
│  │  │  ├─ dynasties.ts
│  │  │  ├─ factions.ts
│  │  │  ├─ maps.ts
│  │  │  ├─ notes.ts
│  │  │  ├─ projects.ts
│  │  │  ├─ search.ts
│  │  │  ├─ tags.ts
│  │  │  ├─ timeline.ts
│  │  │  ├─ types.ts
│  │  │  └─ wiki.ts
│  │  ├─ App.tsx
│  │  ├─ components
│  │  │  ├─ detail
│  │  │  │  └─ CollapsibleSection.tsx
│  │  │  ├─ dynasty
│  │  │  │  ├─ DynastyEventsTimeline.tsx
│  │  │  │  └─ FamilyTree.tsx
│  │  │  ├─ forms
│  │  │  │  └─ TagAutocompleteField.tsx
│  │  │  ├─ Layout
│  │  │  │  ├─ AppLayout.tsx
│  │  │  │  ├─ Sidebar.tsx
│  │  │  │  └─ TopBar.tsx
│  │  │  ├─ settings
│  │  │  │  ├─ ThemePresetSelector.tsx
│  │  │  │  ├─ ThemePreviewCard.tsx
│  │  │  │  └─ ThemeSliderControl.tsx
│  │  │  └─ ui
│  │  │     ├─ ConfirmDialog.tsx
│  │  │     ├─ DndButton.tsx
│  │  │     ├─ EmptyState.tsx
│  │  │     ├─ ErrorBoundary.tsx
│  │  │     ├─ GlobalSnackbar.tsx
│  │  │     ├─ LoadingScreen.tsx
│  │  │     ├─ SearchDialog.tsx
│  │  │     ├─ SplashScreen.tsx
│  │  │     └─ StyleCustomizer.tsx
│  │  ├─ hooks
│  │  │  ├─ useDebounce.ts
│  │  │  ├─ useHistory.ts
│  │  │  └─ useHotkeys.ts
│  │  ├─ main.tsx
│  │  ├─ pages
│  │  │  ├─ appearance
│  │  │  │  ├─ AppearanceLivePreview.tsx
│  │  │  │  └─ AppearancePrimitives.tsx
│  │  │  ├─ AppearanceSettingsPage.tsx
│  │  │  ├─ CharacterDetailPage.tsx
│  │  │  ├─ CharacterGraphPage.tsx
│  │  │  ├─ CharactersPage.tsx
│  │  │  ├─ DogmasPage.tsx
│  │  │  ├─ DynastiesPage.tsx
│  │  │  ├─ dynasty
│  │  │  │  └─ DynastyDialogs.tsx
│  │  │  ├─ DynastyDetailPage.tsx
│  │  │  ├─ faction
│  │  │  │  └─ FactionDialogs.tsx
│  │  │  ├─ FactionDetailPage.tsx
│  │  │  ├─ FactionsPage.tsx
│  │  │  ├─ home
│  │  │  │  ├─ CreateProjectDialog.tsx
│  │  │  │  ├─ HomeBackground.tsx
│  │  │  │  └─ HomePrimitives.tsx
│  │  │  ├─ HomePage.tsx
│  │  │  ├─ map
│  │  │  │  └─ mapUtils.ts
│  │  │  ├─ MapPage.tsx
│  │  │  ├─ note-editor
│  │  │  │  ├─ CreateWikiLinkDialog.tsx
│  │  │  │  ├─ InsertWikiLinkDialog.tsx
│  │  │  │  ├─ MarkdownPreview.tsx
│  │  │  │  └─ ToolbarButton.tsx
│  │  │  ├─ NoteEditorPage.tsx
│  │  │  ├─ NotesPage.tsx
│  │  │  ├─ ProjectSettingsPage.tsx
│  │  │  ├─ TimelinePage.tsx
│  │  │  ├─ WikiGraphPage.tsx
│  │  │  └─ WikiPage.tsx
│  │  ├─ store
│  │  │  ├─ debouncedStorage.ts
│  │  │  ├─ useCharacterStore.ts
│  │  │  ├─ useDogmaStore.ts
│  │  │  ├─ useDynastyStore.ts
│  │  │  ├─ useFactionStore.ts
│  │  │  ├─ useMapStore.ts
│  │  │  ├─ useNoteStore.ts
│  │  │  ├─ usePreferencesStore.ts
│  │  │  ├─ useProjectStore.ts
│  │  │  ├─ useStyleStore.ts
│  │  │  ├─ useTagStore.ts
│  │  │  ├─ useTimelineStore.ts
│  │  │  ├─ useUIStore.ts
│  │  │  └─ useWikiStore.ts
│  │  └─ theme
│  │     ├─ AppThemeProvider.tsx
│  │     ├─ componentOverrides.ts
│  │     ├─ createAppTheme.ts
│  │     ├─ muiTheme.ts
│  │     ├─ presets.ts
│  │     └─ tokens.ts
│  ├─ tsconfig.json
│  └─ vite.config.ts
├─ LICENSE
├─ package-lock.json
├─ package.json
├─ scripts
│  ├─ chunker.mjs
│  ├─ db
│  │  ├─ explain-hot.mjs
│  │  └─ seed-demo.mjs
│  ├─ doctor.mjs
│  ├─ perf
│  │  ├─ baseline.mjs
│  │  ├─ compare.mjs
│  │  └─ reports
│  │     ├─ release-after.json
│  │     └─ release-before.json
│  ├─ smoke
│  │  ├─ cleanup.mjs
│  │  ├─ context.mjs
│  │  ├─ frontend.mjs
│  │  ├─ index.mjs
│  │  ├─ lib.mjs
│  │  └─ scenarios
│  │     ├─ characters.mjs
│  │     ├─ dogmas.mjs
│  │     ├─ dynasties.mjs
│  │     ├─ factions.mjs
│  │     ├─ health.mjs
│  │     ├─ maps.mjs
│  │     ├─ notes.mjs
│  │     ├─ perf.mjs
│  │     ├─ project-transfer.mjs
│  │     ├─ projects.mjs
│  │     ├─ search.mjs
│  │     ├─ tags.mjs
│  │     ├─ timeline.mjs
│  │     └─ wiki.mjs
│  └─ smoke-runner.mjs
├─ shared
│  ├─ package.json
│  ├─ src
│  │  ├─ constants.ts
│  │  ├─ index.ts
│  │  ├─ schemas
│  │  │  ├─ character.schema.ts
│  │  │  ├─ common.schema.ts
│  │  │  ├─ dogma.schema.ts
│  │  │  ├─ dynasty.schema.ts
│  │  │  ├─ faction.schema.ts
│  │  │  ├─ index.ts
│  │  │  ├─ map.schema.ts
│  │  │  ├─ note.schema.ts
│  │  │  ├─ project.schema.ts
│  │  │  └─ timeline.schema.ts
│  │  └─ types
│  │     └─ index.ts
│  └─ tsconfig.json
└─ tsconfig.json

```