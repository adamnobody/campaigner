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
│  │  │  ├─ graphLayout.controller.ts
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
│  │  │  │  ├─ 011_state_relations.ts
│  │  │  │  ├─ 012_branch_scoped_creates.ts
│  │  │  │  ├─ 013_branch_visibility_v020.ts
│  │  │  │  ├─ 014_faction_relations_branch.ts
│  │  │  │  ├─ 015_graph_layouts.ts
│  │  │  │  └─ 016_timeline_event_era_color.ts
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
│  │  │  ├─ noteListQuerySchema.test.ts
│  │  │  ├─ political-scale.routes.ts
│  │  │  ├─ project.routes.ts
│  │  │  ├─ querySchemas.ts
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
│  │  │  │  ├─ graphLayoutImport.helpers.ts
│  │  │  │  ├─ index.ts
│  │  │  │  ├─ project.service.ts
│  │  │  │  ├─ project.types.ts
│  │  │  │  ├─ projectExport.service.ts
│  │  │  │  └─ projectImport.service.ts
│  │  │  ├─ ambition.service.ts
│  │  │  ├─ branch.service.ts
│  │  │  ├─ branchOverlay.service.ts
│  │  │  ├─ branchScope.ts
│  │  │  ├─ character-trait.service.ts
│  │  │  ├─ character.service.ts
│  │  │  ├─ dogma.service.ts
│  │  │  ├─ graphLayout.service.ts
│  │  │  ├─ note.service.ts
│  │  │  ├─ search.service.ts
│  │  │  ├─ tag.service.ts
│  │  │  ├─ timeline.service.ts
│  │  │  └─ wiki.service.ts
│  │  ├─ utils
│  │  │  ├─ apiResponse.ts
│  │  │  ├─ asyncHandler.ts
│  │  │  ├─ branchRequest.ts
│  │  │  ├─ dbHelpers.ts
│  │  │  └─ parseId.ts
│  │  └─ index.ts
│  ├─ .env.example
│  ├─ package.json
│  └─ tsconfig.json
├─ data
├─ docs
│  ├─ architecture
│  │  └─ conventions.md
│  ├─ ideas
│  │  ├─ ideas-backlog.md
│  │  ├─ ideas-dumb.md
│  │  └─ ideas-prompt.md
│  ├─ migration
│  │  ├─ baseline-2026-05-14
│  │  │  ├─ baseline-build.txt
│  │  │  ├─ baseline-doctor.txt
│  │  │  ├─ baseline-smoke-frontend.txt
│  │  │  ├─ baseline-smoke.txt
│  │  │  └─ notes.md
│  │  └─ README.md
│  └─ performance-regression-checklist.md
├─ electron
│  ├─ icon.ico
│  └─ main.js
├─ frontend
│  ├─ public
│  │  ├─ ambitions
│  │  │  ├─ demokratizatsiya.jpg
│  │  │  ├─ diplomaticheskaya-gegemoniya.jpg
│  │  │  ├─ ekologicheskaya-garmoniya.jpg
│  │  │  ├─ industrializatsiya.jpg
│  │  │  ├─ izolyatsionizm.jpg
│  │  │  ├─ kontrol-morskikh-putey.jpg
│  │  │  ├─ kontrol-torgovykh-marshrutov.jpg
│  │  │  ├─ kulturnaya-assimilyatsiya.jpg
│  │  │  ├─ magicheskoe-prevoskhodstvo.jpg
│  │  │  ├─ mest.jpg
│  │  │  ├─ nakoplenie-bogatstva.jpg
│  │  │  ├─ nauchnyy-progress.jpg
│  │  │  ├─ obedinenie-naroda.jpg
│  │  │  ├─ osvobozhdenie-poraboshchennykh.jpg
│  │  │  ├─ podderzhanie-mira.jpg
│  │  │  ├─ poraboshchenie-sosedey.jpg
│  │  │  ├─ razvitie-iskusstv.jpg
│  │  │  ├─ religioznaya-ekspansiya.jpg
│  │  │  ├─ religioznoe-obrashchenie-sosedey.jpg
│  │  │  ├─ restavratsiya-starogo-poryadka.jpg
│  │  │  ├─ sozdanie-koloniy.jpg
│  │  │  ├─ sverzhenie-soseda.jpg
│  │  │  ├─ tekhnologicheskiy-progress.jpg
│  │  │  ├─ territorialnaya-ekspansiya.jpg
│  │  │  ├─ torgovaya-dominatsiya.jpg
│  │  │  ├─ ustanovlenie-tiranii.jpg
│  │  │  ├─ voennoe-prevoskhodstvo.jpg
│  │  │  ├─ vyzhivanie.jpg
│  │  │  └─ zashchita-traditsiy.jpg
│  │  ├─ fonts
│  │  │  ├─ my-local-font.css
│  │  │  └─ README.md
│  │  ├─ traits
│  │  │  ├─ ambitsioznost.jpg
│  │  │  ├─ apatiya.jpg
│  │  │  ├─ chestnost.jpg
│  │  │  ├─ chrevogudie.jpg
│  │  │  ├─ dobrota.jpg
│  │  │  ├─ doverchivost.jpg
│  │  │  ├─ egoizm.jpg
│  │  │  ├─ fanatizm.jpg
│  │  │  ├─ kharizma.jpg
│  │  │  ├─ khitrost.jpg
│  │  │  ├─ khladnokrovie.jpg
│  │  │  ├─ khrabrost.jpg
│  │  │  ├─ kreativnost.jpg
│  │  │  ├─ litsemerie.jpg
│  │  │  ├─ lyubopytstvo.jpg
│  │  │  ├─ malodushie.jpg
│  │  │  ├─ melankholiya.jpg
│  │  │  ├─ miloserdie.jpg
│  │  │  ├─ mudrost.jpg
│  │  │  ├─ nervoznost.jpg
│  │  │  ├─ optimizm.jpg
│  │  │  ├─ paranoyya.jpg
│  │  │  ├─ pokhot.jpg
│  │  │  ├─ raschetlivost.jpg
│  │  │  ├─ reshitelnost.jpg
│  │  │  ├─ samokontrol.jpg
│  │  │  ├─ shchedrost.jpg
│  │  │  ├─ umstvennaya-otstalost.jpg
│  │  │  ├─ upryamstvo.jpg
│  │  │  ├─ utonchennost.jpg
│  │  │  ├─ vernost.jpg
│  │  │  ├─ vysokomerie.jpg
│  │  │  ├─ zhadnost.jpg
│  │  │  ├─ zhestokost.jpg
│  │  │  └─ zlost.jpg
│  │  └─ campaigner.png
│  ├─ src
│  │  ├─ api
│  │  │  ├─ transport
│  │  │  │  ├─ http.ts
│  │  │  │  ├─ index.ts
│  │  │  │  ├─ tauri.ts
│  │  │  │  └─ types.ts
│  │  │  ├─ ambitions.ts
│  │  │  ├─ app.ts
│  │  │  ├─ branches.ts
│  │  │  ├─ characters.ts
│  │  │  ├─ characterTraits.ts
│  │  │  ├─ client.ts
│  │  │  ├─ dogmas.ts
│  │  │  ├─ dynasties.ts
│  │  │  ├─ factions.ts
│  │  │  ├─ graphLayout.ts
│  │  │  ├─ maps.ts
│  │  │  ├─ notes.ts
│  │  │  ├─ politicalScales.ts
│  │  │  ├─ projects.ts
│  │  │  ├─ search.ts
│  │  │  ├─ tags.ts
│  │  │  ├─ timeline.ts
│  │  │  ├─ types.ts
│  │  │  ├─ uploads.ts
│  │  │  ├─ wiki.ts
│  │  │  └─ withBranchParams.ts
│  │  ├─ components
│  │  │  ├─ detail
│  │  │  │  └─ CollapsibleSection.tsx
│  │  │  ├─ exclusions
│  │  │  │  └─ ExclusionCatalogTab.tsx
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
│  │  │     ├─ BranchEntityMissingDialog.tsx
│  │  │     ├─ ConfirmDialog.tsx
│  │  │     ├─ DndButton.tsx
│  │  │     ├─ EditExclusionsDialog.tsx
│  │  │     ├─ EmptyState.tsx
│  │  │     ├─ EntityHeroLayout.tsx
│  │  │     ├─ EntityTabs.tsx
│  │  │     ├─ ErrorBoundary.tsx
│  │  │     ├─ ExclusionOverlay.tsx
│  │  │     ├─ FlipCard.tsx
│  │  │     ├─ FloatingOrb.tsx
│  │  │     ├─ GlassCard.tsx
│  │  │     ├─ GlobalSnackbar.tsx
│  │  │     ├─ LanguageSwitcher.tsx
│  │  │     ├─ LoadingScreen.tsx
│  │  │     ├─ SearchDialog.tsx
│  │  │     ├─ SectionHeader.tsx
│  │  │     ├─ SplashScreen.tsx
│  │  │     ├─ splashTipKeys.ts
│  │  │     └─ StyleCustomizer.tsx
│  │  ├─ hooks
│  │  │  ├─ useDebounce.ts
│  │  │  ├─ useHistory.ts
│  │  │  ├─ useHotkeys.ts
│  │  │  └─ useProjectScope.ts
│  │  ├─ i18n
│  │  │  ├─ catalog
│  │  │  │  └─ displayBuiltinTexts.ts
│  │  │  ├─ locales
│  │  │  │  ├─ en
│  │  │  │  │  ├─ builtins
│  │  │  │  │  │  ├─ catalogAmbitions.json
│  │  │  │  │  │  ├─ catalogTraits.json
│  │  │  │  │  │  └─ politicalScalesBuiltin.json
│  │  │  │  │  ├─ ambitions.json
│  │  │  │  │  ├─ appearance.json
│  │  │  │  │  ├─ characters.json
│  │  │  │  │  ├─ common.json
│  │  │  │  │  ├─ dogmas.json
│  │  │  │  │  ├─ dynasties.json
│  │  │  │  │  ├─ factions.json
│  │  │  │  │  ├─ graph.json
│  │  │  │  │  ├─ map.json
│  │  │  │  │  ├─ navigation.json
│  │  │  │  │  ├─ notes.json
│  │  │  │  │  ├─ onboarding.json
│  │  │  │  │  ├─ policies.json
│  │  │  │  │  ├─ projects.json
│  │  │  │  │  ├─ projectSettings.json
│  │  │  │  │  ├─ settings.json
│  │  │  │  │  ├─ timeline.json
│  │  │  │  │  └─ wiki.json
│  │  │  │  └─ ru
│  │  │  │     ├─ ambitions.json
│  │  │  │     ├─ appearance.json
│  │  │  │     ├─ characters.json
│  │  │  │     ├─ common.json
│  │  │  │     ├─ dogmas.json
│  │  │  │     ├─ dynasties.json
│  │  │  │     ├─ factions.json
│  │  │  │     ├─ graph.json
│  │  │  │     ├─ map.json
│  │  │  │     ├─ navigation.json
│  │  │  │     ├─ notes.json
│  │  │  │     ├─ onboarding.json
│  │  │  │     ├─ policies.json
│  │  │  │     ├─ projects.json
│  │  │  │     ├─ projectSettings.json
│  │  │  │     ├─ settings.json
│  │  │  │     ├─ timeline.json
│  │  │  │     └─ wiki.json
│  │  │  ├─ index.ts
│  │  │  ├─ language.ts
│  │  │  └─ types.ts
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
│  │  │  ├─ graph
│  │  │  │  ├─ components
│  │  │  │  │  ├─ AnimatedGraphSidePanel.tsx
│  │  │  │  │  ├─ GraphCanvasShell.tsx
│  │  │  │  │  ├─ GraphDetailsPanel.tsx
│  │  │  │  │  ├─ GraphFiltersPanel.tsx
│  │  │  │  │  ├─ GraphLegend.tsx
│  │  │  │  │  ├─ GraphStatusBar.tsx
│  │  │  │  │  └─ GraphToolbar.tsx
│  │  │  │  ├─ data
│  │  │  │  │  └─ buildProjectGraph.ts
│  │  │  │  ├─ formatNodeMeta.ts
│  │  │  │  ├─ ProjectGraphPage.tsx
│  │  │  │  └─ types.ts
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
│  │  │  ├─ project-dashboard
│  │  │  │  └─ ProjectDashboardPage.tsx
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
│  │  ├─ types
│  │  │  └─ generated
│  │  │     └─ bindings.ts
│  │  ├─ utils
│  │  │  ├─ error.ts
│  │  │  ├─ exclusions.ts
│  │  │  ├─ mapGeometry.ts
│  │  │  ├─ routes.ts
│  │  │  └─ uploadAssetUrl.ts
│  │  ├─ App.tsx
│  │  ├─ main.tsx
│  │  └─ vite-env.d.ts
│  ├─ index.html
│  ├─ package.json
│  ├─ tsconfig.json
│  └─ vite.config.ts
├─ scripts
│  ├─ db
│  │  ├─ explain-hot.mjs
│  │  └─ seed-demo.mjs
│  ├─ en-catalog
│  │  ├─ ambitions-en.json
│  │  ├─ political-axes-en.json
│  │  ├─ political-zones-en-by-ru-label.json
│  │  └─ traits-en.json
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
│  ├─ _political-rows-from-seed.json
│  ├─ chunker.mjs
│  ├─ doctor.mjs
│  ├─ extract-political-scales-from-seed.mjs
│  ├─ gen-en-builtins.mjs
│  ├─ generate-tree.mjs
│  ├─ prepare-node-runtime.js
│  ├─ rebuild-backend-native.mjs
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
│  │  │  ├─ graphLayout.schema.ts
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
│  └─ tsconfig.json
├─ src-tauri
│  ├─ icons
│  │  └─ icon.ico
│  ├─ migrations
│  │  ├─ 000_init.sql
│  │  ├─ 001_tags.sql
│  │  ├─ 002_projects.sql
│  │  ├─ 003_branch_foundation.sql
│  │  ├─ 004_tag_associations.sql
│  │  ├─ 005_notes.sql
│  │  ├─ 006_timeline.sql
│  │  ├─ 007_characters.sql
│  │  ├─ 008_factions.sql
│  │  └─ 009_dogmas.sql
│  ├─ src
│  │  ├─ bin
│  │  │  └─ codegen.rs
│  │  ├─ commands
│  │  │  ├─ app.rs
│  │  │  ├─ branches.rs
│  │  │  ├─ characters.rs
│  │  │  ├─ dogmas.rs
│  │  │  ├─ factions.rs
│  │  │  ├─ mod.rs
│  │  │  ├─ notes.rs
│  │  │  ├─ projects.rs
│  │  │  ├─ tags.rs
│  │  │  └─ timeline.rs
│  │  ├─ db
│  │  │  ├─ connection.rs
│  │  │  ├─ migrations.rs
│  │  │  └─ mod.rs
│  │  ├─ models
│  │  │  ├─ app.rs
│  │  │  ├─ branch.rs
│  │  │  ├─ character.rs
│  │  │  ├─ dogma.rs
│  │  │  ├─ faction.rs
│  │  │  ├─ mod.rs
│  │  │  ├─ note.rs
│  │  │  ├─ project.rs
│  │  │  ├─ tag_association.rs
│  │  │  ├─ tag.rs
│  │  │  └─ timeline.rs
│  │  ├─ repositories
│  │  │  ├─ branches.rs
│  │  │  ├─ characters.rs
│  │  │  ├─ dogmas.rs
│  │  │  ├─ factions.rs
│  │  │  ├─ mod.rs
│  │  │  ├─ notes.rs
│  │  │  ├─ projects.rs
│  │  │  ├─ tag_associations.rs
│  │  │  ├─ tags.rs
│  │  │  └─ timeline.rs
│  │  ├─ services
│  │  │  ├─ branch_overlay.rs
│  │  │  ├─ branch_scope.rs
│  │  │  ├─ mod.rs
│  │  │  └─ tag_associations.rs
│  │  ├─ error.rs
│  │  ├─ lib.rs
│  │  ├─ main.rs
│  │  ├─ paths.rs
│  │  └─ specta.rs
│  ├─ .gitignore
│  ├─ build.rs
│  ├─ Cargo.lock
│  ├─ Cargo.toml
│  └─ tauri.conf.json
├─ .gitignore
├─ LICENSE
├─ MIGRATION-PROMPT.md
├─ package.json
├─ README.md
├─ start.bat
└─ tsconfig.json
```
