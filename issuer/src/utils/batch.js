import JSZip from 'jszip';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { signJWT } from './crypto.js';
import { generatePlainQRCard } from './card.js';
import { createMetadata, metadataToJSON } from './metadata.js';

/**
 * Sanitize name for filename
 * - Convert to lowercase
 * - Replace spaces with underscores
 * - Remove accents (é→e, á→a, etc.)
 * - Remove special characters except underscores
 */
function sanitizeName(name) {
  return name
    .toLowerCase()
    .normalize('NFD') // Decompose accents
    .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
    .replace(/\s+/g, '_') // Spaces to underscores
    .replace(/[^a-z0-9_]/g, ''); // Remove special chars
}

/**
 * Generate filename for card
 * Format: {memberID}_{sanitizedName}.png
 */
function generateFilename(memberId, fullName) {
  const sanitized = sanitizeName(fullName);
  return `${memberId}_${sanitized}.png`;
}

/**
 * Generate a single card
 * Returns { blob, filename, metadata }
 */
async function generateSingleCard(member, privateKey, issuer = "ampa:ampa-nova-school-almeria", options = {}) {
  const jti = uuidv4();
  const expiryDate = member.parsedExpiryDate;

  // Create JWT payload
  const payload = {
    v: 1,
    iss: issuer,
    sub: member.member_id,
    name: member.full_name,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(expiryDate.getTime() / 1000),
    jti
  };

  // Sign JWT
  const jwt = await signJWT(payload, privateKey);

  // Generate card image as blob
  const cardBlob = await generatePlainQRCard({
    jwt,
    memberName: member.full_name,
    memberId: member.member_id,
    expiryDate: format(expiryDate, 'yyyy-MM-dd'),
    locale: options.locale,
    labels: options.cardLabels,
  });

  const filename = generateFilename(member.member_id, member.full_name);

  return {
    blob: cardBlob,
    filename,
    metadata: {
      member_id: member.member_id,
      name: member.full_name,
      jti,
      expiry: expiryDate.toISOString(),
      filename
    }
  };
}

/**
 * Generate batch of cards from validated members
 * @param {Array} validMembers - Array of validated member records
 * @param {CryptoKey} privateKey - EdDSA private key
 * @param {Function} onProgress - Callback(current, total) for progress updates
 * @param {string} issuer - Issuer identifier
 * @returns {Promise<Blob>} ZIP file as blob
 */
export async function generateBatch(
  validMembers,
  privateKey,
  onProgress = null,
  issuer = "ampa:ampa-nova-school-almeria",
  options = {},
) {
  const zip = new JSZip();
  const memberMetadata = [];
  const total = validMembers.length;

  for (let i = 0; i < validMembers.length; i++) {
    const member = validMembers[i].data;

    // Generate card
    const { blob, filename, metadata } = await generateSingleCard(member, privateKey, issuer, options);

    // Add to ZIP
    zip.file(filename, blob);
    memberMetadata.push(metadata);

    // Report progress
    if (onProgress) {
      onProgress(i + 1, total);
    }
  }

  // Create and add metadata.json
  const metadata = createMetadata(memberMetadata, issuer);
  const metadataJSON = metadataToJSON(metadata);
  zip.file('metadata.json', metadataJSON);

  // Generate ZIP blob
  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Determine ZIP filename from school year
 * Format: cards_YYYY-YYYY.zip
 */
export function getZipFilename() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  let schoolYear;
  if (month >= 8) { // September or later
    schoolYear = `${year}-${year + 1}`;
  } else {
    schoolYear = `${year - 1}-${year}`;
  }

  return `cards_${schoolYear}.zip`;
}

/**
 * Trigger download of ZIP file
 */
export function downloadZip(zipBlob, filename) {
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || getZipFilename();
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
