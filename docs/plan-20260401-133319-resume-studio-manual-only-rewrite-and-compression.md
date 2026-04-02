# Resume Studio Manual-Only Rewrite and Compression

## Summary
Rebuild Resume Studio around one manual markdown editing experience and aggressively delete legacy code. Keep the floating launcher, iframe-based live preview, version storage, and publish behavior, but remove all structured editing, mode switching, photo upload, step-based forms, versions tab UI, and other wizard-era abstractions. After the functional rewrite, do a second consolidation pass that reduces file fragmentation while preserving clear separation between overlay UI, preview, editor, and storage/runtime concerns.

## Key Changes
- Replace the current studio form model with a manual-only draft:
  - introduce a studio-local draft shape with just `markdown: string`
  - remove structured form types, step IDs, draft factories, field-array sync, and all structured draft conversion logic from the studio path
  - on open, derive the editor’s initial markdown from `draft.manual.markdown` when already manual, otherwise seed from the current structured resume using the existing structured-to-markdown export helper
  - on save/autosave/publish, apply the markdown back onto the current source resume as `mode: 'manual'` plus `manual.markdown`, while preserving existing non-manual fields in stored data
- Rebuild the overlay shell as a fullscreen split view:
  - replace the current modal card with a fixed fullscreen overlay
  - use a minimal top bar containing close, active version name, autosave status, publish, and a compact versions menu
  - below the top bar, render two full-height panes separated by a single vertical divider
  - left pane: full-height `TextEditor`
  - right pane: edge-to-edge preview with no card chrome, captions, gradients, or inset shell
- Keep the preview accurate but simplify its presentation:
  - retain the iframe preview pipeline and preview event flow
  - preserve full resume page dimensions and scale the full page to fit the preview pane
  - remove decorative preview framing and most preview-specific wrapper layers
- Keep versions, but simplify their UI and state surface:
  - remove the separate versions tab and fold create/select/delete into a compact top-bar menu
  - keep current version persistence semantics and publish behavior
  - trim `ResumeStudioState` to only the fields still used by launcher, controller, overlay, preview reset, and versions menu
- Remove dead feature surface from Resume Studio:
  - delete all structured editing components under `ui/steps`
  - delete `ResumeStudioEditTab`, `ResumeStudioManualEditor`, `ListItemsEditor`, `draft-sync-context`, and any field helpers only used by the removed structured UI
  - remove photo upload from Resume Studio UI/runtime/server since the manual-only editor does not support that authored flow
  - remove wizard-only state like `isWizardCompatible`, `warnings`, and session-persisted current step
- Extend `TextEditor` for document editing instead of introducing a second editor:
  - add a document/full-height mode or equivalent layout prop
  - reuse the block markdown toolbar/plugins
  - remove the current small max-height constraint in document mode so the editor fills its pane
  - keep `TextEditor` as the only studio editing surface
- Do a second compression pass after the rewrite:
  - collapse the current many-file UI structure into a small manual-only set
  - target a structure like:
    - one overlay composition file
    - one preview pane file
    - `TextEditor`
    - one controller hook
    - existing runtime/storage/server files, trimmed to only live behavior
  - merge resume-studio tests back into canonical files instead of carrying both legacy and manual-only spec files side by side
  - remove constants and helper abstractions that only existed to support deleted UI branches

## Public Interfaces / Types
- Keep app-level resume data support for both `structured` and `manual` resumes.
- Replace the studio-local form draft type with a manual-only draft shape.
- Extend `TextEditor` with a document/full-height editing mode.
- Keep version/publish API endpoints unless an internal simplification is strictly behavior-preserving.
- Simplify `ResumeStudioState` to the minimum fields still required by the new overlay.

## Test Plan
- UI integration:
  - launcher opens a fullscreen overlay
  - overlay renders a full-height split view with one vertical divider
  - `TextEditor` fills the editor pane and drives manual markdown editing
  - preview fills its pane without framed-card chrome
- Compatibility:
  - opening on an existing manual resume loads stored markdown
  - opening on a structured resume shows a seeded manual markdown draft immediately
  - seeded markdown does not change the published resume until autosave/publish writes the active version
- Versions/publish:
  - top-bar versions menu can create, select, and delete versions
  - switching versions swaps manual markdown correctly
  - publish continues to write `src/data/resume.private.json`
  - closing without publish restores the preview to the published draft
- Deletion/regression:
  - remove legacy structured Resume Studio UI tests and replace them with one manual-only canonical `resume-studio.ui.spec.ts`
  - merge any remaining manual store/server coverage into the existing store/server spec files where practical
  - keep only tests that still map to live product behavior

## Assumptions
- “Remove as much code as possible” means deleting dead Resume Studio features and abstractions, not changing the previously chosen product behavior of keeping versions and publish.
- Resume Studio becomes manual-only; the main resume app still supports structured rendering outside the studio.
- Photo upload and structured field editing are out of scope for the rewritten studio and should be removed from the studio surface.
- The preview remains iframe-based so it stays faithful to the actual rendered resume.
