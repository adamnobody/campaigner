# PLAN.md - Strategy and Product Development Plan for Campaigner

## 1. Vision and Positioning

Campaigner should compete not by copying one competitor, but by combining two strengths in a single product:

- Structured worldbuilding platform (entities, relations, maps, timeline, dynasties, factions).
- Fast, flexible writing workflow with low friction (Obsidian-like feel: links, graph, markdown-first flow).

Target positioning:

**Structured Worldbuilding + Writer Freedom**

In practice this means:

- Build and maintain a coherent world model.
- Let authors capture ideas quickly and refine structure later.
- Keep data ownership, portability, and reliability as core product values.

---

## 2. Current State Assessment (Based on Repository)

Campaigner already has a strong foundation:

- Monorepo with clear contracts via `shared` package.
- Backend: Express + TypeScript + SQLite (`better-sqlite3`) + Zod.
- Frontend: React 18 + TypeScript + Vite + MUI + Zustand.
- Desktop wrapper through Electron.

Implemented domain capabilities include:

- Projects.
- Characters (+ relationships and traits).
- Factions (+ ranks/members/assets/relations/policies/ambitions/scales).
- Dynasties (+ members/family links/events/tree positions).
- Notes + Wiki links.
- Maps (+ markers + territories + upload).
- Timeline events.
- Tags + Search.
- Scenario branches (overlay model for selected domains).
- Import/export flows.

Project strengths today:

- Contract-oriented architecture (`shared` as source of truth).
- Good domain coverage for worldbuilding.
- Existing smoke and performance tooling.
- Strong base for offline-capable desktop experience.

Current limiting factors for top-tier competitiveness:

- Partial branch-aware coverage across domains.
- Map tooling depth below latest map-first competitors.
- No full user-facing dynamic entity schema system (custom entity types and fields as first-class).
- Need stronger everyday writer workflow (capture -> link -> refine).

---

## 3. Competitor Summary and What to Learn

### 3.1 World Anvil - Strengths to Learn From

Observed strengths:

- Very broad all-in-one toolset (wiki, maps, timelines, campaign workflows).
- Rich template system with prompts.
- Deep cross-linking and content organization.
- Publication/privacy controls.
- Strong discoverability: categories, tags, search, navigable structure.

Applicable lessons for Campaigner:

- Make templated authoring powerful but not overwhelming.
- Improve placeholder links and "write now, structure later" workflow.
- Treat privacy/share modes as product-level features, not a later add-on.

### 3.2 LegendKeeper - Strengths to Learn From

Observed strengths:

- Map-first UX with advanced map objects (pins, regions, paths, labels).
- Better large-map workflows and map object management.
- Tight map <-> wiki navigation.
- Collaboration-oriented map interactions.

Applicable lessons for Campaigner:

- Evolve maps from marker-centric to geography-centric tooling.
- Add layers/groups/mass edit and visibility controls.
- Make map objects deeply linkable to lore entities and views.

### 3.3 Chronicler - Strengths to Learn From

Observed strengths:

- Clear offline-first, local data ownership promise.
- Markdown-native workflow with wiki links/backlinks.
- Migration-friendly (including Obsidian-style vault compatibility narrative).
- Infobox/template consistency with low complexity.

Applicable lessons for Campaigner:

- Reinforce data ownership and portability messaging.
- Keep markdown and links as first-class authoring model.
- Improve migration/import experience from common writing tools.

### 3.4 vvd.world - Strengths to Learn From

Observed strengths:

- Modern "all-in-one storyteller toolkit" positioning.
- Emphasis on connected worlds (maps, graph, family trees, collaboration).
- AI framed as organizational assistive layer (not creativity replacement).

Applicable lessons for Campaigner:

- Introduce assistive intelligence for structuring and linking content.
- Keep AI optional and transparent in data usage.
- Use modern, creator-focused storytelling language in product communication.

### 3.5 Obsidian Patterns Worth Adopting

Key patterns:

- Fast note capture and editing.
- Wikilinks/backlinks/unlinked mentions.
- Graph and local graph for context.
- Templates and extensibility.
- Strong user control and low lock-in perception.

