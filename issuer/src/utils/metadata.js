import { format } from 'date-fns';

/**
 * Determine school year from current date
 * Example: If current date is 2024-11-15, returns "2024-2025"
 * School year starts in September
 */
function getSchoolYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  // If we're in Sep-Dec, school year is current-next
  // If we're in Jan-Aug, school year is previous-current
  if (month >= 8) { // September is month 8
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

/**
 * Create metadata.json for batch generation
 * @param {Array} members - Array of member records with { member_id, name, jti, expiry, filename }
 * @param {string} issuer - Issuer identifier (e.g., "ampa:ampa-nova-school-almeria")
 * @returns {object} Metadata object
 */
export function createMetadata(members, issuer = "ampa:ampa-nova-school-almeria") {
  const now = new Date();

  return {
    version: "1.0",
    generated_at: now.toISOString(),
    school_year: getSchoolYear(),
    issuer,
    total_cards: members.length,
    members: members.map(member => ({
      member_id: member.member_id,
      name: member.name,
      jti: member.jti,
      expiry: member.expiry,
      filename: member.filename
    }))
  };
}

/**
 * Convert metadata object to JSON string with formatting
 */
export function metadataToJSON(metadata) {
  return JSON.stringify(metadata, null, 2);
}
