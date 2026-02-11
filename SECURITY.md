# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please contact the maintainer directly:

- **Website**: [rauljimenez.info](https://rauljimenez.info)

Include as much detail as possible:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

You should receive a response within 48 hours. We will work with you to understand and address the issue before any public disclosure.

## Security Model

This project uses a cryptographic security model based on signed tokens. Understanding the security boundaries is important:

### Private Key Security

- Private keys are generated and used **only** in the Issuer app
- The Issuer app runs **locally** and is never deployed publicly
- Private keys are held in React state only and **never persisted** to localStorage, cookies, or any browser storage
- Private keys must **never** be committed to Git (enforced via `.gitignore`)

### Token Security

- **Algorithm**: EdDSA with Ed25519 (fast verification, strong security)
- **Token content**: Only non-sensitive data (name, member ID, expiry) — no addresses, phone numbers, or financial data
- **Token transport**: Passed in URL fragment (`#token=...`) to avoid server logs and HTTP referrer leakage
- **Expiration**: All tokens have an expiry date; expired tokens are rejected
- **Clock skew**: 120-second tolerance for clock differences between devices

### Verification Security

- The public key is safe to distribute and is embedded in the Verification app
- All verification happens **client-side** — no server processes tokens
- Tampered tokens are cryptographically rejected
- Optional revocation list (`revoked.json`) allows invalidating specific tokens

### What is NOT in scope

- Denial-of-service attacks against GitHub Pages hosting
- Social engineering attacks against AMPA administrators
- Vulnerabilities in third-party dependencies (please report these upstream)

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 2.x     | Yes       |
| < 2.0   | No        |
