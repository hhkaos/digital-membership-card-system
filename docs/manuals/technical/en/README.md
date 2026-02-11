# Technical Manual (English)

## Audience

This manual is for technical users working with this repository:
- developers
- DevOps/release maintainers
- technical AMPA operators

If you only operate the UI, use `docs/manuals/end-user/en/README.md`.

## Repository structure

- `issuer/`: card issuer SPA (admin-only)
- `verification/`: public verification SPA
- `docs/`: project documentation

## Requirements

- Node.js `>=20`
- npm
- Optional: Rust toolchain (desktop packaging via Tauri)

## Local setup

1. Install dependencies:
```bash
npm install
cd verification && npm install && cd ..
cd issuer && npm install && cd ..
```
2. Run tests:
```bash
npm test
```
3. Start apps:
```bash
cd verification && npm run dev
cd issuer && npm run dev
```

Default URLs:
- Verifier: `http://localhost:5173`
- Issuer: `http://localhost:5174`

## Key management and trust model

- Issuer signs JWT cards with Ed25519 private key.
- Verification validates signatures with the Ed25519 public key.
- Private key must never be committed or distributed.
- Public key is expected in verifier config and is safe to publish.

Operational rule:
- When rotating keys, update verifier public key and reissue cards signed with the new private key.

## Verifier configuration

Primary config file:
- `verification/src/config.json`

Critical fields:
- `issuer`
- `publicKey`
- `revocationEnabled`
- `revocationUrl`
- `clockSkewSeconds`
- `offlinePolicy`
- `contactUrl`

After config changes:
1. Build verifier
2. Deploy verifier
3. Validate with known valid and revoked tokens

## Revocation operations

Revocation file schema:
- `revoked_jti`: revoked token IDs
- `revoked_sub`: revoked member IDs
- `updated_at`

Source path for hosted file:
- `verification/public/revoked.json`

Recommended workflow:
1. Load current file in issuer Revocation tab (URL or file import)
2. Merge new entries (deduplicated)
3. Export updated `revoked.json`
4. Publish with verifier deployment
5. Smoke-test revoked token in production URL

## Build and deployment

Verifier:
```bash
cd verification
npm run build
```

Issuer (web):
```bash
cd issuer
npm run build
```

Issuer desktop (optional scaffold):
```bash
cd issuer
npm run desktop:dev
npm run desktop:build
```

## Quality gates before release

1. `npm test` passes at root and app level
2. Valid token verifies as valid on deployed verifier
3. Revoked token verifies as revoked
4. Expired token verifies as invalid
5. `revoked.json` served from expected URL
6. Public key in verifier matches current issuer private key

## Main references

- `README.md`
- `issuer/README.md`
- `verification/README.md`
- `docs/LOCAL_SETUP.md`
- `docs/DESKTOP_SIGNING.md`
- `docs/SPEC.md`
- `SECURITY.md`
