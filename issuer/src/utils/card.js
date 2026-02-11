import QRCode from 'qrcode';

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
  const url = `https://verify.ampanovaschoolalmeria.org/#token=${jwt}`;

  const canvas = document.createElement('canvas');
  await QRCode.toCanvas(canvas, url, {
    width: 700,
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
  const height = 850;

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
        // Draw QR code (as large as possible, centered at top)
        const qrSize = 700;
        const qrX = (width - qrSize) / 2;
        const qrY = 20;
        ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

        // Overlay logo in the center of the QR code
        const logoMaxSize = 120;
        const logoAspect = logo.width / logo.height;
        let logoWidth, logoHeight;
        if (logoAspect > 1) {
          logoWidth = logoMaxSize;
          logoHeight = logoMaxSize / logoAspect;
        } else {
          logoHeight = logoMaxSize;
          logoWidth = logoMaxSize * logoAspect;
        }
        const logoCenterX = qrX + (qrSize - logoWidth) / 2;
        const logoCenterY = qrY + (qrSize - logoHeight) / 2;

        // White rounded background behind logo for better contrast
        const logoPadding = 10;
        const bgX = logoCenterX - logoPadding;
        const bgY = logoCenterY - logoPadding;
        const bgW = logoWidth + logoPadding * 2;
        const bgH = logoHeight + logoPadding * 2;
        const radius = Math.max(bgW, bgH) / 2;

        ctx.save();
        ctx.beginPath();
        ctx.arc(bgX + bgW / 2, bgY + bgH / 2, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.clip();
        ctx.drawImage(logo, logoCenterX, logoCenterY, logoWidth, logoHeight);
        ctx.restore();

        // Text centered below QR
        const textY = qrY + qrSize + 35;
        ctx.textAlign = 'center';

        // Member name
        ctx.fillStyle = '#30414B';
        ctx.font = 'bold 36px Arial, sans-serif';
        ctx.fillText(memberName, width / 2, textY);

        // Valid until + Member ID
        const expiryFormatted = new Date(expiryDate).toLocaleDateString('es-ES');
        ctx.fillStyle = '#52717B';
        ctx.font = '24px Arial, sans-serif';
        ctx.fillText(`Valid until: ${expiryFormatted}  ·  ID: ${memberId}`, width / 2, textY + 35);

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