Applicable direction:

- Build writer-speed workflows first.
- Keep structure strong, but never at the expense of author flow.

---

## 4. Strategic Product Principles

1. **Capture first, structure second**
   - Any new idea should be captured in seconds.
   - Structuring should be assisted, not forced.

2. **Entity graph as system backbone**
   - Everything (character, place, event, item, faction) should behave as linked entities.

3. **Map and timeline as core narrative dimensions**
   - Space and time must be first-class, not isolated modules.

4. **Data trust is non-negotiable**
   - Reliable export/import, version history, backup safety.

5. **Assistive AI only**
   - Help users organize and connect ideas; do not "replace" creative authorship.

---

## 5. Development Roadmap

## Phase A (0-3 months): Foundation Upgrade

Goal: establish the minimum competitive core.

Planned outcomes:

- Unified entity and relation model expansion.
- Better linking workflow:
  - `[[wikilinks]]`
  - backlinks
  - unlinked mentions
  - alias support
- Placeholder entity creation from unresolved links.
- Search and discovery improvements (fuzzy + faceted filtering + fast jump).
- Import/export hardening for long-term reliability.

Success criteria:

- User can build a linked mini-world quickly and reliably.
- Search and link navigation become daily-driver quality.

## Phase B (3-6 months): Narrative Engine

Goal: make maps and timeline a major differentiator.

Planned outcomes:

- Map evolution:
  - labels (free text map annotations)
  - paths/routes
  - improved layers/groups/visibility controls
- Timeline evolution:
  - lane-based parallel tracks
  - filters by entity/faction/location/time slice
- Chronicle mode:
  - event-to-map contextual navigation
  - "history walkthrough" interaction mode

Success criteria:

- Users can reason about world history spatially and temporally without tool friction.

## Phase C (6-12 months): Platform and Ecosystem

Goal: move from tool to extensible platform.

Planned outcomes:

- Collaboration:
  - roles and permissions
  - comment/review workflows
  - basic change history and diffs
- Extensibility:
  - templates library/marketplace direction
  - automation hooks
  - controlled plugin API surface
- Smart-assist:
  - entity detection from prose
  - auto-suggest links/tags/folders
  - consistency checks for world data

Success criteria:

- Teams can co-create worlds.
- Power users can adapt workflows without forking the product.

---

## 6. Prioritized Initiatives

### P0 (Critical)

- Wikilinks/backlinks/unlinked mentions.
- Custom entity types and custom fields.
- Typed relationship system.
- Search 2.0 (filters + ranking + saved views).
- Reliability package:
  - robust export/import
  - backups
  - recovery/version snapshots

### P1 (High ROI)

- Advanced map tools (labels, paths, grouping, layers).
- Timeline lanes and world-state filters.
- Branch-aware support expansion across key domains.
- Fast writer UX:
  - quick capture
  - command palette patterns
  - keyboard-centric actions

### P2 (Differentiation)

- Chronicle storytelling mode.
- Public sharing/publishing improvements.
- Automation and plugin extensibility.
- Team collaboration improvements.

---

## 7. Technical Execution Plan (Aligned with Current Stack)

### 7.1 Shared Contracts (`shared`)

- Extend schemas for flexible entities/fields/relations.
- Version critical import/export contracts.
- Keep backend/frontend strongly synchronized through shared types.

### 7.2 Backend (`backend`)

- Strengthen domain services for graph traversal and relation querying.
- Normalize pagination/filter patterns across APIs.
- Introduce background indexing/consistency checks where needed.
- Continue validating all input contracts with Zod.

### 7.3 Frontend (`frontend`)

- Build editor/linking core primitives (autocomplete, backlinks, mentions).
- Expand map interaction primitives incrementally (avoid rewrite shock).
- Keep Zustand usage focused on cross-page/global state.
- Preserve domain-local architecture for large pages/components.

### 7.4 Data and Performance (`sqlite` + app layer)

- Add/verify indexes for search-heavy and graph-heavy queries.
- Track API p95/p99 metrics and regressions.
- Improve rendering performance for large map and graph scenarios.

### 7.5 Desktop and Offline Trust (`electron`)

