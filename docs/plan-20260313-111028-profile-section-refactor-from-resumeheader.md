# ProfileSection Refactor From ResumeHeader

## Summary
- Replace the inline `ResumeHeader` rendering in `App.tsx` with a dedicated `ProfileSection` component that represents the resume profile area explicitly.
- Make `Page.Header` generic again: keep it as a thin semantic wrapper and remove the current profile-specific baseline styles from it.
- Preserve the current rendered content and layout: name, label, email, phone, location, and external profile links stay exactly as they are today.

## Key Changes
- Add `ProfileSection` as a dedicated component, using a modern path/name such as `src/components/ProfileSection.tsx`.
- `ProfileSection` public API:
  - required prop: `profileData: ResumeBasics`
  - optional prop: `className`
- Move the current header-specific formatting helpers into `ProfileSection`:
  - location formatting
  - profile URL display formatting
  - phone `tel:` normalization
- Update `App.tsx` so the header becomes:
  - `<Page.Header><ProfileSection profileData={profileData} /></Page.Header>`
  - remove all inline profile/header markup from `App.tsx`
- Revert `Page.Header` to a thin wrapper with no profile-specific baseline classes; keep `className` passthrough only.
- Move the current `ResumeHeader` baseline styles into `ProfileSection` itself via component-owned baseline Tailwind classes, not `app.css`.
- Remove all `ResumeHeader*` references entirely:
  - JSX class names
  - `app.css` selectors
  - any profile-specific baseline styling currently living in `Page.Header`
- Keep the visual/content contract aligned with the current implementation:
  - no avatar/picture
  - no Font Awesome or icon restoration
  - profile links continue to render formatted URLs, not usernames
  - current mobile stacking behavior remains intact

## Implementation Notes
- `ProfileSection` should own the current header layout and contact-list structure internally rather than exposing multiple subcomponents.
- Preserve the current DOM semantics:
  - outer element remains suitable for placement inside `Page.Header`
  - contact methods stay as links where they are today
- Keep canonical Tailwind class enforcement satisfied in the new component; do not reintroduce non-canonical utility forms.
- Do not revive the old `Section--profile` file shape or icon-driven behavior; this is a clean modern replacement, not a rollback.

## Test Plan
- Run `npm run lint`, `npm run typecheck`, `npm run build`, and `npm run test:visual`.
- Existing screen and print snapshots must pass without updating baselines.
- Verify there are no remaining `ResumeHeader` references in source after the refactor.

## Assumptions
- `ProfileSection` is a dedicated profile block rendered inside `Page.Header`, not a generic section primitive.
- Styling ownership should move toward component-local Tailwind classes rather than CSS selectors in `src/styles/app.css`.
- When this plan is approved for implementation, the first step is to save it under `docs/plan-YYYYMMDD-HHMMSS-profile-section-refactor-from-resumeheader.md` per repository rules.
