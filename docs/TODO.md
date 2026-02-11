# AMPA Digital Membership Card System - Implementation TODO

## Overview

Building a cryptographically secure digital membership card system with QR codes for merchant verification.

**Status**: 🚧 V2 In Progress (MVP Complete)
**Scope**: V2 — Revocation, i18n, wallet cards, PWA, accessibility, deployment, analytics, desktop installers
**Last Updated**: 2026-02-11

---

## Phase 1: Verification App Foundation ✅ COMPLETE

### Project Setup

- [x] Create verification app with Vite + React
- [x] Install dependencies: `jose` for JWT verification
- [x] Copy logo to `verification/public/ampa-logo.png`
- [x] Create folder structure: `src/utils`, `src/components`

### Core Verification Logic (`verification/src/utils/verify.js`)

- [x] `parseTokenFromFragment()` - Extract JWT from URL `#token=...`
- [x] `verifyToken()` - Verify JWT signature with EdDSA Ed25519
- [x] `validateExpiry()` - Check expiration with 120s clock skew
- [x] Error handling: INVALID_SIGNATURE, EXPIRED, WRONG_ISSUER, MALFORMED, NO_TOKEN

### Configuration (`verification/src/config.json`)

- [x] Create config with issuer, publicKey placeholder, clockSkew
- [x] Add branding colors: #30414B (primary), #52717B (secondary)
- [x] Set revocationEnabled: false for MVP

### UI Components (`verification/src/components/VerificationResult.jsx`)

- [x] LoadingState - Spinner + "Verifying membership..."
- [x] ValidState - ✅ Green checkmark, member name, expiry date
- [x] InvalidState - ❌ Red X, error message, expandable technical details
- [x] Add inline styles with branded colors

### Main App (`verification/src/App.jsx`)

- [x] Parse token from URL fragment on mount
- [x] Handle "no token" case
- [x] Call verification and render appropriate state
- [x] Error boundary for graceful failures

### Milestone 1 ✓

- [x] Can verify hardcoded test JWT
- [x] Shows valid/invalid states correctly
- [x] Test with tampered token (should fail)

---

## Phase 2: Issuer Core - Key Management & Manual Cards ✅ COMPLETE

### Project Setup

- [x] Create issuer app with Vite + React
- [x] Install dependencies: `jose`, `qrcode.react`, `uuid`
- [x] Copy logo to `issuer/public/ampa-logo.png`
- [x] Create folder structure: `src/utils`, `src/components`

### Cryptography Utilities (`issuer/src/utils/crypto.js`)

- [x] `generateKeypair()` - Create Ed25519 keypair with jose
- [x] `exportPrivateKey()` - Export to PEM format
- [x] `exportPublicKey()` - Export to PEM format
- [x] `importPrivateKey()` - Import from PEM string
- [x] `signJWT()` - Create signed JWT with EdDSA algorithm
- [x] **SECURITY**: Private key in React state ONLY (never localStorage)

### Key Management UI (`issuer/src/components/KeyManagement.jsx`)

- [x] "Generate Keypair" button with crypto.generateKeypair()
- [x] Display private & public keys in textareas
- [x] Security warnings (red alert box with 3 warnings)
- [x] "Import Keypair" textarea with validation
- [x] Key status indicator: "✅ Key loaded" or "⚠️ No key loaded"
- [x] Show public key fingerprint (last 8 chars)

### QR Code Generation (`issuer/src/utils/qr.js`)

