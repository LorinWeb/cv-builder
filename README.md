# My Resume

This repo contains the code for a resume site template. It ships with public sample data by default and automatically switches to a private local JSON file when you create one.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server with the committed sample resume data
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Resume Data Setup

Copy `src/data/resume.sample.json` to `src/data/resume.private.json`, then edit `src/data/resume.private.json`.

When `src/data/resume.private.json` exists, the app uses it automatically. Otherwise it falls back to the sample data.

Your resume data may include `basics.email` and `basics.phone`. The public web build strips `email` and `phone` out of the browser bundle so they are not rendered on the live page.

## Profile Photo Setup

The public sample resume includes a committed placeholder portrait at `public/static/profile-placeholder.jpg`. It shows the intended portrait crop and frame for consumers of the template.

To use a private local photo without committing it:

1. Place the real image at `public/static/private/profile.jpg`
2. Point your private resume JSON at that file:

```json
{
  "basics": {
    "photo": {
      "src": "/static/private/profile.jpg",
      "alt": "Portrait of Your Name"
    }
  }
}
```

The `public/static/private/` directory is ignored by git. If `basics.photo.src` points to a local `/static/...` file, the build validates that the file exists under `public/` and fails with a clear error if it does not.

## PDF Download Feature

A downloadable PDF copy of the CV is generated during dev and production builds.

That PDF can contain private contact details, while the live web version excludes `email` and `phone` from the shipped client bundle so the information is harder to harvest by spam bots and malicious actors.
