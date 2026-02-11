# AMPA Membership Card Verification App

Public-facing web application for merchants to verify the authenticity of AMPA digital membership cards.

## Purpose

Merchants scan a member's QR code, which opens this app with a verification URL. The app:
1. Extracts the JWT token from the URL fragment
2. Verifies the cryptographic signature using the public key
3. Checks the expiration date
4. Checks revocation status (`revoked.json`) when enabled
5. Displays validity status to the merchant

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

App runs on http://localhost:5173

## Testing

```bash
# Run tests once
npm test

# Watch mode
npm run test:watch
```

Tests cover: JWT verification, signature validation, expiry checks, error handling.

## Build for Production

```bash
npm run build
```

Output in `dist/` folder, ready for deployment.

## Configuration

Edit [src/config.json](src/config.json):

```json
{
  "issuer": "AMPA Nova School Almería",
  "publicKey": "-----BEGIN PUBLIC KEY-----\nYOUR_PUBLIC_KEY_HERE\n-----END PUBLIC KEY-----",
  "clockSkewSeconds": 120,
  "revocationEnabled": true,
  "revocationUrl": "/revoked.json",
  "offlinePolicy": "soft-fail",
  "contactUrl": "https://www.ampanovaschoolalmeria.org/sobre-el-ampa/contacto",
  "branding": {
    "primaryColor": "#30414B",
    "secondaryColor": "#52717B",
    "organizationName": "AMPA Novaschool Almeria"
  }
}
```

### Updating the Public Key

**IMPORTANT**: When you generate a new keypair in the issuer app:

1. Copy the public key from issuer app
2. Paste it into `src/config.json` replacing the `publicKey` value
3. Rebuild and redeploy the verification app
4. All previously issued cards will be INVALID (new signatures required)

### Configuration Options

- `issuer` - Organization name (must match JWT issuer)
- `publicKey` - EdDSA public key in PEM format
- `clockSkewSeconds` - Tolerance for time differences (default: 120s)
- `revocationEnabled` - Enable/disable revocation checks
- `revocationUrl` - URL/path to `revoked.json`
- `offlinePolicy` - Revocation fetch failure behavior (`soft-fail`)
- `contactUrl` - Contact page URL used by invalid/revoked UI links
- `branding` - UI colors

## Deployment

### Option 1: Static Hosting (Recommended)

The app is a static SPA, deploy to:
- **Netlify**: Drag `dist/` folder
- **Vercel**: Connect Git repo
- **GitHub Pages**: Push `dist/` to gh-pages branch
- **AWS S3 + CloudFront**: Upload `dist/` contents

### Option 2: Custom Server

```bash
# Build first
npm run build

# Serve with any static server
npx serve dist
```

### Deployment URL

Recommended: `https://verify.ampanovaschoolalmeria.org/verify`

Update issuer app QR URL to match your deployment domain.

## How It Works

### 1. QR Code Scanned

Member shows QR code → Merchant scans → Opens URL:

```
https://verify.ampanovaschoolalmeria.org/verify#token=eyJhbGc...
```

### 2. Token Verification

The app:
- Parses JWT from URL fragment (`#token=...`)
- Verifies signature with EdDSA public key
- Checks expiration date (with 120s clock skew)
- Validates issuer matches config
- Checks `revoked_jti` and `revoked_sub` in `revoked.json` when enabled

### 3. Display Result

**Valid Card**:
- ✅ Green checkmark
- Member name
- Expiry date
- "Membership valid" message

**Invalid Card**:
- ❌ Red X
- Error message
- Expandable technical details
- Reasons: expired, tampered, wrong issuer, malformed

**Revoked Card**:
- ⛔ "Membership Revoked" heading
- Member name shown on second line
- Contact link points to `contactUrl`

## Error Codes

- `NO_TOKEN` - No token in URL
- `MALFORMED` - Invalid JWT format
- `INVALID_SIGNATURE` - Signature verification failed (tampered or wrong key)
- `EXPIRED` - Card past expiration date
- `WRONG_ISSUER` - Issuer doesn't match config
- `REVOKED` - Token/member found in revocation list

## Security

### What's Verified

✅ Cryptographic signature (EdDSA Ed25519)
✅ Expiration date
✅ Issuer identity
✅ Token format & structure
✅ Revocation list (`revoked_jti` and `revoked_sub`) when enabled

### What's NOT Checked

❌ Member ID uniqueness
❌ Online database lookup

### Public Key Distribution

The public key in `config.json` is **safe to distribute**. It can only:
- ✅ Verify signatures
- ❌ Cannot create new signatures
- ❌ Cannot forge cards

## File Structure

```
verification/
├── src/
│   ├── App.jsx              # Main app component
│   ├── components/
│   │   └── VerificationResult.jsx   # UI for valid/invalid states
│   ├── utils/
│   │   ├── verify.js        # JWT verification logic
│   │   └── verify.test.js   # Unit tests (Vitest)
│   ├── config.json          # Public key & configuration
│   └── main.jsx
├── public/
│   └── ampa-logo.png
├── .nvmrc                   # Node.js version
├── vite.config.js           # Vite + Vitest configuration
├── package.json
└── README.md
```

## Browser Support

- ✅ Chrome Desktop (merchant verification)
- ✅ Safari iOS (merchant scanning with phone)
- ✅ Chrome Android (merchant scanning with phone)

## Troubleshooting

### "Invalid signature" for all cards

**Cause**: Public key in config doesn't match private key used to sign cards

**Fix**: Copy correct public key from issuer app to `src/config.json`

### "No membership card detected"

**Cause**: URL doesn't contain `#token=...` fragment

**Fix**: Check QR code generation in issuer app

### Cards showing as expired

**Cause**: System clock differences or genuinely expired

**Fix**: Check merchant device time, or regenerate cards with new expiry dates

## Development Tips

### Test with Invalid Tokens

```javascript
// Tampered token (signature will fail)
window.location.hash = '#token=eyJhbGc...TAMPERED'

// Expired token
// Generate with past expiry date in issuer app
```

### Debugging

Open browser console to see:
- Token parsing
- Verification errors
- JWT payload contents

## Performance

- **Cold start**: ~500ms (JWT verification)
- **Warm verification**: ~100ms
- **No backend required**: All client-side
- **Offline capable**: Works without internet (public key embedded)

## Future Features (v2)

- [ ] PWA support for offline use
- [ ] Internationalization (Spanish/English)
- [ ] Analytics integration
- [ ] Advanced accessibility (WCAG 2.1 AA)

## Links

- [Main README](../README.md)
- [Issuer App](../issuer/README.md)
- [Technical Spec](../SPEC.md)
