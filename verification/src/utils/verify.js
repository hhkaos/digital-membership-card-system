import { jwtVerify, importSPKI } from 'jose';

// Error types for verification
export const VerificationError = {
  NO_TOKEN: 'NO_TOKEN',
  MALFORMED: 'MALFORMED',
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',
  EXPIRED: 'EXPIRED',
  WRONG_ISSUER: 'WRONG_ISSUER',
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
