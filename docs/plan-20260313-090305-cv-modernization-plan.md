# CV Modernization Plan

**Summary**
- First implementation step: create `docs/20260313-090305-cv-modernization-plan.md` and copy the approved migration plan into it verbatim, creating the `docs/` directory if it does not exist.
- Establish committed Playwright visual baselines before changing output, then migrate the app in one pass to strict TypeScript, React 19, Tailwind CSS v4, and `date-fns`.
- Finish by removing obsolete dependencies and configs so the repo reflects the new stack cleanly.

**Key Changes**
- Documentation first: add `docs/20260313-090305-cv-modernization-plan.md` with the plan title, summary, implementation checklist, acceptance criteria, and assumptions so the migration record lives in-repo from step one.
- Tooling: add strict TypeScript with `allowJs: false`, `strict: true`, `noEmit: true`, `jsx: react-jsx`, `moduleResolution: bundler`, and `resolveJsonModule`; convert the source tree to `.ts/.tsx`; add `typecheck`.
- Linting: keep a single flat ESLint config with TypeScript support and remove the legacy `.eslintrc.json`.
- React: upgrade `react` and `react-dom` through `18.3` warnings to `19.x`, add `@types/react` and `@types/react-dom` 19.x, and keep the existing `createRoot` entry unless a React 19 warning requires a small compatibility tweak.
- Types/interfaces: introduce a `ResumeData` model for `src/resume.json`, type all component props directly, remove `PropTypes`, and simplify `MainLayout` to the interface actually used by the app.
- Tailwind: install Tailwind CSS v4 with `@tailwindcss/vite`, convert `vite.config.js` to `vite.config.ts`, preserve the existing alias/build behavior, and remove the SCSS preprocessor config.
- Styling approach: replace SCSS with one Tailwind-backed CSS entry; move most layout, spacing, typography, and component styling into JSX utilities; keep a thin global CSS layer only for `@page`, `@media print`, normalize/base carryover, and the existing print helper classes.
- Reset strategy: disable Tailwind Preflight so browser-default resets do not shift the current resume output.
- Date migration: replace `moment` in `date-range` with `date-fns`, preserving `MMM YYYY`, inclusive month counting, `Present`, and the current behavior for invalid ordering.
- Date compatibility: normalize loose ISO-like input such as `2010-06-1` before parsing so the existing resume JSON continues to render identically without data edits.
- Cleanup: remove `sass`, `moment`, `prop-types`, `dotenv`, `rimraf`, SCSS files, the unused `public/index.html`, and any dead font imports/config left over after the migration.

**Visual Baseline**
- Add `playwright.config.ts` with one Chromium project, a fixed local preview port, and a fixed desktop viewport of `1280x1600`.
- Add `tests/resume.visual.spec.ts` that captures and commits two full-page goldens from `/`: one normal screen render and one print-emulated render using `page.emulateMedia({ media: 'print' })`.
- Configure screenshots for determinism with disabled animations, hidden caret, and a wait for font/layout stability before asserting.
- Generate and commit the baseline snapshots against the current SCSS implementation before any Tailwind edits, then reuse the same tests unchanged after the migration.

**Test Plan**
- Add Playwright as the only test runner in this pass; do not add Vitest or Jest.
- Add a date-helper spec under the Playwright runner covering ongoing roles rendering `Present`, inclusive month math, end-before-start returning `0 months`, and non-zero-padded date inputs preserving current display.
- Add scripts for `test:visual`, `test:visual:update`, `preview:visual`, `typecheck`, and keep `lint` and `build`.
- Acceptance criteria: `npm run lint`, `npm run typecheck`, `npm run build`, and `npm run test:visual` all pass; both committed snapshots show no diffs after the migration; the plan doc exists at `docs/20260313-090305-cv-modernization-plan.md`.

**Assumptions**
- The filename format is `docs/YYYYMMDD-HHMMSS-plan-slug.md`, and the chosen slug for this work is `cv-modernization-plan`.
- Snapshot baselines are committed as Chromium-on-current-platform artifacts; cross-platform screenshot normalization is out of scope.
- `src/resume.json` remains the editable resume source.
- The goal is output parity, not redesign; any snapshot diff is treated as a regression unless explicitly approved.
