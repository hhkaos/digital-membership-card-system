# AMPA Card Issuer App

Admin tool for generating cryptographically signed digital membership cards.

## Purpose

This application allows AMPA administrators to:
1. Generate Ed25519 cryptographic keypairs
2. Create individual membership cards manually
3. Batch generate cards from CSV files
4. Download cards as PNG images with embedded QR codes
5. Manage revocations (by `jti` token ID or `sub` member ID), including QR PNG lookup

**IMPORTANT**: This app should NEVER be deployed publicly. It runs locally only.

## Prerequisites

- **Node.js >= 20** (see `.nvmrc` — run `nvm use` if using nvm)

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

App runs on http://localhost:5174

## Testing

```bash
# Run tests once
npm test

# Watch mode
npm run test:watch
```

Tests cover: key generation, JWT signing, CSV parsing, date validation, metadata generation, filename sanitization, and cross-app integration (issuer sign → verification validate).

## Usage Guide

### Step 1: Generate Keypair

1. Open the app and go to **🔑 Key Management** tab
2. Click **"Generate Keypair"**
3. Copy the **public key** (you'll need this for verification app)
4. **CRITICAL**: Do NOT close the app or refresh until you've copied the keys
5. **SECURITY WARNING**:
   - Never commit private keys to Git
   - Never share private keys
   - Keys are stored in memory only (cleared on app close)

### Step 2: Configure Verification App

1. Copy the public key from the issuer app
2. Open `verification/src/config.json`
3. Paste the public key into the `publicKey` field
4. Save and rebuild the verification app

### Step 3: Generate Cards

#### Option A: Manual Entry (Single Card)

1. Go to **🎫 Generate Card** tab
2. Fill in:
   - Full Name: Member's name
   - Member ID: Unique identifier (e.g., "001", "002")
   - Expiry Date: When card expires (e.g., "2025-06-30")
3. Click **"Generate Card"**
4. Download the PNG card

#### Option B: Batch Upload (Multiple Cards)

1. Prepare CSV file (see format below)
2. Go to **📦 Batch Upload** tab
3. Click **"Select CSV File"**
4. Review validation results
5. Click **"Generate All Cards"**
6. Download ZIP file with all cards + metadata

### Step 4: Revoke from QR PNG (or ID)

1. Go to **🚫 Revocation** tab
2. Load current `revoked.json` first:
   - Default source: local verifier `http://localhost:5173/revoked.json`
   - Alternative: deployed domain `https://verify.ampanovaschoolalmeria.org/revoked.json`
   - Or import a local `revoked.json` file
3. Upload a PNG file containing a member QR code (optional but recommended)
4. The app decodes the QR locally and extracts token identifiers:
   - `jti` (single-card revocation)
   - `sub` (member-wide revocation)
5. Click **"Revoke this token (jti)"** or **"Revoke this member (sub)"**
6. Export and deploy `revoked.json` to `verification/public/revoked.json`

Note:
- Identifier extraction from JWT payload is for lookup convenience in issuer only.
- Final trust/validity is still enforced by cryptographic verification in the verification app.
- Loaded/imported revocation lists are merged (deduplicated), so existing revokes are preserved.

## CSV Format

Create a CSV file with these columns:

```csv
full_name,member_id,expiry_date
María García López,001,2026-06-30
Juan Pérez Martínez,002,30/06/2026
Ana Rodríguez Silva,003,30-06-2026
```

### Required Columns

- **full_name** - Member's full name (supports accents and special characters)
- **member_id** - Unique identifier for the member
- **expiry_date** - Card expiration date

### Supported Date Formats

- `YYYY-MM-DD` → 2026-06-30
- `DD/MM/YYYY` → 30/06/2026
- `DD-MM-YYYY` → 30-06-2026
- `D/M/YYYY` → 1/6/2026

### Example Files

See [examples/sample-members.csv](examples/sample-members.csv) for a complete example.

### Validation

The app will validate:
- ✅ All required fields are present
- ✅ Dates are in valid format
- ✅ Dates are in the future
- ❌ Missing fields will show errors
- ❌ Invalid dates will show errors

## Card Output

### Individual Cards

Format: `{memberID}_{sanitizedName}.png`

Example: `001_maria_garcia_lopez.png`

### Batch Cards

Format: `cards_YYYY-YYYY.zip`

Example: `cards_2025-2026.zip`

Contains:
- All PNG cards
- `metadata.json` (for tracking and renewals)

## File Structure

```
issuer/
├── src/
│   ├── App.jsx              # Main app with tabs
│   ├── components/
│   │   ├── KeyManagement.jsx    # Keypair generation UI
│   │   ├── ManualEntry.jsx      # Single card form
│   │   ├── CSVUpload.jsx        # Batch upload UI
│   │   └── RevocationManager.jsx # Revocation management + QR PNG lookup
│   ├── utils/
│   │   ├── crypto.js              # EdDSA keypair & JWT signing
│   │   ├── crypto.test.js         # Unit tests
│   │   ├── card.js                # PNG card generation
│   │   ├── card.test.js           # Unit tests
│   │   ├── qr.jsx                 # QR code generation
│   │   ├── csv.js                 # CSV parsing & validation
│   │   ├── csv.test.js            # Unit tests
│   │   ├── batch.js               # Batch card generation
│   │   ├── batch.test.js          # Unit tests
│   │   ├── metadata.js            # Metadata generation
│   │   ├── metadata.test.js       # Unit tests
│   │   ├── tokenLookup.js         # Decode QR text + extract token identifiers
│   │   ├── tokenLookup.test.js    # Unit tests
│   │   └── crypto-verify.test.js  # Cross-app integration tests
│   └── App.jsx
├── examples/
│   └── sample-members.csv   # Example CSV file
├── public/
│   └── ampa-logo.png
├── .nvmrc                   # Node.js version
├── vite.config.js           # Vite + Vitest configuration
├── package.json
└── README.md
```

## Security Best Practices

### 🔴 CRITICAL - Private Key Security

1. **Never commit private keys to Git**
   - `.gitignore` blocks `.pem`, `*private*`, `keys/`, etc.
   - Double-check before any `git add`

2. **Never persist keys to storage**
   - Keys are stored in React state only
   - Cleared when app closes
   - Never use `localStorage` or `sessionStorage`

3. **Never deploy this app publicly**
   - Run locally only
   - Private keys must never be exposed

4. **Backup keys securely**
   - Save private key to encrypted storage
   - Use password manager or encrypted drive
   - If lost, all existing cards become invalid

### 🟡 Best Practices

- Generate new keypair for each school year
- Keep CSV files secure (contain member names/IDs)
- Use HTTPS when deploying verification app
- Regularly update expiry dates

## Troubleshooting

### "No key loaded" warning

**Cause**: No private key in memory

**Fix**: Go to Key Management tab and generate or import a keypair

### Cards not verifying in verification app

**Cause**: Public key mismatch

**Fix**: Ensure verification app has the matching public key from this keypair

### CSV upload shows errors

**Cause**: Invalid CSV format or dates

**Fix**:
- Check required columns: `full_name`, `member_id`, `expiry_date`
- Verify date formats

## Credits

Vibe Coder: Raul Jimenez Ortega
AI Assistants: Claude, Codex, Copilot
- Ensure dates are in the future

### Performance issues with large batches

**Target**: < 2 seconds per card

**Tips**:
- For 100+ cards, expect ~3 minutes
- Don't close browser during generation
- Download automatically starts when complete

## Technical Details

### Cryptography

- **Algorithm**: EdDSA with Ed25519 curve
- **Library**: `jose` (Web Crypto API compliant)
- **Key Size**: 256-bit (quantum-resistant)
- **Signature Size**: 64 bytes

### JWT Structure

```json
{
  "v": 1,
  "iss": "AMPA Nova School Almería",
  "sub": "001",
  "name": "María García López",
  "iat": 1707580800,
  "exp": 1739116800,
  "jti": "550e8400-e29b-41d4-a716-446655440000"
}
```

Fields:
- `v` - Token version
- `iss` - Issuer (organization)
- `sub` - Subject (member ID)
- `name` - Member full name
- `iat` - Issued at (Unix timestamp)
- `exp` - Expiration (Unix timestamp)
- `jti` - JWT ID (UUID for tracking/revocation)

### Card Image

- **Size**: 800x1200px (portrait)
- **Format**: PNG
- **QR Code**: High error correction (30%)
- **Elements**: Logo, QR code, member name, expiry date

## Metadata Format

The `metadata.json` file in batch ZIPs contains:

```json
{
  "version": "1.0",
  "generated_at": "2026-02-10T12:00:00.000Z",
  "school_year": "2025-2026",
  "issuer": "AMPA Nova School Almería",
  "total_cards": 150,
  "members": [
    {
      "member_id": "001",
      "name": "María García López",
      "jti": "550e8400-e29b-41d4-a716-446655440000",
      "expiry": "2026-06-30T00:00:00.000Z",
      "filename": "001_maria_garcia_lopez.png"
    }
  ]
}
```

**Purpose**: Track issued cards for renewals and future revocation feature.

## Dependencies

- `react` - UI framework
- `jose` - JWT signing with EdDSA
- `qrcode.react` - QR code generation
- `uuid` - Unique token IDs
- `papaparse` - CSV parsing
- `date-fns` - Date formatting and parsing
- `jszip` - ZIP file creation
- Browser `BarcodeDetector` API - QR image decoding from uploaded PNGs (no server upload)
- `vitest` (dev) - Unit testing framework

## Future Features (v2)

- [ ] Card renewal workflow
- [ ] Export history log
- [ ] Multi-year support
- [ ] Custom card designs
- [ ] Internationalization (Spanish/English)

## Links

- [Main README](../README.md)
- [Verification App](../verification/README.md)
- [Technical Spec](../SPEC.md)
- [Sample CSV](examples/sample-members.csv)
