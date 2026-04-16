
```
campaigner
├─ backend
│  ├─ package.json
│  ├─ src
│  │  ├─ controllers
│  │  │  ├─ branch.controller.ts
│  │  │  ├─ character-traits.controller.ts
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
│  │  │  │  ├─ 003_dynasty_members_graph.ts
│  │  │  │  └─ 004_faction_policies.ts
│  │  │  └─ schema.ts
│  │  ├─ index.ts
│  │  ├─ middleware
│  │  │  ├─ createUpload.ts
│  │  │  ├─ errorHandler.ts
│  │  │  ├─ requestMetrics.ts
│  │  │  ├─ upload.ts
│  │  │  └─ validateRequest.ts
│  │  ├─ routes
│  │  │  ├─ branch.routes.ts
│  │  │  ├─ character-traits.routes.ts
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
│  │  │  ├─ branch.service.ts
│  │  │  ├─ branchOverlay.service.ts
│  │  │  ├─ character-trait.service.ts
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
│  │  │  ├─ factionPolicy.service.ts
│  │  │  ├─ map
│  │  │  │  └─ map.types.ts
│  │  │  ├─ map.service.ts
│  │  │  ├─ note.service.ts
│  │  │  ├─ project
│  │  │  │  ├─ assetHelpers.ts
│  │  │  │  ├─ demoProject.payload.ts
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
├─ electron
│  ├─ icon.ico
│  └─ main.js
├─ frontend
│  ├─ index.html
│  ├─ package.json
│  ├─ public
│  │  ├─ fonts
│  │  │  ├─ my-local-font.css
│  │  │  └─ README.md
│  │  └─ traits
│  │     ├─ ambitsioznost.jpg
│  │     ├─ apatiya.jpg
│  │     ├─ chestnost.jpg
│  │     ├─ chrevogudie.jpg
│  │     ├─ dobrota.jpg
│  │     ├─ doverchivost.jpg
│  │     ├─ egoizm.jpg
│  │     ├─ fanatizm.jpg
│  │     ├─ kharizma.jpg
│  │     ├─ khitrost.jpg
│  │     ├─ khladnokrovie.jpg
│  │     ├─ khrabrost.jpg
│  │     ├─ kreativnost.jpg
│  │     ├─ litsemerie.jpg
│  │     ├─ lyubopytstvo.jpg
│  │     ├─ malodushie.jpg
│  │     ├─ melankholiya.jpg
│  │     ├─ miloserdie.jpg
│  │     ├─ mudrost.jpg
│  │     ├─ nervoznost.jpg
│  │     ├─ optimizm.jpg
│  │     ├─ paranoyya.jpg
│  │     ├─ pokhot.jpg
│  │     ├─ raschetlivost.jpg
│  │     ├─ reshitelnost.jpg
│  │     ├─ samokontrol.jpg
│  │     ├─ shchedrost.jpg
│  │     ├─ umstvennaya-otstalost.jpg
│  │     ├─ upryamstvo.jpg
│  │     ├─ utonchennost.jpg
│  │     ├─ vernost.jpg
│  │     ├─ vysokomerie.jpg
│  │     ├─ zhadnost.jpg
│  │     ├─ zhestokost.jpg
│  │     └─ zlost.jpg
│  ├─ src
│  │  ├─ api
│  │  │  ├─ axiosClient.ts
│  │  │  ├─ branches.ts
│  │  │  ├─ characters.ts
│  │  │  ├─ characterTraits.ts
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
│  │  │  ├─ forms
│  │  │  │  └─ TagAutocompleteField.tsx
│  │  │  ├─ Layout
│  │  │  │  ├─ AppLayout.tsx
│  │  │  │  ├─ Sidebar.tsx
│  │  │  │  └─ TopBar.tsx
│  │  │  ├─ onboarding
│  │  │  │  ├─ OnboardingOverlay.tsx
│  │  │  │  └─ onboardingSteps.ts
│  │  │  ├─ settings
│  │  │  │  ├─ ThemePresetSelector.tsx
│  │  │  │  ├─ ThemePreviewCard.tsx
│  │  │  │  └─ ThemeSliderControl.tsx
│  │  │  └─ ui
│  │  │     ├─ ConfirmDialog.tsx
│  │  │     ├─ DndButton.tsx
│  │  │     ├─ EmptyState.tsx
│  │  │     ├─ EntityHeroLayout.tsx
│  │  │     ├─ EntityTabs.tsx
│  │  │     ├─ ErrorBoundary.tsx
│  │  │     ├─ FloatingOrb.tsx
│  │  │     ├─ GlassCard.tsx
│  │  │     ├─ GlobalSnackbar.tsx
│  │  │     ├─ LoadingScreen.tsx
│  │  │     ├─ SearchDialog.tsx
│  │  │     ├─ SectionHeader.tsx
│  │  │     ├─ SplashScreen.tsx
│  │  │     └─ StyleCustomizer.tsx
│  │  ├─ hooks
│  │  │  ├─ useDebounce.ts
│  │  │  ├─ useHistory.ts
│  │  │  ├─ useHotkeys.ts
│  │  │  └─ useProjectScope.ts
│  │  ├─ main.tsx
│  │  ├─ pages
│  │  │  ├─ appearance
│  │  │  │  ├─ AppearanceLivePreview.tsx
│  │  │  │  ├─ AppearancePrimitives.tsx
│  │  │  │  ├─ fontPresets.ts
│  │  │  │  └─ useDebouncedDraft.ts
│  │  │  ├─ AppearanceSettingsPage.tsx
│  │  │  ├─ character
│  │  │  │  ├─ CharacterTraitsTab.tsx
│  │  │  │  ├─ CreateTraitDialog.tsx
│  │  │  │  └─ TraitFlipCard.tsx
│  │  │  ├─ character-graph
│  │  │  │  └─ graphConstants.ts
│  │  │  ├─ CharacterDetailPage.tsx
│  │  │  ├─ CharacterGraphPage.tsx
│  │  │  ├─ CharactersPage.tsx
│  │  │  ├─ dogma
│  │  │  │  ├─ DogmaFormDialog.tsx
│  │  │  │  ├─ DogmaListItem.tsx
│  │  │  │  └─ dogmaStyles.ts
│  │  │  ├─ DogmasPage.tsx
│  │  │  ├─ DynastiesPage.tsx
│  │  │  ├─ dynasty
│  │  │  │  ├─ DynastyDialogs.tsx
│  │  │  │  ├─ DynastyEventsTimeline.tsx
│  │  │  │  └─ FamilyTree.tsx
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
│  │  │  │  ├─ MapMarkerDialog.tsx
│  │  │  │  ├─ MapMarkerOnMap.tsx
│  │  │  │  ├─ MapMarkerPanel.tsx
│  │  │  │  ├─ MapTerritoryDialog.tsx
│  │  │  │  ├─ MapTerritoryPanel.tsx
│  │  │  │  ├─ MapTerritorySvg.tsx
│  │  │  │  ├─ MapToolbar.tsx
│  │  │  │  ├─ mapUtils.ts
│  │  │  │  ├─ useMapData.ts
│  │  │  │  ├─ useMapInteractions.ts
│  │  │  │  ├─ useMapMarkerCrud.ts
│  │  │  │  ├─ useMapNavigation.ts
│  │  │  │  ├─ useMapTerritoryCrud.ts
│  │  │  │  ├─ useMapTerritoryDrawing.ts
│  │  │  │  └─ useMapViewport.ts
│  │  │  ├─ MapPage.tsx
│  │  │  ├─ note-editor
│  │  │  │  ├─ CreateWikiLinkDialog.tsx
│  │  │  │  ├─ InsertWikiLinkDialog.tsx
│  │  │  │  ├─ MarkdownPreview.tsx
│  │  │  │  ├─ NoteEditorMarkdownToolbar.tsx
│  │  │  │  ├─ NoteEditorWikiSidebar.tsx
│  │  │  │  └─ ToolbarButton.tsx
│  │  │  ├─ NoteEditorPage.tsx
│  │  │  ├─ NotesPage.tsx
│  │  │  ├─ ProjectSettingsPage.tsx
│  │  │  ├─ TimelinePage.tsx
│  │  │  ├─ wiki
│  │  │  │  ├─ WikiArticleCard.tsx
│  │  │  │  ├─ WikiDialogs.tsx
│  │  │  │  └─ wikiPreviewText.ts
│  │  │  ├─ WikiGraphPage.tsx
│  │  │  └─ WikiPage.tsx
│  │  ├─ store
│  │  │  ├─ branchStorage.ts
│  │  │  ├─ debouncedStorage.ts
│  │  │  ├─ useBranchStore.ts
│  │  │  ├─ useCharacterStore.ts
│  │  │  ├─ useCharacterTraitsStore.ts
│  │  │  ├─ useDogmaStore.ts
│  │  │  ├─ useDynastyStore.ts
│  │  │  ├─ useFactionStore.ts
│  │  │  ├─ useMapStore.ts
│  │  │  ├─ useNoteStore.ts
│  │  │  ├─ useOnboardingStore.ts
│  │  │  ├─ usePreferencesStore.ts
│  │  │  ├─ useProjectStore.ts
│  │  │  ├─ useStyleStore.ts
│  │  │  ├─ useTagStore.ts
│  │  │  ├─ useTimelineStore.ts
│  │  │  ├─ useUIStore.ts
│  │  │  └─ useWikiStore.ts
│  │  ├─ theme
│  │  │  ├─ AppThemeProvider.tsx
│  │  │  ├─ componentOverrides.ts
│  │  │  ├─ createAppTheme.ts
│  │  │  ├─ muiTheme.ts
│  │  │  ├─ presets.ts
│  │  │  └─ tokens.ts
│  │  └─ utils
│  │     ├─ error.ts
│  │     └─ uploadAssetUrl.ts
│  ├─ tsconfig.json
│  └─ vite.config.ts
├─ LICENSE
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
│  │  │  ├─ branch.schema.ts
│  │  │  ├─ character-trait.schema.ts
│  │  │  ├─ character.schema.ts
│  │  │  ├─ common.schema.ts
│  │  │  ├─ dogma.schema.ts
│  │  │  ├─ dynasty.schema.ts
│  │  │  ├─ faction.schema.ts
│  │  │  ├─ index.ts
│  │  │  ├─ map.schema.ts
│  │  │  ├─ note.schema.ts
│  │  │  ├─ policy.schema.ts
│  │  │  ├─ project.schema.ts
│  │  │  ├─ timeline.schema.ts
│  │  │  └─ wiki.schema.ts
│  │  └─ types
│  │     └─ index.ts
│  └─ tsconfig.json
├─ start.bat
└─ tsconfig.json

```