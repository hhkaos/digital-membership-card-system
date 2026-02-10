import { generateKeyPair, exportSPKI, exportPKCS8, importPKCS8, SignJWT } from 'jose';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate Ed25519 keypair for signing membership cards
 * @returns {Promise<{privateKey: CryptoKey, publicKey: CryptoKey}>}
 */
export async function generateKeypair() {
  const { privateKey, publicKey } = await generateKeyPair('EdDSA', {
    crv: 'Ed25519',
    extractable: true
  });

  return { privateKey, publicKey };
}

/**
 * Export private key to PEM format
 * SECURITY: This should NEVER be stored in localStorage or any persistent storage
 * @param {CryptoKey} privateKey
 * @returns {Promise<string>} PEM-formatted private key
 */
export async function exportPrivateKey(privateKey) {
  return await exportPKCS8(privateKey);
}

/**
 * Export public key to PEM format
 * @param {CryptoKey} publicKey
 * @returns {Promise<string>} PEM-formatted public key
 */
export async function exportPublicKey(publicKey) {
  return await exportSPKI(publicKey);
}

/**
 * Import private key from PEM format
 * @param {string} pem - PEM-formatted private key
 * @returns {Promise<CryptoKey>}
 */
export async function importPrivateKey(pem) {
  if (!pem || typeof pem !== 'string') {
    throw new Error('Invalid PEM format: must be a non-empty string');
  }
  
  try {
    return await importPKCS8(pem, 'EdDSA');
  } catch (error) {
    throw new Error('Failed to import private key. Please check the PEM format.');
  }
}

/**
 * Sign a JWT token with EdDSA Ed25519 algorithm
 * @param {object} payload - JWT payload with member data
 * @param {CryptoKey} privateKey - Ed25519 private key
 * @returns {Promise<string>} Signed JWT token
 */
export async function signJWT(payload, privateKey) {
  if (!privateKey) {
    throw new Error('Private key is required for signing');
  }
  
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'EdDSA' })
    .setIssuedAt()
    .setIssuer(payload.iss)
    .setSubject(payload.sub)
    .setExpirationTime(payload.exp)
    .setJti(payload.jti)
    .sign(privateKey);
  
  return jwt;
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
