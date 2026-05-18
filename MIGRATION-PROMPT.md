# Campaigner Rust/Tauri Migration Agent Rules

This document contains the permanent rules for all Campaigner migration PRs.

Every task-specific prompt may reference this file instead of repeating these rules.

## Core Goal

The migration goal is not to partially rewrite the app.

The goal is to end with a fully working Rust + Tauri application with no functional regression compared to the current application.

Every PR must keep the application in a working state.

A migration PR is only successful if:

- the migrated scope works end-to-end;
- existing user flows are not broken;
- frontend contracts are preserved or compatibility adapters are provided;
- data is not lost or corrupted;
- build/test/checks are executed and reported;
- unrelated domains are not touched.

## Non-Negotiable No-Regression Rule

Do not break existing UX, UI flows, data model expectations, API contracts, or storage behavior.

If a flow exists in the UI, it must remain working.

If a flow is not fully migrated in the current PR:

- keep it on the legacy path;
- keep the old API/backend fallback alive;
- do not connect it to a half-finished Rust/Tauri implementation;
- do not return fake empty data;
- do not leave `TODO`, `not implemented`, or throwing stubs in reachable UI paths.

Working application is more important than architectural purity.

## Standard Workflow For Every Migration PR

### 1. Check Initial State

Before changing anything, run:

```bash
git status --short
```

Expected: clean worktree.

If the worktree is dirty:

- stop;
- report the unexpected changes;
- do not continue unless explicitly instructed.

### 2. Study Source Of Truth

Before implementing, inspect the existing backend/frontend/shared implementation for the target domain.

Find:

- backend routes/controllers/services;
- database schema and migrations;
- shared schemas/types;
- frontend API/service layer;
- stores/hooks;
- UI pages/components that call the domain;
- generated Tauri bindings if already present;
- existing Rust/Tauri models/repositories/commands.

Do not invent a new contract.

Match existing behavior.

### 3. Define The Current Contract

For the target domain, identify:

- public frontend functions;
- backend endpoints/functions;
- DTOs;
- request inputs;
- response outputs;
- error behavior;
- CRUD operations;
- nested flows;
- project/branch scoping;
- soft delete vs hard delete;
- ordering/sorting semantics;
- duplicate handling;
- validation rules;
- timestamps;
- JSON/metadata behavior;
- links to other domains;
- side effects.

Implementation must preserve this behavior unless the task explicitly says otherwise.

### 4. Define PR Scope

Each PR must have a clear scope.

**Allowed:**

- only files needed for the current domain/slice;
- Rust models;
- repositories;
- services;
- Tauri commands;
- SQLite migrations;
- Specta/codegen;
- frontend adapter/service integration;
- tests;
- minimal UI wiring only if necessary for the existing flow.

**Forbidden by default:**

- unrelated domains;
- broad UI rewrites;
- massive formatting changes;
- backend/shared/electron changes unless explicitly required;
- destructive migrations;
- architectural rewrites;
- build artifacts;
- switching unfinished flows to Rust/Tauri;
- moving to the next domain.

### 5. Compatibility Strategy

Prefer preserving the existing public TypeScript/frontend API.

If Rust/Tauri commands return a different shape, add a compatibility adapter.

Do not rewrite UI components if the service/transport layer can preserve the old interface.

If only part of a domain is migrated:

- migrated methods can use Rust/Tauri;
- non-migrated methods must keep legacy fallback;
- all reachable UI paths must remain functional.

## Rust/Tauri Rules

### Models

Rust API-facing models must:

- use `serde::Serialize`;
- use `serde::Deserialize` where needed;
- use `specta::Type` if the project exports bindings via Specta;
- preserve frontend naming conventions, usually camelCase via `serde(rename_all = "camelCase")`;
- match existing DTO optionality;
- avoid adding speculative fields.

Internal DB structs may use snake_case.

### Repositories

Repositories must:

- use the existing DB access style of the project;
- use rusqlite if that is the established storage layer;
- use prepared statements;
- parameterize writes;
- return the project’s standard `Result`/`AppError`;
- avoid panics;
- use transactions for multi-step writes;
- match backend semantics exactly.

Do not add ORM/sqlx/diesel unless the project already uses them and the task explicitly allows it.

### Services

Use a service layer when behavior is more than direct CRUD.

Services may handle:

- validation;
- normalization;
- branch/project scope checks;
- reference checks;
- nested writes;
- ordering;
- relation directionality;
- derived metrics;
- backend-compatible error mapping.

Do not bury complex business logic directly in Tauri commands.

### Commands

Tauri commands must:

- be registered in the invoke handler;
- return serializable results/errors;
- not panic on user/data errors;
- preserve frontend contract through adapter or direct matching;
- be exported through Specta if the project uses Specta/codegen.

Do not add commands for internal foundations unless the current PR actually exposes them to frontend.

### Errors

Runtime/user/data errors must not crash the app.

Avoid `unwrap`/`expect` in runtime paths.

Errors should be:

- controlled;
- serializable;
- understandable by frontend;
- compatible with existing UI error handling.

## SQLite Migration Rules

For every DB migration:

