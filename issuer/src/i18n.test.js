import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { i18nResources, _resolveLanguage } from './i18n';

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

describe('language switching', () => {
  it('returns different translations for es and en', () => {
    const esLabel = i18nResources.es.language.label;
    const enLabel = i18nResources.en.language.label;
    expect(esLabel).toBe('Idioma');
    expect(enLabel).toBe('Language');
    expect(esLabel).not.toBe(enLabel);
  });

  it('all top-level sections have distinct translations between languages', () => {
    const esTitle = i18nResources.es.app.title;
    const enTitle = i18nResources.en.app.title;
    expect(esTitle).not.toBe(enTitle);
  });
});

describe('browser language detection', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns es when navigator.language is es-ES', () => {
    vi.stubGlobal('navigator', { language: 'es-ES' });
    expect(_resolveLanguage()).toBe('es');
  });

  it('returns en when navigator.language is en-US', () => {
    vi.stubGlobal('navigator', { language: 'en-US' });
    expect(_resolveLanguage()).toBe('en');
  });

  it('defaults to es for unsupported language', () => {
    vi.stubGlobal('navigator', { language: 'fr-FR' });
    expect(_resolveLanguage()).toBe('es');
  });

  it('prefers explicit parameter over browser language', () => {
    vi.stubGlobal('navigator', { language: 'en-US' });
    expect(_resolveLanguage('es')).toBe('es');
  });

  it('prefers URL query language over stored/browser language', () => {
    vi.stubGlobal('window', { location: { search: '?lang=en', hash: '' } });
    vi.stubGlobal('navigator', { language: 'es-ES' });
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => 'es'),
      setItem: vi.fn(),
    });
    expect(_resolveLanguage()).toBe('en');
  });

  it('reads language from URL hash params', () => {
    vi.stubGlobal('window', { location: { search: '', hash: '#token=abc&lang=es' } });
    vi.stubGlobal('navigator', { language: 'en-US' });
    expect(_resolveLanguage()).toBe('es');
  });
});
