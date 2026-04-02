# Markdown-Only Resume Simplification and Component Cleanup

## Summary
Remove `src/data/resume.private.json`, `src/data/resume.sample.json`, and the entire structured resume model. The app becomes markdown-only, with a single published file `src/data/resume.md` as the only runtime/build/test source. Resume Studio remains sqlite-backed for version history, but it stores markdown only and publishes markdown only. This pass also removes the remaining structured UI layer entirely: `StructuredResume`, `ProfileSection`, `ResumeSection`, `Layout/Section`, and the now-orphaned `ItemRenderers` components all go away. `ManualResume` and `ManualResumeMarkdown` are merged into one `MarkdownResume.tsx` component.

## Key Changes
### Data source and build pipeline
- Replace the JSON loader with a markdown loader that reads only `src/data/resume.md`.
- Update the Vite virtual data module to watch and load only `src/data/resume.md`; remove JSON parsing, schema validation, sample/private resolution, and photo asset validation.
- Collapse the runtime data contract to a markdown-only shape, ideally just `{ markdown: string }`.
- Derive SEO title/description directly from markdown headings/content; remove all structured fallbacks.
- Remove JSON-specific redaction and ATS presentation branches. Web, preview, and PDF all consume the same markdown source.

### Resume Studio and storage
- Keep sqlite for local version history, but change stored version content from JSON blobs to raw markdown text only.
- Replace JSON sync with markdown sync:
  - publish writes `src/data/resume.md`
  - initial studio import reads `src/data/resume.md`
  - no `resume.private.json` or sample import path remains
- Aggressively reset legacy storage:
  - remove JSON/blob compatibility code and old draft/version migration paths
  - if existing sqlite data is in the old shape, discard it and re-seed from `src/data/resume.md`
- Simplify studio API/state payloads to markdown-only fields, and update publish/status copy to reference `src/data/resume.md`.

### Renderer and component simplification
- Remove structured mode entirely:
  - delete `mode`, `manual`, and all structured resume section/item types
  - delete `StructuredResume`
  - delete structured-only helpers such as grouped-work flattening and JSON-to-markdown export logic
- Remove the remaining structured component surface:
  - delete `ProfileSection`
  - delete `ResumeSection`
  - delete `src/components/Layout/Section.tsx`
  - delete the orphaned `src/components/ItemRenderers` components and the folder if empty
- Merge `ManualResume` and `ManualResumeMarkdown` into a single `src/components/MarkdownResume.tsx` that owns:
  - the page shell
  - the PDF download affordance
  - the markdown rendering
- Update `App` so it always renders `AmbientDesignLayer` for on-screen output and always renders `MarkdownResume` as the only resume surface. The only condition on the ambient layer is print output, where it remains hidden.

### Heavy cleanup pass
- Do this in two explicit cleanup passes after the functional switch:
  1. Remove runtime/store/build code that still mentions JSON, structured sections, or mode branching.
  2. Search for and delete leftover unused helpers, constants, docs, and tests tied to structured resumes, JSON files, or removed components.
- Update README and current product docs to describe the new single-source workflow around `src/data/resume.md` and Resume Studio publishing.
- Keep historical plan files in `docs/` untouched; only remove live code/tests/docs that no longer map to the markdown-only system.

## Public Interfaces / Types
- `src/data/resume.md` becomes the only runtime resume source file.
- Resume Studio API/store payloads become markdown-only.
- Remove `ResumeMode`, `ResumeManualContent`, structured resume section types, and JSON schema exports.
- Remove JSON-specific constants such as sample/private data paths and replace them with a single markdown path constant.

## Test Plan
- Loader/build tests:
  - loads `src/data/resume.md` as the only source
  - watches only that file for dev HMR
  - throws a clear error when `src/data/resume.md` is missing or empty
- Resume Studio tests:
  - initializes from existing `src/data/resume.md`
  - stores versions as markdown only
  - publish writes `src/data/resume.md`
  - selecting/deleting versions no longer touches any JSON file
  - old JSON-specific import/reset behavior is gone
- Rendering/SEO/PDF tests:
  - app renders markdown-only resume correctly on screen/print/PDF
  - `AmbientDesignLayer` is present for normal on-screen rendering and absent in print output
  - title/description are derived from markdown only
  - no structured transform path remains
- Cleanup verification:
  - delete outdated structured-mode tests, `ItemRenderers` tests, and JSON-file tests
  - keep only tests that still map to markdown rendering, studio markdown versioning, SEO, ambient layer behavior, and PDF behavior
  - run full verification, including Playwright visual coverage, after the cleanup pass

## Assumptions
- `src/data/resume.md` is a repo-tracked published artifact and the only resume file the app loads.
- Resume Studio remains the editing/versioning tool, but it publishes markdown instead of JSON.
- `AmbientDesignLayer` should appear in all on-screen contexts, including preview, and remain excluded only from print output.
- Legacy sqlite/JSON data is not migrated; it is intentionally discarded in favor of a markdown-only reset seeded from `src/data/resume.md`.
