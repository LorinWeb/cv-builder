# Resume Studio Popover Versions Menu

## Summary
Replace the custom absolute-positioned versions dropdown in Resume Studio with Base UI Popover while preserving the current manual-only fullscreen studio behavior, version actions, and top-bar layout. This is a UI primitive swap plus a small controller cleanup, not a product-flow change.

## Implementation Changes
- Rebuild the versions menu in `src/features/resume-studio/ui/ResumeStudioDialog.tsx` with `@base-ui/react/popover`:
  - use `Popover.Root` in controlled mode, wired to the existing `isVersionsMenuOpen` and `setIsVersionsMenuOpen`
  - use the existing `Versions` button as `Popover.Trigger`
  - render menu content through `Popover.Portal > Popover.Positioner > Popover.Popup`
  - anchor the popup below the trigger, right-aligned to it, with a small vertical offset and viewport collision padding
  - do not use `Popover.Arrow`, `Popover.Backdrop`, or extra title/description wrappers for this menu
- Keep the current menu content and behaviors:
  - same create-version input and button
  - same version list, status labels, open action, and delete action
  - preserve current success-close behavior: successful create and select close the popover; delete keeps the popover open unless existing controller logic already closes it
- Keep the existing visual design, but move popup styling from “absolutely positioned panel” assumptions to a popup surface that works inside a portal:
  - retain current rounded surface, border, spacing, and scrollable list styling
  - ensure the popup layers above the fullscreen dialog and is not clipped by the top bar or workspace containers
  - keep width behavior equivalent to the current menu (`min(28rem, calc(100vw - 2rem))` or the same effective sizing)
- Trim the now-dead menu-specific manual positioning logic:
  - remove the wrapper assumptions that depended on `relative` plus conditional inline rendering
  - rely on Base UI for outside click, Escape dismissal, focus handling, and anchored positioning

## Public Interfaces / State
- No resume data, storage, or API contract changes.
- Resume Studio state stays controlled with the existing `isVersionsMenuOpen` boolean and setter.
- No dependency changes are needed because `@base-ui/react` is already present.

## Test Plan
- Update Resume Studio UI coverage to assert:
  - the `Versions` trigger opens a Base UI popover-backed menu
  - the menu is visible in the portal and remains anchored to the top-bar trigger
  - outside click and Escape close the menu
  - create version still works and closes the popover on success
  - select version still works and closes the popover on success
  - delete version still works and preserves the current close/open behavior
- Re-run the existing `tests/resume-studio.ui.spec.ts` coverage so the fullscreen overlay, preview behavior, and manual editing flow still pass unchanged.

## Assumptions
- This change is intentionally limited to the versions dropdown primitive; the rest of Resume Studio remains as currently designed.
- The popover should behave as a standard anchored non-modal popup inside the fullscreen dialog.
- Visual styling should stay close to the current menu unless Base UI positioning requires small layout adjustments.
