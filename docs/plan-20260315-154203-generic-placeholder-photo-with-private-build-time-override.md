# Generic Placeholder Photo with Private Build-Time Override

## Summary
- Add a photo to the profile area, centered above the rest of the profile data inside `ProfileSection`.
- Keep the public repo generic by committing a neutral placeholder image and using it in the public sample resume data.
- Keep your real photo out of git by loading it from an ignored local public asset path during your local/deploy build, with the path stored in your private resume JSON.

## Key Changes
- Extend `ResumeBasics` with an optional `photo` field shaped as `{ src: string; alt?: string }`.
- Update the Zod resume schema and resume data types to support that optional field.
- Commit a generic placeholder asset at `public/static/profile-placeholder.jpg`.
- Update the committed sample resume JSON so `basics.photo.src` points to `/static/profile-placeholder.jpg`, with alt text describing it as a placeholder/template image.
- Reserve an ignored private asset path for the real photo, for example `public/static/private/profile.jpg`, and add that directory pattern to `.gitignore`.
- Update the private resume path convention so your local/private JSON sets `basics.photo.src` to `/static/private/profile.jpg` and your preferred alt text.
- Render the photo in `ProfileSection` above the name/contact content, centered horizontally, with a fixed portrait frame and `object-fit: cover` so the placeholder communicates the expected crop clearly.
- Preserve existing layout behavior when `photo` is absent, but the committed sample should include the placeholder by default.
- Add build-time validation in the resume data loading path for site-relative local photo paths:
  - if `basics.photo.src` starts with `/static/`, resolve it against `public/`
  - fail build/dev/test with a clear error if the file is missing
  - skip filesystem validation for non-local URLs if that ever gets added later

## Implementation Notes
- Keep the photo path in resume data, not env-only config, so the template stays data-driven and the private override fits the existing `RESUME_DATA_PATH` pattern.
- Do not store the real photo in IndexedDB/local storage as the canonical source; that would only personalize one browser and would not reliably ship to `lorin.live`.
- Update README guidance to document:
  - the committed placeholder image
  - the ignored private image location
  - the private resume JSON override
  - the fact that your local/deploy build must have the private file present to ship the real photo

## Test Plan
- Add/adjust schema and loader tests to cover:
  - `basics.photo` is optional
  - valid local `/static/...` photo paths pass
  - missing local photo files fail with a clear error
- Add component/Playwright coverage for:
  - placeholder image renders in the sample/public build
  - photo is centered above the rest of the profile content
  - layout remains correct on mobile and print
- Update the existing resume visual snapshots to reflect the new generic placeholder image in the public sample build.

## Assumptions
- `lorin.live` is built locally or otherwise in an environment that has access to the ignored private asset file at build time.
- The public template should show a generic placeholder image by default, not no image.
- The real private photo should not be committed to the public repo.
- The profile photo should appear in both screen and print output.