- Improve reliability and recovery behavior.
- Keep "local-first confidence" in UX and messaging.

---

## 8. KPI Framework

Use KPIs to evaluate competitiveness and user value:

- **Activation:** time to first linked mini-world.
- **Capture speed:** median time from idea to saved note/entity.
- **Graph density:** average meaningful links per entity.
- **Retention:** D7 and D30 for active world creators.
- **Depth of usage:** share of projects using map + timeline + links together.
- **Reliability:** import/export failure rate and recovery incidents.
- **Performance:** key UI responsiveness + API p95/p99 targets.

---

## 9. Risk Register and Mitigations

### Risk 1: Feature bloat and UX overload

Mitigation:

- Progressive disclosure.
- Basic/pro modes.
- Strong defaults.

### Risk 2: Architectural entropy during rapid growth

Mitigation:

- Respect canonical API/import placement rules.
- Keep minimal-diff, incremental refactor strategy.

### Risk 3: Import/export incompatibility over time

Mitigation:

- Contract tests and version fixtures.
- Explicit migration support per format version.

### Risk 4: Performance regressions on large worlds

Mitigation:

- Early indexing and profiling.
- Incremental perf gates with baseline comparisons.

### Risk 5: User distrust of AI features

Mitigation:

- Opt-in AI assistance only.
- Transparent data handling and clear ownership guarantees.

---

## 10. Practical 8-Week Execution Backlog

1. Ship Wikilinks MVP (autocomplete + backlinks + unresolved links).
2. Ship Custom Entity Type MVP (core field types + editor UI).
3. Add Typed Relations + relation explorer.
4. Add Map Labels + Paths (CRUD + visual controls).
5. Add Timeline Lanes + entity-based filters.
6. Upgrade Search with facets and better ranking.
7. Ship Export vNext with stronger portability semantics.
8. Run targeted performance pass and freeze baseline metrics.

---

## 11. Suggested Release Framing

Recommended release narrative for users:

- "Campaigner now combines world structure depth with writer-speed workflow."
- "Your world stays yours: reliable export, local trust, and long-term portability."
- "From quick idea capture to deeply connected lore, in one consistent environment."

---

## 12. Decision Checklist for Every New Feature

Before implementing a feature, verify:

1. Does it reduce friction for daily writing?
2. Does it improve world model coherence?
3. Does it increase reliability or trust?
4. Is it incremental and architecture-safe?
5. Can success be measured with a KPI?

If at least 3/5 are not true, the feature should be postponed or redesigned.

---

## 13. User Segments and Jobs-to-be-Done (JTBD)

### Segment A: Solo Writer (novelist / screenwriter / lore author)

Primary jobs:

- Capture ideas before they are lost.
- Turn fragmented notes into coherent world canon.
- Keep consistency across names, events, places, and timelines.

Primary pains:

- Tool friction during writing sessions.
- Broken context when jumping between notes/maps/timeline.
- Fear of lock-in and future migration pain.

What keeps this segment:

- Fast writing flow, strong linking, strong search.
- Data ownership confidence.
- Templates that assist but do not constrain.

### Segment B: Game Master (TTRPG)

Primary jobs:

- Prepare sessions quickly.
- Track factions, NPCs, places, events, and consequences.
- Present lore context to players with controlled visibility.

Primary pains:

- Time pressure before sessions.
- Difficulty mapping events to geography and travel.
- Hard to maintain canon after many sessions.

What keeps this segment:

- Map + timeline + relation views that are practical.
- Session prep shortcuts and reusable structures.
- Private/public/player-facing content controls.

### Segment C: Co-Author / Small Lore Team

Primary jobs:

- Co-create a coherent shared world.
- Avoid conflicting edits and hidden contradictions.
- Review and approve changes efficiently.

Primary pains:

- Weak collaboration and role controls.
- Poor visibility into who changed what.
- No clear review workflow.

What keeps this segment:

- Roles, permissions, comments, history.
- Consistency checks and structured review loops.
- Predictable release/publish workflow for shared worlds.

### Segment D: Power Worldbuilder / Builder-Engineer Hybrid

