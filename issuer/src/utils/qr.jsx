import { QRCodeCanvas } from 'qrcode.react';

/**
 * Generate verification URL with JWT token in fragment
 * @param {string} jwt - Signed JWT token
 * @param {string} baseUrl - Base verification URL (default: production URL)
 * @returns {string} Full verification URL with token
 */
export function generateQRUrl(jwt, baseUrl = 'https://verify.ampanovaschoolalmeria.org/verify') {
  return `${baseUrl}#token=${jwt}`;
}

/**
 * QR Code component with AMPA branding
 * @param {object} props - {value, size}
 */
export function AMPAQRCode({ value, size = 300 }) {
  return (
    <QRCodeCanvas
      value={value}
      size={size}
      fgColor="#30414B"  // Primary color
      bgColor="#FFFFFF"  // White background
      level="H"          // High error correction (30%)
      includeMargin={true}
    />
  );
}

/**
 * Get QR code as data URL for card generation
 * @param {string} value - URL to encode
 * @param {number} size - QR code size in pixels
 * @returns {string} Data URL of QR code image
 */
export function getQRDataUrl(value, size = 300) {
  // Create temporary canvas
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  // Note: This is a simplified version. In practice, we'll generate QR using qrcode.react
  // and extract the canvas data URL from the rendered component
  return canvas.toDataURL('image/png');
}
