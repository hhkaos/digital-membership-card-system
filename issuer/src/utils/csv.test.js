import { describe, it, expect, vi } from 'vitest';
import { parseDateFlexible, validateRow } from './csv.js';

describe('parseDateFlexible', () => {
  it('parses ISO format YYYY-MM-DD', () => {
    const result = parseDateFlexible('2025-08-31');
    expect(result).toBeInstanceOf(Date);
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(7); // 0-indexed, August = 7
    expect(result.getDate()).toBe(31);
  });

  it('parses DD/MM/YYYY format', () => {
    const result = parseDateFlexible('31/08/2025');
    expect(result).toBeInstanceOf(Date);
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(7);
    expect(result.getDate()).toBe(31);
  });

  it('parses DD-MM-YYYY format', () => {
    const result = parseDateFlexible('31-08-2025');
    expect(result).toBeInstanceOf(Date);
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(7);
    expect(result.getDate()).toBe(31);
  });

  it('parses D/M/YYYY with single digits', () => {
    const result = parseDateFlexible('1/8/2025');
    expect(result).toBeInstanceOf(Date);
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(7);
    expect(result.getDate()).toBe(1);
  });

  it('returns null for invalid date string', () => {
    expect(parseDateFlexible('not-a-date')).toBeNull();
    expect(parseDateFlexible('13/13/2025')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseDateFlexible('')).toBeNull();
  });

  it('returns null for null/undefined', () => {
    expect(parseDateFlexible(null)).toBeNull();
    expect(parseDateFlexible(undefined)).toBeNull();
  });

  it('handles whitespace-padded dates', () => {
    const result = parseDateFlexible('  2025-08-31  ');
    expect(result).toBeInstanceOf(Date);
    expect(result.getFullYear()).toBe(2025);
  });
});

describe('validateRow', () => {
  // Use a far-future date so tests don't break
  const futureDate = '2099-12-31';

  it('passes for valid row with all fields', () => {
    const row = {
      full_name: 'Raúl Jiménez',
      member_id: '12345',
      expiry_date: futureDate,
    };
    const result = validateRow(row, 2);
    expect(result.valid).toBe(true);
    expect(result.data.full_name).toBe('Raúl Jiménez');
    expect(result.data.member_id).toBe('12345');
    expect(result.lineNumber).toBe(2);
  });

  it('fails when full_name is missing', () => {
    const row = { full_name: '', member_id: '12345', expiry_date: futureDate };
    const result = validateRow(row, 3);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Missing full_name');
    expect(result.lineNumber).toBe(3);
  });

  it('fails when member_id is missing', () => {
    const row = { full_name: 'Test User', member_id: '', expiry_date: futureDate };
    const result = validateRow(row, 4);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Missing member_id');
  });

  it('fails when expiry_date is missing', () => {
    const row = { full_name: 'Test User', member_id: '12345', expiry_date: '' };
    const result = validateRow(row, 5);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Missing expiry_date');
  });

  it('fails for invalid date format', () => {
    const row = { full_name: 'Test User', member_id: '12345', expiry_date: 'invalid' };
    const result = validateRow(row, 6);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid date format');
  });

  it('fails when expiry date is in the past', () => {
    const row = { full_name: 'Test User', member_id: '12345', expiry_date: '2020-01-01' };
    const result = validateRow(row, 7);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('future');
  });

  it('reports multiple errors at once', () => {
    const row = { full_name: '', member_id: '', expiry_date: '' };
    const result = validateRow(row, 8);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Missing full_name');
    expect(result.error).toContain('Missing member_id');
    expect(result.error).toContain('Missing expiry_date');
  });

  it('trims whitespace from valid fields', () => {
    const row = {
      full_name: '  Test User  ',
      member_id: '  12345  ',
      expiry_date: futureDate,
    };
    const result = validateRow(row, 9);
    expect(result.valid).toBe(true);
    expect(result.data.full_name).toBe('Test User');
    expect(result.data.member_id).toBe('12345');
  });

  it('includes parsedExpiryDate for valid rows', () => {
    const row = { full_name: 'Test', member_id: '123', expiry_date: futureDate };
    const result = validateRow(row, 10);
    expect(result.valid).toBe(true);
    expect(result.data.parsedExpiryDate).toBeInstanceOf(Date);
  });
});