Primary jobs:

- Model complex worlds with custom structures.
- Build repeatable workflows with templates and automation.
- Analyze connections and surface hidden dependencies.

Primary pains:

- Rigid domain schema.
- Limited extension points.
- Graph and query tools not deep enough.

What keeps this segment:

- Custom entity schema.
- Plugin/automation hooks.
- Advanced graph and filtered analytical views.

---

## 14. Competitive Matrix (Feature-Level)

Legend:

- `Strong`: best-in-class or very mature.
- `Medium`: usable but not leading.
- `Emerging`: early capability or partial implementation.

| Capability | World Anvil | LegendKeeper | Chronicler | vvd.world | Campaigner (Current) | Campaigner (Target) |
|---|---|---|---|---|---|---|
| Wiki + linked lore | Strong | Medium | Strong | Medium | Strong | Strong |
| Markdown-first writing | Medium | Medium | Strong | Medium | Medium | Strong |
| Backlinks / unlinked mentions | Medium | Medium | Strong | Medium | Emerging | Strong |
| Map depth (regions/paths/labels) | Strong | Strong | Emerging | Medium | Medium | Strong |
| Timeline depth | Strong | Medium | Emerging | Medium | Medium | Strong |
| Entity relationship modeling | Strong | Medium | Medium | Medium | Medium | Strong |
| Custom schema/types | Medium | Medium | Medium | Medium | Emerging | Strong |
| Offline/local-first trust | Medium | Medium | Strong | Low | Medium | Strong |
| Import/export portability | Strong | Medium | Strong | Medium | Medium | Strong |
| Collaboration workflows | Medium | Medium | Low | Medium | Emerging | Strong |
| Extensibility/plugins | Medium | Low | Medium | Low | Emerging | Medium/Strong |
| Authoring speed UX | Medium | Medium | Strong | Medium | Medium | Strong |

Strategic implication:

- Campaigner can win by combining:
  - structural depth (World Anvil-like),
  - map/timeline usability (LegendKeeper-inspired),
  - writer velocity + local trust (Chronicler/Obsidian pattern).

---

## 15. North Star and Metrics Tree

### 15.1 North Star Metric

**Weekly Connected World Sessions (WCWS)**  
Definition: number of weekly sessions where a user creates or updates at least 1 entity and 1 meaningful link/relation.

Why:

- Measures both activity and world coherence.
- Rewards connected knowledge creation, not passive browsing.

### 15.2 Supporting KPI Tree

Acquisition and activation:

- Time to first linked world object.
- % new users creating first linked pair in first session.

Engagement and productivity:

- Median capture time (idea -> saved object).
- Median link creation per writing session.
- Search-to-open success rate.

Depth and coherence:

- Average typed relations per entity.
- % projects using map + timeline + wiki links together.
- Contradiction/consistency issue rate per 100 entities.

Retention:

- D7 and D30 retained creators.
- Weekly active worlds.

Reliability and trust:

- Export success rate.
- Restore/recovery success rate.
- Data-loss incidents (target: zero).

Performance:

- p95 API latency for search/map/timeline endpoints.
- UI interaction stutter metrics on map/editor.

---

## 16. P0 PRD Blocks (Detailed)

Each P0 initiative should follow this structure and acceptance gates.

### P0-1: Wikilinks, Backlinks, and Unlinked Mentions

Problem:

- Authors lose context and cannot quickly navigate world knowledge.

User story:

- As an author, I can type `[[...]]` to link entities while writing and instantly see incoming references and unlinked opportunities.

Scope:

- Link autocomplete for entities and notes.
- Backlinks panel per note/entity.
- Unlinked mentions detection with one-click link creation.
- Alias support for alternate names.

Acceptance criteria:

- Link creation from editor requires <= 2 interactions after typing `[[`.
- Backlinks list updates after save without manual refresh.
- Unlinked mention suggestions support accept/ignore state.
- Rename operation updates links without corruption.

Non-goals (v1):

- Full semantic entity extraction.
- Cross-project linking.

### P0-2: Custom Entity Types and Custom Fields

Problem:

- Fixed schema limits worldbuilding variety across genres.

