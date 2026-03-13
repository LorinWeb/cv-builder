# Page Compound Layout Refactor

## Summary
- Replace the legacy `MainLayout` with a new compound `Page` component at `src/components/Layout/Page/index.tsx`, and migrate `src/components/App.tsx` to the new API in the same change.
- Preserve the current screen and print rendering for the existing resume. This is a structural refactor, not a redesign.
- Remove the old `src/components/Layouts/index.tsx` implementation after the migration and delete its now-unused page/layout CSS selectors from `src/styles/app.css`.

## Public API
- Export `Page` as the default export, with static slots: `Page.Header`, `Page.Body`, `Page.MainContent`, `Page.Sidebar`, and `Page.Footer`.
- Slot element semantics:
  - `Page` -> `div`
  - `Page.Header` -> `header`
  - `Page.Body` -> `div`
  - `Page.MainContent` -> `main`
  - `Page.Sidebar` -> `aside`
  - `Page.Footer` -> `footer`
- `Page.Sidebar` requires `placement: 'left' | 'right'`.
- All slots accept native element props plus `className`.
- Supported `Page.Body` contract: one direct `Page.MainContent`, plus zero to two direct `Page.Sidebar` children, with at most one sidebar per placement.

## Implementation Changes
- Build `Page` with the same compound-component pattern already used by `Section`: typed slot props, `Object.assign`, and `joinClassNames` for class merging.
- Move the current A4 page shell from `MainLayout` into `Page` itself, preserving the existing width, min-height, padding, shadow, centering, and print reset behavior.
- Keep `Page.Header` and `Page.Footer` as thin semantic wrappers with no built-in spacing rules beyond class passthrough. `App.tsx` keeps its current header-specific typography and border classes.
- Make `Page.Body` own the page column layout. It should inspect its direct slot children, compute whether left and/or right sidebars are present, and provide that layout state internally to `Page.MainContent` and `Page.Sidebar`.
- Use CSS-based placement, not DOM regrouping. Authored child order stays intact in the DOM; desktop placement comes from grid/column classes.
- Desktop column templates:
  - main only: `minmax(0,1fr)`
  - left + main: `minmax(0,1fr) minmax(0,2.15fr)`
  - main + right: `minmax(0,2.15fr) minmax(0,1fr)`
  - left + main + right: `minmax(0,1fr) minmax(0,2.15fr) minmax(0,1fr)`
- Mobile behavior: `Page.Body` collapses to one column at the current `640px` breakpoint and keeps DOM order. Use built-in vertical spacing there so stacked layouts do not depend on slot-specific margin hacks.
- `Page.MainContent` should place itself in the main column and apply divider/padding based on detected neighbors:
  - right sidebar only: preserve current `border-r` + `pr-[20px]`
  - left sidebar only: mirror with `border-l` + `pl-[20px]`
  - both sidebars: apply both sides
  - no sidebar: no divider or side padding
- `Page.Sidebar` should place itself from `placement` and apply side-specific padding:
  - `left` -> left column + `pr-[6px]`
  - `right` -> right column + `pl-[6px]`
  - mobile -> remove left/right padding
- Update `App.tsx` to use the new slots directly:
  - wrap existing header content in `Page.Header`
  - wrap the current main resume sections in `Page.MainContent`
  - wrap the existing aside content in `Page.Sidebar placement="right"`
  - do not add a footer yet
- Remove the old page/layout selectors from `src/styles/app.css` once their behavior has been moved into the `Page` component. Keep existing global print utilities and resume-specific styles that still belong to the app shell.

## Test Plan
- Run `npm run lint`, `npm run typecheck`, `npm run build`, and `npm run test:visual`.
- Existing Playwright screen and print screenshots must pass without updating snapshots.
- During implementation, do a local smoke check for:
  - right sidebar only (the current app path)
  - left sidebar only
  - left + main + right
  Remove any temporary smoke-check render code before finalizing.

## Assumptions
- `Page.Body` only supports direct slot children for layout detection; wrapped or nested slot discovery is out of scope.
- Visual placement is CSS-driven on desktop, while DOM order remains authored for accessibility and mobile stacking.
- `Page.Footer` is implemented now for API completeness but remains unused and unstyled by default.
- Exact rendering parity is only required for the current right-sidebar resume output; left-sidebar and dual-sidebar support are added as component capability and validated by smoke check, not by committed screenshots in this pass.
