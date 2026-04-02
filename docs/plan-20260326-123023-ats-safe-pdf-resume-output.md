# ATS-Safe PDF Resume Output

## Summary

- Keep the live web CV unchanged.
- Change only the generated/downloaded PDF render target to an ATS-safe presentation.
- Fix the three reported parser issues in the PDF output by:
  - switching from the current two-column body to a single-column flow
  - flattening grouped progression roles into standalone entries
  - removing computed duration text like `[2 years, 8 months]`

## Implementation Changes

- Add a PDF-target presentation transform under `src/features/pdf-download` that derives an ATS render model from the existing resume data without mutating stored JSON or Resume Studio drafts.
- In that transform:
  - convert each `ResumeWorkGroup` into standalone work entries
  - preserve authored role order within each progression group
  - copy group-level `company` and `website` onto a flattened role when the nested role does not define them
  - leave already-flat work entries unchanged
- Update `src/components/App.tsx` to branch on `__RESUME_RENDER_TARGET__`:
  - `web`: keep the current layout and section placement logic
  - `pdf`: render a single-column document with no sidebar
  - PDF section order: Summary, Professional Experience, Selected Achievements, Skills, Education
- Update work and education date rendering so the PDF target shows only the explicit date range, while web keeps the current duration-enhanced label.
- Keep grouped progression rendering for web only. The PDF path should receive flattened work items, so no nested progression block appears in the ATS PDF.

## Public Interfaces / Types

- No changes to the resume JSON schema.
- No changes to Resume Studio storage or draft types.
- Add only internal render-target helpers and a dates-only formatter.

## Test Plan

- Add unit coverage for the PDF presentation transform:
  - grouped progression becomes flat standalone roles
  - group `company` and `website` inheritance works as intended
  - flat roles pass through unchanged
- Add date-format tests proving PDF output omits computed durations while web output keeps them.
- Add PDF-target rendering coverage against the actual `RESUME_RENDER_TARGET=pdf` path, not just print media, and assert:
  - the PDF target has no sidebar layout
  - grouped roles render as standalone entries
  - duration text is absent
- Update PDF smoke coverage so ATS-safe structure regressions are checked alongside existing redaction checks.

## Assumptions

- The generated/downloaded PDF becomes the canonical ATS-safe version in this pass.
- Existing human-readable month/year formatting stays as-is; only computed duration text is removed.
- Achievements remain included in the ATS PDF, but after Professional Experience to prioritize parser-friendly chronology.
