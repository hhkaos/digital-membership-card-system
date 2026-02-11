---
name: release
description: Cut a versioned release by promoting Unreleased changelog entries, tagging, and publishing assets.
metadata:
  short-description: Create a complete versioned release
---

# Release

Use this skill when the user asks to create a formal project release.

## 1. Review unreleased changes

1. Read `CHANGELOG.md` and collect all items under `## [Unreleased]`.
2. Show those items to the user and ask for confirmation.
3. If Unreleased is empty, stop and report there is nothing to release.

## 2. Recommend version bump

1. Read latest released version from `CHANGELOG.md`.
2. Recommend `major`, `minor`, or `patch` based on unreleased content.
3. Explain reasoning and let user confirm or override target version.

## 3. Prepare release metadata

Use date format `YYYY-MM-DD`.

### `CHANGELOG.md`

1. Rename `## [Unreleased]` content block to `## [<version>] - <date>`.
2. Insert a new empty `## [Unreleased]` section above it.
3. Preserve older release sections unchanged.

### `docs/TODO.md`

- Reflect completed work and release status changes for impacted phases only.

### `docs/SPEC.md`

- Update only if release includes spec-impacting changes.
- If updated, align acceptance criteria and metadata fields.

### Package versions

Set `version` in:

- `issuer/package.json`
- `verification/package.json`

## 4. Verify quality gates

1. Run `npm test` from repo root.
2. If tests fail, stop and report failures before continuing.

## 5. Build and package artifacts

1. Build issuer: `cd issuer && npm run build`.
2. Build verification: `cd verification && npm run build`.
3. Create artifacts:
   - `zip -r issuer-v<version>.zip issuer/dist`
   - `zip -r verification-v<version>.zip verification/dist`

## 6. Commit release

1. Stage release files explicitly by name (no `git add -A` / `git add .`).
2. Ask user to choose commit alias:
   - `git cai`
   - `git ch`
3. Commit with message: `release: v<version>`.
4. Push branch.

## 7. Tag and publish

1. Create and push tag:
   - `git tag v<version>`
   - `git push --tags`
2. Create GitHub release with notes from changelog section and both zip files:

```bash
gh release create v<version> \
  --title "v<version>" \
  --notes "<changelog entries for this version>" \
  issuer-v<version>.zip \
  verification-v<version>.zip
```

3. Show the resulting release URL.

## 8. Clean up artifacts

Remove temporary zip files after successful release creation:

- `rm issuer-v<version>.zip verification-v<version>.zip`

## Safety constraints

- Stop on test/build failures and ask how to proceed.
- Never release without explicit user confirmation of version.
- Never stage secrets/private keys.
