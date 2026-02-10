import * as ed25519 from '@noble/ed25519';
import { v4 as uuidv4 } from 'uuid';
import 'fastestsmallesttextencoderdecoder';

// The above import automatically polyfills TextEncoder/TextDecoder for older browsers

/**
 * Generate Ed25519 keypair for signing membership cards
 * Safari/iOS compatible using @noble/ed25519
 * @returns {Promise<{privateKey: Uint8Array, publicKey: Uint8Array}>}
 */
export async function generateKeypair() {
  const privateKey = ed25519.utils.randomPrivateKey();
  const publicKey = await ed25519.getPublicKeyAsync(privateKey);

  return { privateKey, publicKey };
}

/**
 * Export private key to PEM format (PKCS#8)
 * SECURITY: This should NEVER be stored in localStorage or any persistent storage
 * @param {Uint8Array} privateKey
 * @returns {Promise<string>} PEM-formatted private key
 */
export async function exportPrivateKey(privateKey) {
  // Ed25519 private key is 32 bytes
  // PKCS#8 wrapper for Ed25519 (DER format)
  const pkcs8Header = new Uint8Array([
    0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06,
    0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20
  ]);

  const pkcs8Key = new Uint8Array(pkcs8Header.length + privateKey.length);
  pkcs8Key.set(pkcs8Header);
  pkcs8Key.set(privateKey, pkcs8Header.length);

  const base64 = btoa(String.fromCharCode(...pkcs8Key));
  const pem = `-----BEGIN PRIVATE KEY-----\n${base64.match(/.{1,64}/g).join('\n')}\n-----END PRIVATE KEY-----`;

  return pem;
}

/**
 * Export public key to PEM format (SPKI)
 * @param {Uint8Array} publicKey
 * @returns {Promise<string>} PEM-formatted public key
 */
export async function exportPublicKey(publicKey) {
  // Ed25519 public key is 32 bytes
  // SPKI wrapper for Ed25519 (DER format)
  const spkiHeader = new Uint8Array([
    0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65,
    0x70, 0x03, 0x21, 0x00
  ]);

  const spkiKey = new Uint8Array(spkiHeader.length + publicKey.length);
  spkiKey.set(spkiHeader);
  spkiKey.set(publicKey, spkiHeader.length);

  const base64 = btoa(String.fromCharCode(...spkiKey));
  const pem = `-----BEGIN PUBLIC KEY-----\n${base64.match(/.{1,64}/g).join('\n')}\n-----END PUBLIC KEY-----`;

  return pem;
}

/**
 * Import private key from PEM format
 * @param {string} pem - PEM-formatted private key
 * @returns {Promise<Uint8Array>}
 */
export async function importPrivateKey(pem) {
  if (!pem || typeof pem !== 'string') {
    throw new Error('Invalid PEM format: must be a non-empty string');
  }

  try {
    // Remove PEM headers and decode base64
    const base64 = pem
      .replace(/-----BEGIN PRIVATE KEY-----/g, '')
      .replace(/-----END PRIVATE KEY-----/g, '')
      .replace(/\s/g, '');

    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Extract the 32-byte private key from PKCS#8 wrapper
    // The private key starts at byte 16 (after the PKCS#8 header)
    const privateKey = bytes.slice(16, 48);

    if (privateKey.length !== 32) {
      throw new Error('Invalid Ed25519 private key length');
    }

    return privateKey;
  } catch (error) {
    throw new Error('Failed to import private key. Please check the PEM format.');
  }
}

/**
 * Derive public key from private key
 * @param {Uint8Array} privateKey - Ed25519 private key
 * @returns {Promise<Uint8Array>} Ed25519 public key
 */
export async function derivePublicKey(privateKey) {
  return await ed25519.getPublicKeyAsync(privateKey);
}

/**
 * Convert a Uint8Array to a binary string without using argument spreading,
 * to avoid "too many arguments" errors for large inputs.
 * @param {Uint8Array} bytes
 * @returns {string}
 */
function uint8ToBinaryString(bytes) {
  const len = bytes.length;
  const chars = new Array(len);
  for (let i = 0; i < len; i++) {
    chars[i] = String.fromCharCode(bytes[i]);
  }
  return chars.join('');
}

/**
 * Base64URL encode (RFC 4648)
 * @param {Uint8Array} data
 * @returns {string}
 */
function base64urlEncode(data) {
  const base64 = btoa(uint8ToBinaryString(data));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Sign a JWT token with EdDSA Ed25519 algorithm
 * @param {object} payload - JWT payload with member data
 * @param {Uint8Array} privateKey - Ed25519 private key
 * @returns {Promise<string>} Signed JWT token
 */
export async function signJWT(payload, privateKey) {
  if (!privateKey) {
    throw new Error('Private key is required for signing');
  }

  // Create JWT header
  const header = { alg: 'EdDSA', typ: 'JWT' };

  // Encode header and payload
  const encodedHeader = base64urlEncode(
    new TextEncoder().encode(JSON.stringify(header))
  );
  const encodedPayload = base64urlEncode(
    new TextEncoder().encode(JSON.stringify(payload))
  );

  // Create signing input
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const messageBytes = new TextEncoder().encode(signingInput);

  // Sign with Ed25519
  const signature = await ed25519.signAsync(messageBytes, privateKey);
  const encodedSignature = base64urlEncode(signature);

  // Return complete JWT
  return `${signingInput}.${encodedSignature}`;
}

/**
 * Create JWT payload for a member
 * @param {object} memberData - {fullName, memberId, expiryDate}
 * @returns {object} JWT payload per SPEC
 */
export function createMemberPayload(memberData) {
  const { fullName, memberId, expiryDate } = memberData;
  
  // Convert expiry date to Unix timestamp
  const expiryTimestamp = Math.floor(new Date(expiryDate).getTime() / 1000);
  
  return {
    v: 1,  // Token schema version
    iss: 'ampa:ampa-nova-school-almeria',  // Issuer identifier
    sub: memberId,  // Member ID
    name: fullName,  // Full member name
    iat: Math.floor(Date.now() / 1000),  // Issued-at timestamp
    exp: expiryTimestamp,  // Expiration timestamp
    jti: uuidv4()  // Unique token ID for revocation
  };
}

/**
 * Validate private key format
 * @param {string} pem - PEM-formatted key
 * @returns {boolean} true if valid
 */
export function isValidPEMFormat(pem) {
  if (!pem || typeof pem !== 'string') return false;
  
  const trimmed = pem.trim();
  return (
    trimmed.startsWith('-----BEGIN PRIVATE KEY-----') &&
    trimmed.endsWith('-----END PRIVATE KEY-----')
  );
}

/**
 * Extract last N characters of public key for fingerprint display
 * @param {string} publicKeyPEM - Public key in PEM format
 * @param {number} length - Number of characters to extract
 * @returns {string} Last N characters of key
 */
export function getKeyFingerprint(publicKeyPEM, length = 8) {
  if (!publicKeyPEM) return '';
  
  // Remove PEM headers/footers and get actual key content
  const keyContent = publicKeyPEM
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/\s/g, '');
  
  return keyContent.slice(-length);
}
