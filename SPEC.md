# AMPA Digital Membership Card (QR) – Technical Specification

## 1. Overview

### 1.1 Goal

Build a digital AMPA membership card system that local shops can validate by scanning a QR code.

### 1.2 Key Requirements

- No dedicated merchant app required
- Works with standard phone camera QR scanner
- Validation must be cryptographically secure (hard to forge)
- Must not expose sensitive personal data
- Static hosting for verification (no backend required)
- Cross-platform installable issuer tool

### 1.3 System Components

1. **Verification Web App**: Static site for merchants to validate membership cards
2. **Issuer PWA**: Installable web app for AMPA admins to generate membership cards
3. **Digital Membership Cards**: PNG images with QR codes distributed to members

---

## 2. Architecture

### 2.1 High-Level Flow

```
Member receives card → Shows QR to merchant → Merchant scans QR →
Phone opens verification URL → Page validates token → Shows ✅ or ❌
```

### 2.2 Security Model

- **Signed credentials**: JWT tokens signed with EdDSA (Ed25519) algorithm
- **QR content**: `https://verify.ampanovaschoolalmeria.org/verify#token=<SIGNED_JWT>`
- **Client-side verification**: JavaScript verification using embedded public key
- **Revocation support**: Optional static JSON file with revoked token IDs
- **URL fragment**: Token passed in `#` fragment to avoid server logs/referrers

---

## 3. Token Specification

### 3.1 Format

JWT (JSON Web Token) using JWS (JSON Web Signature) with EdDSA algorithm and Ed25519 curve.

### 3.2 Required Claims (Payload)

```json
{
  "v": 1,
  "iss": "ampa:ampa-nova-school-almeria",
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Raúl Jiménez",
  "iat": 1725148800,
  "exp": 1756684800,
  "jti": "9c1b3c63-7cc4-4d09-ae1b-3a7a2b5f1c10"
}
```

**Field descriptions:**

- `v` (number): Token schema version (currently 1)
- `iss` (string): Issuer identifier, format: `"ampa:<slug>"`
- `sub` (string): Member ID (UUID format, required in CSV)
- `name` (string): Full member name (e.g., "Raúl Jiménez")
- `iat` (number): Issued-at timestamp (Unix seconds)
- `exp` (number): Expiration timestamp (Unix seconds) - annual, school year aligned
- `jti` (string): Token ID (UUID, auto-generated per card for revocation)

### 3.3 Optional Claims

- `tier` (string): Membership type if needed (e.g., "family", "student")
- `note` (string): Short non-sensitive message (use sparingly)

### 3.4 Prohibited Data

Token payload MUST NEVER include:

- National ID (DNI)
- Full address
- Email address
- Phone number
- Children's names or data
- Date of birth
- Any other sensitive personal information

---

## 4. Verification Rules

A token is **VALID** if and only if:

1. **Signature is valid** with the AMPA public key (EdDSA Ed25519)
2. **Issuer matches**: `iss` field matches expected issuer identifier
3. **Not expired**: `exp` is in the future (allow 120 second clock skew)
4. **Supported version**: `v` field is recognized (currently: 1)
5. **Not revoked**: If revocation enabled, `jti` is NOT in `revoked_jti` array

### 4.1 Error Conditions

| Condition | Display Message | Technical Detail |
|-----------|----------------|------------------|
| Signature invalid | "Invalid membership card" | Show crypto verification failed in debug |
| Expired | "Membership expired" | Show expiry date in debug |
| Revoked | "Membership revoked" | Show revocation date in debug |
| Malformed | "Invalid card format" | Show parsing error in debug |
| Wrong issuer | "Unrecognized issuer" | Show issuer mismatch in debug |

### 4.2 Offline Revocation Policy

**Policy**: Soft-fail (fail open)

- If `revoked.json` cannot be fetched (offline/network error):
  - Display validation result with warning: "⚠️ Revocation status could not be checked"
  - Allow merchant to proceed with manual judgment
  - Log warning in console for debugging

---

## 5. Revocation System

### 5.1 Revocation File Format

**Location**: `https://verify.ampanovaschoolalmeria.org/revoked.json`

**Format**:

```json
{
  "updated_at": "2026-02-10T10:00:00Z",
  "revoked_jti": [
    "9c1b3c63-7cc4-4d09-ae1b-3a7a2b5f1c10",
    "a1b2c3d4-5e6f-7a8b-9c0d-1e2f3a4b5c6d"
  ],
  "revoked_sub": []
}
```

**Fields**:

- `updated_at`: ISO 8601 timestamp of last update
- `revoked_jti`: Array of revoked token IDs (individual cards)
- `revoked_sub`: Array of revoked member IDs (all cards for that member)

### 5.2 Revocation Workflow

