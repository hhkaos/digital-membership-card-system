# Implementation Plan: AMPA Digital Membership Card System (MVP)

## Context

The AMPA (Parents' Association) of Nova School Almeria needs a digital membership card system to allow local merchants to verify member status by scanning QR codes. Currently, they have no automated system - everything is manual.

**Problem**: Paper cards are easy to forge, hard to revoke, and require merchants to manually check membership lists.

**Solution**: Build a cryptographically secure digital card system with:
- QR codes containing signed JWT tokens (EdDSA Ed25519 algorithm)
- Static web verification app (no merchant accounts needed)
- Issuer tool for AMPA admins to generate cards from CSV files

**Current State**: Completely greenfield project - only SPEC.md and logo PNG exist.

**MVP Scope** (user selected): Core functionality only - verification, issuer, CSV processing. Skip advanced features like i18n, PWA, wallet-style cards, and revocation UI for initial release.

---

## Implementation Strategy

### Monorepo Structure
```
socios-ampa/
├── verification/          # Static web app for merchants
├── issuer/               # Web tool for AMPA admins
├── .gitignore
└── README.md
```

### Build Order
1. **Verification app first** - Simpler, establishes crypto foundation
2. **Issuer core** - Manual card generation
3. **CSV batch processing** - Bulk generation capability

### Technology Stack

**Verification App:**
- React 18 + Vite
- jose (JWT verification with EdDSA Ed25519)
- Simple CSS (inline styles for MVP)

**Issuer App:**
- React 18 + Vite
- jose (key generation + JWT signing)
- qrcode.react (QR generation)
- papaparse (CSV parsing)
- date-fns (flexible date parsing)
- jszip + uuid (batch download)

---

## Phase 1: Verification App Foundation

**Goal**: Working verification app that can validate JWT tokens

### Step 1.1: Project Setup
Create verification app structure:

```bash
cd /Users/hhkaos/workspace/socios-ampa
npm create vite@latest verification -- --template react
cd verification
npm install jose
```

**Critical files to create:**
- `verification/src/utils/verify.js` - JWT verification logic
- `verification/src/config.json` - Configuration (public key, issuer, colors)
- `verification/src/components/VerificationResult.jsx` - UI components
- `verification/src/App.jsx` - Main app with URL fragment parsing

### Step 1.2: Core Verification Logic

**File**: `verification/src/utils/verify.js`

Functions needed:
- `parseTokenFromFragment()` - Extract JWT from `#token=...` in URL
- `verifyToken(jwt, publicKey, issuer, clockSkew)` - Verify signature, expiry, issuer
- `validateExpiry(exp, clockSkew)` - Check expiration with 120s tolerance

Error types to handle:
- INVALID_SIGNATURE - Tampered token
- EXPIRED - Past expiration date
- WRONG_ISSUER - Different AMPA
- MALFORMED - Invalid JWT format
- NO_TOKEN - Missing from URL

**Key requirement**: Use jose library with EdDSA algorithm verification (Ed25519 curve)

### Step 1.3: Configuration File

**File**: `verification/src/config.json`

```json
{
  "issuer": "ampa:ampa-nova-school-almeria",
  "publicKey": "",  // Will be filled after keypair generation
  "clockSkewSeconds": 120,
  "branding": {
    "primaryColor": "#30414B",
    "secondaryColor": "#52717B",
    "organizationName": "AMPA Nova School Almeria"
  },
  "revocationEnabled": false  // MVP: Skip revocation
}
```

### Step 1.4: UI Components

**File**: `verification/src/components/VerificationResult.jsx`

Three states needed:
1. **LoadingState** - Spinner + "Verifying membership..."
2. **ValidState** - ✅ green checkmark, member name, expiry date
3. **InvalidState** - ❌ red X, error message, expandable technical details

Use inline styles for MVP (branded colors from config):
- Primary: #30414B
- Success: #28a745
- Error: #dc3545

**File**: `verification/src/App.jsx`

Logic:
1. On mount: Parse token from URL fragment
2. If no token: Show "No membership card detected"
3. If token: Verify and show appropriate state
4. Handle all error cases gracefully

### Step 1.5: Logo Integration

Copy logo to public folder:
```bash
cp images/ampa-logo.png verification/public/
```

Display in verification result header (use existing PNG, no conversion needed)

### Verification Milestone
- Can verify a hardcoded test JWT token
- Shows valid/invalid states correctly
- URL format: `http://localhost:5173/verify#token=<JWT>`
- Test with tampered token (should show "Invalid")

---

## Phase 2: Issuer Core - Key Management & Manual Cards

**Goal**: Generate keypairs and create individual signed cards

### Step 2.1: Project Setup

```bash
cd /Users/hhkaos/workspace/socios-ampa
npm create vite@latest issuer -- --template react
cd issuer
npm install jose qrcode.react uuid
```

**Critical files to create:**
- `issuer/src/utils/crypto.js` - Key generation and JWT signing
- `issuer/src/utils/qr.js` - QR code generation
- `issuer/src/utils/card.js` - Card image rendering
- `issuer/src/components/KeyManagement.jsx` - Key management UI
- `issuer/src/components/ManualEntry.jsx` - Single card generation form
- `issuer/src/App.jsx` - Main app with state management

### Step 2.2: Cryptography Utilities

**File**: `issuer/src/utils/crypto.js`

Critical functions:
- `generateKeypair()` - Create Ed25519 keypair using jose library
- `exportPrivateKey(key)` - Export to PEM format
- `exportPublicKey(key)` - Export to PEM format
- `importPrivateKey(pem)` - Import from PEM string
- `signJWT(payload, privateKey)` - Create signed JWT with EdDSA algorithm

**SECURITY CRITICAL**:
- Private key stored ONLY in component state (React useState)
- NEVER in localStorage, sessionStorage, or any persistent storage
- Cleared when user closes/refreshes page
- Clear warnings in UI about key security

JWT payload structure (per SPEC):
```javascript
{
  v: 1,  // Token schema version
  iss: "ampa:ampa-nova-school-almeria",  // Issuer identifier
  sub: memberID,  // Member ID (UUID format)
  name: fullName,  // Full member name
  iat: Math.floor(Date.now() / 1000),  // Issued-at timestamp
  exp: expiryTimestamp,  // Expiration (Unix seconds)
  jti: uuid()  // Unique token ID for revocation
}
```

### Step 2.3: Key Management UI

**File**: `issuer/src/components/KeyManagement.jsx`

Features:
1. **Generate Keypair Button**
   - Calls crypto.generateKeypair()
   - Displays both keys in textareas
   - Shows security warnings (red alert box):
     - "Store private key securely (password manager)"
     - "Never commit to Git repository"
     - "Losing this key means regenerating all member cards"

2. **Import Keypair**
   - Textarea for pasting private key (PEM format)
   - Validate format on blur
   - Extract and display public key
   - Store in component state only

3. **Key Status Indicator**
   - Show "✅ Key loaded" or "⚠️ No key loaded"
   - Display public key fingerprint (last 8 chars)

### Step 2.4: QR Code Generation

**File**: `issuer/src/utils/qr.js`

Functions:
- `generateQRUrl(jwt)` - Format: `https://verify.ampanovaschoolalmeria.org/verify#token=${jwt}`
- `QRCodeComponent` - Wrapper around qrcode.react with branding:
  - Foreground: #30414B (primary color)
  - Background: #FFFFFF (white)
  - Error correction level: High (30%)
  - Size: 300x300px

### Step 2.5: Card Image Generation (Plain QR Only for MVP)

**File**: `issuer/src/utils/card.js`

Function: `generatePlainQRCard(memberData, qrDataUrl)`

Simple PNG layout:
```
┌─────────────────────┐
│   [AMPA Logo]       │
│                     │
│   [QR CODE]         │
│                     │
│   Member Name       │
│   Valid until: date │
└─────────────────────┘
```

Implementation:
- Use HTML Canvas API to render
- Size: 800x1200px (portrait)
- Download as PNG: `{memberID}_{sanitizedName}.png`
- File sanitization: Replace spaces with `_`, remove special chars, lowercase

**Note**: Skip wallet-style cards for MVP (can add in Phase 4+)

### Step 2.6: Manual Card Entry Form

**File**: `issuer/src/components/ManualEntry.jsx`

Form fields:
- Full name (text input, required)
- Member ID (text input, required) - Recommend UUID format
- Expiry date (date picker, required)

Validation:
- All fields required
- Date must be in future
- Show inline error messages

"Generate Card" button:
1. Validate form
2. Create JWT payload with auto-generated jti (UUID)
3. Sign with private key
4. Generate QR code
5. Create card image
6. Trigger download

### Step 2.7: End-to-End Integration Test

**Critical milestone**:
1. Generate keypair in issuer
2. Copy public key to `verification/src/config.json`
3. Create single card manually in issuer
4. Download PNG card
5. Scan/copy JWT from card
6. Open verification app with token in URL: `http://localhost:5173/verify#token=<JWT>`
7. Verify shows ✅ Valid with member name and expiry date

**Success criteria**: Complete working flow from key generation → card creation → verification

---

## Phase 3: CSV Batch Processing

**Goal**: Generate 100+ cards from CSV file in one operation

### Step 3.1: Additional Dependencies

```bash
cd issuer
npm install papaparse date-fns jszip
```

### Step 3.2: CSV Parsing Utility

**File**: `issuer/src/utils/csv.js`

Functions:
- `parseCSV(file)` - Use papaparse to parse CSV file
- `validateRow(row, lineNumber)` - Validate required fields
- `parseDateFlexible(dateStr)` - Support multiple formats with date-fns:
  - `YYYY-MM-DD` (ISO 8601)
  - `DD/MM/YYYY`
  - `DD-MM-YYYY`
  - `D/M/YYYY` (single digits)

Return structure:
```javascript
{
  valid: [
    { fullName, memberId, expiryDate, lineNumber }
  ],
  errors: [
    { lineNumber, field, message }
  ]
}
```

Required CSV columns:
- `full_name` - Member's full name
- `member_id` - Unique member ID (recommend UUID)
- `expiry_date` - Expiration date (flexible formats)

### Step 3.3: CSV Upload Component

**File**: `issuer/src/components/CSVUpload.jsx`

Features:
1. **File Input**
   - Accept: `.csv` files only
   - Parse on upload
   - Show parsing progress

2. **Preview Table**
   - Display all rows with columns: Status | Line | Name | Member ID | Expiry Date
   - Status indicators:
     - ✅ Valid (green)
     - ❌ Error (red) - show inline error message
   - Summary bar: "150 valid, 3 errors"

3. **Inline Editing** (optional for MVP, can skip)
   - Allow fixing errors directly in table
   - Re-validate on change

4. **Generate All Cards Button**
   - Disabled if any errors present
   - Shows count: "Generate 150 Cards"

### Step 3.4: Batch Generation Logic

**File**: `issuer/src/utils/batch.js`

Function: `generateBatch(members, privateKey, config)`

Process:
1. For each member:
   - Auto-generate unique jti (UUID)
   - Create JWT payload
   - Sign with private key
   - Generate QR code
   - Create card image (plain QR format)
   - Add to ZIP file
2. Create metadata.json with card inventory
3. Package as ZIP: `cards_YYYY-YYYY.zip`
4. Return download

Progress indicator:
- Show: "Generating cards... 25/150"
- Update in real-time

### Step 3.5: Metadata Generation

**File**: `issuer/src/utils/metadata.js`

Function: `createMetadata(members, schoolYear)`

Format (per SPEC Appendix):
```json
{
  "generated_at": "2026-02-10T10:30:00Z",
  "school_year": "2024-2025",
  "issuer": "ampa:ampa-nova-school-almeria",
  "total_cards": 150,
  "members": [
    {
      "member_id": "12345",
      "name": "Raúl Jiménez",
      "jti": "9c1b3c63-7cc4-4d09-ae1b-3a7a2b5f1c10",
      "expiry": "2025-08-31T23:59:59Z",
      "filename": "12345_raul_jimenez.png"
    }
  ]
}
```

Purpose: Track all generated cards for future revocation and renewals

### Step 3.6: File Naming & Organization

ZIP structure:
```
cards_2024-2025.zip
├── 12345_raul_jimenez.png
├── 12346_maria_garcia.png
├── ...
└── metadata.json
```

File naming rules:
- Format: `{memberID}_{sanitizedName}.png`
- Sanitization:
  - Replace spaces with `_`
  - Remove accents (Raúl → raul)
  - Remove special characters
  - Lowercase
- Example: "Raúl Jiménez" → "raul_jimenez"

Folder naming:
- Format: `cards_YYYY-YYYY` (school year)
- Example: `cards_2024-2025`

### Verification Milestone
- Upload CSV with 10 test members
- Generate all cards successfully
- Download ZIP file
- Extract and verify multiple cards work in verification app
- Performance: < 2 seconds per card (20 seconds for 10 cards)

---

## Phase 4: Project Infrastructure & Documentation

**Goal**: Git setup, README, basic docs

### Step 4.1: Git Configuration

**File**: `.gitignore` (root)

```
# Dependencies
node_modules/
package-lock.json

# Build outputs
dist/
build/
*.log

# Environment
.env
.env.local

# Security - CRITICAL
*.pem
*private*.key
*secret*
keys/

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Generated files
downloads/
cards_*/
*.zip
```

**Critical**: Ensure private keys can never be committed

### Step 4.2: Root README

**File**: `README.md` (root)

Contents:
- Project overview and purpose
- Architecture diagram (text-based)
- Quick start guide
- Links to verification and issuer apps
- Security notes
- License

### Step 4.3: App-specific READMEs

**File**: `verification/README.md`
- Installation: `npm install`
- Development: `npm run dev`
- Build: `npm run build`
- Configuration: How to update public key
- Deployment: GitHub Pages instructions

**File**: `issuer/README.md`
- Installation: `npm install`
- Development: `npm run dev`
- Build: `npm run build`
- Usage: How to generate keypair and cards
- CSV format specification
- Security warnings

### Step 4.4: Sample CSV File

**File**: `issuer/examples/sample-members.csv`

```csv
full_name,member_id,expiry_date
Raúl Jiménez,550e8400-e29b-41d4-a716-446655440000,2025-08-31
María García,550e8400-e29b-41d4-a716-446655440001,31/08/2025
Pedro López,550e8400-e29b-41d4-a716-446655440002,2025-08-31
```

Include 5-10 sample rows for testing

---

## Critical Files Summary

### Verification App
1. **`verification/src/utils/verify.js`** - JWT verification with EdDSA Ed25519
2. **`verification/src/config.json`** - Public key and configuration
3. **`verification/src/components/VerificationResult.jsx`** - UI for valid/invalid states
4. **`verification/src/App.jsx`** - URL parsing and state management

### Issuer App
5. **`issuer/src/utils/crypto.js`** - Key generation and JWT signing with EdDSA
6. **`issuer/src/utils/qr.js`** - QR code generation with branding
7. **`issuer/src/utils/card.js`** - Plain QR card image rendering
8. **`issuer/src/utils/csv.js`** - CSV parsing with flexible date formats
9. **`issuer/src/utils/batch.js`** - Batch card generation
10. **`issuer/src/utils/metadata.js`** - Metadata JSON generation
11. **`issuer/src/components/KeyManagement.jsx`** - Key UI with security warnings
12. **`issuer/src/components/ManualEntry.jsx`** - Single card form
13. **`issuer/src/components/CSVUpload.jsx`** - Batch upload with validation
14. **`issuer/src/App.jsx`** - Main app with routing

### Infrastructure
15. **`.gitignore`** - Prevent private key commits
16. **`README.md`** (root) - Project documentation
17. **`verification/README.md`** - Verification app docs
18. **`issuer/README.md`** - Issuer app docs

---

## MVP Complete ✅

Phases 1-5 (Verification, Issuer, CSV Batch, Infrastructure, Testing & CI) are done.
See TODO.md for the full MVP checklist.

---

## V2 Implementation Plan

### Approach

Each V2 phase is **self-contained and testable**. Complete one phase, write tests, verify manually, then move to the next. Phases are ordered by user value and dependency.

---

## Phase 6: Revocation System

**Goal**: Allow AMPA admins to revoke individual tokens or all tokens for a member, and have the verification app check the revocation list.

**Why first**: Core security feature — without it, lost/stolen cards can't be invalidated.

### Step 6.1: Revocation Checking in Verification App

**File**: `verification/src/utils/verify.js` (modify existing)

Add revocation checking to the verification flow:
- `checkRevocation(jti, sub, revocationUrl)` — Fetch `revoked.json`, check both `revoked_jti` and `revoked_sub` arrays
- Use `cache: "no-store"` header to always get fresh data
- **Offline policy**: Soft-fail — if fetch fails, show warning "⚠️ Revocation status could not be checked" but still show valid result
- New error type: `REVOKED` — "Membership revoked"

**File**: `verification/src/config.json` (modify existing)

Update config:
```json
{
  "revocationEnabled": true,
  "revocationUrl": "/revoked.json",
  "offlinePolicy": "soft-fail"
}
```

**File**: `verification/public/revoked.json` (new)

Create empty revocation list:
```json
{
  "updated_at": "2026-02-11T00:00:00Z",
  "revoked_jti": [],
  "revoked_sub": []
}
```

**File**: `verification/src/components/VerificationResult.jsx` (modify existing)

- Add "revoked" state UI (❌ red, "Membership revoked")
- Add warning banner for soft-fail case (yellow ⚠️ on valid results)

### Step 6.2: Revocation UI in Issuer App

**File**: `issuer/src/components/RevocationManager.jsx` (new)

Features:
1. **Input section**: Text field for member ID or token ID (jti)
2. **Revocation type dropdown**: "Revoke specific token (jti)" or "Revoke all tokens for member (sub)"
3. **"Add to Revocation List" button**
4. **Current revocation list table**: Editable, shows all revoked IDs with type and timestamp
5. **"Remove from list" button** per row (undo mistakes)
6. **Import existing revoked.json**: Upload/paste to continue from previous list
7. **Export section**:
   - "Download revoked.json" button
   - "Copy to clipboard" button
   - Display JSON preview
   - Instructions text: "Upload this file to your GitHub Pages repository at verification/public/revoked.json"

**File**: `issuer/src/utils/revocation.js` (new)

Functions:
- `createRevocationEntry(id, type)` — Create entry with timestamp
- `addToRevocationList(list, id, type)` — Add jti or sub to appropriate array, update `updated_at`
- `removeFromRevocationList(list, id, type)` — Remove entry
- `exportRevocationJSON(list)` — Format as JSON string
- `importRevocationJSON(jsonString)` — Parse and validate format
- `validateRevocationList(list)` — Ensure correct structure

### Step 6.3: Integrate Revocation UI into Issuer App

**File**: `issuer/src/App.jsx` (modify existing)

- Add "Revocation" tab/section to navigation
- Render `RevocationManager` component
- No private key needed for revocation management

### Step 6.4: Tests

**Unit tests** (`verification/src/utils/verify.test.js` — add tests):
- Token with jti in `revoked_jti` → REVOKED
- Token with sub in `revoked_sub` → REVOKED
- Token not in revocation list → VALID
- Revocation fetch fails (network error) → VALID with warning (soft-fail)
- Empty revocation list → VALID
- `revocationEnabled: false` → Skip revocation check entirely

**Unit tests** (`issuer/src/utils/revocation.test.js` — new):
- Add jti to revocation list
- Add sub to revocation list
- Remove entry from list
- Import/export JSON roundtrip
- Validate malformed JSON rejection
- Duplicate entries handled (no duplicates added)
- `updated_at` timestamp updates on changes

### Milestone 6 ✓
- Revoke a token by jti → verification shows ❌ "Membership revoked"
- Revoke all tokens for member by sub → all that member's cards show revoked
- Offline/network error → shows ✅ valid with ⚠️ warning banner
- Export revoked.json → upload to verification/public/ → revocation works
- All tests pass

---

## Phase 7: Internationalization (i18n)

**Goal**: Support Spanish (primary) and English (fallback) in both apps.
**Status (2026-02-11)**: In progress. Verification i18n and issuer app-level i18n are implemented with a local provider fallback due blocked package install network access.

**Why second**: The AMPA is in Spain — Spanish should be the primary language. Most merchants and members will use Spanish.

### Step 7.1: Setup i18n Framework

Install in both apps:
```bash
cd verification && npm install react-i18next i18next i18next-browser-languagedetector
cd ../issuer && npm install react-i18next i18next i18next-browser-languagedetector
```

### Step 7.2: Verification App i18n

**File**: `verification/src/i18n.js` (new)

i18next configuration:
- Default language: `es` (Spanish)
- Fallback: `en` (English)
- Detection: Browser language preference
- Namespace: `translation`

**File**: `verification/src/locales/es.json` (new)

Spanish translations for:
- "Verificando socio..." (loading)
- "Socio válido" / "Socio no válido" (valid/invalid)
- "Válido hasta:" (valid until)
- "Carnet caducado" (expired)
- "Carnet dado de baja" (revoked)
- "Carnet de socio no detectado" (no token)
- "Emisor no reconocido" (wrong issuer)
- "Formato de carnet no válido" (malformed)
- "Detalles técnicos" (technical details)
- "⚠️ No se pudo verificar el estado de revocación" (revocation warning)
- "Este carnet es válido para descuentos" (valid instruction)

**File**: `verification/src/locales/en.json` (new)

English translations (current hardcoded strings).

**File**: `verification/src/components/VerificationResult.jsx` (modify)

- Replace all hardcoded strings with `t('key')` calls
- Add language toggle button (small flag or "ES | EN" in header)

**File**: `verification/src/App.jsx` (modify)

- Import and initialize i18n
- Wrap app with I18nextProvider

### Step 7.3: Issuer App i18n

**File**: `issuer/src/i18n.js` (new)

Same config as verification app.

**File**: `issuer/src/locales/es.json` (new)

Spanish translations for all issuer UI strings:
- Key management labels and warnings
- Manual entry form labels
- CSV upload messages
- Batch generation progress
- Revocation manager labels
- Error messages

**File**: `issuer/src/locales/en.json` (new)

English translations (current hardcoded strings).

**Files**: All components in `issuer/src/components/` (modify)

- Replace hardcoded strings with `t('key')` calls
- Add language toggle

### Step 7.4: Date Formatting Localization

- Verification app: Format expiry dates using locale (`DD/MM/YYYY` for Spanish, `MM/DD/YYYY` for English)
- Use `Intl.DateTimeFormat` or date-fns locale support

### Step 7.5: Tests

**Unit tests** (`verification/src/utils/i18n.test.js` — new):
- Spanish translations load correctly
- English translations load correctly
- All translation keys exist in both languages (no missing keys)
- Language switching works
- Browser language detection selects correct language

**Unit tests** (`issuer/src/utils/i18n.test.js` — new):
- Same as verification tests
- All issuer-specific keys present in both languages

### Milestone 7 ✓
- Verification app displays in Spanish by default
- Language toggle switches between ES/EN
- All UI text translated (no hardcoded strings remain)
- Dates formatted per locale
- All tests pass

---

## Phase 8: Wallet-Style Cards

**Goal**: Generate professional-looking membership card images (not just plain QR).

**Why third**: Visual improvement that makes cards feel more official and professional.

### Step 8.1: Wallet-Style Card Renderer

**File**: `issuer/src/utils/card.js` (modify existing)

Add function: `generateWalletCard(memberData, qrDataUrl, logoImage)`

Card layout (800x1200px portrait):
```
┌─────────────────────────────────────┐
│  [AMPA Logo]    AMPA Nova School    │
│                                     │
│  Member Name: Raúl Jiménez          │
│  Valid Until: 31/08/2027            │
│                                     │
│          [QR CODE]                  │
│                                     │
│  Member ID: 12345                   │
└─────────────────────────────────────┘
```

Design specs (per SPEC):
- Background: White with subtle primary color (#30414B) header bar
- Primary color header with white text for organization name
- Logo in top-left of header
- Member name in large text
- Expiry date formatted
- QR code centered
- Member ID in smaller text at bottom
- Rounded corners (canvas clip path)
- Colors: Primary (#30414B), Secondary (#52717B)

### Step 8.2: Card Format Selection in UI

**File**: `issuer/src/components/ManualEntry.jsx` (modify)

- Add radio buttons: "Plain QR" / "Wallet-style card"
- Default to "Wallet-style card"
- Pass selection to card generation

**File**: `issuer/src/components/CSVUpload.jsx` (modify)

- Add card format selector before "Generate All Cards" button
- Apply selection to batch generation

### Step 8.3: Update Batch Generation

**File**: `issuer/src/utils/batch.js` (modify)

- Accept `cardFormat` parameter ("plain" | "wallet")
- Use appropriate renderer based on selection

### Step 8.4: Tests

**Unit tests** (`issuer/src/utils/card.test.js` — add tests):
- Wallet card generates canvas of correct dimensions (800x1200)
- Card includes member name in output
- Card includes expiry date in output
- Card format selection works ("plain" vs "wallet")
- Batch generation respects card format parameter

### Milestone 8 ✓
- Generate wallet-style card manually → download shows professional layout
- Generate batch with wallet format → all cards in ZIP use wallet layout
- Plain QR format still works when selected
- All tests pass

---

## Phase 9: PWA Features (Issuer App)

**Goal**: Make the issuer app installable and functional offline.

**Why fourth**: Allows AMPA admins to install the issuer as a desktop/mobile app and use it without internet.

### Step 9.1: PWA Plugin Setup

```bash
cd issuer && npm install vite-plugin-pwa
```

**File**: `issuer/vite.config.js` (modify)

Add VitePWA plugin configuration:
- Name: "AMPA Card Issuer"
- Short name: "AMPA Issuer"
- Description: "Generate digital membership cards for AMPA"
- Theme color: #30414B
- Register type: autoUpdate
- Workbox: precache all assets
- Icons: Generate from existing logo

### Step 9.2: PWA Manifest & Icons

**File**: `issuer/public/manifest.json` (new — auto-generated by plugin, but customize)

```json
{
  "name": "AMPA Card Issuer",
  "short_name": "AMPA Issuer",
  "description": "Generate digital membership cards",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#30414B",
  "icons": [...]
}
```

### Step 9.3: PWA Icons

Generate icon sizes from existing logo:
- 192x192, 512x512 (minimum required)
- Place in `issuer/public/icons/`

### Step 9.4: Service Worker Strategy

- **Precache**: All app assets (JS, CSS, HTML, images)
- **Runtime cache**: Not needed (all crypto is client-side, no API calls except optional revocation)
- **Offline**: Full functionality (key generation, card generation, CSV processing all work offline)

### Step 9.5: Install Prompt UI

**File**: `issuer/src/components/InstallPrompt.jsx` (new)

- Detect if app can be installed (beforeinstallprompt event)
- Show subtle banner: "Install AMPA Issuer for offline use"
- "Install" button triggers native install prompt
- Dismiss option
- Hide after installation

### Step 9.6: Tests

**Unit tests** (`issuer/src/utils/pwa.test.js` — new):
- Manifest is valid JSON with required fields
- Service worker registers successfully
- All required icon sizes present

**Manual testing**:
- Install on Chrome Desktop → app opens standalone
- Install on Android Chrome → app icon on home screen
- Go offline → all features still work (key gen, card gen, CSV)
- Update app → service worker updates

### Milestone 9 ✓
- Issuer app installable from browser
- Works fully offline after installation
- Install prompt shown to users
- Service worker caches all assets
- All tests pass

---

## Phase 10: Accessibility (WCAG 2.1 AA)

**Goal**: Full WCAG 2.1 AA compliance for both apps.

### Step 10.1: Verification App Accessibility

**Files**: `verification/src/components/VerificationResult.jsx`, `verification/src/App.jsx`

Improvements:
- Semantic HTML: Use `<main>`, `<header>`, `<section>`, proper heading hierarchy
- Alt text: All images (logo, status icons) have descriptive alt attributes
- ARIA labels: Status announcements with `role="status"` and `aria-live="polite"`
- Focus management: Auto-focus on result after verification completes
- Color contrast: Verify 4.5:1 ratio for all text (especially on colored backgrounds)
- Keyboard navigation: Tab through all interactive elements (technical details toggle)
- Touch targets: Minimum 44x44px for all interactive elements
- Skip link: "Skip to verification result" for screen readers

### Step 10.2: Issuer App Accessibility

**Files**: All components in `issuer/src/components/`

Improvements:
- Form labels: All inputs have associated `<label>` elements
- Error announcements: Form validation errors announced via `aria-live`
- Focus management: Focus moves to error summary on validation failure
- Tab order: Logical tab order through key management → form → actions
- Semantic HTML: Proper heading hierarchy, landmarks
- Color contrast: Check all text, buttons, status indicators
- Touch targets: 44x44px minimum for buttons, inputs
- Progress announcements: Batch generation progress announced to screen readers

### Step 10.3: Tests

**Unit tests** (add to existing component tests or new `accessibility.test.js`):
- All images have alt attributes
- All form inputs have associated labels
- Interactive elements are keyboard-accessible (tabIndex, role)
- Color contrast ratios meet 4.5:1 (can test with computed styles)
- ARIA roles and attributes are correctly applied

**Manual testing**:
- Navigate both apps using keyboard only (Tab, Enter, Escape)
- Test with screen reader (VoiceOver on macOS/iOS)
- Verify focus indicators visible on all interactive elements

### Milestone 10 ✓
- Both apps navigable with keyboard only
- Screen reader announces all states correctly
- All contrast ratios pass WCAG 2.1 AA
- All images have alt text
- All forms have proper labels
- Tests pass

---

## Phase 11: GitHub Pages Deployment

**Goal**: Automated deployment of verification app to GitHub Pages with custom domain.

### Step 11.1: Verification App Deployment Workflow

**File**: `.github/workflows/deploy-verification.yml` (new)

```yaml
name: Deploy Verification App
on:
  push:
    branches: [main]
    paths: ['verification/**']
  workflow_dispatch:
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: cd verification && npm ci && npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: verification/dist
      - uses: actions/deploy-pages@v4
```

### Step 11.2: Vite Base Path Configuration

**File**: `verification/vite.config.js` (modify)

- Set `base` path for GitHub Pages deployment
- Configure SPA fallback for hash-based routing

### Step 11.3: Custom Domain

**File**: `verification/public/CNAME` (new)

```
verify.ampanovaschoolalmeria.org
```

### Step 11.4: Tests

- Verify build succeeds in CI
- Verify deployed site loads correctly
- Verify token verification works on deployed URL
- Verify revoked.json is accessible at deployed URL

### Milestone 11 ✓
- Push to main auto-deploys verification app
- Custom domain works with HTTPS
- Verification works on production URL
- revoked.json served correctly

---

## Phase 12: Analytics (Optional)

**Goal**: Privacy-respecting analytics to track QR scan volume and error rates.

### Step 12.1: Analytics Module

**File**: `verification/src/utils/analytics.js` (new)

Functions:
- `initAnalytics(config)` — Only initialize if `analytics.enabled === true` in config
- `trackPageView()` — Track verification page load
- `trackVerificationResult(result)` — Track success/failure/error type
- No PII tracking (no member names, no token contents)
- IP anonymization enabled

### Step 12.2: Configuration

**File**: `verification/src/config.json` (modify)

Add analytics config:
```json
{
  "analytics": {
    "enabled": false,
    "provider": "google-analytics",
    "trackingId": ""
  }
}
```

### Step 12.3: Integration

**File**: `verification/src/App.jsx` (modify)

- Import analytics module
- Call `initAnalytics` on mount
- Track verification results after each verification

### Step 12.4: Tests

**Unit tests** (`verification/src/utils/analytics.test.js` — new):
- Analytics not loaded when `enabled: false`
- Analytics initializes when `enabled: true` with valid trackingId
- No PII in tracked events
- Track events called with correct event names

### Milestone 12 ✓
- Analytics disabled by default (no tracking without explicit opt-in)
- When enabled, tracks page views and verification results
- No PII tracked
- Tests pass

---

## V2 Success Criteria

V2 is complete when:
1. ✅ Revocation system works end-to-end (revoke → verify → rejected)
2. ✅ Both apps available in Spanish and English
3. ✅ Wallet-style cards generate professional-looking PNGs
4. ✅ Issuer app installable as PWA, works offline
5. ✅ WCAG 2.1 AA compliance in both apps
6. ✅ Verification app auto-deploys to GitHub Pages
7. ✅ Optional analytics working when enabled
8. ✅ All new features have unit tests
9. ✅ All existing tests still pass
