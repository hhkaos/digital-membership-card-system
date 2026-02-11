# Issuer End User Manual (English)

## Who this guide is for

This guide is for non-technical AMPA admins using the Issuer app.

## What you can do in Issuer

- Load or create signing keys
- Generate one card manually
- Generate many cards from CSV
- Revoke cards/members and export `revoked.json`

## 1. Open the app

Open the Issuer app and select language with `ES/EN`.

![Placeholder - Issuer home](../../assets/placeholder.svg)
_Replace with screenshot: Issuer home with tabs._

## 2. Key Management

Go to `🔑 Key Management`.

- First time: click `Generate New Keypair`
- Existing key: paste it in `Import Existing Private Key`
- Keep private key secret

![Placeholder - Key Management](../../assets/placeholder.svg)
_Replace with screenshot: key generation/import area._

## 3. Generate one card

Go to `🎫 Generate Card`.

1. Enter `Full Name`
2. Enter `Member ID`
3. Set `Expiry Date`
4. Click `Generate Card`

Expected result: PNG card is downloaded.

![Placeholder - Generate Card](../../assets/placeholder.svg)
_Replace with screenshot: manual generation form and success._

## 4. Generate cards from CSV

Go to `📦 Batch Upload`.

CSV columns:
- `full_name`
- `member_id`
- `expiry_date` (YYYY-MM-DD)

Steps:
1. Click `Select CSV File`
2. Review validation
3. Click `Generate N Cards`

Expected result: ZIP with cards and metadata.

![Placeholder - Batch Upload](../../assets/placeholder.svg)
_Replace with screenshot: CSV validation and generate button._

## 5. Revocation

Go to `🚫 Revocation`.

You can:
- Revoke one token by `jti`
- Revoke all member tokens by `sub`

Recommended flow:
1. Load and merge current `revoked.json`
2. Add revocations (manual or QR PNG lookup)
3. Download updated `revoked.json`
4. Publish it through your normal deployment process

![Placeholder - Revocation](../../assets/placeholder.svg)
_Replace with screenshot: current list and export actions._

## Common issues

- `Private key not loaded`
  - Load/import key in `Key Management`
- Batch CSV errors
  - Check required columns and date format
- Revocation not reflected
  - Make sure updated `revoked.json` was deployed
