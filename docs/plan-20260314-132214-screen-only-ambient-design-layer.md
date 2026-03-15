# Screen-Only Ambient Design Layer

## Summary
Add a screen-only ambient layer behind the resume using a single fixed `<canvas>`. The visual is a large diagonal branded overlay with a softened edge and lower-corner glow derived from `--color-primary`, not a particle field or mesh/blob system. The resume must render immediately, print output must stay unchanged, and on screen below `md` the page wrapper should go full width, lose its box shadow, and drop its outer vertical spacing.

## Implementation Changes
- Add one public component under `src/components` with a named export and `data-testid` hooks for the host and canvas.
- Render it once near the top of the app shell so it sits behind the page content, is fixed to the viewport, non-interactive, and hidden for print.
- Draw one diagonal overlay composition on the canvas:
  - the main diagonal shape,
  - a broad softened edge along that diagonal,
  - a subtle corner glow to keep the composition from feeling flat.
- Size the canvas to the viewport with a safe DPR cap and redraw on resize.
- Read the ambient color from `--color-primary` with a fallback.
- Let scroll subtly shift the diagonal treatment when reduced motion is not requested.
- Add only the screen CSS needed for layer visibility, page isolation, and the small-screen page-shell override.

## Public Interfaces / Behavior
- No resume data, schema, or dependency changes.
- The ambient layer takes no props in v1; it derives behavior from window events and media queries.
- `prefers-reduced-motion: reduce` switches the scene to static rendering.
- The layer remains decorative only and must not affect pointer interaction or print layout.
- On small screens, the page should read as a full-bleed sheet over the ambient field rather than a centered card.

## Test Plan
- Run `npm run lint`, `npm run typecheck`, and `npm run test:visual`.
- Keep screen and print screenshots deterministic by using reduced-motion emulation in visual tests.
- Verify that the ambient host/canvas render on screen, remain non-interactive, switch to static mode for reduced motion, and disappear in print.
