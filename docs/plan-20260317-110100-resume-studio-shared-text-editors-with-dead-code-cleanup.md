# Resume Studio Shared Text Editors With Dead Code Cleanup

## Summary

Refactor Resume Studio so repeated free-text editing uses two shared feature-local components and remove the now-redundant bespoke editors.

New shared primitives:

- `TextEditor`: the canonical textarea editor for free-text fields
- `ListItemsEditor`: a field-array editor built on top of `TextEditor`

Chosen behavior:

- every list item is an auto-resizing textarea
- each item starts at one line and grows with content up to the existing max-height cap
- remove controls stay compact and inline
- code made obsolete by this pass is deleted, not left behind

## Key Changes

### Shared editors

Add shared components under `src/features/resume-studio/ui/`:

- `TextEditor`
  - wraps the existing Resume Studio field, description, validation, and textarea wiring
  - uses `react-hook-form`
  - autosizes from one line upward to a capped max height
  - supports `label`, `name`, `placeholder`, `description`, `testId`
- `ListItemsEditor`
  - owns `useFieldArray()`
  - renders each item’s `.text` with `TextEditor`
  - supports `label`, `name`, `addLabel`, `emptyCopy`, `placeholder`
  - keeps compact inline remove controls

### Adopt the shared components

Use `TextEditor` in:

- Basics > Summary
- Work > Summary
  - through the shared work-role fields, so both standalone roles and grouped progression roles use it

Use `ListItemsEditor` in:

- Work > Highlights
- Skills > Keywords
- Achievements
- Education > Courses

Keep all non-text structural UI as-is:

- single-line inputs still use `ResumeStudioInputField`
- skills category cards stay as they are
- grouped work cards stay as they are
- markdown helper text remains on summary editors

## Dead Code Removal

Delete or fold the code made redundant by the refactor:

- remove `ResumeStudioTextListEditor` entirely and replace all call sites with `ListItemsEditor`
- remove the bespoke Skills keyword editor logic inside `ResumeStudioSkillsStep`
  - including its duplicated field-array row rendering
  - including any keyword-specific remove button code/icons that become unused
- remove `ResumeStudioTextAreaField` if it becomes unused after Basics and Work switch to `TextEditor`
- trim `form-fields.tsx` down to the field primitives still actually used
- remove stale imports, helper components, and test assumptions tied to the deleted editors

This pass should leave one shared textarea editor path and one shared text-list path, not multiple overlapping implementations.

## Interfaces

- `TextEditor` becomes the only shared multiline text editor in Resume Studio
- `ListItemsEditor` becomes the only shared editor for `TextValue[]` arrays
- No resume JSON schema changes
- No API/storage/versioning changes

## Test Plan

Update Resume Studio coverage to verify:

- Basics summary still edits and previews correctly through `TextEditor`
- Work summary still edits and previews correctly for standalone and grouped roles
- Work highlights, Skills keywords, Achievements, and Education courses all use the shared list editor path
- list items start as one-line textareas and grow when content becomes multiline
- inline remove controls work across all list-editor sections
- autosave and live preview remain unchanged after the refactor

Run:

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test:visual`

## Assumptions

- `ListItemsEditor` is the final shared name; the old `ResumeStudioTextListEditor` name is removed.
- Auto-resize is implemented locally without adding a dependency.
- The current textarea max-height cap remains the default for both summaries and list items.
- This pass is strictly a shared-editor consolidation plus dead-code cleanup; it does not redesign section layout beyond what is necessary to use the shared components.
