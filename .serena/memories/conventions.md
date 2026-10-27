# Conventions
- Keep diffs minimal and external API contracts stable unless explicitly requested.
- Rust DTOs are authoritative; do not hand-duplicate generated bindings. Run codegen after DTO/command changes.
- React pages/components/stores must call domain modules under `frontend/src/api/`, never invoke Tauri directly.
- Branch-aware domains use existing Rust branch-overlay services.
- New dependencies require one-sentence justification.
- Canvas scene/store/persistence types remain renderer-agnostic; Pixi types stay behind the thin canvas bridge.
- Architectural changes require reading relevant ADR/SPEC; uncovered decisions stop in `DECISION NEEDED` format.