import { describe, it, expect } from 'vitest';
import { i18nResources } from './i18n';

function collectKeys(obj, prefix = '') {
  return Object.entries(obj).flatMap(([key, value]) => {
    const next = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return collectKeys(value, next);
    }
    return [next];
  });
}

describe('issuer i18n resources', () => {
  it('loads Spanish and English translations', () => {
    expect(i18nResources.es).toBeTruthy();
    expect(i18nResources.en).toBeTruthy();
  });

  it('has matching translation keys in es and en', () => {
    const esKeys = collectKeys(i18nResources.es).sort();
    const enKeys = collectKeys(i18nResources.en).sort();
    expect(enKeys).toEqual(esKeys);
  });
});
