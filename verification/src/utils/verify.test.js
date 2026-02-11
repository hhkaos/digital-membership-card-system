import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateKeyPair, exportSPKI, SignJWT, exportPKCS8, importPKCS8 } from 'jose';
import { validateExpiry, verifyToken, checkRevocation, VerificationError } from './verify.js';

// Helper: generate a test Ed25519 keypair
async function createTestKeypair() {
  const { privateKey, publicKey } = await generateKeyPair('EdDSA', {
    crv: 'Ed25519',
    extractable: true,
  });
  const publicKeyPEM = await exportSPKI(publicKey);
  return { privateKey, publicKey, publicKeyPEM };
}

// Helper: sign a test JWT
async function signTestJWT(payload, privateKey) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'EdDSA' })
    .sign(privateKey);
}

describe('validateExpiry', () => {
  it('returns true when expiry is in the future', () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    expect(validateExpiry(futureExp)).toBe(true);
  });

  it('returns true when expiry is within clock skew window', () => {
    const recentlyExpired = Math.floor(Date.now() / 1000) - 60; // 60 seconds ago
    expect(validateExpiry(recentlyExpired, 120)).toBe(true);
  });

  it('returns false when expiry is beyond clock skew', () => {
    const longExpired = Math.floor(Date.now() / 1000) - 300; // 5 minutes ago
    expect(validateExpiry(longExpired, 120)).toBe(false);
  });

  it('returns false when expiry is null or undefined', () => {
    expect(validateExpiry(null, 120)).toBe(false);
    expect(validateExpiry(undefined, 120)).toBe(false);
  });

  it('uses default clock skew of 120 seconds', () => {
    const justExpired = Math.floor(Date.now() / 1000) - 100; // 100 seconds ago
    expect(validateExpiry(justExpired)).toBe(true); // within default 120s

    const tooOld = Math.floor(Date.now() / 1000) - 200; // 200 seconds ago
    expect(validateExpiry(tooOld)).toBe(false); // beyond default 120s
  });
});

describe('verifyToken', () => {
  let keypair;
  const issuer = 'ampa:ampa-nova-school-almeria';

  beforeEach(async () => {
    keypair = await createTestKeypair();
  });

  it('returns NO_TOKEN error for null/empty input', async () => {
    const result = await verifyToken(null, keypair.publicKeyPEM, issuer);
    expect(result.success).toBe(false);
    expect(result.error.type).toBe(VerificationError.NO_TOKEN);
  });

  it('returns NO_TOKEN error for empty string', async () => {
    const result = await verifyToken('', keypair.publicKeyPEM, issuer);
    expect(result.success).toBe(false);
    expect(result.error.type).toBe(VerificationError.NO_TOKEN);
  });

  it('successfully verifies a valid JWT', async () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const payload = {
      v: 1,
      iss: issuer,
      sub: 'member-123',
      name: 'Test User',
      exp: futureExp,
      jti: 'test-jti-123',
    };

    const jwt = await signTestJWT(payload, keypair.privateKey);
    const result = await verifyToken(jwt, keypair.publicKeyPEM, issuer);

    expect(result.success).toBe(true);
    expect(result.payload.name).toBe('Test User');
    expect(result.payload.sub).toBe('member-123');
    expect(result.payload.iss).toBe(issuer);
  });

  it('rejects a tampered JWT', async () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const payload = {
      v: 1,
      iss: issuer,
      sub: 'member-123',
      name: 'Test User',
      exp: futureExp,
      jti: 'test-jti-123',
    };

    const jwt = await signTestJWT(payload, keypair.privateKey);

    // Tamper with the payload (middle part)
    const parts = jwt.split('.');
    parts[1] = parts[1] + 'TAMPERED';
    const tamperedJwt = parts.join('.');

    const result = await verifyToken(tamperedJwt, keypair.publicKeyPEM, issuer);
    expect(result.success).toBe(false);
    expect([VerificationError.INVALID_SIGNATURE, VerificationError.MALFORMED]).toContain(result.error.type);
  });

  it('rejects an expired JWT beyond clock skew', async () => {
    const pastExp = Math.floor(Date.now() / 1000) - 300; // 5 minutes ago
    const payload = {
      v: 1,
      iss: issuer,
      sub: 'member-123',
      name: 'Test User',
      exp: pastExp,
      jti: 'test-jti-123',
    };

    const jwt = await signTestJWT(payload, keypair.privateKey);
    const result = await verifyToken(jwt, keypair.publicKeyPEM, issuer, 120);

    expect(result.success).toBe(false);
    expect(result.error.type).toBe(VerificationError.EXPIRED);
  });

  it('rejects a JWT with wrong issuer', async () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const payload = {
      v: 1,
      iss: 'wrong:issuer',
      sub: 'member-123',
      name: 'Test User',
      exp: futureExp,
      jti: 'test-jti-123',
    };

    const jwt = await signTestJWT(payload, keypair.privateKey);
    const result = await verifyToken(jwt, keypair.publicKeyPEM, issuer);

    expect(result.success).toBe(false);
    expect(result.error.type).toBe(VerificationError.WRONG_ISSUER);
  });

  it('rejects a malformed JWT string', async () => {
    const result = await verifyToken('not-a-jwt', keypair.publicKeyPEM, issuer);
    expect(result.success).toBe(false);
    expect(result.error.type).toBe(VerificationError.MALFORMED);
  });

  it('rejects a JWT signed with a different key', async () => {
    const otherKeypair = await createTestKeypair();
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const payload = {
      v: 1,
      iss: issuer,
      sub: 'member-123',
      name: 'Test User',
      exp: futureExp,
      jti: 'test-jti-123',
    };

    // Sign with other keypair's private key
    const jwt = await signTestJWT(payload, otherKeypair.privateKey);

    // Verify with original keypair's public key
    const result = await verifyToken(jwt, keypair.publicKeyPEM, issuer);
    expect(result.success).toBe(false);
    expect([VerificationError.INVALID_SIGNATURE, VerificationError.MALFORMED]).toContain(result.error.type);
  });
});

