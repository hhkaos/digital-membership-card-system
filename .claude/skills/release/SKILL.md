---
name: release
description: Create a new versioned release with changelog, git tag, and GitHub Release
disable-model-invocation: true
---

Follow these steps to create a new release:

## 1. Review unreleased changes

Read `CHANGELOG.md` and show the user all items under `[Unreleased]`. Ask the user to confirm these are the changes they want to include in the release. If the `[Unreleased]` section is empty, stop and inform the user there is nothing to release.

## 2. Suggest version number

Look at the previous version in `CHANGELOG.md` (e.g. `[2.0]`) and analyze the unreleased changes to recommend a version bump:

- **Major** (e.g. `2.0` → `3.0`) — breaking changes, architectural rewrites, or incompatible API changes
- **Minor** (e.g. `2.0` → `2.1`) — new features, enhancements, or non-breaking additions
- **Patch** (e.g. `2.1` → `2.1.1`) — bug fixes only, no new features

Explain the reasoning and let the user confirm or override the suggested version.

## 3. Update project documentation

### CHANGELOG.md

- Rename `## [Unreleased]` to `## [<version>] - <today's date>` (format: `YYYY-MM-DD`)
- Add a new empty `## [Unreleased]` section above it
- Preserve all existing content below

### docs/TODO.md

Read `docs/TODO.md` and update it to reflect the release:

- Mark completed tasks as `[x]`
- Update phase status labels (e.g. `⬜ TODO` → `🚧 IN PROGRESS` → `✅ COMPLETE`)
- Update the V2 Progress Tracking section
- Update test counts or other metrics
- Update the V2 Success Criteria checklist if applicable

### docs/SPEC.md

Read `docs/SPEC.md` and update it if the release includes changes that affect the specification:

- Update acceptance criteria checkboxes
- Reflect any architecture, feature, or dependency changes
- Update the document version and last updated date in the metadata section
- Skip if the release is purely internal

### package.json versions

Set the `version` field to the new version in:

- `issuer/package.json`
- `verification/package.json`

## 4. Regenerate documentation

Run `npm run docs:generate` to rebuild the HTML documentation from the updated markdown files.

## 5. Run tests

Run `npm test` from the repo root to ensure everything passes before releasing. If tests fail, stop and inform the user.

## 6. Build assets

Run `npm run build` in both `issuer/` and `verification/` directories. Then create zip archives:

- `zip -r issuer-v<version>.zip issuer/dist`
- `zip -r verification-v<version>.zip verification/dist`

## 7. Stage, commit, and push

Stage the modified files (`CHANGELOG.md`, `docs/TODO.md`, `docs/SPEC.md`, `issuer/package.json`, `verification/package.json`) by name. Ask the user which alias to use:

- **`git cai`** — AI-attributed commit (sets author to "AI Generated (hhkaos)" and prefixes the message with "AI: ")
- **`git ch`** — Regular commit with the user's default git identity

Commit with message: `release: v<version>`

Then push with `git push`.

## 8. Create git tag

Run `git tag v<version>` and `git push --tags`.

## 9. Create GitHub Release

Use `gh release create` to create the release on GitHub:

```
gh release create v<version> \
  --title "v<version>" \
  --notes "<changelog entries for this version>" \
  issuer-v<version>.zip \
  verification-v<version>.zip
```

The `--notes` should contain the full changelog entries for this version (the Added, Changed, Fixed, Removed sections) formatted in markdown.

## 10. Clean up

Remove the temporary zip files:

- `rm issuer-v<version>.zip verification-v<version>.zip`

Confirm the release is live by showing the GitHub Release URL.
