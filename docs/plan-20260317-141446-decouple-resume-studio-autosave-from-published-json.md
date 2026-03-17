# Decouple Resume Studio Autosave From Published JSON

## Summary

Current repo behavior:
- Live preview is already runtime-driven through `publishResumeStudioPreview(...)`.
- The typing disruption comes from `saveDraft(...)` also rewriting `src/data/resume.private.json`, which is watched by the Vite `resume-data` plugin and hot-updates the app.

Chosen direction:
- `Autosave to SQLite + instant preview`
- `Manual publish` to `src/data/resume.private.json`
- Separate `active editing version` from `published version`

## Key Changes

### Persistence and publish model
- `saveDraft` updates only the active SQLite version; it must no longer write `src/data/resume.private.json`.
- Add a separate published-version concept in Resume Studio storage/state.
- Publishing writes the selected active version to `src/data/resume.private.json` and marks that version as published.
- Selecting versions must no longer rewrite the JSON file.
- Initialization/import keeps the current first-run behavior, but the imported/created initial version becomes both active and published so the app still has a valid starting JSON artifact.

### Resume Studio UX
- Keep autosave, but relabel its status as local draft persistence, not published state.
- Add an explicit `Publish` action for the active version in the Resume Studio footer.
- Show clear published/editing state in Versions:
  - one badge for `Published`
  - one badge for `Editing` when different
  - one local-dirty indicator when the active version has unpublished changes
- Deletion protection must move from “active version” to “published version”.
- While Resume Studio is open, both the iframe preview and the underlying app page continue to reflect the live draft.
- When Resume Studio closes without publishing, the underlying app must revert to the last published data.

### Runtime and app behavior
- Extend Resume Studio client state with published metadata and unpublished-change state.
- On close, if the active draft is unpublished, republish the last published runtime data into the page render so the non-studio app snaps back to the deployed state without requiring a reload.
- Keep Vite watching `src/data/resume.private.json` for real publish events and normal dev/build behavior; the mitigation is to stop touching that file during autosave, not to disable the watch path.

## Public Interfaces / Types

- Extend `ResumeStudioState` with:
  - `publishedVersionId`
  - `publishedVersionName`
  - `isActiveVersionPublished`
  - `hasUnpublishedChanges`
- Add a publish API:
  - `POST /__resume-studio/publish`
- Store layer gains a publish operation and separate published-version tracking.
- No resume JSON schema changes.

## Test Plan

- Storage tests:
  - autosaving a draft does not rewrite `src/data/resume.private.json`
  - publishing rewrites `src/data/resume.private.json`
  - selecting another version does not rewrite `src/data/resume.private.json`
  - published version is protected from deletion
  - publishing a different version transfers the protection to the new published version
- UI tests:
  - typing updates the iframe preview instantly without dev-app reset behavior
  - autosave status reports local save, not publish
  - `Publish` updates the main app state persistently
  - closing without publish reverts the main page to the published resume
  - versions view shows `Published` and `Editing` correctly
- Full verification:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
  - `npm run test:visual`

## Assumptions

- `src/data/resume.private.json` remains the only published/build artifact.
- SQLite remains the source of truth for in-progress editing.
- v1 publish action applies only to the currently active version; to publish another version, the user opens it and then publishes it.
- No implicit publish on close, autosave, or version switch.
- The underlying page may show draft state only while Resume Studio is open; once closed, it must reflect published state again.
