# PDF Download Feature Module

## Summary
- Package the entire capability as a dedicated `src/features/pdf-download` feature, with one thin external build entrypoint in `scripts/build.mjs`.
- Keep a single private/source resume JSON for local builds, redact `email` and `phone` out of the normal web bundle, and generate a downloadable PDF during `npm run build` from a temporary private build.
- Expose a simple runtime hook, `usePdfDownload`, so the rest of the app only consumes feature state instead of owning PDF logic directly.

## Feature Shape
- Create `src/features/pdf-download` as the ownership boundary for:
  - runtime types and selectors for PDF download config
  - render-target helpers (`web` vs `pdf`)
  - contact selection/redaction rules for the header
  - the `usePdfDownload` hook
  - build-side helpers under a `build/` subfolder using Node-compatible ESM modules so both `vite.config.ts` and `scripts/build.mjs` can import them
- Keep the runtime API small:
  - `usePdfDownload(downloads?)` returns `{ href, label, isAvailable, isPdfRenderTarget }`
  - internal selectors decide whether `email` and `phone` are included for the current render target
- `ProfileSection` becomes a consumer of the feature:
  - it asks the feature which contact items should render
  - it calls `usePdfDownload` for the CTA
  - it does not contain ad-hoc PDF target or redaction logic

## Implementation Changes
- Split resume data contracts into:
  - `ResumeSourceData`: build input, may include `basics.email`, `basics.phone`, and `downloads.resumePdf`
  - `ResumeData`: browser-safe payload, excludes `email` and `phone`
- Extend the source schema with `downloads.resumePdf`:
  - `path: string` as a site-relative `.pdf` output path such as `/resume.pdf`
  - `label?: string`
- Add feature-owned redaction helpers that convert `ResumeSourceData` to `ResumeData` for the public build.
- Update the Vite resume-data plugin to use the feature’s build helpers:
  - normal build injects redacted `ResumeData` with render target `web`
  - temporary PDF build injects full `ResumeSourceData` with render target `pdf`
- Replace `npm run build` with a thin build orchestrator in `scripts/build.mjs`:
  - run the normal public Vite build to `dist`
  - if no PDF config exists, stop
  - otherwise run a second Vite build to a temp outDir in `pdf` target mode
  - preview that temp build locally
  - use Playwright Chromium to open the page, emulate print, wait for fonts and ambient readiness, and write the PDF into final `dist` at the configured path
  - delete the temp build afterward so only the PDF survives
- Update the header UI:
  - `web` target shows only public-safe contact items plus a screen-only download button when available
  - `pdf` target includes `email` and `phone` again
  - use Lucide icons for visible items: `Mail`, `Phone`, `MapPin`, `Link2`, `Download`
  - keep the download CTA out of print output
- Keep `src/data/resume.sample.json` public-safe with no email, phone, or PDF config by default; private local resume JSON may include all three.

## Test Plan
- Extend loader/schema tests to verify:
  - source data accepts `email`, `phone`, and PDF config
  - redaction removes `email` and `phone` from the public payload
  - invalid PDF paths fail clearly
- Add feature-focused tests for:
  - `usePdfDownload`/selector behavior for configured vs missing PDF config
  - contact selection in `web` vs `pdf` targets
- Add a build smoke test using a committed fake-private fixture that:
  - runs the build orchestrator with PDF config enabled
  - asserts the public HTML contains no `mailto:` or `tel:` links
  - asserts the configured PDF file is emitted to `dist`
- Update visual snapshots for the iconized header and rerun `npm run lint`, `npm run typecheck`, and `npm run test:visual`.

## Assumptions
- The dedicated feature folder owns the logic; `scripts/build.mjs` remains only as a thin CLI entrypoint because `npm run build` needs an executable script.
- The generated PDF is intentionally downloadable by site visitors; the privacy requirement is limited to keeping sensitive contact details out of the live HTML DOM and shipped JS bundle.
- The PDF continues to use the existing page layout and print CSS rather than a separate template.
- If `downloads.resumePdf` is absent, the build still succeeds and emits only the public web resume.
