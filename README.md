# AMPA Digital Membership Card System

A cryptographically secure digital membership card system with QR codes for merchant verification. Built for AMPA (Asociación de Madres y Padres de Alumnos) Nova School Almería.

## Overview

This system consists of two web applications:

1. **Issuer App** - Admin tool to generate digital membership cards
2. **Verification App** - Merchant-facing app to verify card authenticity

Cards are cryptographically signed using EdDSA (Ed25519) and distributed as PNG images with embedded QR codes. Merchants scan the QR code to instantly verify membership validity.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        ISSUER APP                            │
│  (Admin only - runs locally, never deployed publicly)        │
├─────────────────────────────────────────────────────────────┤
│  1. Generate Ed25519 keypair                                 │
│  2. Create signed JWTs for members                           │
│  3. Generate QR codes with verification URLs                 │
│  4. Output: PNG cards for distribution                       │
└─────────────────────────────────────────────────────────────┘
                             │
                             │ Cards distributed
                             │ to members
                             ▼
                    ┌──────────────┐
                    │   Members    │
                    │ (PNG cards)  │
                    └──────────────┘
                             │
                             │ Shows QR
                             │ at merchant
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    VERIFICATION APP                          │
│         (Public - deployed to verify.ampanova...)            │
├─────────────────────────────────────────────────────────────┤
│  1. Scan QR code (or click link)                             │
│  2. Verify JWT signature with public key                     │
│  3. Check expiration date                                    │
│  4. Display: Valid ✅ or Invalid ❌                          │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Install Dependencies

```bash
# Install verification app
cd verification
npm install

# Install issuer app
cd ../issuer
npm install
```

### 2. Generate Keypair

```bash
# Start issuer app
cd issuer
npm run dev
```

1. Open http://localhost:5174
2. Go to "🔑 Key Management" tab
3. Click "Generate Keypair"
4. **IMPORTANT**: Copy the public key for the next step

### 3. Configure Verification App

```bash
cd verification/src
```

Edit [config.json](verification/src/config.json) and paste your public key:

```json
{
  "issuer": "AMPA Nova School Almería",
  "publicKey": "-----BEGIN PUBLIC KEY-----\nYOUR_PUBLIC_KEY_HERE\n-----END PUBLIC KEY-----",
  ...
}
```

### 4. Start Verification App

```bash
cd verification
npm run dev
```

Open http://localhost:5173

### 5. Generate Cards

**Option A: Manual Entry** (single card)
1. In issuer app, go to "🎫 Generate Card" tab
2. Fill in member details
3. Click "Generate Card"
4. Download PNG card

**Option B: CSV Batch Upload** (multiple cards)
1. Prepare CSV file (see [sample-members.csv](issuer/examples/sample-members.csv))
2. Go to "📦 Batch Upload" tab
3. Upload CSV file
4. Click "Generate All Cards"
5. Download ZIP file with all cards

### 6. Verify Cards

1. Open a generated card PNG
2. Scan QR code with phone camera
3. Opens verification app → Shows ✅ Valid

## Project Structure

```
socios-ampa/
├── verification/          # Verification web app
│   ├── src/
│   │   ├── components/    # VerificationResult.jsx
│   │   ├── utils/         # verify.js (JWT verification)
│   │   └── config.json    # Public key configuration
│   └── public/
│       └── ampa-logo.png
│
├── issuer/                # Card issuer web app
│   ├── src/
│   │   ├── components/    # KeyManagement, ManualEntry, CSVUpload
│   │   ├── utils/
│   │   │   ├── crypto.js      # EdDSA key generation & JWT signing
│   │   │   ├── card.js        # PNG card generation
│   │   │   ├── qr.jsx         # QR code generation
│   │   │   ├── csv.js         # CSV parsing & validation
│   │   │   ├── batch.js       # Batch card generation
│   │   │   └── metadata.js    # Metadata generation
│   │   └── App.jsx
│   ├── examples/
│   │   └── sample-members.csv
│   └── public/
│       └── ampa-logo.png
│
├── images/                # Project images
├── TODO.md               # Implementation checklist
├── SPEC.md               # Technical specification
└── README.md             # This file
```

## Security Notes

### 🔴 CRITICAL - Private Key Security

- **NEVER** commit private keys to Git (.gitignore blocks `.pem`, `*private*`, etc.)
- **NEVER** persist private keys to localStorage or any browser storage
- **ALWAYS** keep issuer app offline (never deploy publicly)
- Private keys are stored in React state only and cleared on app close

### JWT Security

- Algorithm: **EdDSA with Ed25519** (quantum-resistant, fast verification)
- Expiration: Configurable per card (typically 1 year)
- Clock skew tolerance: 120 seconds
- No sensitive data in JWT (only name, ID, expiry)

### Verification Security

- Public key is safe to distribute
- Tampered tokens are automatically rejected
- Expired tokens show as invalid
- All verification happens client-side (no server required)

### Browser Compatibility

- Verification uses Web Crypto API (Ed25519) on modern browsers for best performance
- Automatically falls back to pure JS Ed25519 (`@noble/ed25519`) on browsers that don't support Ed25519 in Web Crypto (e.g. Safari/iOS < 17)

## Technology Stack

- **React 19** - UI framework
- **Vite** - Build tool
- **jose** - JWT signing/verification (EdDSA Ed25519)
- **@noble/ed25519** - Pure JS Ed25519 fallback for Safari/iOS compatibility
- **qrcode.react** - QR code generation
- **papaparse** - CSV parsing
- **jszip** - ZIP file generation
- **date-fns** - Date handling

## CSV Format

For batch uploads, use this format:

```csv
full_name,member_id,expiry_date
María García López,001,2025-06-30
Juan Pérez,002,30/06/2025
Ana Rodríguez,003,30-06-2025
```

Supported date formats:
- `YYYY-MM-DD` (2025-06-30)
- `DD/MM/YYYY` (30/06/2025)
- `DD-MM-YYYY` (30-06-2025)
- `D/M/YYYY` (1/6/2025)

## Links

- **Issuer App**: [issuer/README.md](issuer/README.md)
- **Verification App**: [verification/README.md](verification/README.md)
- **Technical Spec**: [SPEC.md](SPEC.md)
- **Implementation TODO**: [TODO.md](TODO.md)

## License

MIT License - see [LICENSE](LICENSE) file for details.

Free to use, modify, and distribute for any purpose.

## Support

For issues or questions, contact AMPA administrators.