1. Admin opens Issuer PWA
2. Navigates to "Revoke Membership" section
3. (Optional) Uploads QR PNG from a member card to auto-identify token/member
4. Tool decodes QR locally and extracts unverified JWT identifiers (`jti`, `sub`) for quick action
5. Before editing, admin loads existing `revoked.json` (default: local verifier URL, optional deployed URL)
6. Admin confirms revoke by `jti` (single card) or `sub` (all cards for member)
7. Tool merges (deduplicates) new revocations with existing list entries
8. Admin copies exported `revoked.json` content
9. Manually uploads to GitHub Pages via web UI
10. GitHub Pages auto-redeploys (usually < 1 minute)

### 5.3 Verification Behavior

- Fetch `revoked.json` with `fetch(..., { cache: "no-store" })` and a cache-busting query parameter
- Check both `revoked_jti` (specific token) and `revoked_sub` (all member tokens)
- If offline: soft-fail (allow with warning)
- If issuer loads `revoked.json` from another origin (e.g., deployed domain from localhost), that origin must allow CORS for GET requests

---

## 6. Verification Web App

### 6.1 Technical Stack

- **Framework**: React 18+
- **Build tool**: Vite or Create React App
- **Crypto library**: jose (for JWT verification)
- **QR handling**: Browser native (URL opened from camera app)
- **Styling**: CSS Modules or Styled Components
- **i18n**: react-i18next or similar

### 6.2 Hosting

- **Platform**: GitHub Pages
- **Domain**: Custom subdomain of `ampanovaschoolalmeria.org`
- **Suggested subdomain**: `verify.ampanovaschoolalmeria.org`
- **Deployment**: Git push to `gh-pages` branch or GitHub Actions

### 6.3 Routes

- `/verify` - Main verification page (handles `#token=...` fragment)
- `/merchant-help` - Optional: Merchant instructions (can be added later)
- `/` - Redirect to verification page or landing page

### 6.4 Configuration

Embed in source code or `config.json`:

```json
{
  "issuer": "ampa:ampa-nova-school-almeria",
  "publicKey": "<ED25519_PUBLIC_KEY_PEM>",
  "revocationEnabled": true,
  "revocationUrl": "/revoked.json",
  "offlinePolicy": "soft-fail",
  "clockSkewSeconds": 120,
  "analytics": {
    "enabled": false,
    "provider": "google-analytics",
    "trackingId": ""
  }
}
```

### 6.5 UI States

#### Loading State
- Show spinner/loading indicator
- Text: "Verifying membership..."

#### Valid State
- ✅ Large green checkmark icon
- Heading: "Valid Membership"
- Display: Member name (large text)
- Display: Valid until date (formatted: "DD/MM/YYYY")
- Display: AMPA logo and name
- Brief inline instruction: "This membership is valid for AMPA discounts"
- If revocation check failed: Show warning banner

#### Invalid State
- ❌ Large red X icon
- Heading: "Invalid Membership" (or "Membership Revoked" when revoked)
- Display: Basic error message (user-friendly)
- Revoked case: second line shows member name from token payload
- Expandable "Technical Details" section with specific error
- Optional: "Contact AMPA for support" message

### 6.6 Branding

- **Primary color**: `#30414B`
- **Secondary color**: `#52717B`
- **Logo**: Located at `images/ampa-logo.svg` or `.png`
- **Typography**: System fonts (Open Sans, Roboto, or similar web-safe)

### 6.7 Accessibility (WCAG 2.1 AA)

**Required compliance**:

- Color contrast ratio: 4.5:1 for normal text, 3:1 for large text
- Keyboard navigation: All interactive elements accessible via Tab/Enter
- Semantic HTML: Proper heading hierarchy, landmarks, labels
- Alt text: All images have descriptive alt attributes
- Focus indicators: Visible focus outlines on interactive elements
- Mobile accessibility: Touch targets minimum 44x44px

### 6.8 Internationalization

**Languages**:

- Spanish (primary)
- English (fallback)

**Implementation**:

- Use i18n framework (react-i18next)
- Language detection: Browser language or manual toggle
- Configurable: Easy to add more languages later
- Translations in separate JSON files

**Key strings to translate**:

- Validation status messages
- Error messages
- Merchant instructions
- Date formatting (locale-specific)

### 6.9 Analytics (Optional)

**Requirements**:

- Track QR code scans (verification page loads)
- Track validation results (valid/invalid/error type)
- Privacy-respecting (no PII tracking)
- Configurable: Can enable/disable via config
- Suggested: Google Analytics (GA4) or similar free tool

**Implementation**:

- Only load analytics script if `analytics.enabled === true`
- Track events: `page_view`, `verification_success`, `verification_failure`
- Do NOT track: Member names, token contents, personally identifiable information

---

## 7. Issuer PWA (Progressive Web App)

### 7.1 Technical Stack

- **Framework**: React 18+
- **Build tool**: Vite with PWA plugin
- **PWA framework**: Workbox or vite-plugin-pwa
- **Crypto library**: jose (for JWT signing), @noble/ed25519 (for key generation)
- **QR generation**: qrcode or qrcode.react
- **CSV parsing**: papaparse
- **Date parsing**: date-fns or day.js (flexible date format support)
- **File generation**: canvas (for PNG), jspdf (if PDF needed later)

### 7.1.1 Dependency Manifest Requirements

