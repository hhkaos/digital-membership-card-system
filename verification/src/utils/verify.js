import { jwtVerify, importSPKI } from 'jose';
import { verifyAsync as ed25519Verify, hashes } from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2.js';

// Configure @noble/ed25519 to use pure JS SHA-512 (no crypto.subtle dependency)
hashes.sha512Async = async (message) => sha512(message);

// Error types for verification
export const VerificationError = {
  NO_TOKEN: 'NO_TOKEN',
  MALFORMED: 'MALFORMED',
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',
  EXPIRED: 'EXPIRED',
  WRONG_ISSUER: 'WRONG_ISSUER',
  REVOKED: 'REVOKED',
};

/**
 * Parse JWT token from URL fragment
 * URL format: #token=<JWT>
 * @returns {string|null} JWT token or null if not found
 */
export function parseTokenFromFragment() {
  const hash = window.location.hash;
  if (!hash || !hash.includes('token=')) {
    return null;
  }
  
  const params = new URLSearchParams(hash.substring(1));
  return params.get('token');
}

/**
 * Validate token expiration with clock skew tolerance
 * @param {number} exp - Expiration timestamp (Unix seconds)
 * @param {number} clockSkew - Clock skew tolerance in seconds
 * @returns {boolean} true if token is not expired
 */
export function validateExpiry(exp, clockSkew = 120) {
  const now = Math.floor(Date.now() / 1000);
  return exp > (now - clockSkew);
}

/**
 * Decode base64url string to Uint8Array
 */
