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

## Out of Scope for MVP

These features from SPEC.md are **deferred to v2**:
- ❌ Internationalization (i18n) - Spanish/English support
- ❌ PWA features - Service workers, offline support, installable
- ❌ Wallet-style cards - Fancy card design (using plain QR only)
- ❌ Revocation UI - Revocation management interface
- ❌ Analytics - Google Analytics integration
- ❌ Advanced accessibility - WCAG 2.1 AA full compliance (basic only)
- ❌ Advanced styling - CSS Modules, design system
- ❌ GitHub Actions - CI/CD deployment automation
- ❌ Documentation - Full user guides, merchant guide, security docs

MVP focuses on **core functionality**: verify tokens + generate cards from CSV

---

## Verification & Testing

### End-to-End Test Flow

1. **Generate Test Keypair**
   ```
   Open issuer → Generate Keypair → Copy both keys
   ```

2. **Configure Verification**
   ```
   Paste public key into verification/src/config.json
   ```

3. **Start Both Apps**
   ```bash
   # Terminal 1
   cd verification && npm run dev  # Port 5173

   # Terminal 2
   cd issuer && npm run dev        # Port 5174
   ```

4. **Generate Single Card**
   ```
   Issuer → Paste private key → Manual Entry
   Name: "Test User"
   ID: "12345"
   Expiry: <date 1 year from now>
   Generate Card → Download PNG
   ```

5. **Verify Card**
   ```
   Extract JWT from QR code (or copy from console log)
   Open: http://localhost:5173/verify#token=<JWT>
   Expected: ✅ Valid - Test User - Valid until DD/MM/YYYY
   ```

6. **Test CSV Batch**
   ```
   Issuer → CSV Upload → Select sample-members.csv
   Review validation → Generate All Cards
   Download ZIP → Extract
   Verify multiple cards work
   ```

7. **Test Error Cases**
   ```
   - Tamper with JWT (change payload) → Should show "Invalid"
   - Use expired date in past → Should show "Expired"
   - Wrong issuer in config → Should show "Unrecognized issuer"
   - No token in URL → Should show "No membership card detected"
   ```

### Browser Testing

Test in these browsers (primary use cases):
- ✅ Chrome Desktop (admin using issuer)
- ✅ Safari iOS (merchant scanning QR)
- ✅ Chrome Android (merchant scanning QR)

### Performance Benchmarks

- Verification: < 500ms per token
- Single card generation: < 2 seconds
- Batch 100 cards: < 3 minutes (< 2 seconds per card)
- Page load (verification): < 2 seconds on 3G

### Security Validation

- ✅ Private key never in localStorage/sessionStorage
- ✅ Private key not logged to console
- ✅ Tampered tokens rejected (signature verification)
- ✅ Expired tokens rejected
- ✅ `.gitignore` blocks private keys
- ✅ No sensitive data in JWT (only name, ID, expiry)

---

## Success Criteria

MVP is complete when:
1. ✅ Can generate Ed25519 keypair
2. ✅ Can create single card manually
3. ✅ Can verify card shows valid/invalid correctly
4. ✅ Can upload CSV and generate batch of cards
5. ✅ All generated cards verify successfully
6. ✅ Error cases handled (invalid signature, expired, missing token)
7. ✅ Basic UI works on mobile and desktop
8. ✅ README documentation complete
9. ✅ No private keys can be committed to Git
10. ✅ End-to-end test flow passes

---

## Next Steps After MVP

Once MVP is working, iterate to add:
1. **Revocation system** - UI + JSON export
2. **i18n** - Spanish/English with react-i18next
3. **PWA features** - Installable issuer with offline support
4. **Wallet-style cards** - Fancy card design
5. **GitHub Pages deployment** - Automated CI/CD
6. **Full documentation** - User guides for admins and merchants
7. **Accessibility audit** - WCAG 2.1 AA compliance
8. **Analytics** - Optional Google Analytics integration

But for now: **Focus on core functionality only**. Ship MVP, gather feedback, iterate.