User story:

- As a worldbuilder, I can define custom entity types and fields without code changes.

Scope:

- Entity type builder UI.
- Core field types (text, number, date, enum, relation).
- Validation and rendering rules.
- Template presets for fast start.

Acceptance criteria:

- User creates new entity type and at least 3 field types from UI only.
- Created entities validate correctly and are searchable.
- Fields are portable through export/import.

Non-goals (v1):

- Complex formula fields.
- Arbitrary scripting inside field logic.

### P0-3: Typed Relationship System

Problem:

- Unstructured links reduce graph quality and query power.

User story:

- As an author, I can define relation types (e.g., "rules", "allied_with", "located_in") and filter graph views by relation semantics.

Scope:

- Relation type registry per project.
- Directionality support.
- Basic constraints (allowed source/target type).
- Relation explorer view.

Acceptance criteria:

- User can create, edit, and apply relation types.
- Graph/list view can filter by relation type.
- Relation integrity is preserved on entity rename/delete flows.

Non-goals (v1):

- Advanced ontology inference.
- Multi-hop query language.

### P0-4: Search 2.0

Problem:

- Users cannot reliably find relevant items in larger worlds.

User story:

- As a user, I can find specific content quickly using filters, ranking, and jump navigation.

Scope:

- Better ranking for title/exact/alias matches.
- Filters: type, tag, date range, relation presence.
- Saved search views.
- Keyboard-first quick-open behavior.

Acceptance criteria:

- Query result relevance improves in benchmark set.
- Search interactions remain responsive under load.
- Saved searches are project-scoped and reusable.

Non-goals (v1):

- Full natural-language semantic search stack.

### P0-5: Reliability and Portability Package

Problem:

- Long-term trust breaks if export/recovery is weak.

User story:

- As a creator, I can export, re-import, and recover my world confidently.

Scope:

- Export schema versioning.
- Import compatibility and diagnostics.
- Snapshot/version recovery UX.
- Backup health checks.

Acceptance criteria:

- Export -> Import roundtrip preserves core entities/relations with no critical loss.
- Recovery flow is documented and testable.
- Error messages provide actionable remediation.

Non-goals (v1):

- Real-time cloud sync conflict engine.

---

## 17. Quarterly Execution Plan (12 Months)

### Q1: Core Authoring and Data Model

Primary goals:

- Deliver P0-1, P0-2 MVP, and P0-4 baseline.

Milestones:

- M1: link editor primitives and backlinks.
- M2: custom entity type UI + backend contracts.
- M3: search ranking + filters baseline.

Exit gates:

- Activation and capture speed metrics improve versus baseline.
- No major regressions in smoke/build/perf checks.

### Q2: Map/Timeline Narrative Depth

Primary goals:

- Deliver P1 map and timeline upgrades.
- Begin P0-3 typed relations rollout.

Milestones:

- M1: labels + paths on maps.
- M2: timeline lanes + filters.
- M3: relation explorer alpha.

Exit gates:

- Increase in map/timeline combined usage.
- Map and timeline interactions meet performance targets.

### Q3: Reliability, Branch Expansion, Collaboration Foundation

Primary goals:

- Complete P0-5.
- Expand branch-aware coverage to selected core domains.
- Launch collaboration foundation (roles + comments lite).

Milestones:

- M1: export/import contract versioning complete.
- M2: recovery/snapshot UX.
- M3: role-based access foundation.

Exit gates:

- Roundtrip reliability tests passing.
- Measurable reduction in consistency/support incidents.

### Q4: Platform Layer and Differentiation

Primary goals:

- Controlled extensibility (hooks/plugins-lite).
- Chronicle mode beta.
- Smart-assist opt-in release.

Milestones:

- M1: automation hook system.
- M2: chronicle walkthrough mode.
- M3: assistive suggestions for links/entities.

Exit gates:

- Measurable WCWS growth.
- Positive retention impact for advanced users.

---

## 18. RICE Prioritization (Initial Draft)

Scoring scale:

- Reach: estimated affected users per quarter (1-10).
- Impact: expected effect on North Star (0.25/0.5/1/2/3).
- Confidence: certainty in assumptions (0-100%).
- Effort: team-month estimate.

