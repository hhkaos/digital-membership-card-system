# Local Setup (End-to-End)

This guide covers a complete local workflow: generate keys, configure verifier, issue cards, and verify them.

## 1. Prerequisites

- Node.js `>=20`
- npm

Optional:

```bash
nvm use
```

## 2. Install dependencies

From repo root:

```bash
npm install
cd verification && npm install && cd ..
cd issuer && npm install && cd ..
```

## 3. Start both apps

```bash
# Terminal 1
cd verification && npm run dev

# Terminal 2
cd issuer && npm run dev
```

- Verification: `http://localhost:5173`
- Issuer: `http://localhost:5174`

## 4. Generate keypair in issuer

1. Open `http://localhost:5174`
2. Go to **Key Management**
3. Click **Generate Keypair**
4. Copy the public key

## 5. Configure verification public key

Edit `verification/src/config.json` and replace `publicKey` with the key from issuer.

Then restart verification app if needed.

## 6. Generate cards

### Manual

1. In issuer, open **Generate Card**
2. Enter member data
3. Generate and download PNG

### CSV batch

1. Prepare CSV with columns: `full_name,member_id,expiry_date`
2. Use sample: `issuer/examples/sample-members.csv`
3. In issuer, open **Batch Upload** and generate ZIP

Supported dates include `YYYY-MM-DD`, `DD/MM/YYYY`, `DD-MM-YYYY`, and `D/M/YYYY`.

## 7. Verify a card

1. Open a generated card PNG
2. Scan the QR code
3. URL opens verifier and displays result

## Notes

- For production, keep issuer private/local and protect private keys.
- Verifier can be deployed publicly because it only needs the public key.
