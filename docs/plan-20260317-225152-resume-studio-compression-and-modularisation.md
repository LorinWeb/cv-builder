# Resume Studio Compression And Modularisation

## Summary

Refactor `src/features/resume-studio` to keep the current Resume Studio behavior while reducing repeated code, shrinking oversized modules, and separating UI wiring from state orchestration.

Chosen direction:

- keep the current product surface and tests intact
- remove repetition before adding abstraction
- prefer small feature-local helpers and hooks over generic infrastructure
- delete dead compatibility code where it is no longer called

## Key Changes

### UI composition

- Replace duplicated step metadata with one step definition source that drives:
  - step ids
  - labels
  - navigation order
  - step rendering
- Add small feature-local UI primitives for repeated Resume Studio chrome:
  - shared action button styling
  - shared remove button styling
  - shared card wrappers for repeated field-array sections
- Reuse those primitives across Contacts, Education, Skills, Experience, and Versions instead of repeating button/card markup and class strings.

### Dialog orchestration

- Split `ResumeStudioDialog` into smaller responsibilities:
  - form draft derivation and signature tracking
  - autosave and preview synchronization
  - version-management actions
  - photo upload handling
- Keep the dialog component focused on layout and tab switching.

### Draft and factory helpers

- Expand feature-local draft factories so empty profile, skill, education, and work items come from one place instead of inline literals.
- Reduce draft mapping repetition by introducing small helpers for:
  - text value mapping
  - optional string normalization
  - optional list normalization
- Keep the public draft types unchanged.

### Runtime and server cleanup

- Remove transport boilerplate where the client repeats the same JSON request setup.
- Simplify server route handling with shared helpers where possible.
- Delete dead Resume Studio compatibility paths if they are no longer referenced.

## Interfaces

- No changes to the resume JSON schema.
- No changes to the external Resume Studio user flow.
- No dependency changes.
- No lockfile edits by hand.

## Test Plan

- Run `npm run lint`
- Run `npm run typecheck`
- Run `npm run build`
- Run `npm run test:visual`

## Assumptions

- The existing Playwright Resume Studio coverage is sufficient to guard this refactor without adding a second test framework.
- The dead `/versions/:id/restore` compatibility route can be removed if no caller exists.
- This pass is a structural cleanup and compression pass, not a UI redesign.
