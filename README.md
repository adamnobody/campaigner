
```
campaigner
├─ backend
│  ├─ package.json
│  ├─ src
│  │  ├─ controllers
│  │  │  ├─ character.controller.ts
│  │  │  ├─ folder.controller.ts
│  │  │  ├─ map.controller.ts
│  │  │  ├─ note.controller.ts
│  │  │  ├─ project.controller.ts
│  │  │  ├─ search.controller.ts
│  │  │  ├─ tag.controller.ts
│  │  │  └─ timeline.controller.ts
│  │  ├─ db
│  │  │  ├─ connection.ts
│  │  │  └─ migrate.ts
│  │  ├─ index.ts
│  │  ├─ middleware
│  │  │  ├─ errorHandler.ts
│  │  │  ├─ upload.ts
│  │  │  └─ validateRequest.ts
│  │  ├─ routes
│  │  │  ├─ character.routes.ts
│  │  │  ├─ folder.routes.ts
│  │  │  ├─ map.routes.ts
│  │  │  ├─ note.routes.ts
│  │  │  ├─ project.routes.ts
│  │  │  ├─ search.routes.ts
│  │  │  ├─ tag.routes.ts
│  │  │  ├─ timeline.routes.ts
│  │  │  └─ upload.routes.ts
│  │  └─ services
│  │     ├─ character.service.ts
│  │     ├─ folder.service.ts
│  │     ├─ map.service.ts
│  │     ├─ note.service.ts
│  │     ├─ project.service.ts
│  │     ├─ search.service.ts
│  │     ├─ tag.service.ts
│  │     └─ timeline.service.ts
│  └─ tsconfig.json
├─ data
├─ frontend
│  ├─ index.html
│  ├─ package.json
│  ├─ src
│  │  ├─ api
│  │  │  └─ axiosClient.ts
│  │  ├─ App.tsx
│  │  ├─ components
│  │  │  ├─ Layout
│  │  │  │  ├─ AppLayout.tsx
│  │  │  │  ├─ Sidebar.tsx
│  │  │  │  └─ TopBar.tsx
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
│  │  │  ├─ CharacterDetailPage.tsx
│  │  │  ├─ CharacterGraphPage.tsx
│  │  │  ├─ CharactersPage.tsx
│  │  │  ├─ FilesPage.tsx
│  │  │  ├─ HomePage.tsx
│  │  │  ├─ MapPage.tsx
│  │  │  ├─ NoteEditorPage.tsx
│  │  │  ├─ NotesPage.tsx
│  │  │  ├─ ProjectSettingsPage.tsx
│  │  │  ├─ TimelinePage.tsx
│  │  │  └─ WikiPage.tsx
│  │  ├─ store
│  │  │  ├─ useCharacterStore.ts
│  │  │  ├─ useMapStore.ts
│  │  │  ├─ useNoteStore.ts
│  │  │  ├─ useProjectStore.ts
│  │  │  ├─ useStyleStore.ts
│  │  │  ├─ useTimelineStore.ts
│  │  │  └─ useUIStore.ts
│  │  └─ theme
│  │     └─ muiTheme.ts
│  ├─ tsconfig.json
│  └─ vite.config.ts
├─ LICENSE
├─ package-lock.json
├─ package.json
├─ scripts
│  └─ doctor.mjs
├─ shared
│  ├─ package.json
│  ├─ src
│  │  ├─ constants.ts
│  │  ├─ index.ts
│  │  ├─ schemas
│  │  │  ├─ character.schema.ts
│  │  │  ├─ common.schema.ts
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