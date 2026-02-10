/**
 * Sanitize filename: remove special chars, replace spaces, lowercase
 * @param {string} name - Member name
 * @returns {string} Sanitized name for filename
 */
export function sanitizeFileName(name) {
  return name
    .toLowerCase()
    .normalize('NFD')  // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '')  // Remove diacritics (Raúl → Raul)
    .replace(/[^a-z0-9]/g, '_')  // Replace non-alphanumeric with underscore
    .replace(/_+/g, '_')  // Replace multiple underscores with single
    .replace(/^_|_$/g, '');  // Remove leading/trailing underscores
}

/**
 * Generate QR code canvas
 * @param {string} jwt - JWT token
 * @returns {Promise<HTMLCanvasElement>} QR code canvas
 */
async function generateQRCanvas(jwt) {
  const QRCode = await import('qrcode');
  const url = `https://verify.ampanovaschoolalmeria.org/verify#token=${jwt}`;

  const canvas = document.createElement('canvas');
  await QRCode.toCanvas(canvas, url, {
    width: 400,
    margin: 2,
    color: {
      dark: '#30414B',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'H'
  });

  return canvas;
}

/**
 * Generate plain QR card image (MVP version)
 * @param {object} memberData - {jwt, memberName, memberId, expiryDate}
 * @returns {Promise<Blob>} Card image as blob
 */
export async function generatePlainQRCard(memberData) {
  const { jwt, memberName, memberId, expiryDate } = memberData;

  // Generate QR code canvas
  const qrCanvas = await generateQRCanvas(jwt);

  // Card dimensions
  const width = 800;
  const height = 1200;

  // Create card canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Load and draw logo
  const logo = new Image();
  logo.crossOrigin = 'anonymous';

  return new Promise((resolve, reject) => {
    logo.onload = () => {
      try {
        // Draw logo (centered, top)
        const logoMaxWidth = 300;
        const logoMaxHeight = 200;
        const logoAspect = logo.width / logo.height;
        let logoWidth, logoHeight;

        if (logoAspect > logoMaxWidth / logoMaxHeight) {
          logoWidth = logoMaxWidth;
          logoHeight = logoMaxWidth / logoAspect;
        } else {
          logoHeight = logoMaxHeight;
          logoWidth = logoMaxHeight * logoAspect;
        }

        const logoX = (width - logoWidth) / 2;
        const logoY = 80;
        ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);

        // Draw QR code (centered)
        const qrSize = 400;
        const qrX = (width - qrSize) / 2;
        const qrY = 350;
        ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

        // Member name (below QR)
        ctx.fillStyle = '#30414B';
        ctx.font = 'bold 48px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(memberName, width / 2, 820);

        // Valid until text
        const expiryFormatted = new Date(expiryDate).toLocaleDateString('es-ES');
        ctx.fillStyle = '#52717B';
        ctx.font = '36px Arial, sans-serif';
        ctx.fillText(`Valid until: ${expiryFormatted}`, width / 2, 900);

        // Member ID (small, bottom)
        ctx.fillStyle = '#999999';
        ctx.font = '24px monospace';
        ctx.fillText(`ID: ${memberId}`, width / 2, 1100);

        // Convert to blob
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, 'image/png');
      } catch (error) {
        reject(error);
      }
    };

    logo.onerror = () => {
      reject(new Error('Failed to load logo'));
    };

    // Load logo
    logo.src = '/ampa-logo.png';
  });
}

/**
 * Download card image
 * @param {Blob|string} blobOrDataUrl - Blob or Data URL of image
 * @param {string} filename - Filename for download
 */
export function downloadCard(blobOrDataUrl, filename) {
  const link = document.createElement('a');
  link.download = filename;

  if (blobOrDataUrl instanceof Blob) {
    // Convert blob to URL
    const url = URL.createObjectURL(blobOrDataUrl);
    link.href = url;
    link.click();
    // Clean up the URL after a short delay
    setTimeout(() => URL.revokeObjectURL(url), 100);
  } else {
    // It's a data URL string
    link.href = blobOrDataUrl;
    link.click();
  }
}

/**
 * Generate filename for card
 * @param {string} memberId - Member ID
 * @param {string} fullName - Full member name
 * @returns {string} Filename like "12345_raul_jimenez.png"
 */
export function generateCardFilename(memberId, fullName) {
  const sanitizedName = sanitizeFileName(fullName);
  return `${memberId}_${sanitizedName}.png`;
}
