# PLAN_EXECUTION.md - Operational Delivery Plan

## 1. Execution Model

Planning horizon:

- 2-week sprints.
- 4 initial sprints (8 weeks) for P0 execution.
- Quarterly checkpoints aligned with `PLAN.md`.

Work item hierarchy:

- **Epic** -> **Feature** -> **Task** -> **Subtask**.

Status model:

- `Backlog`, `Ready`, `In Progress`, `Review`, `QA`, `Done`, `Blocked`.

Priority model:

- `P0` critical path.
- `P1` high ROI.
- `P2` differentiation.

---

## 2. Team Roles and Ownership Template

Suggested ownership fields for each task:

- `Product Owner` - scope and acceptance.
- `Tech Lead` - architecture and sequencing.
- `Backend Owner` - API/data contracts.
- `Frontend Owner` - UX and interaction quality.
- `QA Owner` - validation matrix and regression checks.
- `Data/Perf Owner` - metrics and performance gates.

Use this owner format in tracker tickets:

- `Owner: <name>`
- `Approver: <name>`
- `Consulted: <name(s)>`

---

## 3. Sprint Plan (First 8 Weeks)

## Sprint 1 (Weeks 1-2): Foundations and Instrumentation

### Epic E1: Telemetry and Baseline

Feature: Metrics foundation and observability.

Tasks:

1. Define event taxonomy and naming conventions.
   - Owner: Data/Perf Owner
   - Estimate: 2d
   - Dependency: none
   - DoD:
     - Event dictionary documented.
     - Required event properties agreed.
     - Review approved by Product + Tech Lead.

2. Implement core event emitters in frontend for search/link/entity events.
   - Owner: Frontend Owner
   - Estimate: 3d
   - Dependency: task 1
   - DoD:
     - Events fire for core flows.
     - No duplicate emission in normal flow.
     - Smoke scenario validated.

3. Add backend performance dashboard endpoints/aggregation checks.
   - Owner: Backend Owner
   - Estimate: 2d
   - Dependency: none
   - DoD:
     - p95/p99 values exposed for targeted endpoints.
     - Output format documented.

### Epic E2: P0 Technical Discovery

Feature: Design freeze for P0 initiatives.

Tasks:

4. Write technical design doc for P0-1 (Wikilinks stack).
   - Owner: Tech Lead
   - Estimate: 2d
   - Dependency: none
   - DoD:
     - Data model impacts defined.
     - API contracts drafted.
     - UX interaction states captured.

5. Write technical design doc for P0-2 (Custom entity types).
   - Owner: Tech Lead
   - Estimate: 2d
   - Dependency: none
   - DoD:
     - Shared schema changes outlined.
     - Migration approach defined.
     - Validation strategy documented.

---

## Sprint 2 (Weeks 3-4): P0-1 Wikilinks MVP

### Epic E3: Wikilinks Core

Feature: `[[wikilinks]]` creation and navigation baseline.

Tasks:

1. Add link autocomplete API and query optimization.
   - Owner: Backend Owner
   - Estimate: 3d
   - Dependency: Sprint 1 design docs
   - DoD:
     - Endpoint returns ranked suggestions.
     - Response under agreed latency target on medium fixture.

2. Implement editor autocomplete interaction for `[[...]]`.
   - Owner: Frontend Owner
   - Estimate: 3d
   - Dependency: task 1
   - DoD:
     - Suggestions show reliably.
     - Keyboard and mouse flows supported.
     - Selection inserts canonical link syntax.

3. Build backlinks panel in note/entity context.
   - Owner: Frontend Owner
   - Estimate: 3d
   - Dependency: task 1
   - DoD:
     - Backlinks list is accurate and refreshes after save.
     - Empty/loading/error states handled.

4. Add unresolved-link handling and placeholder creation flow.
   - Owner: Backend + Frontend
   - Estimate: 4d
   - Dependency: tasks 1-2
   - DoD:
     - User can create placeholder entity from unresolved link.
     - Placeholder is indexed and linkable.

