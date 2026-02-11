import { describe, it, expect, vi } from 'vitest';
import { parseDateFlexible, validateRow, parseCSV } from './csv.js';

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

describe('parseCSV with Rainbow CSV format', () => {
  const futureDate = '2099-12-31';

  it('should parse CSV with extra spaces in headers and values', async () => {
    const csvContent = `full_name              , member_id, expiry_date
María García López     ,       001, ${futureDate}
Juan Pérez Martínez    ,       002, ${futureDate}`;

    const result = await parseCSV(csvContent);

    expect(result.valid.length).toBe(2);
    expect(result.errors.length).toBe(0);

    // Verify first row data
    expect(result.valid[0].data.full_name).toBe('María García López');
    expect(result.valid[0].data.member_id).toBe('001');
    expect(result.valid[0].data.expiry_date).toBe(futureDate);

    // Verify second row data
    expect(result.valid[1].data.full_name).toBe('Juan Pérez Martínez');
    expect(result.valid[1].data.member_id).toBe('002');
  });

  it('should handle mixed date formats with whitespace', async () => {
    const csvContent = `full_name              , member_id, expiry_date
Ana Rodríguez Silva    ,       003, 30-06-2099
Carlos González Ruiz   ,       004, 2099-12-31
Laura Fernández Díaz   ,       005, 15/09/2099`;

    const result = await parseCSV(csvContent);

    expect(result.valid.length).toBe(3);
    expect(result.errors.length).toBe(0);

    // Verify all dates were parsed correctly
    expect(result.valid[0].data.full_name).toBe('Ana Rodríguez Silva');
    expect(result.valid[0].data.member_id).toBe('003');
    expect(result.valid[0].data.expiry_date).toBe('30-06-2099');

    expect(result.valid[1].data.full_name).toBe('Carlos González Ruiz');
    expect(result.valid[1].data.member_id).toBe('004');
    expect(result.valid[1].data.expiry_date).toBe('2099-12-31');

    expect(result.valid[2].data.full_name).toBe('Laura Fernández Díaz');
    expect(result.valid[2].data.member_id).toBe('005');
    expect(result.valid[2].data.expiry_date).toBe('15/09/2099');
  });

  it('should handle single-digit dates with whitespace', async () => {
    const csvContent = `full_name              , member_id, expiry_date
Carmen Jiménez Torres  ,       009, 1/7/2099`;

    const result = await parseCSV(csvContent);

    expect(result.valid.length).toBe(1);
    expect(result.errors.length).toBe(0);

    expect(result.valid[0].data.full_name).toBe('Carmen Jiménez Torres');
    expect(result.valid[0].data.member_id).toBe('009');
    expect(result.valid[0].data.expiry_date).toBe('1/7/2099');
  });

  it('should validate all rows from the example CSV', async () => {
    const csvContent = `full_name              , member_id, expiry_date
María García López     ,       001, 2099-06-30
Juan Pérez Martínez    ,       002, 30/06/2099
Ana Rodríguez Silva    ,       003, 30-06-2099
Carlos González Ruiz   ,       004, 2099-12-31
Laura Fernández Díaz   ,       005, 15/09/2099
Pedro Sánchez Moreno   ,       006, 15-09-2099
Isabel Martín Romero   ,       007, 2099-02-15
Francisco López Navarro,       008, 31/12/2099
Carmen Jiménez Torres  ,       009, 1/7/2099
Miguel Álvarez Castro  ,       010, 2099-08-20`;

    const result = await parseCSV(csvContent);

    expect(result.valid.length).toBe(10);
    expect(result.errors.length).toBe(0);

    // Spot check a few entries
    expect(result.valid[0].data.full_name).toBe('María García López');
    expect(result.valid[0].data.member_id).toBe('001');

    expect(result.valid[7].data.full_name).toBe('Francisco López Navarro');
    expect(result.valid[7].data.member_id).toBe('008');

    expect(result.valid[9].data.full_name).toBe('Miguel Álvarez Castro');
    expect(result.valid[9].data.member_id).toBe('010');
  });

  it('should handle errors in Rainbow CSV format correctly', async () => {
    const csvContent = `full_name              , member_id, expiry_date
Valid Person           ,       001, 2099-12-31
                       ,       002, 2099-12-31
Invalid Date Person    ,       003, invalid-date`;

    const result = await parseCSV(csvContent);

    expect(result.valid.length).toBe(1);
    expect(result.errors.length).toBe(2);

    // Check valid entry
    expect(result.valid[0].data.full_name).toBe('Valid Person');

    // Check error entries
    expect(result.errors[0].error).toContain('Missing full_name');
    expect(result.errors[1].error).toContain('Invalid date format');
  });
});
