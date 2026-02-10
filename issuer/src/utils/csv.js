import Papa from 'papaparse';
import { parse, isAfter, isValid } from 'date-fns';

/**
 * Parse date with flexible format support
 * Supports: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, D/M/YYYY
 */
export function parseDateFlexible(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }

  const trimmed = dateString.trim();
  const formats = [
    'yyyy-MM-dd',       // 2025-06-30
    'dd/MM/yyyy',       // 30/06/2025
    'dd-MM-yyyy',       // 30-06-2025
    'd/M/yyyy',         // 30/6/2025 or 1/6/2025
  ];

  for (const format of formats) {
    try {
      const parsed = parse(trimmed, format, new Date());
      if (isValid(parsed)) {
        return parsed;
      }
    } catch (e) {
      // Try next format
      continue;
    }
  }

  return null;
}

/**
 * Validate a single CSV row
 * Returns { valid: true, data } or { valid: false, error }
 */
export function validateRow(row, lineNumber) {
  const errors = [];

  // Check required fields
  if (!row.full_name || row.full_name.trim() === '') {
    errors.push('Missing full_name');
  }

  if (!row.member_id || row.member_id.trim() === '') {
    errors.push('Missing member_id');
  }

  if (!row.expiry_date || row.expiry_date.trim() === '') {
    errors.push('Missing expiry_date');
  }

  // Validate expiry date format and value
  if (row.expiry_date) {
    const parsedDate = parseDateFlexible(row.expiry_date);

    if (!parsedDate) {
      errors.push(`Invalid date format: "${row.expiry_date}". Use YYYY-MM-DD, DD/MM/YYYY, or DD-MM-YYYY`);
    } else {
      const now = new Date();
      if (!isAfter(parsedDate, now)) {
        errors.push('Expiry date must be in the future');
      }
    }
  }

  if (errors.length > 0) {
    return {
      valid: false,
      lineNumber,
      data: row,
      error: errors.join('; ')
    };
  }

  return {
    valid: true,
    lineNumber,
    data: {
      full_name: row.full_name.trim(),
      member_id: row.member_id.trim(),
      expiry_date: row.expiry_date.trim(),
      parsedExpiryDate: parseDateFlexible(row.expiry_date)
    }
  };
}

/**
 * Parse CSV file and validate all rows
 * Returns Promise<{ valid: [], errors: [] }>
 */
export function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const valid = [];
        const errors = [];

        results.data.forEach((row, index) => {
          const lineNumber = index + 2; // +2 because: 1-indexed + header row
          const validation = validateRow(row, lineNumber);

          if (validation.valid) {
            valid.push(validation);
          } else {
            errors.push(validation);
          }
        });

        resolve({ valid, errors });
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      }
    });
  });
}
