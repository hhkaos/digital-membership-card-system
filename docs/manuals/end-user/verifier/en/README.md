# Verifier End User Manual (English)

## Who this guide is for

This guide is for merchants and non-technical users checking membership cards in the Verifier app.

## What Verifier does

After scanning a card QR, Verifier checks:
- Signature validity
- Expiry date
- Issuer match
- Revocation status

## 1. Open verification from QR

1. Scan member QR code
2. Open the verification URL
3. Wait for validation result

![Placeholder - Verifier loading](../../assets/placeholder.svg)
_Replace with screenshot: verifier loading state._

## 2. Understand result states

### Valid Membership

- Green state with member name
- Shows validity date
- Membership is accepted

![Placeholder - Valid result](../../assets/placeholder.svg)
_Replace with screenshot: valid membership state._

### Membership Revoked

- Revoked membership warning
- Card/member should not be accepted
- Use contact link for support

![Placeholder - Revoked result](../../assets/placeholder.svg)
_Replace with screenshot: revoked state._

### Invalid Membership

Possible reasons:
- expired card
- modified/tampered token
- invalid format
- wrong issuer

You can open `Show Technical Details` for support diagnostics.

![Placeholder - Invalid result](../../assets/placeholder.svg)
_Replace with screenshot: invalid state with technical details._

## 3. Language and support

- Switch language with `ES/EN`
- Use contact link when shown for AMPA support

## Common issues

- `No membership card detected`
  - QR URL does not include token
- `Verification system not configured`
  - Public key/config missing in verifier deployment
- `Revocation status could not be checked`
  - Temporary network or revocation file issue
