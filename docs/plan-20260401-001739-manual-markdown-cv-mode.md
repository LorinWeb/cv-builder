# Manual Markdown CV Mode

## Summary
- Add a second resume format alongside the existing structured format: `structured` and `manual`.
- In `manual` mode, a version stores one full markdown document, Resume Studio edits that document directly, and the app renders it through a plain black-on-white single-column page inside the existing `Page` container.
- Existing structured rendering and editing stay intact and remain the default for existing data.

## Interface Changes
- Extend resume data with a top-level `mode: 'structured' | 'manual'` and `manual.markdown: string`.
- Treat missing `mode` as `structured` so all current JSON stays valid without migration.
- Keep existing structured fields in the stored document even when `mode === 'manual'` so switching modes does not discard prior structured work.
- Validate `manual.markdown` as required when `mode === 'manual'`; keep current `basics`/section validation for structured mode.
- Manual mode publishes verbatim on web, preview, and PDF. No email/phone redaction is applied to manual markdown.
- Derive manual-mode document metadata from markdown:
  - title: first `#` heading plain text + ` CV`, fallback `Resume`
  - meta description: first non-heading text block, reduced to plain text and first sentence when possible

## Implementation Changes
- Update the resume data types, schema, loader, redaction, and Vite virtual data module to support the new mode while preserving current structured behavior.
- Branch the app renderer on `data.mode`.
  - `structured`: keep the current `ProfileSection`, sections, side column, ambient design, and PDF flattening behavior.
  - `manual`: bypass all structured section/item renderers and render a dedicated markdown article inside the usual `Page` shell with no ambient layer, no sticky profile header, no sidebars, black text, black rules/links, and white background.
- Add a small plain utility row at the top of the manual page to preserve the PDF download affordance in web/preview, hidden in print.
- Introduce a dedicated full-document markdown renderer for manual mode with support for the `CV.md` feature set: headings, paragraphs, lists, links, emphasis, inline code, blockquotes, and horizontal rules; continue to skip raw HTML.
- Extend `toAtsPdfResumeData` so manual mode is passed through unchanged; only structured mode continues to flatten grouped work for the ATS PDF target.
- Add a format switch at the top of Resume Studio: `Structured` / `Manual`.
- Keep the current step-based editor only for structured mode.
- Add a single manual editor panel for manual mode using a raw full-document markdown field rather than the current limited rich-text editor.
- When switching a version from structured to manual and `manual.markdown` is empty, seed it once from a deterministic markdown export of the current structured draft using the `CV.md` shape as the template style. Never overwrite existing manual content automatically after that.
- When switching from manual back to structured, restore the preserved structured draft as-is. Do not attempt to parse markdown back into structured sections.
- Extend draft conversion and autosave logic so `mode` and `manual.markdown` participate in preview, autosave, publish, versioning, and close/reopen flows exactly like current structured edits.

## Test Plan
- Schema/loader tests for:
  - existing structured JSON still loading unchanged
  - manual-mode JSON validating successfully
  - invalid manual payloads failing clearly
  - `mode` defaulting to structured when omitted
- Metadata tests for manual mode title/description extraction from markdown.
- Renderer tests for:
  - manual mode using the plain single-column layout in the normal page container
  - no structured header/sidebar/ambient layer in manual mode
  - manual markdown rendering headings, rules, lists, and links correctly
- Resume Studio UI tests for:
  - switching between structured and manual modes
  - manual editor live preview + autosave
  - seeding manual markdown on first switch
  - version switching preserving both manual content and prior structured content
  - publish keeping the selected manual version live
- Store/server tests for:
  - saving and publishing manual versions
  - preserving structured fields while manual mode is active
  - validation errors for bad manual payloads
- Visual/print/PDF tests for:
  - manual-mode screen screenshot
  - manual-mode print screenshot
  - manual-mode PDF target rendering the same plain layout without structured ATS transforms

## Assumptions
- `CV.md` is a reference/example for the manual markdown shape, not a runtime source file and not edited directly by Resume Studio.
- Manual mode is per version, because it is stored in the version payload.
- Manual mode is the whole page, not “structured header + markdown body”.
- Manual mode publishes exactly what is written, including any inline contact details.
- Switching modes is non-destructive, but there is no reverse markdown-to-structured conversion.
