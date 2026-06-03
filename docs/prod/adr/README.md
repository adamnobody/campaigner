# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for Campaigner.

An ADR captures a single significant technical decision: the context,
the options considered, the choice, and its consequences. ADRs are
**append-only and immutable**. If a decision is reversed or evolved,
write a new ADR that supersedes the old one — do not edit history.

## Index

| #    | Title                                  | Status   | Date       |
|------|----------------------------------------|----------|------------|
| 0001 | Canvas rendering technology            | Accepted | 2026-05-22 |
| 0002 | MapPage migration strategy             | Accepted | 2026-05-24 |
| 0003 | Canvas data model                      | Accepted | 2026-05-24 |
| 0004 | Canvas scene types and scene_container | Proposed | 2026-06-03 |

## Status values

- **Proposed** — under discussion, not yet committed to.
- **Accepted** — decision is in effect.
- **Superseded by ADR-XXXX** — replaced by a newer decision.
- **Deprecated** — no longer relevant, but kept for historical context.
- **Rejected** — considered and explicitly not adopted.

## When to write an ADR

Write an ADR when a decision:
- Is hard or expensive to reverse (technology choice, data model, protocol).
- Has multiple reasonable alternatives.
- Will be questioned later ("why did we do it this way?").
- Crosses module boundaries or affects the whole project.

Do **not** write an ADR for:
- Local refactorings or implementation details.
- Library version bumps.
- Code style preferences (those go to a style guide).

## Numbering

Sequential, zero-padded to four digits: `0001`, `0002`, ...
Filename: `NNNN-kebab-case-title.md` (or linked from
`docs/adr/ADR-NNNN-*.md` when introduced via documentation PR).

**ADR-0004 file:** [`docs/adr/ADR-0004-canvas-scene-types-and-scene-container.md`](../../adr/ADR-0004-canvas-scene-types-and-scene-container.md)

## Process

1. Copy `template.md` to `NNNN-your-title.md`.
2. Fill it in with status **Proposed**.
3. Discuss / iterate.
4. Change status to **Accepted** (or **Rejected**) and commit.
5. Update the index in this README.
6. If superseded later — set status to **Superseded by ADR-XXXX**,
   add a link in both directions, but never delete content.