describe('checkRevocation', () => {
  const baseConfig = {
    revocationEnabled: true,
    revocationUrl: '/revoked.json',
    offlinePolicy: 'soft-fail',
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns revoked when jti is in revoked_jti list', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        updated_at: '2026-02-11T00:00:00Z',
        revoked_jti: ['revoked-jti-1', 'revoked-jti-2'],
        revoked_sub: [],
      }),
    }));

    const result = await checkRevocation('revoked-jti-1', 'member-123', baseConfig);
    expect(result.revoked).toBe(true);
  });

  it('returns revoked when sub is in revoked_sub list', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        updated_at: '2026-02-11T00:00:00Z',
        revoked_jti: [],
        revoked_sub: ['member-123', 'member-456'],
      }),
    }));

    const result = await checkRevocation('some-jti', 'member-123', baseConfig);
    expect(result.revoked).toBe(true);
  });

  it('returns not revoked when token is not in any list', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        updated_at: '2026-02-11T00:00:00Z',
        revoked_jti: ['other-jti'],
        revoked_sub: ['other-sub'],
      }),
    }));

    const result = await checkRevocation('my-jti', 'my-sub', baseConfig);
    expect(result.revoked).toBe(false);
    expect(result.warning).toBeUndefined();
  });

  it('returns not revoked with warning on fetch failure (soft-fail)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const result = await checkRevocation('any-jti', 'any-sub', baseConfig);
    expect(result.revoked).toBe(false);
    expect(result.warning).toBe(true);
  });

  it('returns not revoked with warning on non-ok HTTP response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    }));

    const result = await checkRevocation('any-jti', 'any-sub', baseConfig);
    expect(result.revoked).toBe(false);
    expect(result.warning).toBe(true);
  });

  it('returns not revoked for empty revocation list', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        updated_at: '2026-02-11T00:00:00Z',
        revoked_jti: [],
        revoked_sub: [],
      }),
    }));

    const result = await checkRevocation('my-jti', 'my-sub', baseConfig);
    expect(result.revoked).toBe(false);
  });

  it('skips check entirely when revocationEnabled is false', async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    const result = await checkRevocation('any-jti', 'any-sub', {
      ...baseConfig,
      revocationEnabled: false,
    });

    expect(result.revoked).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