function base64urlToBytes(base64url) {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Extract raw 32-byte Ed25519 public key from SPKI PEM.
 * Ed25519 SPKI is always 44 bytes: 12-byte header + 32-byte key.
 */
function extractEd25519PublicKey(pem) {
  const base64 = pem
    .replace(/-----BEGIN PUBLIC KEY-----/, '')
    .replace(/-----END PUBLIC KEY-----/, '')
    .replace(/\s/g, '');
  const der = base64urlToBytes(
    base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  );
  // Ed25519 SPKI DER: 12-byte prefix + 32-byte raw key
  if (der.length !== 44) {
    throw new Error('Invalid Ed25519 SPKI public key length');
  }
  return der.slice(12);
}

/**
 * Fallback JWT verification using @noble/ed25519 for browsers
 * that don't support Ed25519 in Web Crypto (e.g. Safari < 17).
 */
async function verifyTokenFallback(jwtString, publicKeyPEM, expectedIssuer, clockSkew) {
  const parts = jwtString.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  // Verify the header specifies EdDSA
  const header = JSON.parse(new TextDecoder().decode(base64urlToBytes(headerB64)));
  if (header.alg !== 'EdDSA') {
    throw new Error(`Unsupported algorithm: ${header.alg}`);
  }

  // Prepare verification inputs
  const signature = base64urlToBytes(signatureB64);
  const message = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const publicKey = extractEd25519PublicKey(publicKeyPEM);

  // Verify signature using @noble/ed25519
  const valid = await ed25519Verify(signature, message, publicKey);
  if (!valid) {
    return {
      success: false,
      error: {
        type: VerificationError.INVALID_SIGNATURE,
        message: 'Invalid membership card',
        details: 'Signature verification failed with public key'
      }
    };
  }

  // Decode and return payload
  const payload = JSON.parse(new TextDecoder().decode(base64urlToBytes(payloadB64)));

  // Validate issuer
  if (payload.iss !== expectedIssuer) {
    return {
      success: false,
      error: {
        type: VerificationError.WRONG_ISSUER,
        message: 'Unrecognized issuer',
        details: `Expected '${expectedIssuer}', got '${payload.iss}'`
      }
    };
  }

  // Validate expiration
  if (!validateExpiry(payload.exp, clockSkew)) {
    const expiryDate = new Date(payload.exp * 1000).toLocaleDateString('es-ES');
    return {
      success: false,
      error: {
        type: VerificationError.EXPIRED,
        message: 'Membership expired',
        details: `Token expired on ${expiryDate}`
      }
    };
  }

  return { success: true, payload };
}

/**
 * Check if an error indicates Web Crypto Ed25519 is unavailable.
 * This covers: Ed25519 not supported (Safari < 17), and
 * crypto.subtle being undefined (non-secure HTTP context).
 */
function isWebCryptoUnavailable(error) {
  const msg = error.message || '';
  return (
    msg.includes('not supported') ||
    msg.includes('NotSupportedError') ||
    msg.includes('undefined is not an object') ||
    msg.includes('Cannot read properties of undefined') ||
    error.name === 'NotSupportedError' ||
    error.name === 'TypeError'
  );
}

/**
 * Verify JWT token with EdDSA Ed25519 signature
 * @param {string} jwt - JWT token string
 * @param {string} publicKeyPEM - Public key in PEM format
 * @param {string} expectedIssuer - Expected issuer identifier
 * @param {number} clockSkew - Clock skew tolerance in seconds
 * @returns {Promise<{success: boolean, payload?: object, error?: {type: string, message: string, details?: string}}>}
 */
export async function verifyToken(jwt, publicKeyPEM, expectedIssuer, clockSkew = 120) {
  if (!jwt) {
    return {
      success: false,
      error: {
        type: VerificationError.NO_TOKEN,
        message: 'No membership card detected',
        details: 'URL fragment missing token parameter'
      }
    };
  }

  try {
    // Import public key from PEM format
    const publicKey = await importSPKI(publicKeyPEM, 'EdDSA');

    // Verify JWT signature and decode payload
    const { payload } = await jwtVerify(jwt, publicKey, {
      algorithms: ['EdDSA']
    });

    // Validate issuer
    if (payload.iss !== expectedIssuer) {
      return {
        success: false,
        error: {
          type: VerificationError.WRONG_ISSUER,
          message: 'Unrecognized issuer',
          details: `Expected '${expectedIssuer}', got '${payload.iss}'`
        }
      };
    }

    // Validate expiration
    if (!validateExpiry(payload.exp, clockSkew)) {
      const expiryDate = new Date(payload.exp * 1000).toLocaleDateString('es-ES');
      return {
        success: false,
        error: {
          type: VerificationError.EXPIRED,
          message: 'Membership expired',
          details: `Token expired on ${expiryDate}`
        }
      };
    }

    // Success - return payload
    return {
      success: true,
      payload
    };

  } catch (error) {
    // Fallback to pure JS Ed25519 when Web Crypto is unavailable (Safari < 17, or non-HTTPS context)
    if (isWebCryptoUnavailable(error)) {
      try {
        return await verifyTokenFallback(jwt, publicKeyPEM, expectedIssuer, clockSkew);
      } catch (fallbackError) {
        return {
          success: false,
          error: {
            type: VerificationError.MALFORMED,
            message: 'Invalid card format',
            details: fallbackError.message
          }
        };
      }
    }

    // Handle expired token
    if (error.code === 'ERR_JWT_EXPIRED') {
      return {
        success: false,
        error: {
          type: VerificationError.EXPIRED,
          message: 'Membership expired',
          details: error.message
        }
      };
    }

    // Handle verification errors
    if (error.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
      return {
        success: false,
        error: {
          type: VerificationError.INVALID_SIGNATURE,
          message: 'Invalid membership card',
          details: 'Signature verification failed with public key'
        }
      };
    }

    // Malformed JWT or other errors
    return {
      success: false,
      error: {
        type: VerificationError.MALFORMED,
        message: 'Invalid card format',
        details: error.message
      }
    };
  }
}

/**
 * Check if a token has been revoked
 * @param {string} jti - Token ID
 * @param {string} sub - Member ID
 * @param {object|string} revocationConfig - Revocation URL string or config object
 * @returns {Promise<{revoked: boolean, warning?: boolean}>}
 */
export async function checkRevocation(jti, sub, revocationConfig) {
  const config = typeof revocationConfig === 'string'
    ? { revocationEnabled: true, revocationUrl: revocationConfig }
    : (revocationConfig || {});

  if (!config.revocationEnabled) {
    return { revoked: false };
  }

  try {
    const cacheBustedUrl = `${config.revocationUrl}${config.revocationUrl.includes('?') ? '&' : '?'}_ts=${Date.now()}`;
    const response = await fetch(cacheBustedUrl, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (Array.isArray(data.revoked_jti) && data.revoked_jti.includes(jti)) {
      return { revoked: true };
    }

    if (Array.isArray(data.revoked_sub) && data.revoked_sub.includes(sub)) {
      return { revoked: true };
    }

    return { revoked: false };
  } catch {
    // Soft-fail: allow with warning when revocation list can't be fetched
    return { revoked: false, warning: true };
  }
}
