# Replace Section-Specific Resume Components With `ResumeSection`

## Summary
- Remove the current resume-section wrapper components (`Section--about`, `Section--impact`, `Section--skills`, `Section--education`, `Section--work`) and replace them with a single generic `ResumeSection` component plus extracted item renderers.
- Keep the current rendered layout, spacing, and print behavior unchanged.
- `App.tsx` becomes the composition point for all resume sections; item-level markup moves into `src/components/ItemRenderers`, including renaming `WorkItem` to `WorkExperienceItem`.

## Public API
- Add `src/components/ResumeSection.tsx` as the domain-specific wrapper for resume sections.
- `ResumeSection` props should be a typed union:
  - common props: `title?: string`, `className?: string`
  - text-only mode: `children: ReactNode`
  - item-list mode: `items: TItem[]` and `children: (args: { items: TItem[]; getItemClassName: (item: TItem, index: number) => string }) => ReactNode`
- `ResumeSection` is generic over `TItem`; `items` should infer the type automatically, but explicit `<ResumeSection<TItem>>` usage must also work.
- `getItemClassName` is the only item-level helper exposed by `ResumeSection`. It should encapsulate the current print logic:
  - promote `printBreakBefore: 'page'` from the first top-level item to the section wrapper
  - suppress that same page break on the first rendered top-level item
  - keep `avoidPageBreakInside` and non-first-item `printBreakBefore` on the item itself
- Standardize extracted item renderer props to `item` plus optional `className`.

## Implementation Changes
- Keep [`src/components/Layout/Section.tsx`](../src/components/Layout/Section.tsx) as the low-level presentational primitive and build `ResumeSection` on top of it. `ResumeSection` becomes the only section wrapper used by `App`.
- Move section composition into [`src/components/App.tsx`](../src/components/App.tsx):
  - summary/about becomes `<ResumeSection title="Professional Summary">{profileData.summary}</ResumeSection>`
  - achievements, work, skills, and education use `items` plus the render-prop child
  - education note stays in the same Education section and is appended after the mapped education items
- Create `src/components/ItemRenderers/` with these components:
  - `WorkExperienceItem.tsx` from the current inline `WorkItem`, preserving single-entry vs progression-group rendering, nested progression print classes, and date/highlight formatting
  - `AchievementItem.tsx` for `impact` list items
  - `SkillCategoryItem.tsx` for each skill block
  - `EducationEntryItem.tsx` for each education entry
  - `EducationNoteItem.tsx` for the appended education note block
- Delete the old section wrapper files after `App.tsx` is migrated.
- Keep non-section-specific helpers where they are unless needed by multiple item renderers; if duplicated `TextValue` formatting is extracted, do it as a small shared helper rather than leaving repeated `getTextValue` implementations.

## Test Plan
- Run `npm run lint`, `npm run typecheck`, `npm run build`, and `npm run test:visual`.
- Verify typed usage in `App.tsx`:
  - render-prop `items` and `item` are correctly typed for work, skills, education, and impact
  - explicit generic parameters on `ResumeSection` remain valid if used
- Verify visual/print parity:
  - summary renders unchanged with the generic wrapper
  - the first top-level work, skills, education, and impact items still promote a page break to the section wrapper without double-applying it to the first item
  - nested work progression entries still keep their own print classes
  - the education note still renders after the education items in the same section
- Verify there are no remaining imports or source files for the removed `Section--*` components.

## Assumptions
- `ResumeSection` does not render list containers itself; the render-prop consumer remains responsible for `<ul>`, fragments, or block wrappers inside the section body.
- Summary/about uses plain children rather than being forced into a fake single-item array.
- `ProfileSection` is not part of this refactor.
- When this plan is approved for implementation, save it first under `docs/plan-{timestamp}-replace-section-specific-resume-components-with-resumesection.md`.
