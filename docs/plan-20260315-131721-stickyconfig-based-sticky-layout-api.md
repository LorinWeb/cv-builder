# StickyConfig-Based Sticky Layout API

## Summary
- Replace the boolean-only sticky API with `sticky?: boolean | StickyConfig` on both `Page.Header` and `Section.Title`.
- Keep `Page.Header` and `Section.Title` decoupled: the resume screen measures the header height in app-level code and passes that value into the title sticky config.
- Completely disable sticky behavior in print, including sticky positioning, offsets, z-index, and sticky-only background treatment.

## Key Changes
- Add a shared sticky utility in `src/components/Layout`:
  - `type StickyPosition = 'top' | 'bottom'`
  - `interface StickyConfig { position?: StickyPosition; offset?: number | string }`
  - a normalizer/helper that turns `boolean | StickyConfig` into a concrete sticky style config
  - offset normalization rules: numbers become `px`, strings pass through unchanged
  - `sticky={true}` normalizes to `{ position: 'top', offset: 0 }`
- Update `Page.Header`:
  - change `sticky` to `boolean | StickyConfig`
  - default to non-sticky when omitted or `false`
  - forward its DOM ref so app-level code can observe its height
  - apply sticky positioning via normalized inline style, setting only the active side (`top` or `bottom`) and clearing the opposite side
  - add a stable data attribute for sticky-enabled state/position so print CSS can target it
  - keep sticky-specific background/z-index treatment only when sticky is enabled on screen
- Update `Section.Title`:
  - change `sticky` to `boolean | StickyConfig`
  - apply the same sticky normalization logic as `Page.Header`
  - add the same sticky data attribute pattern for print overrides
  - ensure sticky-generated `position`/`top`/`bottom` override caller style, while unrelated caller styles still pass through
- Update `ResumeSection`:
  - add `titleSticky?: boolean | StickyConfig`
  - forward `titleSticky` directly to `Section.Title`
- Add an app-level measurement hook for the current resume screen:
  - observe the `Page.Header` element height with `ResizeObserver`
  - also recompute on `window.resize`
  - return the current header height in pixels and clean up observer/listeners on unmount
- Update `App.tsx`:
  - render `<Page.Header sticky ref={...}>`
  - compute `titleSticky={{ position: 'top', offset: headerHeight }}` from the observed header height
  - pass that config to all current titled `ResumeSection`s
- Update print styling in `src/styles/app.css`:
  - add a print-only reset targeting sticky-enabled layout elements via data attributes
  - force `position: static`, `top: auto`, `bottom: auto`, and `z-index: auto` with `!important` so inline sticky offsets are fully neutralized in print
  - remove sticky-only background treatment in print so printed rendering stays unchanged

## Public API Changes
- `Page.Header`: `sticky?: boolean | StickyConfig`
- `Section.Title`: `sticky?: boolean | StickyConfig`
- `ResumeSection`: `titleSticky?: boolean | StickyConfig`
- `Page.Header` becomes ref-forwarding so callers can measure it cleanly

## Test Plan
- Add pure tests for the sticky helper/normalizer covering:
  - `false` disables sticky output
  - `true` becomes top/0
  - top and bottom config variants
  - number and string offsets
  - inactive side is cleared when the other side is used
- Add a Playwright behavior test for the live resume page that verifies:
  - the header sticks when scrolled
  - section titles stay below the header using the measured offset
  - resizing to a narrower viewport changes header height and updates the title offset without reload
- Extend print verification so sticky-enabled header/title elements resolve to non-sticky computed print styles
- Run `npm run typecheck`, `npm run lint`, and Playwright coverage including the existing visual spec; update snapshots only if screen rendering changes

## Assumptions
- The current app keeps sticky header behavior by explicitly using `sticky` on `Page.Header`.
- All currently titled `ResumeSection`s should receive sticky title behavior.
- `bottom` support is part of the shared sticky API now, even though the current resume screen continues to use `top`.
- Sticky offset coordination is app-owned for this screen; layout primitives do not auto-read each other’s measurements.
- Print output should match the non-sticky document flow regardless of any sticky config passed at runtime.