- create a new sequential migration file;
- do not edit old migrations;
- do not do destructive schema changes unless explicitly required and safe;
- match backend schema/semantics;
- add indexes for common lookups;
- preserve project/branch scoping;
- preserve soft-delete semantics if backend uses them;
- preserve timestamps behavior;
- preserve ordering fields if backend uses them;
- add foreign keys only if compatible with existing schema/data;
- store JSON/metadata in a backend-compatible way.

Migration file names should follow the project’s existing convention.

If existing migrations are numbered, use the next number.

## Frontend Integration Rules

Prefer changing:

- API adapter;
- service layer;
- transport layer.

Avoid changing:

- pages;
- components;
- stores;

unless absolutely necessary for wiring.

Frontend requirements:

- public API shape should remain stable;
- loading/error states must keep working;
- no white screen;
- no new console runtime errors;
- no fake empty results as substitute for real behavior;
- non-migrated methods must stay on fallback;
- migrated methods must work end-to-end.

## Codegen/Specta Rules

If models/commands exported to frontend changed:

Run the project’s codegen command, usually:

```bash
npm run tauri:codegen
```

If the project convention requires stable double generation, run it twice:

```bash
npm run tauri:codegen
npm run tauri:codegen
```

Then inspect:

```bash
git diff -- frontend/src/types/generated/bindings.ts
```

Rules:

- do not edit generated bindings manually;
- generated diff must correspond to the current PR scope;
- investigate unrelated generated diffs;
- commit generated bindings only if the project tracks them.

## Testing Rules

Add tests for the migrated repository/service behavior.

Minimum test categories when applicable:

- create persists;
- list returns created data;
- get returns details;
- update changes intended fields only;
- delete matches backend behavior;
- project/branch scoping;
- ordering;
- duplicate handling;
- not found errors;
- invalid input errors;
- nested entity behavior;
- relation behavior;
- persistence semantics.

Do not invent behavior.

Tests must match existing backend/source-of-truth behavior.

## Required Checks Before Final Report

Run applicable checks.

**Frontend:**

```bash
npm run build
```

**Codegen, if relevant:**

```bash
npm run tauri:codegen
```

**Tauri production build, if reasonable:**

```bash
npm run tauri:build
```

**Rust:**

```bash
cd src-tauri && cargo fmt --check
cd src-tauri && cargo clippy -- -D warnings
cd src-tauri && cargo test
```

**Optional doctor:**

```bash
npm run doctor
```

If a command does not exist:

- report that it does not exist.

If a command fails because of an existing known issue:

- report evidence that it was not introduced by the current PR.

If a command fails because of current changes:

- fix before finalizing.

## Manual Smoke Testing

For user-facing migration PRs, manually verify the relevant UI flow.

At minimum:

- app starts in Tauri dev;
- main UI opens;
- no white screen;
- no new console runtime errors;
- target screen opens;
- list/load works;
- create works if applicable;
- details/open works if applicable;
- update works if applicable;
- delete/archive works if applicable;
- data persists after restart if applicable;
- nested flows work or remain on fallback.

If a flow is not migrated:

- verify it still works through fallback;
- report it as fallback.

## Git Hygiene

Before commit:

```bash
git status --short
git diff --stat
git diff
```

Check:

- no unrelated changes;
- no mass formatting-only changes;
- no accidental backend/shared/electron edits;
- no build artifacts;
- no node_modules;
- no target;
- no dist;
- no generated files unless expected;
- migration number is correct;
- old migrations were not edited;
- frontend changes are minimal and scoped;
- UI was not rewritten unnecessarily.

## Commit Rules

Use a precise commit message.

Examples:

```text
feat(tauri): port factions through Rust transport
chore(tauri): add tag associations foundation
docs: update migration notes
```

If the PR becomes foundation-only instead of user-facing:

- only do this if full migration is objectively too large;
- keep UI on legacy fallback;
- document why;
- document follow-ups.

## Final Report Format

After commit, report:

- commit SHA;
- `git log -1 --stat`;
- `git status --short`;
- migrations added;
- Rust models added/changed;
- repositories added/changed;
- services added/changed;
- Tauri commands added/changed;
- Specta/codegen/bindings changes;
- frontend adapter/service changes;
- which flows now use Rust/Tauri;
- which flows remain on legacy fallback;
- tests added and what they cover;
- check results:
  - `npm run build`;
  - `npm run tauri:codegen`, if run;
  - `npm run tauri:build`, if run;
  - `cargo fmt --check`;
  - `cargo clippy -- -D warnings`;
  - `cargo test`;
  - `npm run doctor`, if run;
- manual smoke checks performed;
- confirmation of no functional regression;
- known follow-ups.

## Absolute Restrictions

Unless the task-specific prompt explicitly says otherwise:

- do not break UI;
- do not change UX;
- do not change frontend contract without compatibility adapter;
- do not leave half-migrated broken flows;
- do not remove legacy fallback before Rust/Tauri covers the same scenario;
- do not migrate unrelated domains;
- do not do broad refactors;
- do not do destructive migrations;
- do not add ORM/sqlx/diesel;
- do not use `unwrap`/`expect` in runtime paths;
- do not commit generated/build garbage;
- do not move to the next domain in the same PR.
