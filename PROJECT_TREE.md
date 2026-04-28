# Project Tree

Автогенерируется скриптом `npm run tree`. Не редактировать вручную.

```
campaigner
├─ backend
│  ├─ src
│  │  ├─ controllers
│  │  │  ├─ ambition.controller.ts
│  │  │  ├─ branch.controller.ts
│  │  │  ├─ character-traits.controller.ts
│  │  │  ├─ character.controller.ts
│  │  │  ├─ dogma.controller.ts
│  │  │  ├─ dynasty.controller.ts
│  │  │  ├─ faction.controller.ts
│  │  │  ├─ map.controller.ts
│  │  │  ├─ note.controller.ts
│  │  │  ├─ political-scale.controller.ts
│  │  │  ├─ project.controller.ts
│  │  │  ├─ search.controller.ts
│  │  │  ├─ tag.controller.ts
│  │  │  ├─ timeline.controller.ts
│  │  │  └─ wiki.controller.ts
│  │  ├─ db
│  │  │  ├─ migrations
│  │  │  │  ├─ 001_create_maps_table.ts
│  │  │  │  ├─ 002_tag_associations_dynasty.ts
│  │  │  │  ├─ 003_dynasty_members_graph.ts
│  │  │  │  ├─ 004_faction_policies.ts
│  │  │  │  ├─ 005_faction_ambitions.ts
│  │  │  │  ├─ 006_trait_and_ambition_exclusions.ts
│  │  │  │  ├─ 007_faction_types_and_character_affiliations.ts
│  │  │  │  ├─ 008_faction_kind_and_membership_sync.ts
│  │  │  │  ├─ 009_faction_metrics.ts
│  │  │  │  ├─ 010_political_scales.ts
│  │  │  │  └─ 011_state_relations.ts
│  │  │  ├─ seeds
│  │  │  │  └─ politicalScalesSeedData.ts
│  │  │  ├─ connection.ts
│  │  │  ├─ migrate.ts
│  │  │  └─ schema.ts
│  │  ├─ middleware
│  │  │  ├─ createUpload.ts
│  │  │  ├─ errorHandler.ts
│  │  │  ├─ requestMetrics.ts
│  │  │  ├─ upload.ts
│  │  │  └─ validateRequest.ts
│  │  ├─ routes
│  │  │  ├─ ambition.routes.ts
│  │  │  ├─ branch.routes.ts
│  │  │  ├─ character-traits.routes.ts
│  │  │  ├─ character.routes.ts
│  │  │  ├─ commonSchemas.ts
│  │  │  ├─ dogma.routes.ts
│  │  │  ├─ dynasty.routes.ts
│  │  │  ├─ faction.routes.ts
│  │  │  ├─ map.routes.ts
│  │  │  ├─ note.routes.ts
│  │  │  ├─ political-scale.routes.ts
│  │  │  ├─ project.routes.ts
│  │  │  ├─ search.routes.ts
│  │  │  ├─ tag.routes.ts
│  │  │  ├─ timeline.routes.ts
│  │  │  ├─ upload.routes.ts
│  │  │  └─ wiki.routes.ts
│  │  ├─ services
│  │  │  ├─ dynasty
│  │  │  │  ├─ dynasty.mappers.ts
│  │  │  │  ├─ dynasty.service.ts
│  │  │  │  ├─ dynasty.types.ts
│  │  │  │  └─ index.ts
│  │  │  ├─ faction
│  │  │  │  ├─ faction-policy.service.ts
│  │  │  │  ├─ faction.mappers.ts
│  │  │  │  ├─ faction.service.ts
│  │  │  │  ├─ faction.types.ts
│  │  │  │  └─ index.ts
│  │  │  ├─ map
│  │  │  │  ├─ index.ts
│  │  │  │  ├─ map.service.ts
│  │  │  │  └─ map.types.ts
│  │  │  ├─ political-scale
│  │  │  │  ├─ index.ts
│  │  │  │  ├─ political-scale-assignment.service.ts
│  │  │  │  └─ political-scale.service.ts
│  │  │  ├─ project
│  │  │  │  ├─ assetHelpers.ts
│  │  │  │  ├─ demoProject.payload.ts
│  │  │  │  ├─ index.ts
│  │  │  │  ├─ project.service.ts
│  │  │  │  ├─ project.types.ts
│  │  │  │  ├─ projectExport.service.ts
│  │  │  │  └─ projectImport.service.ts
│  │  │  ├─ ambition.service.ts
│  │  │  ├─ branch.service.ts
│  │  │  ├─ branchOverlay.service.ts
│  │  │  ├─ character-trait.service.ts
│  │  │  ├─ character.service.ts
│  │  │  ├─ dogma.service.ts
│  │  │  ├─ note.service.ts
│  │  │  ├─ search.service.ts
│  │  │  ├─ tag.service.ts
│  │  │  ├─ timeline.service.ts
│  │  │  └─ wiki.service.ts
│  │  ├─ utils
│  │  │  ├─ apiResponse.ts
│  │  │  ├─ asyncHandler.ts
│  │  │  ├─ dbHelpers.ts
│  │  │  └─ parseId.ts
│  │  └─ index.ts
│  ├─ .env.example
│  ├─ package.json
│  └─ tsconfig.json
├─ docs
│  ├─ architecture
│  │  └─ conventions.md
│  └─ performance-regression-checklist.md
├─ electron
│  ├─ icon.ico
│  └─ main.js
├─ frontend
│  ├─ public
│  │  ├─ ambitions
│  │  │  ├─ demokratizatsiya.svg
│  │  │  ├─ diplomaticheskaya-gegemoniya.svg
│  │  │  ├─ ekologicheskaya-garmoniya.svg
│  │  │  ├─ industrializatsiya.jpg
│  │  │  ├─ izolyatsionizm.jpg
│  │  │  ├─ kontrol-morskikh-putey.svg
│  │  │  ├─ kontrol-torgovykh-marshrutov.svg
│  │  │  ├─ kulturnaya-assimilyatsiya.svg
│  │  │  ├─ magicheskoe-prevoskhodstvo.svg
│  │  │  ├─ mest.svg
│  │  │  ├─ nakoplenie-bogatstva.svg
│  │  │  ├─ nauchnyy-progress.svg
│  │  │  ├─ obedinenie-naroda.svg
│  │  │  ├─ osvobozhdenie-poraboshchennykh.svg
│  │  │  ├─ podderzhanie-mira.svg
│  │  │  ├─ poraboshchenie-sosedey.svg
│  │  │  ├─ razvitie-iskusstv.svg
│  │  │  ├─ religioznaya-ekspansiya.svg
│  │  │  ├─ religioznoe-obrashchenie-sosedey.svg
│  │  │  ├─ restavratsiya-starogo-poryadka.svg
│  │  │  ├─ sozdanie-koloniy.svg
│  │  │  ├─ sverzhenie-soseda.svg
│  │  │  ├─ tekhnologicheskiy-progress.svg
│  │  │  ├─ territorialnaya-ekspansiya.svg
│  │  │  ├─ torgovaya-dominatsiya.svg
│  │  │  ├─ ustanovlenie-tiranii.svg
│  │  │  ├─ voennoe-prevoskhodstvo.svg
│  │  │  ├─ vyzhivanie.svg
│  │  │  └─ zashchita-traditsiy.svg
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
│  │  │  ├─ ambitions.ts
│  │  │  ├─ branches.ts
│  │  │  ├─ characters.ts
│  │  │  ├─ characterTraits.ts
│  │  │  ├─ client.ts
│  │  │  ├─ dogmas.ts
│  │  │  ├─ dynasties.ts
│  │  │  ├─ factions.ts
│  │  │  ├─ maps.ts
│  │  │  ├─ notes.ts
│  │  │  ├─ politicalScales.ts
│  │  │  ├─ projects.ts
│  │  │  ├─ search.ts
│  │  │  ├─ tags.ts
│  │  │  ├─ timeline.ts
│  │  │  ├─ types.ts
│  │  │  └─ wiki.ts
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
│  │  │     ├─ EditExclusionsDialog.tsx
│  │  │     ├─ EmptyState.tsx
│  │  │     ├─ EntityHeroLayout.tsx
│  │  │     ├─ EntityTabs.tsx
│  │  │     ├─ ErrorBoundary.tsx
│  │  │     ├─ ExclusionOverlay.tsx
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
│  │  ├─ pages
│  │  │  ├─ appearance
│  │  │  │  ├─ components
│  │  │  │  │  ├─ AppearanceLivePreview.tsx
│  │  │  │  │  ├─ AppearancePrimitives.tsx
│  │  │  │  │  ├─ CreateColorThemeDialog.tsx
│  │  │  │  │  ├─ fontPresets.ts
│  │  │  │  │  └─ useDebouncedDraft.ts
│  │  │  │  └─ AppearanceSettingsPage.tsx
│  │  │  ├─ characters
│  │  │  │  ├─ components
│  │  │  │  │  ├─ CharacterTraitsTab.tsx
│  │  │  │  │  ├─ CreateTraitDialog.tsx
│  │  │  │  │  └─ TraitFlipCard.tsx
│  │  │  │  ├─ graph
│  │  │  │  │  └─ graphConstants.ts
│  │  │  │  ├─ CharacterDetailPage.tsx
│  │  │  │  ├─ CharacterGraphPage.tsx
│  │  │  │  └─ CharactersPage.tsx
│  │  │  ├─ dogmas
│  │  │  │  ├─ components
│  │  │  │  │  ├─ DogmaFormDialog.tsx
│  │  │  │  │  ├─ DogmaListItem.tsx
│  │  │  │  │  └─ dogmaStyles.ts
│  │  │  │  └─ DogmasPage.tsx
│  │  │  ├─ dynasties
│  │  │  │  ├─ components
│  │  │  │  │  ├─ DynastyDialogs.tsx
│  │  │  │  │  ├─ DynastyEventsTimeline.tsx
│  │  │  │  │  └─ FamilyTree.tsx
│  │  │  │  ├─ DynastiesPage.tsx
│  │  │  │  └─ DynastyDetailPage.tsx
│  │  │  ├─ factions
│  │  │  │  ├─ components
│  │  │  │  │  ├─ AmbitionFlipCard.tsx
│  │  │  │  │  ├─ CreateAmbitionDialog.tsx
│  │  │  │  │  ├─ CustomMetricsEditor.tsx
│  │  │  │  │  ├─ FactionAmbitionsTab.tsx
│  │  │  │  │  ├─ FactionCompareDialog.tsx
│  │  │  │  │  ├─ FactionDialogs.tsx
│  │  │  │  │  ├─ FactionPoliticalScalesSection.tsx
│  │  │  │  │  └─ MetricInput.tsx
│  │  │  │  ├─ FactionDetailPage.tsx
│  │  │  │  └─ FactionsPage.tsx
│  │  │  ├─ home
│  │  │  │  ├─ components
│  │  │  │  │  ├─ CreateProjectDialog.tsx
│  │  │  │  │  ├─ HomeBackground.tsx
│  │  │  │  │  └─ HomePrimitives.tsx
│  │  │  │  └─ HomePage.tsx
│  │  │  ├─ maps
│  │  │  │  ├─ components
│  │  │  │  │  ├─ MapMarkerDialog.tsx
│  │  │  │  │  ├─ MapMarkerOnMap.tsx
│  │  │  │  │  ├─ MapMarkerPanel.tsx
│  │  │  │  │  ├─ MapTerritoryDialog.tsx
│  │  │  │  │  ├─ MapTerritoryPanel.tsx
│  │  │  │  │  ├─ MapTerritorySvg.tsx
│  │  │  │  │  ├─ MapToolbar.tsx
│  │  │  │  │  └─ mapUtils.ts
│  │  │  │  ├─ hooks
│  │  │  │  │  ├─ useMapData.ts
│  │  │  │  │  ├─ useMapInteractions.ts
│  │  │  │  │  ├─ useMapMarkerCrud.ts
│  │  │  │  │  ├─ useMapNavigation.ts
│  │  │  │  │  ├─ useMapTerritoryCrud.ts
│  │  │  │  │  ├─ useMapTerritoryDrawing.ts
│  │  │  │  │  └─ useMapViewport.ts
│  │  │  │  └─ MapPage.tsx
│  │  │  ├─ notes
│  │  │  │  ├─ components
│  │  │  │  │  ├─ CreateWikiLinkDialog.tsx
│  │  │  │  │  ├─ InsertWikiLinkDialog.tsx
│  │  │  │  │  ├─ MarkdownPreview.tsx
│  │  │  │  │  ├─ NoteEditorMarkdownToolbar.tsx
│  │  │  │  │  ├─ NoteEditorWikiSidebar.tsx
│  │  │  │  │  └─ ToolbarButton.tsx
│  │  │  │  ├─ NoteEditorPage.tsx
│  │  │  │  └─ NotesPage.tsx
│  │  │  ├─ project-settings
│  │  │  │  └─ ProjectSettingsPage.tsx
│  │  │  ├─ timeline
│  │  │  │  └─ TimelinePage.tsx
│  │  │  └─ wiki
│  │  │     ├─ components
│  │  │     │  ├─ WikiArticleCard.tsx
│  │  │     │  ├─ WikiDialogs.tsx
│  │  │     │  └─ wikiPreviewText.ts
│  │  │     ├─ WikiGraphPage.tsx
│  │  │     └─ WikiPage.tsx
│  │  ├─ store
│  │  │  ├─ branchStorage.ts
│  │  │  ├─ debouncedStorage.ts
│  │  │  ├─ useAmbitionsStore.ts
│  │  │  ├─ useBranchStore.ts
│  │  │  ├─ useCharacterStore.ts
│  │  │  ├─ useCharacterTraitsStore.ts
│  │  │  ├─ useDogmaStore.ts
│  │  │  ├─ useDynastyStore.ts
│  │  │  ├─ useFactionStore.ts
│  │  │  ├─ useMapStore.ts
│  │  │  ├─ useMapTerritoriesRefreshStore.ts
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
│  │  │  ├─ interfaceStyles.ts
│  │  │  ├─ muiTheme.ts
│  │  │  ├─ presets.ts
│  │  │  └─ tokens.ts
│  │  ├─ utils
│  │  │  ├─ error.ts
│  │  │  ├─ exclusions.ts
│  │  │  ├─ mapGeometry.ts
│  │  │  └─ uploadAssetUrl.ts
│  │  ├─ App.tsx
│  │  └─ main.tsx
│  ├─ index.html
│  ├─ package.json
│  ├─ tsconfig.json
│  ├─ tsconfig.tsbuildinfo
│  └─ vite.config.ts
├─ scripts
│  ├─ db
│  │  ├─ explain-hot.mjs
│  │  └─ seed-demo.mjs
│  ├─ perf
│  │  ├─ reports
│  │  │  ├─ release-after.json
│  │  │  └─ release-before.json
│  │  ├─ baseline.mjs
│  │  └─ compare.mjs
│  ├─ smoke
│  │  ├─ scenarios
│  │  │  ├─ characters.mjs
│  │  │  ├─ dogmas.mjs
│  │  │  ├─ dynasties.mjs
│  │  │  ├─ factions.mjs
│  │  │  ├─ health.mjs
│  │  │  ├─ maps.mjs
│  │  │  ├─ notes.mjs
│  │  │  ├─ perf.mjs
│  │  │  ├─ project-transfer.mjs
│  │  │  ├─ projects.mjs
│  │  │  ├─ search.mjs
│  │  │  ├─ tags.mjs
│  │  │  ├─ timeline.mjs
│  │  │  └─ wiki.mjs
│  │  ├─ cleanup.mjs
│  │  ├─ context.mjs
│  │  ├─ frontend.mjs
│  │  ├─ index.mjs
│  │  └─ lib.mjs
│  ├─ chunker.mjs
│  ├─ doctor.mjs
│  ├─ generate-tree.mjs
│  └─ smoke-runner.mjs
├─ shared
│  ├─ src
│  │  ├─ schemas
│  │  │  ├─ ambition.schema.ts
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
│  │  │  ├─ political-scale.schema.ts
│  │  │  ├─ project.schema.ts
│  │  │  ├─ timeline.schema.ts
│  │  │  └─ wiki.schema.ts
│  │  ├─ types
│  │  │  └─ index.ts
│  │  ├─ constants.ts
│  │  └─ index.ts
│  ├─ package.json
│  ├─ tsconfig.json
│  └─ tsconfig.tsbuildinfo
├─ .gitignore
├─ AGENTS.md
├─ LICENSE
├─ package-lock.json
├─ package.json
├─ PLAN_EXECUTION.md
├─ PLAN.md
├─ README.md
├─ start.bat
└─ tsconfig.json
```
