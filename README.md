
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
│  │  │  │  ├─ maps.routes.ts
│  │  │  │  ├─ markers.routes.ts
│  │  │  │  ├─ notes.routes.ts
│  │  │  │  └─ projects.routes.ts
│  │  │  ├─ server.ts
│  │  │  ├─ services
│  │  │  │  ├─ files.service.ts
│  │  │  │  ├─ maps.service.ts
│  │  │  │  ├─ markers.service.ts
│  │  │  │  ├─ notes.service.ts
│  │  │  │  └─ projects.service.ts
│  │  │  └─ validation
│  │  │     ├─ maps.zod.ts
│  │  │     ├─ markers.zod.ts
│  │  │     ├─ notes.zod.ts
│  │  │     └─ projects.zod.ts
│  │  └─ tsconfig.json
│  └─ frontend
│     ├─ eslint.config.js
│     ├─ index.html
│     ├─ package.json
│     ├─ public
│     │  └─ vite.svg
│     ├─ README.md
│     ├─ src
│     │  ├─ app
│     │  │  ├─ api.ts
│     │  │  ├─ router.tsx
│     │  │  └─ store.ts
│     │  ├─ App.css
│     │  ├─ App.tsx
│     │  ├─ assets
│     │  │  └─ react.svg
│     │  ├─ components
│     │  │  ├─ maps
│     │  │  │  ├─ CreateMapDialog.tsx
│     │  │  │  ├─ MapCanvas.tsx
│     │  │  │  ├─ MapsTree.tsx
│     │  │  │  └─ MapViewer.tsx
│     │  │  ├─ markers
│     │  │  │  ├─ MarkerDialog.tsx
│     │  │  │  └─ MarkerPin.tsx
│     │  │  └─ notes
│     │  │     ├─ CreateNoteDialog.tsx
│     │  │     ├─ NoteEditorDrawer.tsx
│     │  │     ├─ NoteEditorPanel.tsx
│     │  │     └─ NotesList.tsx
│     │  ├─ index.css
│     │  ├─ main.tsx
│     │  ├─ pages
│     │  │  ├─ ProjectsPage.tsx
│     │  │  └─ ProjectWorkspacePage.tsx
│     │  └─ theme
│     │     └─ theme.ts
│     ├─ tsconfig.app.json
│     ├─ tsconfig.json
│     ├─ tsconfig.node.json
│     └─ vite.config.ts
├─ package-lock.json
└─ package.json

```
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
│  │  │  │  ├─ maps.routes.ts
│  │  │  │  ├─ markers.routes.ts
│  │  │  │  ├─ notes.routes.ts
│  │  │  │  └─ projects.routes.ts
│  │  │  ├─ server.ts
│  │  │  ├─ services
│  │  │  │  ├─ files.service.ts
│  │  │  │  ├─ maps.service.ts
│  │  │  │  ├─ markers.service.ts
│  │  │  │  ├─ notes.service.ts
│  │  │  │  └─ projects.service.ts
│  │  │  └─ validation
│  │  │     ├─ maps.zod.ts
│  │  │     ├─ markers.zod.ts
│  │  │     ├─ notes.zod.ts
│  │  │     └─ projects.zod.ts
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
├─ README.md
└─ scripts
   └─ doctor.mjs

```