# Project Tree

Автогенерируется скриптом `npm run tree`. Не редактировать вручную.

```
campaigner
├─ data
├─ docs
│  └─ ideas
│     ├─ ideas-backlog.md
│     ├─ ideas-dumb.md
│     └─ ideas-prompt.md
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
│  │  │  │  ├─ index.ts
│  │  │  │  ├─ tauri.ts
│  │  │  │  └─ types.ts
│  │  │  ├─ ambitions.ts
│  │  │  ├─ app.ts
│  │  │  ├─ branches.ts
│  │  │  ├─ characters.ts
│  │  │  ├─ characterTraits.ts
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
│  │  │  ├─ uploadFile.ts
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
│  │  │     ├─ AssetAvatar.tsx
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
│  │  │  ├─ useAssetUrl.ts
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
│  │  │  │  │  ├─ useMapInitialFit.ts
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
│  ├─ .env.tauri
│  ├─ index.html
│  ├─ package.json
│  ├─ tsconfig.json
│  └─ vite.config.ts
├─ scripts
│  ├─ db
│  ├─ en-catalog
│  │  ├─ ambitions-en.json
│  │  ├─ political-axes-en.json
│  │  ├─ political-zones-en-by-ru-label.json
│  │  └─ traits-en.json
│  ├─ lib
│  ├─ _political-rows-from-seed.json
│  ├─ gen-en-builtins.mjs
│  ├─ gen-rust-seeds.mjs
│  ├─ generate-tree.mjs
│  ├─ prepare-electron-runtime-deps.mjs
│  ├─ tauri-vite-build.mjs
│  └─ tauri-vite-dev.mjs
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
│  │  ├─ seeds
│  │  │  ├─ ambitions.ts
│  │  │  ├─ characterTraits.ts
│  │  │  ├─ index.ts
│  │  │  ├─ manifestHash.ts
│  │  │  ├─ politicalScales.ts
│  │  │  └─ stableStringify.ts
│  │  ├─ types
│  │  │  └─ index.ts
│  │  ├─ constants.ts
│  │  └─ index.ts
│  ├─ package.json
│  └─ tsconfig.json
├─ src-tauri
│  ├─ capabilities
│  │  └─ default.json
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
│  │  ├─ 009_dogmas.sql
│  │  ├─ 010_ambitions.sql
│  │  ├─ 011_character_traits.sql
│  │  ├─ 012_political_scales.sql
│  │  ├─ 013_graph_layouts.sql
│  │  ├─ 014_dynasties.sql
│  │  ├─ 015_maps.sql
│  │  └─ 016_wiki_links.sql
│  ├─ src
│  │  ├─ bin
│  │  │  └─ codegen.rs
│  │  ├─ commands
│  │  │  ├─ ambitions.rs
│  │  │  ├─ app.rs
│  │  │  ├─ branches.rs
│  │  │  ├─ character_traits.rs
│  │  │  ├─ characters.rs
│  │  │  ├─ dogmas.rs
│  │  │  ├─ dynasties.rs
│  │  │  ├─ factions.rs
│  │  │  ├─ graph_layouts.rs
│  │  │  ├─ maps.rs
│  │  │  ├─ mod.rs
│  │  │  ├─ notes.rs
│  │  │  ├─ political_scales.rs
│  │  │  ├─ project_io.rs
│  │  │  ├─ projects.rs
│  │  │  ├─ search.rs
│  │  │  ├─ tags.rs
│  │  │  ├─ timeline.rs
│  │  │  ├─ uploads.rs
│  │  │  └─ wiki.rs
│  │  ├─ db
│  │  │  ├─ connection.rs
│  │  │  ├─ migrations.rs
│  │  │  └─ mod.rs
│  │  ├─ models
│  │  │  ├─ ambition.rs
│  │  │  ├─ app.rs
│  │  │  ├─ branch.rs
│  │  │  ├─ character_trait.rs
│  │  │  ├─ character.rs
│  │  │  ├─ dogma.rs
│  │  │  ├─ dynasty.rs
│  │  │  ├─ faction.rs
│  │  │  ├─ graph_layout.rs
│  │  │  ├─ map.rs
│  │  │  ├─ mod.rs
│  │  │  ├─ note.rs
│  │  │  ├─ political_scale.rs
│  │  │  ├─ project_io.rs
│  │  │  ├─ project.rs
│  │  │  ├─ search.rs
│  │  │  ├─ tag_association.rs
│  │  │  ├─ tag.rs
│  │  │  ├─ timeline.rs
│  │  │  ├─ upload.rs
│  │  │  └─ wiki_link.rs
│  │  ├─ repositories
│  │  │  ├─ ambitions_seed.rs
│  │  │  ├─ ambitions.rs
│  │  │  ├─ branches.rs
│  │  │  ├─ character_traits_seed.rs
│  │  │  ├─ character_traits.rs
│  │  │  ├─ characters.rs
│  │  │  ├─ dogmas.rs
│  │  │  ├─ dynasties.rs
│  │  │  ├─ factions.rs
│  │  │  ├─ graph_layouts.rs
│  │  │  ├─ maps.rs
│  │  │  ├─ mod.rs
│  │  │  ├─ notes.rs
│  │  │  ├─ political_scales_seed.rs
│  │  │  ├─ political_scales.rs
│  │  │  ├─ project_io.rs
│  │  │  ├─ projects.rs
│  │  │  ├─ search.rs
│  │  │  ├─ tag_associations.rs
│  │  │  ├─ tags.rs
│  │  │  ├─ timeline.rs
│  │  │  └─ wiki.rs
│  │  ├─ services
│  │  │  ├─ branch_overlay.rs
│  │  │  ├─ branch_scope.rs
│  │  │  ├─ mod.rs
│  │  │  └─ tag_associations.rs
│  │  ├─ uploads
│  │  │  ├─ filename.rs
│  │  │  ├─ mod.rs
│  │  │  ├─ service.rs
│  │  │  ├─ storage.rs
│  │  │  ├─ validation.rs
│  │  │  └─ web_path.rs
│  │  ├─ asset_protocol.rs
│  │  ├─ error.rs
│  │  ├─ lib.rs
│  │  ├─ main.rs
│  │  ├─ paths.rs
│  │  └─ specta.rs
│  ├─ .gitignore
│  ├─ build-frontend.mjs
│  ├─ build.rs
│  ├─ Cargo.lock
│  ├─ Cargo.toml
│  ├─ dev-frontend.mjs
│  └─ tauri.conf.json
├─ .gitignore
├─ LICENSE
├─ package.json
├─ README.md
└─ tsconfig.json
```
