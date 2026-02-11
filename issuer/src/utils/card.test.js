import { describe, it, expect } from 'vitest';
import { sanitizeFileName, generateCardFilename } from './card.js';

describe('sanitizeFileName', () => {
  it('converts to lowercase', () => {
    expect(sanitizeFileName('PEDRO')).toBe('pedro');
  });

  it('removes accents', () => {
    expect(sanitizeFileName('Raúl')).toBe('raul');
    expect(sanitizeFileName('María')).toBe('maria');
    expect(sanitizeFileName('Jiménez')).toBe('jimenez');
  });

  it('replaces spaces with underscores', () => {
    expect(sanitizeFileName('Test User')).toBe('test_user');
  });

  it('handles accented names with spaces', () => {
    expect(sanitizeFileName('Raúl Jiménez')).toBe('raul_jimenez');
    expect(sanitizeFileName('María García')).toBe('maria_garcia');
    expect(sanitizeFileName('PEDRO LÓPEZ')).toBe('pedro_lopez');
  });

  it('collapses multiple underscores', () => {
    expect(sanitizeFileName('Test   User')).toBe('test_user');
  });

  it('removes special characters', () => {
    expect(sanitizeFileName("O'Brien")).toBe('o_brien');
  });

  it('removes leading/trailing underscores', () => {
    expect(sanitizeFileName(' Test ')).toBe('test');
  });
});

describe('generateCardFilename', () => {
  it('returns {id}_{sanitizedName}.png format', () => {
    const filename = generateCardFilename('12345', 'Raúl Jiménez');
    expect(filename).toBe('12345_raul_jimenez.png');
  });

  it('handles simple names', () => {
    const filename = generateCardFilename('001', 'Test User');
    expect(filename).toBe('001_test_user.png');
  });

  it('includes the member ID prefix', () => {
    const filename = generateCardFilename('uuid-abc-123', 'Ana');
    expect(filename).toBe('uuid-abc-123_ana.png');
  });
});
