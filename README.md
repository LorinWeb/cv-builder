# CV Builder

This repo now runs on a single markdown resume source: `src/data/resume.md`.

## Quick Start

```bash
npm install
npm run dev
```

Useful commands:

```bash
npm run build
npm run preview
npm run typecheck
npm run lint
```

## Resume Source

Edit `src/data/resume.md` directly if you want to change the published resume by hand.

The app, preview, SEO metadata, and PDF output all read from that same markdown file. There is no structured JSON resume model anymore, and there is no sample/private fallback pair.

## Resume Studio

Resume Studio is a local markdown authoring overlay available in development. It keeps version history in sqlite under `src/data/local/resume-studio.sqlite` and publishes the active version back to `src/data/resume.md`.

The studio is markdown-only:

1. Open the floating launcher.
2. Edit the full document markdown.
3. Let autosave persist the local draft history.
4. Publish when you want to update `src/data/resume.md`.

## PDF Download

A downloadable PDF copy of the resume is generated during development and production builds. Because the app is markdown-only, the web page, preview, and PDF all render the same document content.
