# Section Compound Component Refactor And Plan-Doc Convention

**Summary**
- First implementation step: add a root `AGENTS.md` that states every approved plan must be saved under `docs/plan-{timestamp}-{plan-title}.md`, with `{timestamp}` using `YYYYMMDD-HHMMSS` and `{plan-title}` as a kebab-case slug.
- Save this approved plan itself using that convention before changing code, creating `docs/` if needed.
- Replace the constant-based section styling with a compound `Section` component and remove all section-owned styling from `src/styles/app.css` while preserving the current visual output.

**Key Changes**
- Add `AGENTS.md` at the repo root with an explicit instruction that approved plans are documented in `/docs` as `plan-{timestamp}-{plan-title}.md`.
- Add the plan doc for this work using that exact naming convention; include the approved plan content verbatim.

- Add `src/components/Layout/Section.tsx` exporting a typed compound API:
- `Section` renders the section wrapper.
- `Section.Title` renders the title element.
- `Section.Body` renders the body wrapper.
- Each part accepts standard element props plus `className`; do not add a variant system in this pass.

- Update `Section--about`, `Section--education`, `Section--impact`, `Section--skills`, and `Section--work` to use:
- `<Section ...>`
- `<Section.Title ...>`
- `<Section.Body ...>`
- Keep presentational Tailwind classes inline in `className` props at the call site so autocomplete remains available.
- Preserve existing section-specific hooks like `titleClassName`, but pass them into `Section.Title` rather than style constants or CSS selectors.

- Remove `src/components/section-styles.ts`.
- Move all section-owned presentation into JSX, including title, body, item row, summary, list, and work-group styling currently split between constants and CSS.
- Keep print behavior wiring from `print.ts`; do not change the page-break API or the resume data contract.

- Reduce `src/styles/app.css` to global-only concerns:
- keep Tailwind imports, design tokens, base/global element rules, page shell/layout rules, resume shell rules that are intentionally global, and print/page helpers.
- remove all `.Section*` and related section-owned descendant selectors from `app.css`.
- do not leave fallback section styling in CSS after the refactor.

**Interfaces**
- New UI API in `src/components/Layout/Section.tsx`:
- `Section`
- `Section.Title`
- `Section.Body`
- No replacement constants file, no style-token export layer for section presentation, and no CSS-driven section contract in `app.css`.

**Test Plan**
- Run `npm run typecheck`, `npm run lint`, and `npm run build`.
- Run `npm run test:visual` and require the existing committed screen and print snapshots to pass without updates.
- Verify sidebar title spacing, work-entry typography, list styling, and print page-break behavior remain unchanged after the CSS removal.

**Assumptions**
- There is currently no repo-local `AGENTS.md`, so this change adds one at the repository root.
- The docs naming convention applies to future approved plans and to this approved refactor plan as part of implementation.
- `src/styles/app.css` may still contain global/page/layout/print rules, but it should contain zero section-owned styling after this change.
- The existing `src/components/Layouts/` directory stays in place; only the new compound section component is introduced under `src/components/Layout/`.
