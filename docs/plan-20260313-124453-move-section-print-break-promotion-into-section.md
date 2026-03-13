# Move Section Print-Break Promotion Into Section

## Summary
- Remove section-level `layout` print config from the resume model and make `Section` responsible for promoting a first-item page break to the section wrapper.
- Keep current item-level print behavior for `avoidPageBreakInside` and non-first-item `printBreakBefore`.
- Do not add a replacement for Summary-level print config in this pass; Summary simply stops supporting standalone section print config.

## Public API / Type Changes
- Add an optional prop to `Section` root: `promotePrintBreakFrom?: Array<PrintConfig | string | null | undefined>`.
- `Section` promotion behavior:
  - inspect only the first array item
  - if the first item is an object with `printBreakBefore: 'page'`, add `PrintBreakBeforePage` to the section wrapper
  - do not promote `avoidPageBreakInside`
- Remove `LayoutConfig` and `layout?: LayoutConfig` from `ResumeData` in `src/types/resume.ts`.
- Remove the empty `layout` object from `src/resume.json`.

## Implementation Changes
- In `src/components/Layout/Section.tsx`, fold the section-break promotion logic into `SectionRoot` so callers no longer compute `sectionBreakClassName` themselves.
- In `src/components/print.ts`, keep:
  - `getPrintClassNames`
  - `getItemPrintClassNames`
  - `joinClassNames`
  Remove `getPromotedSectionBreakClassName`, since that responsibility moves into `Section`.
- Update section callers:
  - `AboutSection`: stop accepting section-level print config from `App`; no promotion prop.
  - `ImpactSection`: pass `promotePrintBreakFrom={impactData}` to `Section`; switch item class handling to `getItemPrintClassNames` so the first promoted item does not also emit its own page break.
  - `SkillsSection`: pass `promotePrintBreakFrom={skillsData}` to `Section`; remove local `getPromotedSectionBreakClassName` usage; keep first item on `getItemPrintClassNames(..., { ignorePageBreakBefore: true })`.
  - `EducationSection`: pass `promotePrintBreakFrom={educationData}` to `Section`; remove local promotion helper usage; keep first education item on `getItemPrintClassNames(..., { ignorePageBreakBefore: true })`.
  - `WorkSection`: pass `promotePrintBreakFrom={workData}` to `Section`; refactor top-level work item rendering so only the first top-level work entry/group ignores its own `printBreakBefore` when the section wrapper is promoting it.
- Update `App.tsx` to stop reading `jsonObj.layout` and stop passing `getPrintClassNames(layout.*)` into section components.
- Keep `educationNoteData` item-level print handling as-is; it is not part of section-break promotion.
- Keep current CSS/print utility classes unchanged; this is a responsibility refactor, not a print-style redesign.

## Test Plan
- Run `npm run lint`, `npm run typecheck`, `npm run build`, and `npm run test:visual`.
- Verify there are no remaining references to:
  - `LayoutConfig`
  - `layout` on `ResumeData`
  - `getPromotedSectionBreakClassName`
  - `jsonObj.layout`
- Smoke-check these print cases:
  - first education item with `printBreakBefore: 'page'` still moves the Education section to a new page
  - first skills item with `printBreakBefore: 'page'` moves the Skills section wrapper, not the first item twice
  - first work item/group with `printBreakBefore: 'page'` moves the whole Work section wrapper
  - first impact item object with `printBreakBefore: 'page'` promotes correctly
  - Summary renders unchanged and no longer depends on `layout.summary`

## Assumptions
- Removing section-level `layout` support is acceptable because `src/resume.json` currently has an empty `layout` object and no active section-level overrides.
- Only `printBreakBefore: 'page'` should be promoted to the section wrapper; `avoidPageBreakInside` remains item-level.
- Summary losing standalone section print config is acceptable in this pass; if needed later, it should be reintroduced via a deliberate data-model change rather than a hidden fallback.
