## Baseline Freeze Notes (2026-05-14)

- `npm run build` -> success (exit code 0), output saved to `baseline-build.txt`.
- `npm run doctor` -> success (exit code 0), output saved to `baseline-doctor.txt`.
- `npm run smoke:up` -> failed (exit code 1), output saved to `baseline-smoke.txt`.
- `npm run smoke:frontend` -> failed (exit code 1), output saved to `baseline-smoke-frontend.txt`.

### Failure notes

- `smoke:up` failed on backend startup because `better-sqlite3` binary was built for another Node module version (`NODE_MODULE_VERSION 145` vs required `127`).
- `smoke:frontend` failed with `fetch failed` (frontend smoke target unavailable in current baseline environment).
