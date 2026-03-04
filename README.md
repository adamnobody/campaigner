
```
campaigner
├─ apps
│  ├─ backend
│  │  ├─ package.json
│  │  ├─ src
│  │  │  ├─ config
│  │  │  │  └─ paths.ts
│  │  │  ├─ db
│  │  │  │  ├─ appDB.ts
│  │  │  │  ├─ projectDB.ts
│  │  │  │  └─ schema.sql
│  │  │  ├─ middleware
│  │  │  │  └─ error.middleware.ts
│  │  │  ├─ routes
│  │  │  │  ├─ characters.routes.ts
│  │  │  │  ├─ maps.routes.ts
│  │  │  │  ├─ markers.routes.ts
│  │  │  │  ├─ notes.routes.ts
│  │  │  │  ├─ projects.routes.ts
│  │  │  │  └─ relationships.routes.ts
│  │  │  ├─ server.ts
│  │  │  ├─ services
│  │  │  │  ├─ characters.service.ts
│  │  │  │  ├─ files.service.ts
│  │  │  │  ├─ maps.service.ts
│  │  │  │  ├─ markers.service.ts
│  │  │  │  ├─ notes.service.ts
│  │  │  │  ├─ projects.service.ts
│  │  │  │  └─ relationships.service.ts
│  │  │  └─ validation
│  │  │     ├─ characters.zod.ts
│  │  │     ├─ maps.zod.ts
│  │  │     ├─ markers.zod.ts
│  │  │     ├─ notes.zod.ts
│  │  │     ├─ projects.zod.ts
│  │  │     └─ relationships.zod.ts
│  │  └─ tsconfig.json
│  └─ frontend
│     ├─ eslint.config.js
│     ├─ index.html
│     ├─ package-lock.json
│     ├─ package.json
│     ├─ public
│     │  └─ vite.svg
│     ├─ README.md
│     ├─ src
│     │  ├─ app
│     │  │  ├─ api.ts
│     │  │  ├─ RootLayout.tsx
│     │  │  ├─ router.tsx
│     │  │  └─ store.ts
│     │  ├─ App.css
│     │  ├─ App.tsx
│     │  ├─ assets
│     │  │  ├─ blank.jpg
│     │  │  ├─ projects-bg.jpeg
│     │  │  └─ react.svg
│     │  ├─ components
│     │  │  ├─ maps
│     │  │  │  ├─ CreateMapDialog.tsx
│     │  │  │  ├─ MapCanvas.tsx
│     │  │  │  ├─ MapsTree.tsx
│     │  │  │  └─ MapViewer.tsx
│     │  │  ├─ markers
│     │  │  │  ├─ MarkerDialog.tsx
│     │  │  │  ├─ markerIcons.ts
│     │  │  │  └─ MarkerPin.tsx
│     │  │  └─ notes
│     │  │     ├─ CreateNoteDialog.tsx
│     │  │     ├─ NoteEditorDrawer.tsx
│     │  │     ├─ NoteEditorPanel.tsx
│     │  │     └─ NotesList.tsx
│     │  ├─ features
│     │  │  └─ projects
│     │  │     └─ ProjectsBackgroundDialog.tsx
│     │  ├─ index.css
│     │  ├─ main.tsx
│     │  ├─ pages
│     │  │  ├─ CharacterPage.tsx
│     │  │  ├─ ProjectCharactersPage.tsx
│     │  │  ├─ ProjectsPage.tsx
│     │  │  └─ ProjectWorkspacePage.tsx
│     │  ├─ shared
│     │  │  ├─ hooks
│     │  │  │  └─ useProjectsBackground.ts
│     │  │  └─ ui
│     │  │     ├─ CommandPalette.tsx
│     │  │     └─ LoadingScreen.tsx
│     │  └─ theme
│     │     └─ theme.ts
│     ├─ tsconfig.app.json
│     ├─ tsconfig.json
│     ├─ tsconfig.node.json
│     └─ vite.config.ts
├─ LICENSE
├─ package-lock.json
├─ package.json
└─ scripts
   └─ doctor.mjs

```
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
│  │  │  ├─ tag.routes.ts
│  │  │  ├─ timeline.routes.ts
│  │  │  └─ upload.routes.ts
│  │  └─ services
│  │     ├─ character.service.ts
│  │     ├─ folder.service.ts
│  │     ├─ map.service.ts
│  │     ├─ note.service.ts
│  │     ├─ project.service.ts
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
│  │  │     ├─ GlobalSnackbar.tsx
│  │  │     ├─ LoadingScreen.tsx
│  │  │     ├─ SplashScreen.tsx
│  │  │     └─ StyleCustomizer.tsx
│  │  ├─ hooks
│  │  │  └─ useDebounce.ts
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
├─ README.md
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