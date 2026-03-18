# Reduce Resume Studio Step-Switch Lag Without Changing Rich Editor UX

## Summary

Keep the current “always rich” editing model and keep dialog open fast. The optimization target is:

- pay the heavy editor mount cost only on the first visit to a step
- remove repeat lag when switching back to `Experience` or `Skills`
- stop whole-dialog form subscriptions from making every heavy step more expensive than it needs to be

No public API or data-shape changes are needed.

## Key Changes

### 1. Retain visited step panels instead of remounting them

- In `src/features/resume-studio/ui/ResumeStudioEditTab.tsx`, replace the current single-step render with retained step panels.
- Track a `mountedSteps` set initialized with the current step.
- When a user first enters a step, add it to `mountedSteps` and keep that panel mounted afterward.
- Hide inactive mounted panels with DOM visibility only; do not unmount them.
- Do not prewarm `Experience` or `Skills` on dialog open. Their first mount still happens on first visit, per the chosen tradeoff.
- Add stable step-panel wrappers so tests can target `Basics`, `Experience`, `Skills`, etc. directly.

Intended effect:

- first visit to `Experience` or `Skills` still pays a one-time mount cost
- later visits stop remounting all of their editors and should feel immediate

### 2. Remove whole-form watching from the dialog render path

- In `src/features/resume-studio/ui/useResumeStudioDialogController.ts`, remove `useWatch({ control: form.control })` from the controller render path.
- Move draft sync into a dedicated subscriber hook based on React Hook Form subscription APIs, so form changes update refs and small derived state instead of forcing the entire dialog tree to rerender.
- Keep these behaviors unchanged:
  - live preview updates immediately
  - autosave still uses the same delay and save rules
  - publish/create-version guards still depend on real unsaved state
- Store the latest merged draft and signature in refs owned by the sync layer, then let actions read from that source instead of recomputing from a root `useWatch`.

Intended effect:

- typing in one field no longer rerenders the whole dialog plus every mounted step subtree
- retaining step panels does not become a regression because hidden heavy panels stay mostly idle

### 3. Trim repeated TextEditor setup cost while keeping editors fully rich

- In `src/features/resume-studio/ui/TextEditor.tsx`, stop recreating editor plugin and toolbar definitions per instance.
- Hoist shared plugin configurations to module-level caches keyed by editor mode (`inline` vs `block`).
- Memoize `TextEditor` and the heavy repeating shells that compose it, especially:
  - `ListItemsEditor`
  - work-role/group cards
  - skill-category cards
- Keep current editor behavior intact:
  - same markdown support
  - same toolbar options by mode
  - same focus/blur toolbar visibility
  - same contenteditable surface immediately available once the step is mounted

Intended effect:

- the first `Experience` and `Skills` mount still stays rich, but with less per-editor setup work
- hidden retained steps avoid unnecessary rerenders when unrelated fields change

## Test Plan

- Run `npm run typecheck`
- Run `npm run build`
- Run `npx playwright test tests/resume-studio.ui.spec.ts`
- Add regression coverage for retained steps:
  - first visit to `Experience`, edit a field, switch away, switch back, and confirm the edited content is still present without rebuilding the step from scratch
  - same flow for `Skills`
- Manually verify in dev:
  - dialog open time feels unchanged
  - first visit to `Experience` and `Skills` has at most a one-time lag
  - second and later visits to those steps feel immediate
  - preview and autosave status still update correctly while editing those sections

## Assumptions

- The rich editor experience must remain immediate once a step is mounted; no “upgrade on focus” behavior.
- Dialog open speed is more important than background prewarming.
- A smaller one-time lag on the first visit to `Experience` or `Skills` is acceptable if repeat lag is removed.
- No compatibility layer is needed; this is an internal UI performance refactor only.
