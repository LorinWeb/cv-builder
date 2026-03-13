# Public GitHub Template With Local Override Resume Data

## Summary

Convert the repo from “tracked real CV data” to “tracked sample data + untracked local override,” while keeping the app runnable out of the box and preserving your current developer flow.

The public repo will commit a dummy sample resume JSON and a committed `.env` that points to it. Your real CV will live in an untracked JSON file inside the repo, and `.env.local` will override `RESUME_DATA_PATH` to point at that file for local work. The app/build/test pipeline will load resume data from that configured path at build/dev time, not from a hardcoded tracked module.

## Key Changes

- Replace the current tracked `src/data/resume.ts` source of truth with:
  - a committed sample file such as `src/data/resume.sample.json`
  - an ignored private file such as `src/data/resume.private.json`
- Commit a root `.env` with:
  - `RESUME_DATA_PATH=src/data/resume.sample.json`
- Keep `.env.local` untracked and use it to override with your private file path, e.g.:
  - `RESUME_DATA_PATH=src/data/resume.private.json`
- Add a shared Node-side loader that:
  - resolves `RESUME_DATA_PATH`
  - reads the JSON file from disk
  - validates it against the resume schema
  - returns a typed `ResumeData` object
- Keep the client import surface stable by making `src/data/resume.ts` a thin typed module backed by build-time injected data from the shared loader.
- Update `vite.config.ts` to use the same loader for both:
  - injecting resume data into the app bundle
  - generating the meta description from the selected resume file
- Update tests to use the shared loader instead of importing tracked resume content directly.
- Add `.gitignore` coverage for the private resume file path pattern if needed; `.env.local` is already ignored.
- Commit a realistic but obviously fake sample resume:
  - John Doe / Jane Doe style names
  - lorem ipsum summaries/highlights
  - no real phone, address, email, employers, or links

## Interfaces / Config

- Add one repo-level configuration input:
  - `RESUME_DATA_PATH`: filesystem path, relative to repo root
- Keep `ResumeData` as the canonical type.
- Add runtime schema validation for JSON-loaded resume data so invalid sample/private files fail clearly during dev/build/test.
- Do not expose the filesystem path itself to browser code; path resolution stays in Node/Vite only.

## Test Plan

- Verify default dev/build/test behavior uses the committed sample JSON when only `.env` is present.
- Verify `.env.local` overrides the sample and loads the private JSON instead.
- Verify invalid or missing JSON at `RESUME_DATA_PATH` fails with a clear error.
- Verify meta description generation uses whichever resume file is selected by env resolution.
- Verify the public repo still builds successfully with no private files present.

## History Cleanup

- Rewrite git history to remove all previously committed real CV data files:
  - `src/data/resume.ts`
  - `src/data/resume.json`
  - `src/resume.json`
- Audit the rewritten history for remaining personal data strings such as your real name, email, phone number, and address.
- Only make the GitHub repo public after the history rewrite is complete.

## Assumptions

- The private override file will be JSON, not TypeScript.
- The private file stays inside the repo working tree but remains untracked.
- The committed `.env` is acceptable because it points only to fake sample data.
- The deployed public template should render sample data by default unless you intentionally build/deploy using your private override.
