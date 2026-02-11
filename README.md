# AMPA Digital Membership Card System

[![CI](https://github.com/hhkaos/digital-membership-card-system/actions/workflows/ci.yml/badge.svg)](https://github.com/hhkaos/digital-membership-card-system/actions/workflows/ci.yml)
[![Pages](https://github.com/hhkaos/digital-membership-card-system/actions/workflows/pages.yml/badge.svg)](https://github.com/hhkaos/digital-membership-card-system/actions/workflows/pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)
![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20-339933?logo=nodedotjs)
![Vitest](https://img.shields.io/badge/Tested_with-Vitest-6E9F18?logo=vitest)

A cryptographically secure digital membership card platform for AMPA Nova School Almeria.

## Try the Live Apps

- **Verifier (production domain):** https://verify.ampanovaschoolalmeria.org/
  - [Verifier with a **valid** badge](https://verify.ampanovaschoolalmeria.org/#token=eyJhbGciOiJFZERTQSJ9.eyJ2IjoxLCJpc3MiOiJhbXBhOmFtcGEtbm92YS1zY2hvb2wtYWxtZXJpYSIsInN1YiI6IjAwMDAxIiwibmFtZSI6IlJhw7psIEppbcOpbmV6IE9ydGVnYSIsImlhdCI6MTc3MDc2OTcwMCwiZXhwIjoxNzkwNzI2NDAwLCJqdGkiOiI2OTI4MTJkNC1lMzljLTQwY2YtOGY0My1hMjE1YTg4ZjkzZjMifQ.wAU5-WNpgh0iIHR51rjZ05NV8GxO5voxqM2918wE2xs_0Nxm-zH0_nnNcMD7B6EfcddFXz3PJlMlwE8ANfOIAw)
  - [Verifier with a **revoked** badge](https://verify.ampanovaschoolalmeria.org/#token=eyJhbGciOiJFZERTQSJ9.eyJ2IjoxLCJpc3MiOiJhbXBhOmFtcGEtbm92YS1zY2hvb2wtYWxtZXJpYSIsInN1YiI6IjAwMSIsIm5hbWUiOiJNYXLDrWEgR2FyY8OtYSBMw7NwZXoiLCJpYXQiOjE3NzA4MDIwMTYsImV4cCI6MTc4Mjc3MDQwMCwianRpIjoiZTM5Y2E2MzEtM2UwOC00YTIwLThlMjQtZDllMWU3NzE2ZjJmIn0.SaqhFb5jVSq5tA07vik--NcuBFuvsti3iFznrOMLJBgyu-DK6PFTy8EMe_IBcZm0-NC5KjtYdmp9TLOPnDHECQ)
- **Issuer (production domain):** https://verify.ampanovaschoolalmeria.org/issuer/

> Issuer link is useful for evaluation only. For real use, run issuer locally and never expose production private keys in a public environment.

## What This Repo Contains

- **Issuer app** (`issuer/`): admin tool to create signed membership cards (PNG + QR)
- **Issuer desktop scaffold** (`issuer/src-tauri/`): optional installer packaging path for Windows/macOS/Linux
- **Verification app** (`verification/`): public app for merchants to validate cards
- **Shared project docs** (`docs/`): technical spec, roadmap, and implementation notes

Cards are signed with **EdDSA (Ed25519)**. Verification is performed client-side using the public key.

## Quick Start

### Prerequisites

- Node.js `>=20`

### Install and test

```bash
npm install
cd verification && npm install && cd ..
cd issuer && npm install && cd ..
npm test
```

### Run locally

```bash
# Terminal 1
cd verification && npm run dev

# Terminal 2
cd issuer && npm run dev
```

- Verification local URL: `http://localhost:5173`
- Issuer local URL: `http://localhost:5174`

For full end-to-end setup (key generation, config wiring, card generation, verification flow), see [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md).

## Documentation Map

- Manuals index (EN/ES, end-user + technical): [docs/MANUALS.md](docs/MANUALS.md)
- Issuer end-user manual (EN): [docs/manuals/end-user/issuer/en/README.md](docs/manuals/end-user/issuer/en/README.md)
- Manual de usuario del Emisor (ES): [docs/manuals/end-user/issuer/es/README.md](docs/manuals/end-user/issuer/es/README.md)
- Verifier end-user manual (EN): [docs/manuals/end-user/verifier/en/README.md](docs/manuals/end-user/verifier/en/README.md)
- Manual de usuario del Verificador (ES): [docs/manuals/end-user/verifier/es/README.md](docs/manuals/end-user/verifier/es/README.md)
- Technical manual (EN): [docs/manuals/technical/en/README.md](docs/manuals/technical/en/README.md)
- Manual técnico (ES): [docs/manuals/technical/es/README.md](docs/manuals/technical/es/README.md)
- End-to-end local setup: [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md)
- Issuer details: [issuer/README.md](issuer/README.md)
- Issuer PWA install/offline guide: [issuer/README.md#pwa-install-and-offline-behavior](issuer/README.md#pwa-install-and-offline-behavior)
- Verification details: [verification/README.md](verification/README.md)
- Security policy and model: [SECURITY.md](SECURITY.md)
- Technical specification: [docs/SPEC.md](docs/SPEC.md)
- Desktop packaging/signing guide: [docs/DESKTOP_SIGNING.md](docs/DESKTOP_SIGNING.md)
- Roadmap and status: [docs/TODO.md](docs/TODO.md)
- Implementation plan/history: [docs/PLAN.md](docs/PLAN.md)
- Contributing guide: [CONTRIBUTING.md](CONTRIBUTING.md)

## Security

- Never commit private keys.
- Issuer is intended for local/admin use.
- Verification distributes only a public key.

See full details in [SECURITY.md](SECURITY.md).

## License

MIT. See [LICENSE](LICENSE).
