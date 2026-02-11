function isLikelyJWT(value) {
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value);
}

function base64urlToBytes(input) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);

  if (typeof atob === 'function') {
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index++) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }

  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(padded, 'base64'));
  }

  throw new Error('Base64 decoding is not available in this environment');
}

function bytesToUtf8(bytes) {
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  }

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('utf8');
  }

  throw new Error('UTF-8 decoding is not available in this environment');
}

/**
 * Extract a JWT token from QR raw text.
 * Supports:
 * - Verification URL fragment: #token=<JWT>
 * - Verification URL query: ?token=<JWT>
 * - Plain JWT text
 */
export function extractTokenFromQrText(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('QR content is empty');
  }

  const text = rawText.trim();
  if (!text) {
    throw new Error('QR content is empty');
  }

  let token = null;

  try {
    const url = new URL(text);

    if (url.hash && url.hash.includes('token=')) {
      const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
      token = hashParams.get('token');
    }

    if (!token) {
      token = url.searchParams.get('token');
    }
  } catch {
    // Not a URL; continue with other supported formats.
  }

  if (!token && text.startsWith('token=')) {
    const directParams = new URLSearchParams(text);
    token = directParams.get('token');
  }

  if (!token && isLikelyJWT(text)) {
    token = text;
  }

  if (!token || !isLikelyJWT(token)) {
    throw new Error('No JWT token found in QR content');
  }

  return token;
}

/**
 * Decode JWT payload without signature verification.
 * Intended only for issuer-side lookup convenience.
 */
export function extractIdentifiersFromToken(jwt) {
  if (!jwt || typeof jwt !== 'string') {
    throw new Error('JWT token is required');
  }

  const parts = jwt.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  try {
    const payload = JSON.parse(bytesToUtf8(base64urlToBytes(parts[1])));
    return {
      jti: payload.jti || null,
      sub: payload.sub || null,
      iss: payload.iss || null,
      name: payload.name || null,
      exp: payload.exp || null,
      token: jwt,
    };
  } catch {
    throw new Error('Unable to decode JWT payload');
  }
}

export function extractIdentifiersFromQrText(rawText) {
  const token = extractTokenFromQrText(rawText);
  return extractIdentifiersFromToken(token);
}

/**
 * Decode QR raw text from an uploaded image file using browser BarcodeDetector API.
 */
export async function decodeQRCodeFromImageFile(file) {
  if (!file) {
    throw new Error('Please select a PNG file');
  }

  if (typeof BarcodeDetector === 'undefined') {
    throw new Error('QR image decoding is not supported in this browser');
  }

  const detector = new BarcodeDetector({ formats: ['qr_code'] });
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Failed to read PNG image');
    }

    context.drawImage(bitmap, 0, 0);
    const codes = await detector.detect(canvas);
    if (!codes || codes.length === 0 || !codes[0].rawValue) {
      throw new Error('No QR code detected in the uploaded image');
    }

    return codes[0].rawValue;
  } finally {
    if (typeof bitmap.close === 'function') {
      bitmap.close();
    }
  }
}
