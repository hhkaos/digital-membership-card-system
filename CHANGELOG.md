# Changelog

All notable changes to this project are documented in this file.

The format is intentionally simple and commit-driven:
- Add entries continuously while implementing changes (not only at release time).
- Each functional commit MUST update `CHANGELOG.md`.
- Group entries under `Unreleased` until a version is cut.
- At release time, move `Unreleased` items to a dated/versioned section.

## [Unreleased]

### Added
- i18n foundation for `verification` and `issuer` apps with local language resources (`es`, `en`) and persistence of selected language.
- Revocation management enhancements in issuer: load/merge existing `revoked.json`, URL source selection (local/deployed), QR PNG identifier lookup, and safer merge behavior to avoid overwriting prior revocations.
- Claude Code `/ship` skill for automated commit workflow (stage, changelog, commit, push) with `git cai`/`git ch` alias support.

### Changed
- Verification revoked state UI now shows "Membership Revoked" with member name on second line.
- Verification technical details toggle alignment adjusted to center.
- Contact links in verification use configured contact URL.
- Issuer UI and generated card text are being localized progressively across components and PNG labels.

### Fixed
- UTF-8 decoding/parsing issues for Spanish characters in QR/token-derived data (e.g., `María García López`).
- Issuer revocation loader now surfaces HTTP 404 errors in the interface when `revoked.json` is missing.

## [2.0] - 2026-02-10

### Added
- Full technical rewrite of the platform specification and architecture.
- PWA-based issuer workflow and React-based verification app design.

### Changed
- Issuer approach changed from CLI to PWA.
- Security, i18n, accessibility, and deployment requirements were expanded and clarified.
