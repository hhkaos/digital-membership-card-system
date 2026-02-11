import { describe, it, expect } from 'vitest';
import {
  generateKeypair,
  exportPrivateKey,
  exportPublicKey,
  importPrivateKey,
  signJWT,
  createMemberPayload,
  isValidPEMFormat,
  getKeyFingerprint,
} from './crypto.js';

describe('generateKeypair', () => {
  it('returns an object with privateKey and publicKey', async () => {
    const { privateKey, publicKey } = await generateKeypair();
    expect(privateKey).toBeDefined();
    expect(publicKey).toBeDefined();
  });
});

describe('exportPrivateKey / exportPublicKey', () => {
  it('exports private key in PEM format', async () => {
    const { privateKey } = await generateKeypair();
    const pem = await exportPrivateKey(privateKey);
    expect(pem).toContain('-----BEGIN PRIVATE KEY-----');
    expect(pem).toContain('-----END PRIVATE KEY-----');
  });

  it('exports public key in PEM format', async () => {
    const { publicKey } = await generateKeypair();
    const pem = await exportPublicKey(publicKey);
    expect(pem).toContain('-----BEGIN PUBLIC KEY-----');
    expect(pem).toContain('-----END PUBLIC KEY-----');
  });
});

describe('importPrivateKey', () => {
  it('roundtrips: export then import a private key', async () => {
    const { privateKey } = await generateKeypair();
    const pem = await exportPrivateKey(privateKey);
    const imported = await importPrivateKey(pem);
    expect(imported).toBeDefined();
  });

  it('throws for null input', async () => {
    await expect(importPrivateKey(null)).rejects.toThrow('Invalid PEM format');
  });

  it('throws for empty string', async () => {
    await expect(importPrivateKey('')).rejects.toThrow('Invalid PEM format');
  });

  it('throws for invalid PEM content', async () => {
    await expect(importPrivateKey('not-a-pem')).rejects.toThrow('Failed to import private key');
  });
});

describe('signJWT', () => {
  it('produces a valid 3-part JWT string', async () => {
    const { privateKey } = await generateKeypair();
    const payload = {
      v: 1,
      iss: 'ampa:ampa-nova-school-almeria',
      sub: 'member-123',
      name: 'Test User',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      jti: 'test-jti',
    };

    const jwt = await signJWT(payload, privateKey);
    const parts = jwt.split('.');
    expect(parts).toHaveLength(3);
    expect(parts[0].length).toBeGreaterThan(0);
    expect(parts[1].length).toBeGreaterThan(0);
    expect(parts[2].length).toBeGreaterThan(0);
  });

  it('throws when private key is null', async () => {
    const payload = { iss: 'test', sub: 'test', exp: 9999999999, jti: 'j' };
    await expect(signJWT(payload, null)).rejects.toThrow('Private key is required');
  });
});

describe('createMemberPayload', () => {
  it('includes all required JWT fields', () => {
    const payload = createMemberPayload({
      fullName: 'Test User',
      memberId: 'member-123',
      expiryDate: '2027-08-31',
    });

    expect(payload.v).toBe(1);
    expect(payload.iss).toBe('ampa:ampa-nova-school-almeria');
    expect(payload.sub).toBe('member-123');
    expect(payload.name).toBe('Test User');
    expect(payload.iat).toBeTypeOf('number');
    expect(payload.exp).toBeTypeOf('number');
    expect(payload.jti).toBeTypeOf('string');
  });

  it('generates unique jti for each call', () => {
    const data = { fullName: 'Test', memberId: '123', expiryDate: '2027-08-31' };
    const p1 = createMemberPayload(data);
    const p2 = createMemberPayload(data);
    expect(p1.jti).not.toBe(p2.jti);
  });

  it('converts expiry date to Unix timestamp', () => {
    const payload = createMemberPayload({
      fullName: 'Test',
      memberId: '123',
      expiryDate: '2027-08-31',
    });
    const expected = Math.floor(new Date('2027-08-31').getTime() / 1000);
    expect(payload.exp).toBe(expected);
  });

  it('sets iat to current time', () => {
    const before = Math.floor(Date.now() / 1000);
    const payload = createMemberPayload({
      fullName: 'Test',
      memberId: '123',
      expiryDate: '2027-08-31',
    });
    const after = Math.floor(Date.now() / 1000);
    expect(payload.iat).toBeGreaterThanOrEqual(before);
    expect(payload.iat).toBeLessThanOrEqual(after);
  });
});

describe('isValidPEMFormat', () => {
  it('returns true for valid private key PEM', () => {
    const pem = '-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEIFake\n-----END PRIVATE KEY-----';
    expect(isValidPEMFormat(pem)).toBe(true);
  });

  it('returns false for null', () => {
    expect(isValidPEMFormat(null)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isValidPEMFormat('')).toBe(false);
  });

  it('returns false for non-string', () => {
    expect(isValidPEMFormat(123)).toBe(false);
  });

  it('returns false for public key PEM', () => {
    const pem = '-----BEGIN PUBLIC KEY-----\nMC4CAQAwBQYDK2VwBCIEIFake\n-----END PUBLIC KEY-----';
    expect(isValidPEMFormat(pem)).toBe(false);
  });

  it('returns false for garbage text', () => {
    expect(isValidPEMFormat('random garbage')).toBe(false);
  });
});

describe('getKeyFingerprint', () => {
  it('returns last 8 characters by default', () => {
    const pem = '-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEA9x1GPMNiyWmgcjZUGWcWQwJ7x3epVhU9rZ1JzsyqyAE=\n-----END PUBLIC KEY-----';
    const fp = getKeyFingerprint(pem);
    expect(fp).toHaveLength(8);
    expect(fp).toBe('zsyqyAE=');
  });

  it('returns custom length', () => {
    const pem = '-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEA9x1GPMNiyWmgcjZUGWcWQwJ7x3epVhU9rZ1JzsyqyAE=\n-----END PUBLIC KEY-----';
    const fp = getKeyFingerprint(pem, 4);
    expect(fp).toHaveLength(4);
  });

  it('returns empty string for null/undefined', () => {
    expect(getKeyFingerprint(null)).toBe('');
    expect(getKeyFingerprint(undefined)).toBe('');
  });
});