- Every third-party package imported in source code MUST exist in the corresponding app `package.json` (`dependencies` or `devDependencies`).
- Runtime imports used by app code MUST be in `dependencies`.
- Test-only/build-only imports MAY be in `devDependencies`.
- `package-lock.json` files MUST be committed and kept in sync with `package.json`.
- CI/test execution MUST fail if a module import is missing from installed dependencies.

### 7.2 Installation & Distribution

- **Type**: PWA (installable web app)
- **Distribution**: Host on GitHub Pages or similar, users install from browser
- **Offline support**: Service worker caches all assets
- **Platforms**: Windows, macOS, Linux, Android, iOS (via browser install)
- **No app stores**: Users visit URL and click "Install App" in browser

### 7.3 Key Features

#### 7.3.1 Key Management

**Generate Keypair**:

- Button: "Generate New Keypair"
- Uses Ed25519 algorithm
- Displays public key (for embedding in verification app)
- Displays private key (for signing tokens)
- **Security warnings**:
  - "Store private key securely (password manager, encrypted disk)"
  - "Never share private key or commit to repository"
  - "Losing private key means generating new cards for all members"

**Import Keypair**:

- Text field: Paste private key (PEM format)
- Validation: Verify key format and algorithm
- Extract public key from private key
- Store only in session memory (cleared on close/refresh)

**Key handling**:

- Private key NEVER persisted to localStorage
- Private key only in memory during session
- Prompt to re-enter key if user refreshes page

#### 7.3.2 Member Data Input

**CSV Upload**:

- File input: Accept `.csv` files
- Required columns: `full_name`, `member_id`, `expiry_date`
- Optional columns: `tier`, `note` (future use)
- Date formats accepted: `YYYY-MM-DD`, `DD/MM/YYYY`, `DD-MM-YYYY`, `D/M/YYYY`
- Flexible parsing with date-fns or similar

**Manual Entry**:

- Form fields:
  - Full name (text, required)
  - Member ID (text, required, UUID format recommended)
  - Expiry date (date picker + text input, required)
  - Tier (dropdown, optional)
  - Note (textarea, optional)
- Button: "Add Member" → adds to generation queue

**Interactive Validation**:

- Live validation as CSV is parsed or form is filled
- Display table of parsed members with status indicators:
  - ✅ Valid
  - ⚠️ Warning (e.g., missing optional field)
  - ❌ Error (e.g., missing required field, invalid date)
- Inline error messages next to problematic rows
- Allow editing rows directly in table
- Show summary: "25 valid, 3 errors"

#### 7.3.3 Card Generation

**Process**:

1. User provides private key (paste or import)
2. User uploads CSV or enters members manually
3. System validates all data (interactive validation)
4. User configures output options:
   - School year folder name (auto-filled: `cards_2024-2025`)
   - Card format: "Plain QR only" or "Wallet-style card"