| Initiative | Reach | Impact | Confidence | Effort | RICE Score |
|---|---:|---:|---:|---:|---:|
| Wikilinks + backlinks + mentions | 9 | 3.0 | 80% | 2.0 | 10.8 |
| Search 2.0 | 9 | 2.0 | 75% | 2.0 | 6.75 |
| Custom entity types | 8 | 2.0 | 65% | 3.0 | 3.47 |
| Typed relationships | 7 | 2.0 | 70% | 2.5 | 3.92 |
| Reliability package | 6 | 2.0 | 85% | 2.0 | 5.1 |
| Map labels + paths | 7 | 1.5 | 70% | 2.0 | 3.68 |
| Timeline lanes + filters | 6 | 1.5 | 70% | 2.0 | 3.15 |

Prioritization implication:

- Execute in this order first:  
  1) Wikilinks stack  
  2) Search 2.0  
  3) Reliability package  
  4) Typed relationships  
  5) Custom entity types  
  6) Map/Timeline upgrades

Note:

- Re-score after every quarter with real telemetry.

---

## 19. Instrumentation and Analytics Plan

### 19.1 Event Taxonomy (MVP)

Core events:

- `entity_created`
- `entity_updated`
- `relation_created`
- `relation_deleted`
- `wikilink_created`
- `wikilink_autocomplete_used`
- `search_executed`
- `search_result_opened`
- `map_label_created`
- `map_path_created`
- `timeline_event_created`
- `export_started` / `export_succeeded` / `export_failed`
- `import_started` / `import_succeeded` / `import_failed`

Required properties:

- `projectId`
- `entityType`
- `branchId` (if applicable)
- `sessionId`
- `latencyMs` (for interactions where relevant)

### 19.2 Dashboard Requirements

Dashboard A: Activation and capture:

- First linked object conversion.
- Median time-to-first-link.

Dashboard B: Product depth:

- Ratio of linked vs unlinked entities.
- Map/timeline/wiki combined usage.

Dashboard C: Reliability and performance:

- Import/export success rates.
- Endpoint p95/p99 trends.

---

## 20. QA and Release Readiness Model

### 20.1 Test Layers

- Contract tests (`shared` schema compatibility).
- API smoke suite (existing smoke scripts + targeted expansions).
- UI smoke for core routes and critical workflows.
- Performance baselines for map/editor/search hotspots.

### 20.2 Release Gates

A release candidate is blocked if any of the following is true:

- Contract-breaking changes without migration path.
- Import/export roundtrip failures for baseline fixture projects.
- Core workflow regressions in smoke suite.
- Significant p95 degradation in search/map/timeline endpoints.

### 20.3 Fixture Project Pack

Maintain canonical fixtures:

- Small world (quick checks).
- Medium interconnected world.
- Large stress world (map + timeline + relations heavy).

Use fixtures for:

- Regression tests.
- Import/export compatibility checks.
- Search relevance benchmark checks.

---

## 21. Go-to-Market and Adoption Plan

### 21.1 Positioning Statements

- "A worldbuilding OS with writer-speed workflow."
- "Deep structure when you need it, zero friction when you write."
- "Own your world data: portable, reliable, future-proof."

### 21.2 Migration Strategy

- Build migration guides from:
  - markdown vault workflows
  - generic wiki exports
  - existing campaign notes workflows
- Provide migration checklist and diagnostics report after import.

### 21.3 Community and Retention Loop

- Publish monthly release notes with practical use cases.
- Showcase user-created templates and workflows.
- Use in-product nudges for underused high-value features.

---

## 22. Immediate Next Actions (Operational)

1. Freeze baseline KPIs and telemetry naming.
2. Confirm P0 scope and assign owners per initiative.
3. Create technical design docs for P0-1 and P0-2.
4. Prepare fixture project pack for reliability testing.
5. Schedule first quarterly planning review against WCWS.

Execution rhythm recommendation:

- Weekly product-health review.
- Biweekly roadmap adjustment based on telemetry.
- Quarterly re-prioritization (RICE refresh + risk update).

