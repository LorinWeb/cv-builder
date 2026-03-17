# Reduce Real Bundle Size Instead of Silencing the Warning

## Summary

Address the warning by changing loading boundaries first, not by raising `chunkSizeWarningLimit`.

The two primary fixes are:

- stop statically pulling Resume Studio into the main app bundle
- stop building the nested PDF render target in development mode during dev-server PDF generation

Only if a warning still remains after those two changes should more `manualChunks` be added.

## Key Changes

### 1. Make Resume Studio a dev-only async boundary

- In `src/components/App.tsx`, remove the static `ResumeStudioLauncher` import from the main app graph.
- Replace it with a dev-only lazy entry:
  - when `import.meta.env.DEV` is `false`, render nothing and do not reference Resume Studio at all
  - when `import.meta.env.DEV` is `true`, lazy-load the Resume Studio entry with `React.lazy` and `Suspense`
- Use a small fallback that preserves the current dev affordance:
  - a fixed-position disabled/loading button with the same general footprint as the current launcher
  - no dialog/editor code loaded until the lazy chunk resolves
- Keep the existing Resume Studio runtime behavior unchanged after load.

Intended effect:

- normal production app builds stop shipping `src/features/resume-studio`
- `@mdxeditor/editor`, `@base-ui/react`, and `react-hook-form` leave the main app chunk
- the public resume path no longer pays for a dev-only editor

### 2. Build the PDF render target in production mode

- In `src/features/pdf-download/build/pipeline.ts`, stop inheriting the dev server’s `mode` for the nested `viteBuild(...)` call.
- Use production mode for the temporary PDF preview bundle.
- Keep the current `RESUME_RENDER_TARGET=pdf` behavior and output paths unchanged.
- Preview can still run locally on the same port; only the nested build mode changes.

Intended effect:

- the temporary dev PDF render build no longer uses a development-mode bundle shape
- the oversized-chunk warning caused by the dev-side PDF build path should disappear or materially shrink

### 3. Keep `manualChunks` as a targeted fallback, not the primary fix

- Keep the current `react-vendor` split in `vite.config.ts`.
- Do not raise `chunkSizeWarningLimit`.
- After steps 1 and 2, rerun build checks.
- Only if any chunk still exceeds `600` kB, add these explicit chunks:
  - `markdown-vendor`: `react-markdown`, `remark-gfm`
  - `resume-studio-editor`: `@mdxeditor/editor`, `@base-ui/react`, `react-hook-form`
- Do not add generic “misc vendor” buckets.

## Public Interfaces / Behavior

- No public API or data-schema changes.
- Resume Studio remains dev-only.
- The only visible UX change is that the dev-only Resume Studio launcher may appear through a short lazy-loading fallback on first load.

## Test Plan

- Run `npm run build` and confirm there is no `Some chunks are larger than 600 kB` warning.
- Start `npm run dev` and confirm the initial dev-side PDF generation path no longer emits the oversized-chunk warning.
- Verify the public app still renders normally and Resume Studio still opens and functions in dev after the lazy load.
- Run `npm run test:visual` to cover the preview/PDF path and ensure the lazy dev-only boundary does not break app rendering.

## Assumptions

- Resume Studio is intentionally excluded from non-dev builds.
- A small async fallback for the dev-only launcher is acceptable.
- The correct outcome is smaller shipped JS, not just suppressing the warning.
- `chunkSizeWarningLimit` should remain at `600` unless the structural fixes fail.
