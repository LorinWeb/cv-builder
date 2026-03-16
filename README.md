# My Resume

This repo contains the code for a resume site template. It ships with public sample data by default and supports a private local JSON override so the real CV content does not need to be committed.

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

By default the project loads `src/data/resume.sample.json`, so it runs out of the box with fictional sample data.

To use a private local resume instead, create an untracked JSON file such as `src/data/resume.private.json` and add a `.env.local` file with:

```bash
RESUME_DATA_PATH=src/data/resume.private.json
```

`RESUME_DATA_PATH` is resolved relative to the repository root. The selected JSON file is validated during dev, build, and tests, and invalid or missing files fail with a clear error.

When you use a private local resume file, it may include `basics.email` and `basics.phone`. The public web build strips `email` and `phone` out of the browser bundle so they are not rendered on the live page.

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
