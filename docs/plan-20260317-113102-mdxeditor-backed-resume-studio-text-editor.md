# MDXEditor-Backed Resume Studio Text Editor

## Summary

Replace the custom textarea-based `TextEditor` in Resume Studio with an `@mdxeditor/editor`-backed implementation that provides inline markdown preview while continuing to save markdown strings into the existing form state.

`TextEditor` remains the feature-local abstraction. `ListItemsEditor` keeps using `TextEditor`, so the editor swap applies to summaries, highlights, keywords, achievements, and courses through the existing shared paths.

## Key Changes

- Add `@mdxeditor/editor` via npm and load its required styles through the feature-local editor wrapper.
- Reimplement `src/features/resume-studio/ui/TextEditor.tsx` around MDXEditor instead of a native `<textarea>`.
- Keep the current `react-hook-form` contract:
  - input value in form state stays a markdown string
  - editor `onChange` writes markdown directly into the form
  - external form resets and version switches push markdown back into the editor
- Add two editor modes through `TextEditor` props:
  - `block` for summary fields
  - `inline` for list-item fields inside `ListItemsEditor`
- Keep the toolbar intentionally constrained to the markdown the resume renderer already supports:
  - block mode: bold, italic, links, inline code, bullet/numbered lists, undo/redo
  - inline mode: bold, italic, links, inline code, undo/redo
- Do not enable headings, tables, images, blockquotes, or raw HTML authoring.

## Interfaces

- `TextEditor` stays the only shared multiline editor in Resume Studio, but its internal implementation changes from native textarea to MDXEditor.
- `TextEditor` gains a mode-style prop for block versus inline authoring.
- `ListItemsEditor` continues to accept the same list metadata, but now passes the inline editor mode to `TextEditor`.
- No resume JSON schema changes, no storage/API changes, and no markdown conversion step beyond persisting the markdown string the editor emits.

## Test Plan

- Verify summary editors still save and preview markdown correctly.
- Verify list-item editors still save and preview markdown correctly through `ListItemsEditor`.
- Verify version switches and form resets replace editor content correctly.
- Verify toolbar-driven edits produce markdown that the existing preview/render pipeline accepts.
- Run:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
  - `npm run test:visual`

## Assumptions

- MDXEditor becomes the implementation behind `TextEditor`; it is not introduced as a parallel editor surface.
- The current markdown renderer remains the source of truth, so the editor toolbar is restricted to that supported subset.
- A WYSIWYG inline experience is preferred over preserving the prior autosizing textarea behavior.
