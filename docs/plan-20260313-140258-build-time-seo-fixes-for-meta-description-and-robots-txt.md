# Build-Time SEO Fixes for Meta Description and `robots.txt`

## Summary
- Generate the document meta description from `src/resume.json` at build time, using `basics.summary` up to the first period.
- Add a valid `public/robots.txt` that allows indexing.
- Keep this entirely in the build pipeline so the final HTML is correct without any client-side DOM mutation.

## Key Changes
- Add a small shared SEO helper that trims and normalizes `basics.summary`, extracts the first sentence, and returns the full trimmed summary when no period exists.
- Make that helper throw a clear build error if `basics.summary` is missing or resolves to an empty description, so the site cannot ship without the required meta description.
- Update `vite.config.ts` to import `src/resume.json` and inject `<meta name="description">` into the document head through Vite’s HTML transform during build generation.
- Add `public/robots.txt` with `User-agent: *` and `Allow: /`.

## Public Interfaces / Types
- No component API, route, or runtime behavior changes.
- No resume schema changes, but the build now requires a non-empty `basics.summary` in `src/resume.json`.

## Test Plan
- Add a Playwright smoke test that verifies the built site exposes the expected meta description and serves `/robots.txt`.
- Run `npm run typecheck` and `npm run build`.
- Rerun Lighthouse against the built site and confirm the two current findings are gone.

## Assumptions
- “Up to the first period” includes the trailing period when one exists.
- If the summary contains no period, the full trimmed summary becomes the meta description.
- The robots policy remains public and indexable, matching the earlier decision.
