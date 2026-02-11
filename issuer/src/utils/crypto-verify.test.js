import { describe, it, expect } from 'vitest';
import {
  generateKeypair,
  exportPublicKey,
  signJWT,
  createMemberPayload,
} from './crypto.js';
import { verifyToken, VerificationError } from '../../../verification/src/utils/verify.js';

describe('Cross-app Integration: Issuer → Verification', () => {
  const issuer = 'ampa:ampa-nova-school-almeria';

  it('generates a card in issuer and verifies it in verification app', async () => {
    // 1. Generate keypair in issuer
    const { privateKey, publicKey } = await generateKeypair();
    const publicKeyPEM = await exportPublicKey(publicKey);

    // 2. Create member payload
    const payload = createMemberPayload({
      fullName: 'Raúl Jiménez',
      memberId: '550e8400-e29b-41d4-a716-446655440000',
      expiryDate: '2099-08-31',
    });

    // 3. Sign JWT
    const jwt = await signJWT(payload, privateKey);

    // 4. Verify in verification app
    const result = await verifyToken(jwt, publicKeyPEM, issuer);

    expect(result.success).toBe(true);
    expect(result.payload.name).toBe('Raúl Jiménez');
    expect(result.payload.sub).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('rejects JWT signed by a different keypair', async () => {
    const keypair1 = await generateKeypair();
    const keypair2 = await generateKeypair();
    const publicKeyPEM1 = await exportPublicKey(keypair1.publicKey);

    const payload = createMemberPayload({
      fullName: 'Test User',
      memberId: 'member-123',
      expiryDate: '2099-08-31',
    });

    // Sign with keypair2's private key
    const jwt = await signJWT(payload, keypair2.privateKey);

    // Verify with keypair1's public key — should fail
    const result = await verifyToken(jwt, publicKeyPEM1, issuer);
    expect(result.success).toBe(false);
    expect([VerificationError.INVALID_SIGNATURE, VerificationError.MALFORMED]).toContain(result.error.type);
  });

  it('rejects expired JWT', async () => {
    const { privateKey, publicKey } = await generateKeypair();
    const publicKeyPEM = await exportPublicKey(publicKey);

    const payload = createMemberPayload({
      fullName: 'Expired User',
      memberId: 'member-expired',
      expiryDate: '2020-01-01', // far in the past
    });

    const jwt = await signJWT(payload, privateKey);
    const result = await verifyToken(jwt, publicKeyPEM, issuer, 120);

    expect(result.success).toBe(false);
    expect(result.error.type).toBe(VerificationError.EXPIRED);
  });

  it('rejects JWT with wrong issuer', async () => {
    const { privateKey, publicKey } = await generateKeypair();
    const publicKeyPEM = await exportPublicKey(publicKey);

    // Create payload — it hardcodes the issuer in createMemberPayload
    const payload = createMemberPayload({
      fullName: 'Test User',
      memberId: 'member-123',
      expiryDate: '2099-08-31',
    });

    const jwt = await signJWT(payload, privateKey);

    // Verify with a different expected issuer
    const result = await verifyToken(jwt, publicKeyPEM, 'wrong:issuer');
    expect(result.success).toBe(false);
    expect(result.error.type).toBe(VerificationError.WRONG_ISSUER);
  });
});
