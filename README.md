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
- **Issuer (production domain):** https://verify.ampanovaschoolalmeria.org/issuer/

> Issuer link is useful for evaluation only. For real use, run issuer locally and never expose production private keys in a public environment.

## What This Repo Contains

- **Issuer app** (`issuer/`): admin tool to create signed membership cards (PNG + QR)
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

- End-to-end local setup: [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md)
- Issuer details: [issuer/README.md](issuer/README.md)
- Verification details: [verification/README.md](verification/README.md)
- Security policy and model: [SECURITY.md](SECURITY.md)
- Technical specification: [docs/SPEC.md](docs/SPEC.md)
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
