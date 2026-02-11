import { describe, it, expect } from 'vitest';
import {
  extractTokenFromQrText,
  extractIdentifiersFromToken,
  extractIdentifiersFromQrText,
  decodeQRCodeFromImageFile,
} from './tokenLookup.js';

function toBase64Url(value) {
  return Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function createJwt(payload) {
  const header = toBase64Url(JSON.stringify({ alg: 'EdDSA', typ: 'JWT' }));
  const body = toBase64Url(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

describe('extractTokenFromQrText', () => {
  it('extracts token from URL hash fragment', () => {
    const token = createJwt({ sub: 'member-1', jti: 'token-1' });
    const text = `https://verify.example.org/verify#token=${token}`;
    expect(extractTokenFromQrText(text)).toBe(token);
  });

  it('extracts token from URL query param', () => {
    const token = createJwt({ sub: 'member-2', jti: 'token-2' });
    const text = `https://verify.example.org/verify?token=${token}`;
    expect(extractTokenFromQrText(text)).toBe(token);
  });

  it('accepts raw JWT text', () => {
    const token = createJwt({ sub: 'member-3', jti: 'token-3' });
    expect(extractTokenFromQrText(token)).toBe(token);
  });

  it('throws when no JWT is found', () => {
    expect(() => extractTokenFromQrText('https://verify.example.org/verify')).toThrow('No JWT token');
  });
});

describe('extractIdentifiersFromToken', () => {
  it('decodes sub and jti from payload', () => {
    const token = createJwt({
      sub: 'member-42',
      jti: 'token-42',
      name: 'Member Name',
      iss: 'ampa:test',
      exp: 1756684800,
    });

    const result = extractIdentifiersFromToken(token);
    expect(result.sub).toBe('member-42');
    expect(result.jti).toBe('token-42');
    expect(result.name).toBe('Member Name');
    expect(result.iss).toBe('ampa:test');
    expect(result.exp).toBe(1756684800);
  });

  it('throws for malformed token', () => {
    expect(() => extractIdentifiersFromToken('bad-token')).toThrow('Invalid JWT');
  });

  it('preserves UTF-8 characters in names', () => {
    const token = createJwt({
      sub: 'member-es-1',
      jti: 'token-es-1',
      name: 'María García López',
      iss: 'ampa:test',
      exp: 1756684800,
    });

    const result = extractIdentifiersFromToken(token);
    expect(result.name).toBe('María García López');
  });
});

describe('extractIdentifiersFromQrText', () => {
  it('extracts identifiers from verification URL', () => {
    const token = createJwt({ sub: 'member-9', jti: 'token-9' });
    const result = extractIdentifiersFromQrText(`https://verify.example.org/verify#token=${token}`);
    expect(result.sub).toBe('member-9');
    expect(result.jti).toBe('token-9');
  });
});

describe('decodeQRCodeFromImageFile', () => {
  it('throws when BarcodeDetector is unavailable', async () => {
    await expect(decodeQRCodeFromImageFile({})).rejects.toThrow('not supported');
  });
});
