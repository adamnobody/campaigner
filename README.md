
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