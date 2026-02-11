import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createEmptyRevocationList,
  createRevocationEntry,
  validateRevocationList,
  addToRevocationList,
  removeFromRevocationList,
  mergeRevocationLists,
  exportRevocationJSON,
  importRevocationJSON,
} from './revocation.js';

describe('createEmptyRevocationList', () => {
  it('returns correct structure with empty arrays', () => {
    const list = createEmptyRevocationList();
    expect(list).toHaveProperty('updated_at');
    expect(list).toHaveProperty('revoked_jti');
    expect(list).toHaveProperty('revoked_sub');
    expect(list.revoked_jti).toEqual([]);
    expect(list.revoked_sub).toEqual([]);
  });

  it('has a valid ISO timestamp', () => {
    const list = createEmptyRevocationList();
    const parsed = new Date(list.updated_at);
    expect(parsed.toISOString()).toBe(list.updated_at);
  });
});

describe('validateRevocationList', () => {
  it('accepts a valid revocation list', () => {
    const list = createEmptyRevocationList();
    expect(validateRevocationList(list)).toBe(true);
  });

  it('rejects null', () => {
    expect(() => validateRevocationList(null)).toThrow('must be an object');
  });

  it('rejects missing updated_at', () => {
    expect(() => validateRevocationList({ revoked_jti: [], revoked_sub: [] })).toThrow('updated_at');
  });

  it('rejects missing revoked_jti', () => {
    expect(() => validateRevocationList({ updated_at: 'x', revoked_sub: [] })).toThrow('revoked_jti');
  });

  it('rejects missing revoked_sub', () => {
    expect(() => validateRevocationList({ updated_at: 'x', revoked_jti: [] })).toThrow('revoked_sub');
  });
});

describe('createRevocationEntry', () => {
  it('creates an entry with id, type and timestamp', () => {
    const entry = createRevocationEntry('token-123', 'jti');
    expect(entry.id).toBe('token-123');
    expect(entry.type).toBe('jti');
    expect(typeof entry.timestamp).toBe('string');
  });

  it('rejects invalid type', () => {
    expect(() => createRevocationEntry('token-123', 'invalid')).toThrow('type');
  });
});

describe('addToRevocationList', () => {
  let list;

  beforeEach(() => {
    list = createEmptyRevocationList();
  });

  it('adds a jti to the list', () => {
    const updated = addToRevocationList(list, 'token-123', 'jti');
    expect(updated.revoked_jti).toContain('token-123');
    expect(updated.revoked_sub).toEqual([]);
  });

  it('adds a sub to the list', () => {
    const updated = addToRevocationList(list, 'member-456', 'sub');
    expect(updated.revoked_sub).toContain('member-456');
    expect(updated.revoked_jti).toEqual([]);
  });

  it('prevents duplicate entries', () => {
    const first = addToRevocationList(list, 'token-123', 'jti');
    const second = addToRevocationList(first, 'token-123', 'jti');
    expect(second.revoked_jti).toEqual(['token-123']);
    // Should return same object when no change
    expect(second).toBe(first);
  });

  it('updates the updated_at timestamp', async () => {
    const originalTime = list.updated_at;
    // Small delay to ensure different timestamp
    await new Promise(r => setTimeout(r, 10));
    const updated = addToRevocationList(list, 'token-123', 'jti');
    expect(updated.updated_at).not.toBe(originalTime);
  });

  it('does not mutate the original list', () => {
    const updated = addToRevocationList(list, 'token-123', 'jti');
    expect(list.revoked_jti).toEqual([]);
    expect(updated.revoked_jti).toEqual(['token-123']);
  });
});

describe('removeFromRevocationList', () => {
  it('removes a jti from the list', () => {
    let list = createEmptyRevocationList();
    list = addToRevocationList(list, 'token-123', 'jti');
    list = addToRevocationList(list, 'token-456', 'jti');

    const updated = removeFromRevocationList(list, 'token-123', 'jti');
    expect(updated.revoked_jti).toEqual(['token-456']);
  });

  it('removes a sub from the list', () => {
    let list = createEmptyRevocationList();
    list = addToRevocationList(list, 'member-123', 'sub');

    const updated = removeFromRevocationList(list, 'member-123', 'sub');
    expect(updated.revoked_sub).toEqual([]);
  });

  it('is a no-op for non-existent entry', () => {
    const list = createEmptyRevocationList();
    const updated = removeFromRevocationList(list, 'nonexistent', 'jti');
    expect(updated).toBe(list);
  });
});

describe('mergeRevocationLists', () => {
  it('merges jti and sub entries from incoming list', () => {
    let base = createEmptyRevocationList();
    base = addToRevocationList(base, 'jti-1', 'jti');

    let incoming = createEmptyRevocationList();
    incoming = addToRevocationList(incoming, 'jti-2', 'jti');
    incoming = addToRevocationList(incoming, 'sub-2', 'sub');

    const merged = mergeRevocationLists(base, incoming);
    expect(merged.revoked_jti).toEqual(['jti-1', 'jti-2']);
    expect(merged.revoked_sub).toEqual(['sub-2']);
  });

  it('does not duplicate existing entries', () => {
    let base = createEmptyRevocationList();
    base = addToRevocationList(base, 'jti-1', 'jti');

    let incoming = createEmptyRevocationList();
    incoming = addToRevocationList(incoming, 'jti-1', 'jti');

    const merged = mergeRevocationLists(base, incoming);
    expect(merged).toBe(base);
  });
});

describe('exportRevocationJSON', () => {
  it('returns valid formatted JSON string', () => {
    const list = createEmptyRevocationList();
    const json = exportRevocationJSON(list);
    expect(typeof json).toBe('string');
    expect(JSON.parse(json)).toEqual(list);
  });

  it('is pretty-printed with 2-space indent', () => {
    const list = createEmptyRevocationList();
    const json = exportRevocationJSON(list);
    expect(json).toContain('\n');
    expect(json).toContain('  "updated_at"');
  });
});

describe('importRevocationJSON', () => {
  it('roundtrips correctly with export', () => {
    let list = createEmptyRevocationList();
    list = addToRevocationList(list, 'token-1', 'jti');
    list = addToRevocationList(list, 'member-1', 'sub');

    const json = exportRevocationJSON(list);
    const imported = importRevocationJSON(json);
    expect(imported).toEqual(list);
  });

  it('rejects malformed JSON', () => {
    expect(() => importRevocationJSON('not json')).toThrow('Invalid JSON');
  });

  it('rejects JSON with missing required fields', () => {
    expect(() => importRevocationJSON('{"foo": "bar"}')).toThrow();
  });

  it('accepts valid JSON with populated arrays', () => {
    const json = JSON.stringify({
      updated_at: '2026-01-01T00:00:00Z',
      revoked_jti: ['a', 'b'],
      revoked_sub: ['c'],
    });
    const imported = importRevocationJSON(json);
    expect(imported.revoked_jti).toEqual(['a', 'b']);
    expect(imported.revoked_sub).toEqual(['c']);
  });
});
