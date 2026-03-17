# Resume-Wide Markdown Support

## Summary

- Real options:
  - `Markdown strings everywhere`: lowest schema/editor churn and the best fit for the current textarea-based UI.
  - `Explicit rich-text type`: more explicit, but larger data-model and editor migration.
  - `Rich text editor`: best authoring UX, highest complexity and dependency cost.
- Chosen direction: keep the existing JSON shape, treat free-text fields as markdown-capable strings, and render them through one shared markdown layer.
- Coverage: all free-text content fields in the schema, not structural labels. That means markdown applies to `summary`, `reference`, and every `TextValue.text` payload; names, titles, companies, dates, URLs, and similar fields stay plain text.

## Key Changes

- Add one shared markdown rendering helper/component with two modes:
  - `block` for multiline summary/reference-style fields
  - `inline` for bullet/keyword/highlight/course-style fields
- Implement rendering with `react-markdown` plus `remark-gfm`, with raw HTML disabled.
- Support markdown features:
  - `block`: paragraphs, emphasis, strong, links, inline code, lists, hard line breaks
  - `inline`: emphasis, strong, links, inline code
  - Disallow headings, blockquotes, tables, images, and raw HTML everywhere to keep layout stable
- Route current rendering through that helper instead of raw strings or `getTextValue()`:
  - profile summary
  - achievements / impact items
  - work summaries and highlights, including progression entries
  - skill keywords
  - any future renderer for schema free-text fields
- Keep the stored data unchanged:
  - no JSON migration
  - Resume Studio continues to save raw source strings
  - markdown lives directly in existing `string` fields and `TextValue.text`
- Keep Resume Studio authoring simple:
  - existing textareas and inputs remain
  - add compact “Markdown supported” guidance to multiline free-text editors
  - no WYSIWYG editor or toolbar in v1
- Add a shared markdown-to-plain-text helper for non-render contexts, and use it for SEO/meta description generation before sentence extraction.
- Do not add new visible resume sections in this pass; dormant schema sections only gain markdown compatibility at the contract/helper level.

## Public APIs / Types

- No schema shape change.
- Contract change: these fields are markdown-capable source text:
  - any `TextValue.text`
  - `basics.summary`
  - `work[].summary`
  - `volunteer[].summary`
  - `awards[].summary`
  - `publications[].summary`
  - `references[].reference`
- Structural fields remain plain text:
  - names, labels, positions, company names, institutions, study types, dates, URLs, profile networks, and similar identifiers.

## Test Plan

- Unit tests for markdown rendering:
  - block summaries render paragraphs, links, and lists correctly
  - inline fields render emphasis/links/code without nested block layout
  - disallowed nodes are ignored or flattened safely
- Unit tests for plain-text extraction:
  - markdown summaries produce clean meta descriptions
  - markdown punctuation is removed while visible text is preserved
- Component/visual coverage for current rendered surfaces:
  - profile summary
  - achievements
  - work summary/highlights
  - skill keywords
- Resume Studio test coverage:
  - markdown typed into summary/highlight fields previews immediately
  - saved versions preserve raw markdown source
- Full verification:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
  - `npm run test:visual`

## Assumptions

- Raw markdown authoring is acceptable; no rich-text editor is introduced.
- “Any block of text” means free-text content fields, not structural labels.
- Inline contexts degrade gracefully if block markdown is entered; they do not error or try to render nested headings/lists.
- Existing plain-text resumes remain valid because plain text is valid markdown.
