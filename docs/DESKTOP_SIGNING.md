# Issuer Desktop Packaging and Signing Guide

This guide defines the practical path to distribute the issuer app as an installable desktop app for non-technical users on Windows, macOS, and Linux.

## Quick Start (Personal Maintainer)

If you are the only maintainer and release from your own Mac:

1. Set required non-secret env vars in your shell:

```bash
export APPLE_SIGNING_IDENTITY='Developer ID Application: YOUR NAME (TEAMID)'
export APPLE_ID='your-apple-id@example.com'
export APPLE_TEAM_ID='YOURTEAMID'
```

2. Save app-specific password in Keychain (recommended):

```bash
security add-generic-password \
  -a "$APPLE_ID" \
  -s "ampa-issuer-notarytool" \
  -w '<app-specific-password>' \
  -U
```

3. Run:

```bash
cd issuer
npm run desktop:release:mac
```

This single command builds, signs, notarizes, staples, verifies, and writes checksums for the macOS installer.

Output location:
- `issuer/release/macos/*.dmg`
- `issuer/release/macos/SHA256SUMS.txt`

## 1. Recommended Approach

Use a desktop wrapper around the existing issuer web app, with no UI/logic fork.

- Recommended stack: Tauri + current `issuer/` React/Vite app
- Goal: double-click installer, app icon in OS launcher, no Node/npm required for end users

## 2. Release Model

Start simple, then harden:

1. Build installers per OS (manual install, no auto-update).
2. Add signing/notarization.
3. Add checksums and release notes.
4. Later: optional auto-update.

## 3. Windows Signing (Authenticode)

## 3.1 What you need

- Code signing certificate (OV or EV) issued to your organization.
- Private key available in secure store (or hardware token/HSM for EV).
- Windows signing toolchain (`signtool` from Windows SDK) in CI runner or signing machine.

## 3.2 Signing flow

1. Build unsigned installer (`.exe`/MSI).
2. Sign binaries and installer with SHA-256 digest.
3. Timestamp signature using a trusted timestamp server.
4. Verify signature before publishing.

## 3.3 Typical command shape

```bash
signtool sign /fd SHA256 /tr <TIMESTAMP_URL> /td SHA256 /a <PATH_TO_ARTIFACT>
signtool verify /pa <PATH_TO_ARTIFACT>
```

## 3.4 Practical notes

- EV certs improve SmartScreen reputation/bootstrap trust.
- Store cert material outside repo and inject via CI secrets or secure key vault.

## 4. macOS Signing + Notarization

## 4.1 What you need

- Apple Developer Program membership.
- Developer ID Application certificate.
- App-specific password and Team ID for notarization tooling.

## 4.2 Signing/notarization flow

1. Build `.app` and `.dmg`.
2. Sign app and installer with Developer ID.
3. Submit to Apple notarization service.
4. Wait for notarization success.
5. Staple notarization ticket to final artifact.
6. Verify Gatekeeper acceptance locally.

## 4.3 Typical command shape

```bash
codesign --deep --force --options runtime --sign "Developer ID Application: <ORG>" <APP_PATH>
xcrun notarytool submit <DMG_OR_ZIP> --apple-id <APPLE_ID> --team-id <TEAM_ID> --password <APP_PASSWORD> --wait
xcrun stapler staple <DMG_OR_APP>
spctl --assess --type execute --verbose <APP_PATH>
```

## 4.4 Practical notes

- Without notarization, many users will see security warnings/blocking.
- Keep signing identities and notarization credentials in secure CI secrets.

## 4.5 Automated command in this repo

The repo includes an automated script:

```bash
cd issuer
npm run desktop:release:mac
```

It executes this sequence automatically:
1. Build DMG via Tauri.
2. Sign `.app` and `.dmg`.
3. Notarize DMG with `notarytool`.
4. Staple tickets to `.app` and `.dmg`.
5. Run Gatekeeper validation.
6. Export artifact and checksums under `issuer/release/macos/`.

Required env vars (from your shell/session):
- `APPLE_SIGNING_IDENTITY`
- `APPLE_ID`
- `APPLE_TEAM_ID`

Password resolution order:
1. `APPLE_APP_SPECIFIC_PASSWORD` env var (optional)
2. Keychain lookup item `ampa-issuer-notarytool` for account `$APPLE_ID`
3. Secure terminal prompt (hidden input)

## 5. Linux Distribution Trust

Linux app signing is less standardized than Windows/macOS.

Minimum recommended:

1. Publish SHA-256 checksums for every installer artifact.
2. Optionally sign checksums with GPG key.
3. Document verification steps for admins.

Typical checksum generation:

```bash
shasum -a 256 <artifact> > <artifact>.sha256
```

Optional GPG detached signature:

```bash
gpg --detach-sign --armor <artifact>.sha256
```

Automated checksums command:

```bash
cd issuer
npm run desktop:checksums
```

## 6. Secrets and Key Management

Never commit signing material.

- Store certificates/keys in CI secret manager or dedicated key vault.
- Restrict permissions to release maintainers.
- Rotate credentials on ownership/staff changes.
- Keep audit trail for every signed release.

## 7. CI Pipeline Blueprint

For each tagged release:

1. Build desktop artifacts on OS-specific runners.
2. Sign per platform.
3. Run smoke install/launch checks.
4. Generate checksums.
5. Publish GitHub Release assets:
   - Windows installer(s)
   - macOS DMG
   - Linux AppImage/DEB
   - checksums (+ optional `.asc` signatures)

Current status in repo:
- `.github/workflows/desktop.yml` builds unsigned desktop bundles per OS and uploads artifacts.
- Personal local macOS command handles signing/notarization end-to-end.

## 8. User-Facing Install Guidance

For non-technical users, provide a short release page checklist:

1. Download installer for your OS.
2. Verify signature/checksum only if instructed by admin.
3. Install and launch app from OS search menu.
4. If blocked by OS security prompt, follow documented trusted-publisher steps.

## 9. Project Integration Checklist

- Add desktop packaging workflow in `.github/workflows/`.
- Add release asset naming convention with version suffix.
- Link this guide from `README.md` and `docs/TODO.md`.
- Add recovery/runbook for expired certificates and failed notarization.