5. Regression and smoke coverage update for wikilinks.
   - Owner: QA Owner
   - Estimate: 2d
   - Dependency: tasks 1-4
   - DoD:
     - New scenario in smoke suite.
     - No critical regression in existing flows.

---

## Sprint 3 (Weeks 5-6): P0-4 Search 2.0 + P0-5 Reliability Start

### Epic E4: Search 2.0

Feature: Better ranking + filters + saved views.

Tasks:

1. Implement ranking update (exact/title/alias weighted logic).
   - Owner: Backend Owner
   - Estimate: 3d
   - Dependency: telemetry baseline
   - DoD:
     - Benchmark set quality improved.
     - Query latency remains within target.

2. Add search facets (type/tag/date/relation flag).
   - Owner: Backend Owner
   - Estimate: 3d
   - Dependency: task 1
   - DoD:
     - Filter combinations return correct results.
     - Pagination behavior consistent.

3. Add frontend search filter UI and saved views.
   - Owner: Frontend Owner
   - Estimate: 3d
   - Dependency: task 2
   - DoD:
     - Filters are discoverable and keyboard-friendly.
     - Saved views are project-scoped and reusable.

### Epic E5: Reliability Package (Part 1)

Feature: Export/import contract hardening.

Tasks:

4. Introduce explicit export schema version checks.
   - Owner: Backend Owner
   - Estimate: 2d
   - Dependency: none
   - DoD:
     - Version surfaced in exported payload metadata.
     - Import validates and reports unsupported versions.

5. Build fixture project pack (small/medium/large).
   - Owner: QA Owner
   - Estimate: 2d
   - Dependency: none
   - DoD:
     - Fixtures available for roundtrip tests.
     - Fixture usage documented.

---

## Sprint 4 (Weeks 7-8): P0-2 and P0-3 MVP

### Epic E6: Custom Entity Types (MVP)

Feature: User-defined entity types and fields.

Tasks:

1. Extend shared schemas for dynamic entity definitions.
   - Owner: Tech Lead + Backend Owner
   - Estimate: 3d
   - Dependency: design doc P0-2
   - DoD:
     - New contracts in `shared`.
     - Backward compatibility strategy documented.

2. Add backend CRUD for type definitions and validation.
   - Owner: Backend Owner
   - Estimate: 3d
   - Dependency: task 1
   - DoD:
     - Type and field definitions persisted.
     - Runtime validation enforces field rules.

3. Build frontend type builder UI and entity form renderer.
   - Owner: Frontend Owner
   - Estimate: 4d
   - Dependency: task 2
   - DoD:
     - User can create a type with core field kinds.
     - Entity create/edit form renders from schema.

### Epic E7: Typed Relationships (MVP)

Feature: Project-level relation types and filtered exploration.

Tasks:

4. Add relation-type registry and constraints model.
   - Owner: Backend Owner
   - Estimate: 3d
   - Dependency: P0-2 schema work
   - DoD:
     - Relation types support direction and allowed source/target.
     - Validation enforced on relation create/update.

5. Add relation-type management UI and filtered relation explorer.
   - Owner: Frontend Owner
   - Estimate: 4d
   - Dependency: task 4
   - DoD:
     - Relation type CRUD in UI.
     - Explorer supports relation-type filters.

6. End-to-end QA pass for P0 package.
   - Owner: QA Owner
   - Estimate: 3d
   - Dependency: all Sprint 4 tasks
   - DoD:
     - Roundtrip tests pass on all fixtures.
     - Smoke suite green.
     - Release gate checklist complete.

---

## 4. Tracker-Ready Epic Breakdown

## Epic E1: Telemetry and Baseline

Definition of Done:

- Event taxonomy finalized.
- Dashboards created for activation/depth/reliability/perf.
- Baseline captured and shared.

## Epic E3: Wikilinks Stack

Definition of Done:

- Autocomplete, backlinks, unresolved mention flow live.
- Searchability and navigation validated.
- No critical editor regressions.

## Epic E4: Search 2.0

Definition of Done:

- Improved ranking benchmark.
- Filters + saved views shipped.
- Performance and UX gates passed.

## Epic E5: Reliability Package

Definition of Done:

- Versioned export/import contract.
- Roundtrip fixtures pass.
- User-facing failure diagnostics improved.

## Epic E6: Custom Entity Types

Definition of Done:

- Type and field definitions manageable in UI.
- Entities rendered and validated from type schema.
- Export/import compatibility verified.

## Epic E7: Typed Relationships

Definition of Done:

- Relation types configurable and enforceable.
- Filterable relation explorer shipped.
- Data integrity preserved on edit/delete flows.

---

## 5. Dependency Map (Critical Path)

Critical path order:

1. Event taxonomy and telemetry baseline (E1).
2. P0-1 design freeze and implementation (E3).
3. Search quality and filter layer (E4).
4. Reliability contract versioning + fixtures (E5).
5. Dynamic schema foundation (E6).
6. Typed relation registry and UX (E7).

Parallelization opportunities:

- Reliability fixtures can start in parallel with Search 2.0.
- UI preparations for type builder can begin before final backend endpoints if mock contracts are stable.

---

## 6. Definition of Ready (DoR)

A task is `Ready` only if:

- User story and acceptance criteria are explicit.
- API/schema impacts are known.
- Dependencies and owner assigned.
- Test expectations are defined.
- Risk level documented.

---

## 7. Definition of Done (Global)

A task is `Done` only if:

- Implementation matches acceptance criteria.
- Relevant smoke/build checks pass.
- No new critical lint/type errors.
- Telemetry added where needed.
- Documentation and release notes updated (if user-facing behavior changed).

---

## 8. Risk and Blocker Protocol

Blocker levels:

- `B1`: local issue, can be solved within sprint.
- `B2`: cross-team dependency, may shift scope.
- `B3`: architectural or reliability risk, requires leadership decision.

Escalation SLA:

- B1: same day resolution attempt.
- B2: triage within 24h.
- B3: decision meeting within 48h.

If blocked:

1. Mark ticket `Blocked`.
2. Add blocker note (cause, impact, proposed options).
3. Assign escalation owner.

---

## 9. QA Matrix Template

For each shipped feature, validate:

- Happy path.
- Edge cases.
- Error handling.
- Data integrity after edit/rename/delete.
- Import/export compatibility.
- Performance on medium and large fixtures.

---

## 10. Release Checklist Template

Pre-release:

- P0 acceptance criteria met.
- Smoke scenarios green.
- Fixture roundtrip tests green.
- Performance gates within thresholds.
- Rollback plan documented.

Release:

- Feature flags configured.
- Monitoring dashboard active.
- Support notes prepared.

Post-release (48-72h):

- KPI deltas reviewed.
- Error and latency spikes checked.
- Top user feedback themes captured.

---

## 11. First Planning Board (Suggested Ticket Seeds)

Create initial tickets:

- `E1-01` Event taxonomy spec.
- `E1-02` Frontend event instrumentation.
- `E1-03` Backend perf metric validation.
- `E3-01` Link autocomplete API.
- `E3-02` Editor wikilink UX.
- `E3-03` Backlinks panel.
- `E3-04` Unresolved mention flow.
- `E4-01` Search ranking update.
- `E4-02` Search facets API.
- `E4-03` Search filter UI + saved views.
- `E5-01` Export schema versioning.
- `E5-02` Fixture pack and roundtrip suite.
- `E6-01` Shared schema for custom entity types.
- `E6-02` Backend type CRUD + validation.
- `E6-03` Frontend type builder and renderer.
- `E7-01` Relation type registry.
- `E7-02` Relation explorer filter UI.

---

## 12. Cadence and Governance

Weekly:

- Product health review (metrics + blockers + risk).

Biweekly (sprint rituals):

- Planning.
- Mid-sprint risk check.
- Review/demo.
- Retrospective.

Monthly:

- KPI deep-dive and roadmap correction.

Quarterly:

- RICE re-scoring and strategic reprioritization.

