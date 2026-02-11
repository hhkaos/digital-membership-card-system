# AMPA Digital Membership Card System

[![CI](https://github.com/hhkaos/digital-membership-card-system/actions/workflows/ci.yml/badge.svg)](https://github.com/hhkaos/digital-membership-card-system/actions/workflows/ci.yml)
[![Pages](https://github.com/hhkaos/digital-membership-card-system/actions/workflows/pages.yml/badge.svg)](https://github.com/hhkaos/digital-membership-card-system/actions/workflows/pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)
![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20-339933?logo=nodedotjs)
![Vitest](https://img.shields.io/badge/Tested_with-Vitest-6E9F18?logo=vitest)
![ESLint](https://img.shields.io/badge/Linter-ESLint-4B32C3?logo=eslint)
![Husky](https://img.shields.io/badge/Git_Hooks-Husky-yellow)
![Crypto](https://img.shields.io/badge/Crypto-EdDSA_Ed25519-green?logo=letsencrypt)
![GitHub Pages](https://img.shields.io/badge/Deployed_on-GitHub_Pages-222?logo=githubpages)

![AI Assisted: Claude Code](https://img.shields.io/badge/AI_Assisted-Claude_Code-purple)
![AI Assisted: GitHub Copilot](https://img.shields.io/badge/AI_Assisted-GitHub_Copilot-blue)
![AI Assisted: OpenAI Codex](https://img.shields.io/badge/AI_Assisted-OpenAI_Codex-green)
![AI Assisted: ChatGPT](https://img.shields.io/badge/AI_Assisted-ChatGPT-10a37f)

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

### Prerequisites

- **Node.js >= 20** (recommended: use [nvm](https://github.com/nvm-sh/nvm))

```bash
# If using nvm, the .nvmrc file will set the correct version
nvm use
```

### 1. Install Dependencies

```bash
# Install root dependencies (husky git hooks)
npm install

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
├── .github/workflows/
│   └── ci.yml             # GitHub Actions CI (runs tests on PRs & pushes)
├── .husky/
│   └── pre-push           # Git hook: runs tests before push
├── verification/          # Verification web app
│   ├── src/
│   │   ├── components/    # VerificationResult.jsx
│   │   ├── utils/
│   │   │   ├── verify.js       # JWT verification logic
│   │   │   └── verify.test.js  # Unit tests
│   │   └── config.json    # Public key configuration
│   └── public/
│       └── ampa-logo.png
│
├── issuer/                # Card issuer web app
│   ├── src/
│   │   ├── components/    # KeyManagement, ManualEntry, CSVUpload
│   │   ├── utils/
│   │   │   ├── crypto.js           # EdDSA key generation & JWT signing
│   │   │   ├── crypto.test.js      # Unit tests
│   │   │   ├── card.js             # PNG card generation
│   │   │   ├── card.test.js        # Unit tests
│   │   │   ├── qr.jsx              # QR code generation
│   │   │   ├── csv.js              # CSV parsing & validation
│   │   │   ├── csv.test.js         # Unit tests
│   │   │   ├── batch.js            # Batch card generation
│   │   │   ├── batch.test.js       # Unit tests
│   │   │   ├── metadata.js         # Metadata generation
│   │   │   ├── metadata.test.js    # Unit tests
│   │   │   └── crypto-verify.test.js # Cross-app integration tests
│   │   └── App.jsx
│   ├── examples/
│   │   └── sample-members.csv
│   └── public/
│       └── ampa-logo.png
│
├── .nvmrc                 # Node.js version (nvm)
├── package.json           # Root: husky + test script
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

## Testing

Both apps use [Vitest](https://vitest.dev/) for unit testing. Tests cover all core utility functions: JWT verification, cryptography, CSV parsing, batch generation, and metadata.

```bash
# Run all tests (both apps)
npm test

# Run tests for a specific app
cd verification && npm test
cd issuer && npm test

# Watch mode
cd verification && npm run test:watch
cd issuer && npm run test:watch
```

### CI/CD

- **Pre-push hook**: [Husky](https://typicode.github.io/husky/) runs all tests locally before every `git push`
- **GitHub Actions**: CI workflow runs tests on every PR and push to `main` (see badge above)

## Technology Stack

- **React 19** - UI framework
- **Vite** - Build tool
- **Vitest** - Unit testing framework
- **jose** - JWT signing/verification (EdDSA Ed25519)
- **@noble/ed25519** - Pure JS Ed25519 fallback for Safari/iOS compatibility
- **qrcode.react** - QR code generation
- **papaparse** - CSV parsing
- **jszip** - ZIP file generation
- **date-fns** - Date handling
- **husky** - Git hooks (pre-push test runner)

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
