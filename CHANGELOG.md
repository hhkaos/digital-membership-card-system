# Changelog

All notable changes to this project are documented in this file.

The format is intentionally simple and commit-driven:
- Add entries continuously while implementing changes (not only at release time).
- Each functional commit MUST update `CHANGELOG.md`.
- Group entries under `Unreleased` until a version is cut.
- At release time, move `Unreleased` items to a dated/versioned section.

## [Unreleased]

### Added
- GitHub issue templates (bug report, feature request) and PR template for standardized contributions.
- SECURITY.md with vulnerability reporting process and security model documentation.
- CODE_OF_CONDUCT.md (Contributor Covenant v2.1).
- FUNDING.yml linking to rauljimenez.info for sponsorship inquiries.
- Roadmap section in README.md with V2 phase status table.
- `docs/LOCAL_SETUP.md` with end-to-end local setup (keys, config, issuing, verification).
- Issuer PWA setup with `vite-plugin-pwa`, manifest/icons, service worker registration, and install prompt component.
- PWA validation tests in issuer for manifest fields, required icon sizes, and service-worker registration wiring.
- Initial Tauri desktop scaffold under `issuer/src-tauri/` with Rust entrypoint, app config, and desktop icon assets.
- GitHub Actions desktop workflow (`.github/workflows/desktop.yml`) to build unsigned installer artifacts for Linux, Windows, and macOS.
- `docs/DESKTOP_SIGNING.md` runbook covering Windows signing, macOS notarization, Linux checksum/GPG strategy, and release pipeline guidance.
- Automated personal macOS release scripts (`desktop:release:mac`) and checksum generation (`desktop:checksums`) for repeatable installer publishing.

### Changed
- Moved SPEC.md, PLAN.md, TODO.md into `docs/` folder to reduce root clutter.
- Updated all internal references to moved docs across README, CONTRIBUTING, skill files, and sub-app READMEs.
- Refactored root README into a concise entry point and added one-click live app links for verifier and issuer.
- Added direct README demo links for prefilled valid/revoked verification examples.
- Expanded GitHub Pages workflow to build and publish both apps (verification at root and issuer at `/issuer/`).
- Added browser-language detection coverage in both app i18n test suites.
- Set `issuer/vite.config.js` base path to `/issuer/` for GitHub Pages subpath deployment.
- Added root `npm run dev` script to run verification and issuer dev servers in parallel.
- Expanded issuer documentation with installability/offline troubleshooting and platform-specific app-launch guidance with official browser help links.
- Added issuer scripts for desktop packaging: `build:desktop`, `desktop:dev`, and `desktop:build`.
- Updated personal desktop release flow to avoid local secret files, using shell env vars plus macOS Keychain lookup for notarization password.
- Temporarily disabled installer generation in `.github/workflows/desktop.yml` to remove desktop installer distribution from the active build process.

### Fixed
- Issuer logo asset paths now use `import.meta.env.BASE_URL`, fixing missing logo rendering in local and `/issuer/` base-path environments.

### Removed
- `ROADMAP_ISSUE.md` (its roadmap content is now represented directly in project docs).

## [2.1] - 2026-02-11

### Added
- i18n foundation for `verification` and `issuer` apps with local language resources (`es`, `en`) and persistence of selected language.
- Revocation management enhancements in issuer: load/merge existing `revoked.json`, URL source selection (local/deployed), QR PNG identifier lookup, and safer merge behavior to avoid overwriting prior revocations.
- Claude Code `/ship` skill for automated commit workflow (stage, changelog, commit, push) with `git cai`/`git ch` alias support.
- Claude Code `/release` skill for creating versioned releases with changelog, git tags, and GitHub Releases with build artifacts.

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
