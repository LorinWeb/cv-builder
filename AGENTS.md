# Repository Instructions

- Whenever a plan is approved, save it in `/docs` as a Markdown file named `plan-{timestamp}-{plan-title}.md`.
- Use the timestamp format `YYYYMMDD-HHMMSS`.
- Use a kebab-case slug for `{plan-title}`.
- Create the `/docs` directory if it does not already exist.
- These planning and plan-linked commit rules apply to AI-generated output in this repository.
- After executing an approved plan, do not commit immediately. First present the result to a human and wait for explicit approval before creating any commit.
- Commits that implement an approved plan must include a `Plan:` footer that references the matching `docs/plan-{timestamp}-{plan-title}.md` file.
- Never edit `package-lock.json` directly. If dependency changes are needed, let `npm` update the lockfile as a byproduct of package manager commands.
- Planned-work commits must use this shape:
- `<type>: <summary>`
- blank line
- `<detail line 1>`
- `<detail line 2>`
- blank line
- `Plan: docs/plan-YYYYMMDD-HHMMSS-plan-title.md`
- In repository documentation, reference files with relative paths only. Never use absolute filesystem paths.

# New component creation rules

- For new components under `src/components`, also follow the local instructions in `src/components/AGENTS.md`.
