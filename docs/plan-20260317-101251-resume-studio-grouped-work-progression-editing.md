# Resume Studio Grouped Work Progression Editing

## Summary

Add first-class editing support for grouped work progression entries in Resume Studio instead of requiring users to flatten them into standalone roles.

The storage model already supports grouped work data through `ResumeWorkGroup`, and versioning/autosave already work at the full-resume level. The missing piece is the draft model and experience editor UI, which currently only understand flat `ResumeWorkEntry[]` and therefore lock the step when any `progression` group exists.

## Goals

- Allow grouped company progression to be edited in Resume Studio.
- Preserve the current live preview and autosave flow.
- Keep flat roles fully supported.
- Avoid destructive conversions between grouped and flat work data.

## Non-Goals

- No schema migration for stored resume JSON.
- No drag-and-drop reordering in this pass.
- No new public resume layout changes outside whatever the edited data already renders.

## Implementation Changes

### 1. Replace the flat work draft model with an item union

Update `src/features/resume-studio/types.ts` so the draft matches the source model more closely:

- Keep a role draft for flat roles.
- Add a grouped work draft with optional group-level `company`, optional `website`, print config, and nested role drafts.
- Change `ResumeStudioDraft.work` from `ResumeStudioWorkDraft[]` to a union array such as:
  - `ResumeStudioStandaloneWorkDraft`
  - `ResumeStudioProgressionGroupDraft`

This removes the need for the editor to pretend grouped data does not exist.

### 2. Make draft conversion fully round-trip grouped work data

Update `src/features/resume-studio/draft.ts`:

- Replace `isResumeStudioWorkEditable()` gating in `toResumeStudioDraft()`.
- Add converters for:
  - source flat role -> standalone work draft
  - source progression group -> grouped work draft
  - grouped/standalone drafts -> source work items
- Keep the rest of the draft mapping unchanged.

Result:

- opening Resume Studio loads grouped work into the form instead of replacing `work` with `[]`
- autosave writes grouped work back without flattening
- switching versions preserves grouped and flat work items exactly

### 3. Remove the progression incompatibility lock

Update `src/features/resume-studio/compatibility.ts` and related state wiring:

- remove the `unsupported-work-progression` warning
- remove `isResumeStudioWorkEditable()`
- stop marking the wizard incompatible solely because grouped work exists

This changes grouped work from an unsupported edge case to a supported editor shape.

### 4. Rebuild the Experience step around work items and nested roles

Refactor `src/features/resume-studio/ui/steps/ResumeStudioExperienceStep.tsx` so it edits both:

- standalone role items
- grouped company progression items with nested roles

Recommended UI structure:

- top-level actions:
  - `Add role`
  - `Add company progression`
- standalone role card:
  - current fields stay mostly unchanged
- progression group card:
  - group-level fields:
    - company
    - website
    - print config if already exposed elsewhere
  - nested role list:
    - role
    - start date
    - end date
    - contract checkbox
    - summary
    - highlights
  - nested actions:
    - `Add role to progression`
    - remove nested role
  - top-right remove control for deleting the whole group

Implementation detail:

- use one `useFieldArray()` for top-level work items
- split grouped and standalone card rendering into small subcomponents under `src/features/resume-studio/ui/steps/`
- inside a progression card, use a nested `useFieldArray()` for `work.{index}.progression`

### 5. Keep autosave and instant preview working with the new shape

Update any work-draft assumptions in `src/features/resume-studio/ui/ResumeStudioDialog.tsx`:

- keep using the existing full-draft autosave flow
- ensure draft merge logic handles the updated `work` union shape without flattening
- keep preview publishing driven by `applyResumeStudioDraft()`

No new save mechanism is needed. The current autosave/version flow already operates on full `ResumeSourceData`.

### 6. Preserve rendering behavior

No resume presentation rewrite is required. `src/components/ItemRenderers/WorkExperienceItem.tsx` already supports:

- `ResumeWorkEntry`
- `ResumeWorkGroup`

The editor changes should feed that existing renderer through the current live preview and app render path.

## File-Level Plan

Primary files to change:

- `src/features/resume-studio/types.ts`
- `src/features/resume-studio/draft.ts`
- `src/features/resume-studio/compatibility.ts`
- `src/features/resume-studio/storage/store.ts`
- `src/features/resume-studio/ui/ResumeStudioEditTab.tsx`
- `src/features/resume-studio/ui/ResumeStudioDialog.tsx`
- `src/features/resume-studio/ui/steps/ResumeStudioExperienceStep.tsx`

Likely new supporting files:

- `src/features/resume-studio/ui/steps/ResumeStudioWorkItemCard.tsx`
- `src/features/resume-studio/ui/steps/ResumeStudioProgressionGroupCard.tsx`
- `src/features/resume-studio/ui/steps/ResumeStudioWorkRoleFields.tsx`

Test files to update:

- `tests/resume-studio.ui.spec.ts`
- `tests/resume-studio.store.spec.ts`
- optionally `tests/resume-studio.server.spec.ts` if any compatibility expectations need updating

## UX Details

- Users should be able to mix flat roles and grouped progression blocks in one resume.
- Grouped entries should not be auto-flattened or transformed behind the scenes.
- If a progression group has no explicit `company`, the editor should still display and save it, but the UI should encourage filling it in.
- A progression group should require at least one nested role before save; validation errors should appear inline.

## Validation

Add or update validation for:

- progression groups must contain at least one role
- nested roles keep the existing required fields:
  - position
  - start date
  - summary
  - company may remain optional at the nested level when the group company is present

Validation should happen before saving through the existing API/store path so autosave errors surface the same way as other editor errors.

## Test Plan

### Store tests

- importing an existing private resume with grouped work keeps the grouped structure intact
- saving a grouped active version rewrites `src/data/resume.private.json` without flattening
- creating/selecting/deleting versions preserves grouped work data independently per version

### UI tests

- Resume Studio opens with grouped work and the Experience step is editable
- users can edit a grouped company and nested roles and see the preview update immediately
- users can add a new progression group
- users can add/remove nested roles inside a progression group
- users can mix grouped entries and standalone roles
- autosave persists grouped edits across reopening the dialog and across version switches

### Full verification

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test:visual`

## Assumptions

- `ResumeWorkGroup` remains the canonical grouped-career model.
- The existing resume renderer remains the source of truth for how grouped work appears in preview and on the final page.
- Reordering work items or nested progression roles can be deferred until after grouped editing lands.