5. User clicks "Generate Cards"
6. System:
   - For each member:
     - Auto-generates `jti` (UUID)
     - Creates JWT payload with all claims
     - Signs JWT with private key using EdDSA Ed25519
     - Generates QR code with branded colors:
       - URL: `https://verify.ampanovaschoolalmeria.org/verify#token=<JWT>`
       - Colors: Primary color (#30414B) on white background
       - Error correction: High (30%) to allow logo embedding if needed later
     - Generates card image (PNG):
       - Format chosen by user (plain QR or wallet-style)
       - Wallet-style includes: logo, member name, expiry date, QR code
   - Creates folder structure: `downloads/cards_YYYY-YYYY/`
   - Saves each card as: `{member_id}_{sanitized_name}.png`
7. System creates ZIP file with all cards + metadata
8. User downloads ZIP file

**Wallet-Style Card Design**:

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

**Card specifications**:

- Size: 800x1200px (portrait) or 1200x800px (landscape) - TBD in design phase
- Resolution: 300 DPI equivalent for printing
- Format: PNG with transparency support
- Colors: Primary (#30414B), Secondary (#52717B), White background

#### 7.3.4 Revocation Management

**Interface**:

- Section: "Revoke Membership"
- Source selector: local verifier URL or deployed domain URL (default source: local verifier)
- Upload: PNG file with card QR code (optional lookup path)
- Input: Member ID or Token ID (jti)
- Dropdown: "Revoke specific token (jti)" or "Revoke all tokens for member (sub)"
- Button: "Add to Revocation List"
- Button: "Load and Merge" existing revoked list from selected URL
- Display: Current revocation list (editable table)
- Button: "Export revoked.json"
- Quick actions: "Revoke this token (jti)" and "Revoke this member (sub)" after PNG lookup

**Export**:

- Generates `revoked.json` file with proper format
- Shows modal with file content for copy-paste
- Button: "Download revoked.json"
- Instructions: "Upload this file to your GitHub Pages repository"

**Workflow**:

1. Admin loads existing revoked list from local/deployed URL (or local file)
2. Admin enters ID to revoke
3. System merges new IDs into current revocation list (no overwrite)
4. Admin clicks "Export revoked.json"
4. Admin copies content or downloads file
5. Admin manually uploads to GitHub web UI: `revoked.json`
6. GitHub Pages redeploys automatically

#### 7.3.5 Configuration Persistence

**Config file**: `issuer-config.json` (stored in localStorage)

**Persisted settings**:

```json
{
  "issuer": "ampa:ampa-nova-school-almeria",
  "publicKey": "<PUBLIC_KEY_PEM>",
  "defaultExpiryMonths": 12,
  "schoolYearStart": "09-01",
  "outputFolderPattern": "cards_{year}-{nextyear}",
  "cardFormat": "wallet-style",
  "branding": {
    "primaryColor": "#30414B",
    "secondaryColor": "#52717B",
    "logoPath": "./images/ampa-logo.svg"
  }
}
```

**Never persisted**:

- Private key
- Member data
- Generated tokens

**Config UI**:

- Settings page to edit configuration
- Button: "Export Config" (download JSON)
- Button: "Import Config" (upload JSON)
- Button: "Reset to Defaults"

### 7.4 User Roles

**Target users**: AMPA administrators (1-3 people)

**Expected usage**:

- Bulk generation at start of school year (~50-200 members)
- Incremental additions throughout year (~5-20 new members)
- On-demand single card generation (lost cards, replacements)

**No authentication**: Tool runs locally, no user accounts needed

### 7.5 Security Considerations

- Private key never leaves user's device (session-only in memory)
- No backend, no key storage on servers
- All cryptographic operations client-side
- Clear warnings about key security
- Audit log (optional): Local log of generation events (CSV export)

---

## 8. Key Management

### 8.1 Key Generation

**Algorithm**: EdDSA with Ed25519 curve

**Process**:

1. Use `@noble/ed25519` or `jose` library to generate keypair
2. Export private key as PEM format
3. Export public key as PEM format
4. Provide both to user for secure storage

**Example Node.js script** (for documentation):

```javascript
import { generateKeyPair, exportPKCS8, exportSPKI } from 'jose';

const { privateKey, publicKey } = await generateKeyPair('EdDSA', {
  crv: 'Ed25519'
});

const privateKeyPEM = await exportPKCS8(privateKey);
const publicKeyPEM = await exportSPKI(publicKey);

console.log('Private Key:\n', privateKeyPEM);
console.log('Public Key:\n', publicKeyPEM);
```

### 8.2 Key Storage

**Private Key**:

- Store in password manager (1Password, LastPass, Bitwarden)
- Or encrypted disk/file (VeraCrypt, BitLocker)
- Never commit to Git repository (add to `.gitignore`)
- Create backup copy in secure location

**Public Key**:

- Embed in verification app source code
- Can be committed to Git (public information)
- Optionally serve from `/.well-known/ampa-membership/pubkey.json`

### 8.3 Key Rotation (Future)

**Not implemented in v1**, but architecture should support:

- JWT header includes `kid` (key ID)
- Verification app supports multiple public keys
- Issuer tool allows selecting which key to use
- Old tokens remain valid until expiry

**When to rotate**:

- Key compromise suspected
- Annual security practice
- Change of administration

---

## 9. Data Privacy

### 9.1 GDPR Compliance

**Minimal data collection**:

- Only collect what's necessary for membership verification
- No sensitive personal data in tokens
- Member can revoke card (via revocation system)

**Data in token**:

- ✅ Name (necessary for merchant verification)
- ✅ Member ID (random UUID, not personal identifier)
- ✅ Expiry date (necessary for validation)
- ❌ No email, phone, address, DNI, children's data

**Data retention**:

- Tokens expire automatically (school year)
- Revocation list can be purged after token expiry
- Issuer tool doesn't store member data (CSV input only)

### 9.2 Merchant Privacy

- Merchants don't need accounts or identification
- No tracking of which merchant scanned which card (unless analytics enabled)
- Validation is anonymous

### 9.3 Analytics Privacy

If analytics enabled:

- Only aggregate data (scan counts, error rates)
- No PII tracked
- No token contents logged
- IP anonymization enabled (if using Google Analytics)
- Cookie consent banner if required by EU law

---

## 10. File Naming & Organization

### 10.1 Issuer Output Structure

```
downloads/
└── cards_2024-2025/
    ├── 12345_Raul_Jimenez.png
    ├── 12346_Maria_Garcia.png
    ├── 12347_Pedro_Lopez.png
    ├── ...
    └── metadata.json
```

**File naming**:

- Format: `{member_id}_{sanitized_name}.png`
- Sanitization: Replace spaces with `_`, remove special chars, lowercase
- Example: `12345_raul_jimenez.png`

**Folder naming**:

- Format: `cards_YYYY-YYYY`
- Example: `cards_2024-2025`
- Represents school year

**Metadata file**:

```json
{
  "generated_at": "2024-09-01T10:30:00Z",
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

**Purpose**: Helps with card tracking, renewals, and revocations

### 10.2 Repository Structure

```
socios-ampa/
├── README.md
├── SPEC.md (this file)
├── LICENSE
├── .gitignore
│
├── issuer/                    # Issuer PWA
│   ├── public/
│   │   ├── manifest.json
│   │   ├── icons/
│   │   └── images/
│   │       └── ampa-logo.svg
│   ├── src/
│   │   ├── components/
│   │   ├── utils/
│   │   │   ├── crypto.js      # Key generation, JWT signing
│   │   │   ├── qr.js          # QR code generation
│   │   │   ├── card.js        # Card image generation
│   │   │   ├── csv.js         # CSV parsing
│   │   │   ├── revocation.js  # Revocation list helpers
│   │   │   └── tokenLookup.js # QR PNG decode + JWT identifier extraction
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── package.json
│   └── vite.config.js
│
├── verification/              # Verification web app
│   ├── public/
│   │   ├── revoked.json       # Revocation list
│   │   └── images/
│   │       └── ampa-logo.svg
│   ├── src/
│   │   ├── components/
│   │   ├── utils/
│   │   │   └── verify.js      # JWT verification
│   │   ├── locales/           # i18n translations
│   │   │   ├── es.json
│   │   │   └── en.json
│   │   ├── config.json        # App configuration
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── package.json
│   └── vite.config.js
│
└── docs/                      # Documentation
    ├── SETUP.md               # Initial setup guide
    ├── USER_GUIDE.md          # Issuer tool user guide
    ├── MERCHANT_GUIDE.md      # Merchant instructions
    └── SECURITY.md            # Security best practices
```

---

## 11. User Flows

### 11.1 Initial Setup (One-time)

1. **Generate keypair**:
   - Admin opens Issuer PWA
   - Clicks "Generate New Keypair"
   - Copies private key to password manager
   - Copies public key to verification app config

2. **Deploy verification app**:
   - Developer embeds public key in `verification/src/config.json`
   - Commits and pushes to GitHub
   - Configures GitHub Pages with custom domain
   - Tests verification with sample token

3. **Install issuer PWA**:
   - Admin visits issuer URL in browser
   - Clicks "Install App" (browser prompt)
   - App added to device like native app

### 11.2 Annual Card Generation

1. **Prepare member data**:
   - Export member list from spreadsheet/database
   - Format as CSV: `full_name,member_id,expiry_date`
   - Example: `Raúl Jiménez,12345,2025-08-31`

2. **Generate cards**:
   - Open Issuer PWA
   - Paste private key into key field
   - Upload CSV file
   - Review validation results, fix any errors
   - Configure school year: `2024-2025`
   - Select card format: "Wallet-style card"
   - Click "Generate Cards"
   - Download ZIP file with all cards

3. **Distribute to members**:
   - Unzip card files
   - Send individual PNG files via email (manual or mail merge)
   - Or upload to shared drive for member download
   - Or print and distribute physically

### 11.3 Mid-Year New Member

1. **Single card generation**:
   - Open Issuer PWA
   - Paste private key
   - Switch to "Manual Entry" tab
   - Fill form: name, ID, expiry date
   - Click "Generate Card"
   - Download single PNG file
   - Send to member

### 11.4 Revoking a Card

1. **Identify card to revoke**:
   - Member reports lost/stolen card
   - Or membership terminated
   - Find member ID or token ID from metadata.json
   - Or upload card PNG in Issuer PWA to extract `jti`/`sub` automatically

2. **Update revocation list**:
   - Open Issuer PWA
   - Navigate to "Revoke Membership" section
   - Upload PNG (optional) or enter member ID/token ID manually
   - Click "Revoke this token (jti)" / "Revoke this member (sub)" or "Add to Revocation List"
   - Click "Export revoked.json"
   - Copy JSON content

3. **Deploy revocation**:
   - Go to GitHub repository web UI
   - Navigate to `verification/public/revoked.json`
   - Click "Edit"
   - Paste new content
   - Commit changes
   - Wait for GitHub Pages to redeploy (~1 min)

4. **Verify revocation**:
   - Scan revoked card QR code
   - Should show "Membership revoked"

### 11.5 Merchant Validation

1. **Merchant receives QR**:
   - Member shows phone screen with card image
   - Or printed card

2. **Scan with camera**:
   - Merchant opens native camera app (iOS/Android)
   - Points at QR code
   - Phone detects QR, shows notification: "Open verify.ampanovaschoolalmeria.org?"
   - Merchant taps notification

3. **View validation result**:
   - Browser opens verification page
   - Shows loading spinner briefly
   - Displays result:
     - ✅ "Valid Membership - Raúl Jiménez - Valid until 31/08/2025"
     - Or ❌ "Invalid Membership - [reason]"
   - Merchant grants discount or not

---

## 12. Error Handling

### 12.1 Issuer PWA Errors

| Error Scenario | User Message | Action |
|----------------|--------------|--------|
| Invalid private key | "Invalid private key format. Please check and try again." | Show help link to key format documentation |
| CSV parse error | "Could not parse CSV file. Please check format." | Show expected CSV format example |
| Invalid date format | "Invalid date in row 5: '32/13/2025'. Use YYYY-MM-DD or DD/MM/YYYY." | Highlight problematic row |
| Missing required field | "Missing member_id in row 3." | Highlight problematic row |
| Duplicate member ID | "Duplicate member_id '12345' found in rows 3 and 7." | Highlight both rows |
| QR generation failed | "Failed to generate QR code for member 12345." | Skip member, log error, continue |
| No private key provided | "Please enter private key to sign tokens." | Highlight key input field |

### 12.2 Verification App Errors

| Error Scenario | User Message (Basic) | Technical Detail (Expandable) |
|----------------|---------------------|-------------------------------|
| No token in URL | "No membership card detected." | "URL fragment missing 'token' parameter." |
| Malformed JWT | "Invalid card format." | "Failed to parse JWT: [error details]" |
| Invalid signature | "Invalid membership card." | "Signature verification failed with public key." |
| Expired token | "Membership expired." | "Token expired on [date]. Current time: [time]." |
| Wrong issuer | "Unrecognized issuer." | "Expected 'ampa:ampa-nova-school-almeria', got '[issuer]'." |
| Revoked token | "Membership Revoked" + member name on second line | "Token ID '[jti]' found in revocation list." |
| Network error (revocation) | "⚠️ Valid, but revocation status unknown." | "Failed to fetch revoked.json: [error]" |
| Unsupported version | "Unsupported card version." | "Token version [v] not recognized. Supported: 1." |

---

## 13. Testing Strategy

### 13.1 Verification App Testing

**Unit tests**:

- JWT verification logic
- Expiry check with clock skew
- Revocation list checking
- Date formatting

**Integration tests**:

- Valid token flow
- Invalid token flows (expired, revoked, tampered)
- Offline revocation handling
- i18n switching

**Manual testing**:

- Generate test card with issuer
- Scan QR with iOS Safari (iPhone)
- Scan QR with Android Chrome
- Test with expired token
- Test with revoked token
- Test offline (airplane mode)
- Test accessibility with screen reader

**Browsers**:

- ✅ Safari iOS 15+
- ✅ Chrome Android 100+
- ✅ Chrome Desktop
- ✅ Firefox Desktop
- ✅ Safari macOS

### 13.2 Issuer PWA Testing

**Unit tests**:

- JWT signing
- CSV parsing (various formats)
- Date parsing (flexible formats)
- QR code generation
- Key generation

**Integration tests**:

- End-to-end card generation flow
- Config persistence
- Revocation list export

**Manual testing**:

- Install PWA on Windows, macOS, Android
- Generate cards from CSV
- Generate single card manually
- Test key import
- Test key generation
- Verify generated tokens in verification app

### 13.3 Security Testing

- Attempt to tamper with JWT (modify payload, re-encode)
- Attempt to forge signature
- Test with expired token
- Test with token from different issuer
- Test revocation bypass attempts
- Verify private key never leaves browser

---

## 14. Deployment

### 14.1 Verification App Deployment

**Platform**: GitHub Pages

**Steps**:

1. Build production bundle: `npm run build`
2. Output to `verification/dist/`
3. Push to `gh-pages` branch or deploy via GitHub Actions
4. Configure custom domain in GitHub settings: `verify.ampanovaschoolalmeria.org`
5. Update DNS: CNAME record pointing to GitHub Pages
6. Enable HTTPS (automatic with GitHub Pages + custom domain)

**GitHub Actions** (optional):

```yaml
name: Deploy Verification App
on:
  push:
    branches: [main]
    paths:
      - 'verification/**'
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd verification && npm install && npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./verification/dist
```

### 14.2 Issuer PWA Deployment

**Platform**: GitHub Pages (or any static host)

**Access**: Can be private repository or public with obscure URL

**Steps**:

1. Build PWA: `npm run build`
2. Output to `issuer/dist/`
3. Deploy to `issuer.ampanovaschoolalmeria.org` or similar
4. Or host on separate free platform (Netlify, Vercel) for separation

**Installation URL**: Users visit deployed URL and install PWA from browser

**No authentication needed**: Runs locally, private key never sent to server

### 14.3 Revocation List Updates

**Method**: Manual upload via GitHub web UI

**Process**:

1. Generate `revoked.json` in Issuer PWA
2. Go to GitHub repository: `verification/public/revoked.json`
3. Click "Edit file" button
4. Paste new JSON content
5. Add commit message: "Revoke member 12345"
6. Click "Commit changes"
7. GitHub Pages auto-redeploys in ~1 minute

**Alternative** (for tech-savvy admins): Git commit and push

---

## 15. Non-Functional Requirements

### 15.1 Performance

- Verification page load: < 2 seconds (3G network)
- Token verification: < 500ms
- QR code scan to result: < 3 seconds total
- Issuer card generation: < 2 seconds per card
- Batch generation (100 cards): < 60 seconds

### 15.2 Scalability

- Support up to 500 members initially
- Revocation list: Up to 100 revoked tokens (JSON < 10KB)
- Verification app: Static, no scaling concerns
- Issuer app: Local, no scaling concerns

### 15.3 Reliability

- Verification app uptime: Depends on GitHub Pages (99.9%+)
- Offline issuer: Works without internet (after PWA install)
- Graceful degradation: Offline revocation checking (soft-fail)

### 15.4 Security

- Private key never transmitted over network
- All crypto operations client-side
- No user tracking (unless analytics enabled with consent)
- HTTPS required for verification app
- Resistance to token forgery (cryptographic signature)

### 15.5 Usability

- Merchant flow: < 5 seconds from scan to result
- No merchant training required (intuitive UI)
- Issuer tool: Usable by non-technical AMPA admin
- Clear error messages
- Accessible to users with disabilities

### 15.6 Maintainability

- Well-documented code
- Minimal dependencies
- Standard frameworks (React)
- Config-driven (easy to customize)
- No backend (reduces maintenance burden)

---

## 16. Future Enhancements (Out of Scope for v1)

### 16.1 Possible v2 Features

- **Apple/Google Wallet passes**: Native wallet integration
- **Dynamic QR codes**: Short-lived tokens, requires backend
- **Multi-AMPA support**: Handle multiple AMPAs with one tool
- **Merchant tracking**: Optional merchant identification (privacy-respecting)
- **Advanced analytics**: Scan locations, times, trends
- **Automated email distribution**: Send cards directly from issuer tool
- **Member portal**: Self-service card download/renewal
- **Push notifications**: Alert members when card expiring
- **Barcode support**: Alternative to QR codes
- **Offline-first verification**: Cache valid members, sync later

### 16.2 Key Rotation Support

- Implement `kid` (key ID) in JWT header
- Support multiple public keys in verification app
- Issuer tool: Select which key to use
- Gradual rollout: Old keys remain valid during transition

### 16.3 Advanced Revocation

- Real-time revocation check (requires backend)
- Webhook notifications on revocation
- Temporary suspension (not permanent revocation)
- Audit trail of revocations

---

## 17. Acceptance Criteria

### 17.1 Verification App

- [x] Merchant can scan QR code with standard phone camera (iOS/Android)
- [x] Valid membership shows ✅ with name and expiry date
- [x] Invalid membership shows ❌ with clear reason
- [x] Expired tokens detected and rejected
- [x] Tampered tokens detected (signature verification)
- [x] Revoked tokens detected (if revocation enabled)
- [x] Works offline with soft-fail revocation policy
- [x] Accessible (WCAG 2.1 AA basic compliance)
- [x] Bilingual (Spanish + English)
- [x] Branded with AMPA colors and logo
- [x] Loads in < 3 seconds on 3G
- [x] No sensitive data exposed in UI or logs

### 17.2 Issuer PWA

- [x] Can generate Ed25519 keypair
- [x] Can import existing private key
- [x] Accepts CSV with flexible date formats
- [x] Interactive validation with clear error messages
- [x] Generates branded QR codes (AMPA colors)
- [x] Generates both plain QR and wallet-style card formats
- [x] Exports cards as PNG files
- [x] File naming: `{id}_{name}.png` in `cards_YYYY-YYYY/` folder
- [x] Includes metadata.json with card details
- [x] Can revoke tokens (export revoked.json)
- [x] Persists config (not private key)
- [x] Installable as PWA on major platforms
- [x] Works offline after installation
- [x] Private key never persisted or transmitted

### 17.3 Security

- [x] Tokens cryptographically signed (EdDSA Ed25519)
- [x] Signature verification prevents forgery
- [x] Expiry prevents indefinite validity
- [x] Revocation mechanism works
- [x] No sensitive personal data in tokens
- [x] Private key handling secure (session-only)
- [x] HTTPS enforced on verification app

### 17.4 Usability

- [x] Merchant validation flow < 5 seconds
- [x] No merchant training required
- [x] Issuer tool usable by non-technical admin
- [x] Clear error messages for all failure modes
- [x] Accessible to keyboard-only users
- [x] Works on mobile and desktop

---

## 18. Glossary

- **AMPA**: Asociación de Madres y Padres de Alumnos (Parents' Association)
- **JWT**: JSON Web Token, a standard for signed credentials
- **JWS**: JSON Web Signature, the signing mechanism used by JWT
- **EdDSA**: Edwards-curve Digital Signature Algorithm
- **Ed25519**: Specific elliptic curve used with EdDSA
- **PWA**: Progressive Web App, installable web application
- **QR**: Quick Response code, 2D barcode
- **jti**: JWT ID, unique identifier for a token
- **sub**: Subject, the entity the token represents (member ID)
- **iss**: Issuer, who created the token
- **exp**: Expiration timestamp
- **iat**: Issued-at timestamp
- **WCAG**: Web Content Accessibility Guidelines
- **i18n**: Internationalization (18 letters between 'i' and 'n')
- **PEM**: Privacy-Enhanced Mail, text encoding for cryptographic keys

---

## 19. References

### 19.1 Standards & Specifications

- [RFC 7519: JWT](https://datatracker.ietf.org/doc/html/rfc7519)
- [RFC 8032: EdDSA](https://datatracker.ietf.org/doc/html/rfc8032)
- [RFC 7515: JWS](https://datatracker.ietf.org/doc/html/rfc7515)
- [WCAG 2.1](https://www.w3.org/TR/WCAG21/)
- [PWA Documentation](https://web.dev/progressive-web-apps/)

### 19.2 Libraries

- [jose](https://github.com/panva/jose) - JWT/JWS/JWE library
- [@noble/ed25519](https://github.com/paulmillr/noble-ed25519) - Ed25519 implementation
- [qrcode](https://github.com/soldair/node-qrcode) - QR code generation
- [papaparse](https://www.papaparse.com/) - CSV parsing
- [date-fns](https://date-fns.org/) - Date manipulation
- [react-i18next](https://react.i18next.com/) - Internationalization

### 19.3 Tools

- [GitHub Pages](https://pages.github.com/)
- [Vite](https://vitejs.dev/)
- [Workbox](https://developers.google.com/web/tools/workbox) - PWA toolkit

---

## 20. Document Metadata

- **Version**: 2.0
- **Last Updated**: 2026-02-10
- **Author**: Claude (based on user interview)
- **Status**: Draft - Ready for Review
- **Project**: AMPA Nova School Almeria - Digital Membership Cards
- **Domain**: ampanovaschoolalmeria.org

---

## 21. Change Log

### Version 2.0 (2026-02-10)

- Complete rewrite based on detailed user interview
- Changed issuer from CLI to PWA
- Added React as framework
- Specified EdDSA Ed25519 algorithm
- Added branding specifications (colors, logo)
- Added i18n requirements (Spanish + English)
- Added accessibility requirements (WCAG 2.1 AA)
- Added analytics support (optional, configurable)
- Detailed file naming and organization
- Interactive CSV validation
- Config file persistence
- Comprehensive user flows and error handling
- Deployment procedures

### Version 1.0 (Initial)

- Original specification with CLI-based issuer
- Basic verification requirements
- General security model

---

## Appendix A: Sample CSV Format

```csv
full_name,member_id,expiry_date
Raúl Jiménez,12345,2025-08-31
María García,12346,31/08/2025
Pedro López,12347,2025-08-31
Ana Martínez,12348,31-08-2025
```

**Supported date formats**:

- `YYYY-MM-DD` (ISO 8601)
- `DD/MM/YYYY`
- `DD-MM-YYYY`
- `D/M/YYYY` (single digits)

---

## Appendix B: Sample Configuration Files

### Verification App Config (`verification/src/config.json`)

```json
{
  "issuer": "ampa:ampa-nova-school-almeria",
  "publicKey": "-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX=\n-----END PUBLIC KEY-----",
  "revocationEnabled": true,
  "revocationUrl": "/revoked.json",
  "offlinePolicy": "soft-fail",
  "clockSkewSeconds": 120,
  "branding": {
    "primaryColor": "#30414B",
    "secondaryColor": "#52717B",
    "logoPath": "/images/ampa-logo.svg",
    "organizationName": "AMPA Nova School Almeria"
  },
  "analytics": {
    "enabled": false,
    "provider": "google-analytics",
    "trackingId": ""
  },
  "i18n": {
    "defaultLanguage": "es",
    "supportedLanguages": ["es", "en"]
  }
}
```

### Issuer App Config (`issuer-config.json`)

```json
{
  "issuer": "ampa:ampa-nova-school-almeria",
  "publicKey": "-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX=\n-----END PUBLIC KEY-----",
  "verificationUrl": "https://verify.ampanovaschoolalmeria.org/verify",
  "defaultExpiryMonths": 12,
  "schoolYearStart": "09-01",
  "outputFolderPattern": "cards_{year}-{nextyear}",
  "cardFormat": "wallet-style",
  "branding": {
    "primaryColor": "#30414B",
    "secondaryColor": "#52717B",
    "logoPath": "./images/ampa-logo.svg",
    "organizationName": "AMPA Nova School Almeria"
  },
  "csv": {
    "requiredColumns": ["full_name", "member_id", "expiry_date"],
    "optionalColumns": ["tier", "note"],
    "dateFormats": ["YYYY-MM-DD", "DD/MM/YYYY", "DD-MM-YYYY"]
  }
}
```

---

## Appendix C: Security Checklist

### Before Launch

- [ ] Private key generated securely and stored in password manager
- [ ] Public key embedded in verification app
- [ ] Private key added to `.gitignore` (never committed)
- [ ] Verification app served over HTTPS
- [ ] JWT signature verification tested with tampered tokens
- [ ] Expiry checking tested with old tokens
- [ ] Revocation list tested with revoked tokens
- [ ] No console.log statements exposing sensitive data
- [ ] Analytics (if enabled) respects privacy (no PII)
- [ ] Error messages don't leak system internals to users
- [ ] PWA manifest doesn't request unnecessary permissions

### Ongoing

- [ ] Monitor for compromised tokens
- [ ] Review revocation list quarterly
- [ ] Update dependencies for security patches
- [ ] Backup private key in multiple secure locations
- [ ] Test verification app with new browser versions
- [ ] Review analytics for suspicious patterns (if enabled)

---

**End of Specification**
