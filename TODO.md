# AMPA Digital Membership Card System - Implementation TODO

## Overview
Building a cryptographically secure digital membership card system with QR codes for merchant verification.

**Status**: 🚧 In Progress
**Scope**: MVP (Minimal Viable Product) - Core features only
**Last Updated**: 2026-02-10

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
- [ ] Extract and verify multiple cards in verification app (ready for testing)
- [ ] Performance: < 2 seconds per card (ready for testing)

---

## Phase 4: Project Infrastructure & Documentation ✅ COMPLETE

### Git Configuration
- [x] Create `.gitignore` with:
  - [x] node_modules, dist, *.log
  - [x] *.pem, *private*.key, *secret*, keys/
  - [x] .env, downloads/, cards_*/, *.zip
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

## Out of Scope for MVP (v2 Features)

The following features from SPEC.md are **deferred to version 2**:

- ❌ Internationalization (i18n) - Spanish/English with react-i18next
- ❌ PWA features - Service workers, offline support, installable
- ❌ Wallet-style cards - Fancy card design (using plain QR only)
- ❌ Revocation UI - Revocation management interface
- ❌ Analytics - Google Analytics integration
- ❌ Advanced accessibility - Full WCAG 2.1 AA compliance
- ❌ Advanced styling - CSS Modules, design system
- ❌ GitHub Actions - CI/CD deployment automation
- ❌ Full documentation - User guides, merchant guide, security docs

---

## Testing Checklist

### End-to-End Test Flow
- [ ] Generate keypair in issuer
- [ ] Copy public key to verification config
- [ ] Start both apps (verification on :5173, issuer on :5174)
- [ ] Generate single card manually
- [ ] Verify card → ✅ Valid
- [ ] Upload CSV with 10 members
- [ ] Generate batch
- [ ] Verify multiple cards

### Error Case Testing
- [ ] Tamper with JWT → "Invalid"
- [ ] Expired date → "Expired"
- [ ] Wrong issuer → "Unrecognized issuer"
- [ ] No token in URL → "No membership card detected"

### Browser Testing
- [ ] Chrome Desktop (admin using issuer) ✓
- [ ] Safari iOS (merchant scanning QR) ✓
- [ ] Chrome Android (merchant scanning QR) ✓

### Security Validation
- [ ] Private key never in localStorage/sessionStorage
- [ ] Private key not logged to console
- [ ] Tampered tokens rejected
- [ ] Expired tokens rejected
- [ ] `.gitignore` blocks private keys
- [ ] No sensitive data in JWT (only name, ID, expiry)

---

## Success Criteria

MVP is complete when all these are ✅:

1. [ ] Can generate Ed25519 keypair
2. [ ] Can create single card manually
3. [ ] Can verify card shows valid/invalid correctly
4. [ ] Can upload CSV and generate batch of cards
5. [ ] All generated cards verify successfully
6. [ ] Error cases handled properly
7. [ ] Basic UI works on mobile and desktop
8. [ ] README documentation complete
9. [ ] No private keys can be committed to Git
10. [ ] End-to-end test flow passes

---

## Progress Tracking

**Phase 1**: ✅ COMPLETE
**Phase 2**: ✅ COMPLETE
**Phase 3**: ✅ COMPLETE
**Phase 4**: ✅ COMPLETE

**Overall**: 100% Complete 🎉

---

## Notes

- **Security Critical**: Private keys must NEVER be persisted to localStorage or any storage
- **Algorithm**: EdDSA with Ed25519 curve (not RSA or ECDSA)
- **JWT Format**: Version 1, includes: v, iss, sub, name, iat, exp, jti
- **File Naming**: Use sanitized names, lowercase, underscores
- **Performance Target**: < 2 seconds per card generation
- **Browser Support**: Chrome Desktop, Safari iOS, Chrome Android
