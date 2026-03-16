# Single-Step Resume Data Setup

## Summary

Standardize the repo on one consumer workflow: create `src/data/resume.private.json` by copying `src/data/resume.sample.json`, then edit that file. The app should automatically prefer the private file when it exists and otherwise fall back to the sample.

This removes `RESUME_DATA_PATH` from the consumer story entirely and deletes the related path-selection/env plumbing. The README `Resume Data Setup` section becomes a single instruction instead of multiple configuration options.

## Implementation Changes

- Replace env-driven resume-data selection with fixed-path selection:
  - `src/data/resume.private.json` is the only private override path.
  - `src/data/resume.sample.json` remains the fallback sample.
  - If the private file exists, dev/build use it.
  - If the private file does not exist, dev/build use the sample.
  - If the private file exists but is invalid, fail on it rather than silently falling back.

- Remove consumer-facing path configurability from the codebase:
  - delete `RESUME_DATA_PATH` support from the loader/build helpers
  - remove `.env.local`-based resume-data switching from README and code
  - remove the env-var constant and any helper logic whose only job is choosing an arbitrary JSON path

- Move the fixed-path resolution into the data-loading layer rather than leaving it in the PDF feature:
  - `src/data/load-resume-data.ts` should own “private if present, else sample”
  - `vite.config.ts` and the PDF plugin should import that data-domain resolver instead of depending on path-selection logic under `src/features/pdf-download/build`

- Make dev behavior match the one-step setup cleanly:
  - watch both fixed candidate files in dev so creating or editing `src/data/resume.private.json` is picked up without adding config
  - keep `.gitignore` for `src/data/*.private.json`

- Simplify README `Resume Data Setup` to one action:
  - tell consumers to copy `src/data/resume.sample.json` to `src/data/resume.private.json` and edit it
  - state that the app automatically switches to the private file when present
  - remove all mention of `.env.local` and `RESUME_DATA_PATH`

## Test Plan

- Update loader tests to cover fixed-path precedence instead of env precedence:
  - sample loads when private file is absent
  - private file wins when present
  - invalid private file fails clearly
  - missing sample fails clearly

- Make test runs deterministic without using `RESUME_DATA_PATH`:
  - test-mode loads should use the sample path by default so local private files do not affect snapshots or metadata tests
  - Playwright/web-server test setup should use that deterministic sample-mode path rather than env overrides

- Simplify PDF/build smoke tests to stop pointing at custom fixture paths through env vars:
  - use the normal sample data where possible
  - remove any fixture/setup that only existed to exercise arbitrary resume-data-path selection

- Run `npm run lint`, `npm run typecheck`, `npm run build`, and the full Playwright suite after the refactor.

## Assumptions

- The chosen single-step workflow is: copy `src/data/resume.sample.json` to `src/data/resume.private.json` and edit it.
- Internal test behavior may still force sample data in test mode for determinism, but that is not exposed as consumer configuration.
- No new helper script like `npm run init:resume` is added; the simplification comes from fixed conventions, not more tooling.
