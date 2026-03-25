
```
campaigner
├─ backend
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
│  │  │  └─ migrations
│  │  │     └─ 001_create_maps_table.ts
│  │  ├─ index.ts
│  │  ├─ middleware
│  │  │  ├─ errorHandler.ts
│  │  │  ├─ upload.ts
│  │  │  └─ validateRequest.ts
│  │  ├─ routes
│  │  │  ├─ character.routes.ts
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
│  │  └─ services
│  │     ├─ character.service.ts
│  │     ├─ dogma.service.ts
│  │     ├─ dynasty.service.ts
│  │     ├─ faction.service.ts
│  │     ├─ map.service.ts
│  │     ├─ note.service.ts
│  │     ├─ project.service.ts
│  │     ├─ search.service.ts
│  │     ├─ tag.service.ts
│  │     ├─ timeline.service.ts
│  │     └─ wiki.service.ts
│  ├─ tsconfig.json
│  └─ uploads
│     └─ factions
│        └─ faction-1774159645120-b70l7n.png
├─ data
├─ frontend
│  ├─ index.html
│  ├─ package.json
│  ├─ src
│  │  ├─ api
│  │  │  └─ axiosClient.ts
│  │  ├─ App.tsx
│  │  ├─ components
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
│  │  │  ├─ AppearanceSettingsPage.tsx
│  │  │  ├─ CharacterDetailPage.tsx
│  │  │  ├─ CharacterGraphPage.tsx
│  │  │  ├─ CharactersPage.tsx
│  │  │  ├─ DogmasPage.tsx
│  │  │  ├─ DynastiesPage.tsx
│  │  │  ├─ DynastyDetailPage.tsx
│  │  │  ├─ FactionDetailPage.tsx
│  │  │  ├─ FactionsPage.tsx
│  │  │  ├─ HomePage.tsx
│  │  │  ├─ MapPage.tsx
│  │  │  ├─ NoteEditorPage.tsx
│  │  │  ├─ NotesPage.tsx
│  │  │  ├─ ProjectSettingsPage.tsx
│  │  │  ├─ TimelinePage.tsx
│  │  │  ├─ WikiGraphPage.tsx
│  │  │  └─ WikiPage.tsx
│  │  ├─ store
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
│  └─ doctor.mjs
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