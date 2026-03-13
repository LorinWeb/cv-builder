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

The committed `.env` points `RESUME_DATA_PATH` at `src/data/resume.sample.json`, so the project runs out of the box with fictional sample data.

To use a private local resume instead, create an untracked JSON file such as `src/data/resume.private.json` and add a `.env.local` file with:

```bash
RESUME_DATA_PATH=src/data/resume.private.json
```

`RESUME_DATA_PATH` is resolved relative to the repository root. The selected JSON file is validated during dev, build, and tests, and invalid or missing files fail with a clear error.

## Tech Stack

- React 19
- Vite
- TypeScript
- Zod
- Tailwind CSS
- date-fns
- Playwright
- Modern ES modules
