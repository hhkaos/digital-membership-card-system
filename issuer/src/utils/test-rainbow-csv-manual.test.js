import { describe, it, expect } from 'vitest';
import Papa from 'papaparse';

describe('Rainbow CSV format parsing', () => {
  it('should parse CSV with extra spaces in header and values', () => {
    const csvContent = `full_name              , member_id, expiry_date
María García López     ,       001, 2026-06-30
Juan Pérez Martínez    ,       002, 30/06/2026`;

    const result = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true
    });

    console.log('Headers:', result.meta.fields);
    console.log('Row 1:', result.data[0]);
    
    expect(result.data.length).toBe(2);
    
    // Show what we actually get
    const row1 = result.data[0];
    console.log('Row 1 keys:', Object.keys(row1));
    console.log('Row 1 values:', Object.values(row1));
  });
});
