# Two-Way Proportional Scroll Sync for Resume Studio

## Summary
Implement scroll sync by treating the editor pane and the preview iframe as two separate scroll owners and synchronizing them through an explicit `postMessage` bridge. The iframe is not a blocker here because it is same-origin and already participates in parent/child preview messaging. The sync model should be proportional: both sides share a normalized scroll progress value (`0..1`), and whichever side the user scrolls becomes the active source.

## Key Changes
- Add stable refs/IDs for the two actual scroll owners:
  - the editor pane `ScrollArea.Viewport` in the parent app
  - the preview app `ScrollArea.Viewport` inside the iframe
- Extend Resume Studio’s internal frame messaging with scroll-sync messages:
  - `scroll-sync:ready` from iframe to parent when the preview viewport is mounted
  - `scroll-sync:update` from whichever side the user scrolls, carrying normalized progress
  - `scroll-sync:set` from parent to iframe when the editor leads or when the parent reapplies the shared ratio
- Parent-side sync orchestration should live with the iframe wrapper:
  - keep a `sharedProgressRef` as the canonical ratio
  - listen to editor viewport scroll events, compute `scrollTop / maxScrollTop`, and send that to the iframe
  - listen for iframe scroll messages and apply the same ratio to the editor viewport
  - use `requestAnimationFrame` throttling plus suppression flags so programmatic scroll updates do not echo back into loops
  - ignore tiny deltas with an epsilon threshold to prevent jitter
- Preview-side sync should live only in preview mode:
  - attach a scroll listener to the preview app’s `ScrollArea.Viewport`
  - post normalized progress to the parent when the user scrolls inside the iframe
  - listen for `scroll-sync:set` from the parent and set `viewport.scrollTop` proportionally
  - send `scroll-sync:ready` after the viewport ref exists so the parent can push the current shared ratio
- Preserve sync across content and layout changes:
  - keep the last shared ratio on both sides
  - observe viewport/content size changes with `ResizeObserver`
  - after editor content changes, preview rerenders, or pane resizes, reapply the stored ratio instead of leaving each side at its old absolute `scrollTop`
- Do not sync the iframe element itself and do not use the CSS-scaled outer preview shell for calculations:
  - all progress math must use the inner preview viewport inside the iframe
  - the iframe’s CSS transform is presentation-only and should not affect normalized scroll math

## Public Interfaces / Internal Protocol
- No user-facing data, storage, or API shape changes.
- Add internal Resume Studio message helpers/types for the new scroll-sync protocol alongside the existing preview-data message helpers.
- Keep the sync implementation internal to Resume Studio; no changes to resume JSON or publish behavior.

## Test Plan
- Editor-to-preview sync:
  - scroll the editor pane to a known ratio and assert the preview iframe viewport reaches the same normalized ratio
- Preview-to-editor sync:
  - scroll the preview iframe viewport and assert the editor pane follows proportionally
- Loop prevention:
  - verify programmatic sync updates do not trigger infinite bounce or visible jitter
- Reflow preservation:
  - edit content so scroll heights change, then assert both sides preserve the last normalized ratio after rerender
- Handshake/reload:
  - open the studio, wait for iframe readiness, and confirm sync works after iframe reloads or preview remounts
- No-overflow behavior:
  - when one side has no vertical overflow, sync should no-op cleanly and not show spurious movement

## Assumptions
- The preview iframe remains same-origin.
- The desired behavior is whole-document proportional sync, not semantic section/heading matching.
- Sync should be live and immediate while scrolling, with `requestAnimationFrame` throttling rather than delayed or smooth animated syncing.
- When the user starts scrolling the other pane, that pane becomes the new source of truth immediately.
