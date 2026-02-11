import { describe, it, expect, vi, afterEach } from 'vitest';
import { createMetadata, metadataToJSON } from './metadata.js';

describe('createMetadata', () => {
  const sampleMembers = [
    {
      member_id: '12345',
      name: 'Raúl Jiménez',
      jti: 'jti-abc',
      expiry: '2025-08-31T23:59:59.000Z',
      filename: '12345_raul_jimenez.png',
    },
    {
      member_id: '12346',
      name: 'María García',
      jti: 'jti-def',
      expiry: '2025-08-31T23:59:59.000Z',
      filename: '12346_maria_garcia.png',
    },
  ];

  it('returns correct structure with all fields', () => {
    const metadata = createMetadata(sampleMembers);
    expect(metadata.version).toBe('1.0');
    expect(metadata.generated_at).toBeDefined();
    expect(metadata.school_year).toMatch(/^\d{4}-\d{4}$/);
    expect(metadata.issuer).toBe('ampa:ampa-nova-school-almeria');
    expect(metadata.total_cards).toBe(2);
    expect(metadata.members).toHaveLength(2);
  });

  it('total_cards matches members array length', () => {
    const metadata = createMetadata(sampleMembers);
    expect(metadata.total_cards).toBe(sampleMembers.length);
  });

  it('each member has required fields', () => {
    const metadata = createMetadata(sampleMembers);
    for (const member of metadata.members) {
      expect(member).toHaveProperty('member_id');
      expect(member).toHaveProperty('name');
      expect(member).toHaveProperty('jti');
      expect(member).toHaveProperty('expiry');
      expect(member).toHaveProperty('filename');
    }
  });

  it('generated_at is valid ISO timestamp', () => {
    const metadata = createMetadata(sampleMembers);
    const date = new Date(metadata.generated_at);
    expect(date.toISOString()).toBe(metadata.generated_at);
  });

  it('uses custom issuer when provided', () => {
    const metadata = createMetadata(sampleMembers, 'custom:issuer');
    expect(metadata.issuer).toBe('custom:issuer');
  });

  it('handles empty members array', () => {
    const metadata = createMetadata([]);
    expect(metadata.total_cards).toBe(0);
    expect(metadata.members).toHaveLength(0);
  });
});

describe('metadataToJSON', () => {
  it('returns valid JSON string', () => {
    const metadata = createMetadata([]);
    const json = metadataToJSON(metadata);
    const parsed = JSON.parse(json);
    expect(parsed).toEqual(metadata);
  });

  it('is pretty-printed with 2-space indent', () => {
    const metadata = createMetadata([]);
    const json = metadataToJSON(metadata);
    expect(json).toContain('\n');
    expect(json).toContain('  '); // 2-space indent
  });
});
