# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AMPA Digital Membership Card System — a cryptographically secure digital membership card platform for AMPA Novaschool Almería. Members receive QR-coded PNG cards that merchants scan to verify membership status. No backend required; verification is entirely client-side using EdDSA (Ed25519) signatures.

## Commands

```bash
# Install (root + both apps)
npm install && cd verification && npm install && cd ../issuer && npm install && cd ..

# Dev servers (both apps in parallel)
npm run dev                          # verification :5173, issuer :5174

# Tests
npm test                             # run both apps' tests sequentially
cd verification && npm test          # verification only
cd issuer && npm test                # issuer only
cd issuer && npm run test:watch      # watch mode (works in either app)

# Lint
cd verification && npm run lint
cd issuer && npm run lint

# Build
cd verification && npm run build     # output: verification/dist/
cd issuer && npm run build           # output: issuer/dist/
```

A Husky pre-push hook runs `npm test` automatically.

## Architecture

### Two-App Monorepo

- **`verification/`** — Public static web app (React 19 + Vite 7). Merchants scan a QR code which opens a URL with `#token=<JWT>`. The app verifies the JWT signature client-side using an embedded public key (`src/config.json`) and checks revocation status against a static `revoked.json`.
- **`issuer/`** — Admin PWA (React 19 + Vite 7 + vite-plugin-pwa). Used locally by AMPA admins to generate Ed25519 keypairs, sign JWTs, render 800x1200px PNG membership cards with QR codes, handle batch CSV imports (→ ZIP with cards + metadata.json), and manage revocations. Private keys exist only in browser memory.

The apps share no code but are cryptographically linked: issuer signs tokens with Ed25519 private key, verification validates with the corresponding public key.

### Data Flow

```
Issuer generates keypair → Signs JWT per member → Renders PNG card with QR →
Member shows QR → Merchant scans → Verification app parses #token=<JWT> →
Verifies EdDSA signature + expiry + revocation → Shows ✅ or ❌
```

### Key Technical Details

- **Crypto**: EdDSA Ed25519 via `jose` library. JWT payload: `{v, iss, sub, name, iat, exp, jti}`
- **Revocation**: Two levels — by `jti` (single card) or `sub` (member-wide). Stored in `verification/public/revoked.json`
- **i18n**: Both apps support Spanish (es) and English (en) via `src/i18n.js` + `src/locales/`
- **Issuer tabs**: Key Management → Manual Entry → CSV Batch Upload → Revocation Manager
- **CSV format**: columns `full_name,member_id,expiry_date` (accepts YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY)
- **Config**: `verification/src/config.json` holds public key, issuer name, branding colors, revocation settings

### Deployment (GitHub Pages)

Verification deploys at domain root (`/`), issuer at `/issuer/` subpath. The `issuer/vite.config.js` uses `base: '/issuer/'`. CI runs tests on push/PR; Pages workflow builds both apps and combines artifacts.

## Git Conventions

- **Conventional commits**: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- **AI commits**: use `git cai "message"` (prefixes with "AI: ", sets AI author). Human commits: `git ch "message"`
- **Custom skills**: `/ship` (commit + push with doc updates) and `/release` (versioned release with tag + GitHub Release)
- When shipping (`/ship`), update `CHANGELOG.md` (under `[Unreleased]`), `docs/TODO.md`, and `docs/SPEC.md` if feature-related
- When shipping (`/ship`), if `docs/manuals/end-user/**` changed, run `npm run docs:generate` and include regenerated `*/public/docs/*` files
- Stage files by name — never use `git add -A` or `git add .`
- Never commit `.pem` files, private keys, or real member data
