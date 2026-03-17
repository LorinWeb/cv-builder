# Resume Studio Feature With Repo-Local SQLite Versioning

## Summary

Adopt a versioned local editor under `src/features/resume-studio`, backed by SQLite, while keeping `src/data/resume.private.json` as the render artifact.

Chosen details:

- Store the DB at `src/data/local/resume-studio.sqlite`
- Keep the feature under `src/features/resume-studio`
- Structure it similarly to `src/features/pdf-download`: thin root exports, shared `types.ts` and `constants.ts`, then focused subfolders for non-runtime concerns
- Use Base UI only inside this feature’s editor UI

## Feature Structure

Create `src/features/resume-studio` with this shape:

- `index.ts`
  Exports the public runtime surface used by the app shell, such as the launcher component and any small hooks/selectors.
- `runtime.ts`
  Client/runtime helpers that are safe in the browser, similar to `pdf-download/runtime.ts`.
- `types.ts`
  Shared feature contracts such as `ResumeStudioState`, `ResumeStudioDraft`, `ResumeVersionSummary`, and API payload/result types.
- `constants.ts`
  Feature-local route constants, default labels, and DB/file path constants that are safe to share.
- `ui/`
  Base UI + React Hook Form editor components only for this feature.
  Put the dialog/drawer, version list, and wizard steps here rather than under `src/components`.
- `server/`
  Dev-only Vite integration and HTTP handlers.
  Include `vite-plugin.ts`, route handlers, request/response mapping, and file-upload handling.
- `storage/`
  SQLite-backed persistence behind a driver-agnostic interface.
  Include `store.ts`, `sqlite-store.ts`, `migrations.ts`, and JSON sync helpers.

Keep the root exports narrow. Do not export storage or server internals from `index.ts`.

## Storage and Sync

Use these concrete locations:

- SQLite DB: `src/data/local/resume-studio.sqlite`
- Generated render file: `src/data/resume.private.json`
- Uploaded photos: `public/static/private/`

Behavior:

- The DB is the editor source of truth for current draft plus immutable versions.
- `src/data/resume.private.json` is rewritten from the current saved draft whenever the draft is saved or a version is restored.
- Versions live only in SQLite; JSON stays single-version and render-ready.
- Git-ignore:
  - `src/data/local/`
  - `src/data/resume.private.json`
  - `public/static/private/`

Because the DB lives under `src/`, explicitly configure Vite/editor watchers to ignore `src/data/local/*.sqlite*` so SQLite writes do not cause noisy reload behavior. Only JSON artifact writes should refresh the rendered resume.

## Versioning Model

- Keep one editable current draft in SQLite.
- `Save draft` updates the current draft and rewrites `src/data/resume.private.json`.
- `Create version` requires a user-provided name and snapshots the current saved draft into `resume_versions`.
- `Restore version` copies the snapshot back into the current draft and rewrites `src/data/resume.private.json`.
- On first run:
  - if `src/data/resume.private.json` exists, import it into the DB draft and create one initial version
  - otherwise initialize from starter data, create the DB, and write the first `src/data/resume.private.json`

## Test Plan

- Storage tests:
  - DB initializes correctly from existing `src/data/resume.private.json`
  - saving draft rewrites JSON
  - creating named versions stores immutable snapshots
  - restoring a version updates both DB draft and JSON
  - unsupported schema sections survive save/version/restore
- Vite/server tests:
  - `src/data/local/*.sqlite*` writes are ignored by HMR
  - JSON rewrites still update the page
  - photo uploads write to `public/static/private/`
- UI tests:
  - dev-only `Create your resume` / `Edit resume` launcher behavior
  - Base UI wizard saves draft changes
  - versions list shows saved versions and restore works
- Full verification:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
  - `npm run test:visual`

## Assumptions

- `src/features/resume-studio` is the final feature name.
- The feature-specific UI stays inside the feature folder, not under `src/components`.
- `node:sqlite` is still used behind the storage interface so swapping drivers later stays localized to `storage/`.
- If you approve this plan, the saved plan doc should be written under `docs/` before implementation begins.
