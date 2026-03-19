# Configurable Basics Summary Placement

## Summary
- Add a Basics-level Resume Studio toggle that controls whether the summary is always rendered as the first section directly under the page header.
- Keep the unchecked default responsive: summary renders first only below the existing `640px` layout breakpoint and stays in the right sidebar at wider widths.
- Apply the checked state everywhere, including print/PDF, so the summary becomes the first main-content section on all targets.

## API / Data Changes
- Extend `ResumeBasics` / `ResumeSourceBasics` and the resume Zod schema with optional `summaryAlwaysFirstSection?: boolean`.
- Extend `ResumeStudioBasicsDraft` with required `summaryAlwaysFirstSection: boolean`; map missing source data to `false` when loading into the form.
- Persist `true` when checked and omit the field when unchecked so existing resume JSON keeps the default behavior without a migration.

## Implementation Changes
- Resume Studio:
- Add a checkbox under the Basics summary editor labeled `Alway show as first section`.
- Wire it into the existing form/autosave/version/publish flow and give it a stable test target.
- Add a small feature-local checkbox field in `src/features/resume-studio/ui/form-fields.tsx` and reuse it for the existing contract-role checkbox so boolean controls stay consistent.
- Runtime rendering:
- Add a generic `useMediaQuery('(max-width: 640px)')` hook under `src/hooks`.
- In `src/components/App.tsx`, compute whether summary belongs in main content or the sidebar from `summaryAlwaysFirstSection` plus the current viewport width.
- Render summary at the top of `Page.MainContent` whenever it should be the first section, and suppress the sidebar copy in that state.
- Recompute sidebar presence from actual sidebar content so the right column disappears when summary moves out and no skills/education content remains.
- Storage:
- No SQLite migration is needed; Resume Studio already stores full resume JSON blobs.

## Test Plan
- Extend loader/schema coverage to accept `basics.summaryAlwaysFirstSection` and confirm it survives public-data redaction.
- Extend Resume Studio draft/store coverage to verify default `false` behavior and round-tripping through save, version switch, and publish flows.
- Extend `tests/resume-studio.ui.spec.ts` to verify:
- the new checkbox appears in Basics and autosaves
- checked state moves the live-page summary to the first post-header section at desktop width
- unchecked state keeps desktop sidebar placement
- checked state survives version switching and publish
- Add a targeted live-page Playwright layout test for the unchecked mobile case: below `640px`, summary becomes the first section under the header.
- Run the full verification pass after implementation: `npm run typecheck`, `npm run lint`, relevant Playwright specs, and the existing visual suite.

## Assumptions
- The checkbox label is implemented exactly as written in the request: `Alway show as first section`.
- The Resume Studio iframe preview remains desktop-sized when unchecked; mobile-only placement is asserted on the live page, not the preview iframe.
- Checked state changes screen, print, and PDF layout consistently.