- [x] `generateQRUrl()` - Format: `https://verify.ampanovaschoolalmeria.org/verify#token=${jwt}`
- [x] `QRCodeComponent` - Wrapper with branding (colors: #30414B fg, #FFFFFF bg)
- [x] Error correction: High (30%)
- [x] Size: 300x300px

### Card Image Generation (`issuer/src/utils/card.js`)

- [x] `generatePlainQRCard()` - Plain PNG with logo, QR, name, expiry
- [x] Use HTML Canvas API (800x1200px portrait)
- [x] File download as: `{memberID}_{sanitizedName}.png`
- [x] Sanitization: spaces → `_`, remove special chars, lowercase

### Manual Entry Form (`issuer/src/components/ManualEntry.jsx`)

- [x] Form fields: full name, member ID, expiry date
- [x] Validation: all required, date in future
- [x] Inline error messages
- [x] "Generate Card" button logic:
  - [x] Validate form
  - [x] Create JWT payload with auto-generated jti (UUID)
  - [x] Sign with private key
  - [x] Generate QR code
  - [x] Create card image
  - [x] Trigger download

### Main App (`issuer/src/App.jsx`)

- [x] State management for private key
- [x] Navigation between KeyManagement and ManualEntry
- [x] Security: Clear key on unmount

### Milestone 2 ✓

- [x] Generate keypair in issuer
- [x] Copy public key to verification config
- [x] Create single card manually
- [x] Download PNG card
- [x] Verify card in verification app → shows ✅ Valid

---

## Phase 3: CSV Batch Processing ✅ COMPLETE

### Additional Dependencies

- [x] Install: `papaparse`, `date-fns`, `jszip`

### CSV Parsing (`issuer/src/utils/csv.js`)

- [x] `parseCSV()` - Use papaparse to parse CSV file
- [x] `validateRow()` - Validate required fields (full_name, member_id, expiry_date)
- [x] `parseDateFlexible()` - Support formats: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, D/M/YYYY
- [x] Return structure: { valid: [], errors: [] }

### CSV Upload Component (`issuer/src/components/CSVUpload.jsx`)

- [x] File input (accept: .csv)
- [x] Parse on upload with progress indicator
- [x] Preview table: Status | Line | Name | Member ID | Expiry Date
- [x] Status indicators: ✅ Valid, ❌ Error with inline message
- [x] Summary bar: "150 valid, 3 errors"
- [x] "Generate All Cards" button (disabled if errors)

### Batch Generation (`issuer/src/utils/batch.js`)

- [x] `generateBatch()` - Process all members
- [x] For each member:
  - [x] Auto-generate jti (UUID)
  - [x] Create JWT payload
  - [x] Sign with private key
  - [x] Generate QR code
  - [x] Create card image
  - [x] Add to ZIP
- [x] Progress indicator: "Generating cards... 25/150"
- [x] Create metadata.json
- [x] Package as: `cards_YYYY-YYYY.zip`

### Metadata Generation (`issuer/src/utils/metadata.js`)

- [x] `createMetadata()` - Generate metadata.json per SPEC format
- [x] Include: generated_at, school_year, issuer, total_cards, members array
- [x] Each member: member_id, name, jti, expiry, filename
- [x] Purpose: Track cards for revocation and renewals

### File Naming

- [x] Format: `{memberID}_{sanitizedName}.png`
- [x] Sanitization: spaces → `_`, remove accents (Raúl → raul), lowercase
- [x] ZIP structure: `cards_2024-2025.zip` with all PNGs + metadata.json

### Milestone 3 ✓

- [x] Upload CSV with 10 test members
- [x] Generate all cards successfully
- [x] Download ZIP file
- [x] Extract and verify multiple cards in verification app
- [x] Performance: < 2 seconds per card

---

## Phase 4: Project Infrastructure & Documentation ✅ COMPLETE

### Git Configuration

- [x] Create `.gitignore` with:
  - [x] node_modules, dist, \*.log
  - [x] *.pem, *private*.key, *secret\*, keys/
  - [x] .env, downloads/, cards\__/, _.zip
  - [x] .DS_Store, Thumbs.db

### Documentation

- [x] **Root README.md**:
  - [x] Project overview and purpose
  - [x] Architecture diagram (text-based)
  - [x] Quick start guide
  - [x] Links to both apps
  - [x] Security notes

- [x] **verification/README.md**:
  - [x] Installation, development, build commands
  - [x] Configuration: How to update public key
  - [x] Deployment instructions

- [x] **issuer/README.md**:
  - [x] Installation, development, build commands
  - [x] Usage: Generate keypair and cards
  - [x] CSV format specification
  - [x] Security warnings

- [x] **Sample CSV** (`issuer/examples/sample-members.csv`):
  - [x] Create with 5-10 sample rows
  - [x] Include all date formats for testing

---

## Phase 5: Testing & CI/CD ✅ COMPLETE

### Test Framework Setup

- [x] Install Vitest in verification app
- [x] Install Vitest in issuer app
- [x] Add `test` and `test:watch` scripts to both apps
- [x] Configure Vitest in both `vite.config.js` files
- [x] Add `.nvmrc` files (Node >= 20 required)
- [x] Add `engines` field to both `package.json` files

### Unit Tests - Verification App (13 tests)

- [x] `verify.test.js` — validateExpiry (5 tests)
- [x] `verify.test.js` — verifyToken: valid JWT, tampered, expired, wrong issuer, malformed, wrong key (8 tests)

### Unit Tests - Issuer App (63 tests)

- [x] `crypto.test.js` — keypair generation, PEM export/import, JWT signing, payload creation, PEM validation, fingerprints (22 tests)
- [x] `csv.test.js` — flexible date parsing (4 formats), row validation (17 tests)
- [x] `metadata.test.js` — metadata structure, school year, JSON serialization (8 tests)
- [x] `batch.test.js` — ZIP filename format (2 tests)
- [x] `card.test.js` — filename sanitization, card filename generation (10 tests)
- [x] `crypto-verify.test.js` — cross-app integration: sign in issuer, verify in verification (4 tests)

### Bug Fix Discovered by Tests

- [x] Fixed `verify.js`: Added handling for `ERR_JWT_EXPIRED` error code from jose (expired tokens were incorrectly reported as MALFORMED)

### Git Hooks (Husky)

- [x] Root `package.json` with husky setup
- [x] `.husky/pre-push` hook runs all tests before push
- [x] Shared with collaborators via Git (auto-installs on `npm install`)

### GitHub Actions CI

- [x] `.github/workflows/ci.yml` — runs on PRs and pushes to `main`
- [x] Verification and issuer tests run in parallel as separate jobs
- [x] CI status badge added to root README.md

---

# V2 Features

**Status**: 🚧 In Progress
**Approach**: Each phase is self-contained. Implement → test → verify manually → move on.
**Last Updated**: 2026-02-11

---

## Phase 6: Revocation System 🚧 IN PROGRESS

### Revocation Checking in Verification App

- [x] Add `checkRevocation(jti, sub, revocationUrl)` to `verify.js`
- [x] Fetch `revoked.json` with `cache: "no-store"` header
- [x] Check both `revoked_jti` and `revoked_sub` arrays
- [x] Soft-fail on network error (show warning, still display valid)
- [x] Add `REVOKED` error type
- [x] Update `config.json`: set `revocationEnabled: true`, add `revocationUrl`
- [x] Create `verification/public/revoked.json` (empty initial list)
- [x] Add revoked state UI to `VerificationResult.jsx` (❌ "Membership revoked")
- [x] Add soft-fail warning banner to valid results (⚠️ yellow)

### Revocation UI in Issuer App

- [x] Create `issuer/src/utils/revocation.js`:
  - [x] `createRevocationEntry(id, type)` with timestamp
  - [x] `addToRevocationList(list, id, type)`
  - [x] `removeFromRevocationList(list, id, type)`
  - [x] `exportRevocationJSON(list)`
  - [x] `importRevocationJSON(jsonString)` with validation
- [x] Create `issuer/src/components/RevocationManager.jsx`:
  - [x] Input for member ID or token ID (jti)
  - [x] Dropdown: revoke by jti or by sub
  - [x] "Add to Revocation List" button
  - [x] Current revocation list table with remove buttons
  - [x] Import existing revoked.json
  - [x] Export: download button + copy to clipboard + JSON preview
  - [x] Instructions for uploading to GitHub Pages
- [x] Add "Revocation" tab to `issuer/src/App.jsx`

### Phase 6 Tests

- [x] `verify.test.js` — Token with jti in `revoked_jti` → REVOKED
- [x] `verify.test.js` — Token with sub in `revoked_sub` → REVOKED
- [x] `verify.test.js` — Token not in list → VALID
- [x] `verify.test.js` — Fetch fails → VALID with warning (soft-fail)
- [x] `verify.test.js` — Empty revocation list → VALID
- [x] `verify.test.js` — `revocationEnabled: false` → skip check
- [x] `revocation.test.js` — Add jti to list
- [x] `revocation.test.js` — Add sub to list
- [x] `revocation.test.js` — Remove entry from list
- [x] `revocation.test.js` — Import/export JSON roundtrip
- [x] `revocation.test.js` — Reject malformed JSON
- [x] `revocation.test.js` — No duplicate entries
- [x] `revocation.test.js` — `updated_at` updates on changes

### Phase 6 Manual Verification

- [x] Revoke token by jti → verification shows ❌ "Membership revoked"
- [ ] Revoke by sub → all member's cards show revoked
- [ ] Network error → shows ✅ valid with ⚠️ warning
- [x] Export revoked.json → place in verification/public/ → works
- [x] All existing tests still pass

---

## Phase 7: Internationalization (i18n) ✅ COMPLETE

### Setup

- [x] ~~Install `react-i18next`, `i18next`, `i18next-browser-languagedetector`~~ — custom lightweight i18n solution used instead (React Context-based)
- [x] Add local i18n provider fallback in verification (network install blocked)
- [x] Add local i18n provider fallback in issuer (network install blocked)

### Verification App i18n

- [x] Create `verification/src/i18n.js` (config: default `es`, fallback `en`)
- [x] Create `verification/src/locales/es.json` (all UI strings in Spanish)
- [x] Create `verification/src/locales/en.json` (current English strings)
- [x] Replace hardcoded strings in `VerificationResult.jsx` with `t()` calls
- [x] Add language toggle (ES | EN) to header
- [x] Initialize i18n in app entrypoint (`main.jsx`) and consume in `App.jsx`
- [x] Localize date formatting (DD/MM/YYYY for ES, MM/DD/YYYY for EN)

### Issuer App i18n

- [x] Create `issuer/src/i18n.js`
- [x] Create `issuer/src/locales/es.json` (all UI strings in Spanish)
- [x] Create `issuer/src/locales/en.json` (current English strings)
- [x] Replace hardcoded strings in all components with `t()` calls:
  - [x] `KeyManagement.jsx`
  - [x] `ManualEntry.jsx`
  - [x] `CSVUpload.jsx`
  - [x] `RevocationManager.jsx`
  - [x] `App.jsx`
- [x] Add language toggle

### Phase 7 Tests

- [x] Spanish translations load correctly
- [x] English translations load correctly
- [x] All keys exist in both language files (no missing translations)
- [x] Language switching works
- [x] Browser language detection selects correct language
- [x] Date formatting changes per locale

### Phase 7 Manual Verification

- [x] Verification app displays in Spanish by default
- [x] Toggle to English → all strings change
- [x] All UI text translated (no hardcoded English remains)
- [x] All existing tests still pass (139 tests)

---

## Phase 9: PWA Features (Issuer) ✅ COMPLETE

### Setup

- [x] Install `vite-plugin-pwa` in issuer
- [x] Configure VitePWA in `issuer/vite.config.js`

### PWA Assets

- [x] Create `issuer/public/manifest.json` (name, icons, theme, display: standalone)
- [x] Generate PWA icons from logo (192x192, 512x512) in `issuer/public/icons/`

### Service Worker

- [x] Configure Workbox precaching for all app assets
- [x] Offline: full functionality (all crypto is client-side)

### Install Prompt

- [x] Create `issuer/src/components/InstallPrompt.jsx`
- [x] Detect `beforeinstallprompt` event
- [x] Show install banner with dismiss option
- [x] Hide after installation

### Phase 9 Tests

- [x] Manifest is valid JSON with required fields
- [x] All required icon sizes present
- [x] Service worker registers

### Phase 9 Manual Verification

- [x] Install on Chrome Desktop → opens standalone
- [x] Go offline → all features still work
- [x] Install prompt appears for new visitors
- [x] All existing tests still pass

---

## Phase 10: Accessibility (WCAG 2.1 AA) ⬜ TODO

### Verification App

- [ ] Semantic HTML: `<main>`, `<header>`, `<section>`, proper headings
- [ ] Alt text on all images (logo, status icons)
- [ ] ARIA: `role="status"`, `aria-live="polite"` for results
- [ ] Focus management: auto-focus result after verification
- [ ] Color contrast: 4.5:1 ratio for all text
- [ ] Keyboard: Tab through all interactive elements
- [ ] Touch targets: minimum 44x44px
- [ ] Skip link for screen readers

### Issuer App

- [ ] Form labels: all inputs have `<label>` elements
- [ ] Error announcements via `aria-live`
- [ ] Focus moves to error summary on validation failure
- [ ] Logical tab order
- [ ] Semantic HTML with heading hierarchy
- [ ] Color contrast check
- [ ] Touch targets: 44x44px minimum
- [ ] Progress announcements for batch generation

### Phase 10 Tests

- [ ] All images have alt attributes
- [ ] All form inputs have associated labels
- [ ] ARIA roles correctly applied
- [ ] Interactive elements keyboard-accessible

### Phase 10 Manual Verification

- [ ] Navigate both apps with keyboard only
- [ ] Test with VoiceOver (macOS)
- [ ] Focus indicators visible
- [ ] All existing tests still pass

---

## Phase 11: GitHub Pages Deployment 🚧 IN PROGRESS

### Deployment Workflow

- [x] Update `.github/workflows/pages.yml` to build and deploy to GitHub Pages
- [x] Build and publish both apps in one artifact (`verification/` root + `issuer/` subpath)
- [x] Configure trigger on push to `main`
- [ ] Set Vite `base` path in `verification/vite.config.js`
- [x] Set Vite `base` path in `issuer/vite.config.js` to `/issuer/`
- [ ] Create `verification/public/CNAME` for custom domain

### Phase 11 Verification

- [ ] Push to main → auto-deploys verification app
- [ ] Custom domain works with HTTPS
- [ ] Token verification works on production URL
- [ ] `revoked.json` accessible at deployed URL
- [ ] All existing tests still pass

---

## Phase 12: Analytics (Optional) ✅ COMPLETE

### Analytics Module

- [x] Create `verification/src/utils/analytics.js`
- [x] `initAnalytics(config)` — only load if `analytics.enabled === true`
- [x] `trackPageView()` — track verification page loads
- [x] `trackVerificationResult(result)` — track success/failure/type
- [x] No PII tracking, IP anonymization enabled
- [x] Add analytics config to `verification/src/config.json` (disabled by default)
- [x] Integrate in `App.jsx`

### Phase 12 Tests

- [x] Analytics not loaded when `enabled: false`
- [x] Analytics initializes when `enabled: true`
- [x] No PII in tracked events

### Phase 12 Manual Verification

- [ ] Default: no analytics scripts loaded
- [ ] Enable in config → events tracked
- [x] All existing tests still pass

---

## Phase 13: Desktop Installer Distribution (Issuer) 🚧 IN PROGRESS

### Packaging Strategy

- [x] Add desktop wrapper for issuer app (recommended: Tauri)
- [x] Reuse current issuer React/Vite build (no feature fork)
- [ ] Produce installers for:
  - [ ] Windows (`.exe` / MSI)
  - [ ] macOS (`.dmg` + `.app`)
  - [ ] Linux (`.AppImage` and/or `.deb`)

### UX and Security

- [ ] Add first-run checks (issuer version, build info, basic diagnostics)
- [ ] Decide private key persistence mode for desktop app:
  - [ ] Session-only mode (current behavior)
  - [ ] Optional secure OS storage (keychain/credential vault)
- [ ] Document update policy (manual download first, auto-update later)

### Signing and Trust

- [ ] Define certificate ownership model (organization-owned signing identities)
- [ ] Windows: Authenticode signing configured in release pipeline
- [ ] macOS: Developer ID signing + notarization + stapling configured
- [ ] Linux: publish checksums + optional GPG signatures
- [x] Create operator runbook: `docs/DESKTOP_SIGNING.md`

### CI/CD and Release Assets

- [x] Add GitHub Actions workflow to build desktop installers per OS
- [x] Temporarily disable installer generation in CI build process
- [ ] Upload all installers as GitHub Release assets
- [ ] Include SHA-256 checksums for every artifact
- [ ] Smoke test install/uninstall on clean VMs

### Phase 13 Manual Verification

- [ ] Non-technical user can install on Windows without terminal
- [ ] Non-technical user can install on macOS without terminal
- [ ] Non-technical user can install on Linux without terminal
- [ ] App appears in OS launcher/search and opens standalone
- [ ] Existing issuer/verifier tests still pass

---

## V2 Progress Tracking

**Phase 6**: 🚧 IN PROGRESS — Revocation system (code complete, manual verification pending)
**Phase 7**: ✅ COMPLETE — Internationalization (i18n)
**Phase 9**: ✅ COMPLETE — PWA features
**Phase 10**: ⬜ TODO — Accessibility (WCAG 2.1 AA)
**Phase 11**: 🚧 IN PROGRESS — GitHub Pages deployment
**Phase 12**: ✅ COMPLETE — Analytics (optional)
**Phase 13**: 🚧 IN PROGRESS — Desktop installer distribution scaffold + signing runbook

**V2 Overall**: ~30% Complete (3 of 8 phases done or near-done)

---

## V2 Success Criteria

V2 is complete when all these are ✅:

1. [ ] Revocation system works end-to-end
2. [x] Both apps available in Spanish and English
3. [ ] Wallet-style cards generate professional PNGs
4. [ ] Issuer app installable as PWA, works offline
5. [ ] WCAG 2.1 AA compliance in both apps
6. [ ] Verification app auto-deploys to GitHub Pages
7. [ ] Optional analytics working when enabled
8. [ ] All new features have unit tests
9. [ ] All existing tests still pass (76+ tests)
10. [ ] Issuer desktop installers available for Windows/macOS/Linux with trusted signing process

---

## Notes

- **Node.js**: >= 20 required (`.nvmrc` files provided, run `nvm use`)
- **Security Critical**: Private keys must NEVER be persisted to localStorage or any storage
- **Algorithm**: EdDSA with Ed25519 curve (not RSA or ECDSA)
- **JWT Format**: Version 1, includes: v, iss, sub, name, iat, exp, jti
- **File Naming**: Use sanitized names, lowercase, underscores
- **Performance Target**: < 2 seconds per card generation
- **Browser Support**: Chrome Desktop, Safari iOS, Chrome Android
- **Testing**: Vitest (76 tests), pre-push hook (Husky), CI (GitHub Actions)
- **V2 Approach**: Implement each phase incrementally, test and verify before moving on
