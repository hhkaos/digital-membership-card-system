import { createContext, createElement, useContext, useMemo, useState } from 'react';
import es from './locales/es.json';
import en from './locales/en.json';

const resources = { es, en };
const LANGUAGE_STORAGE_KEY = 'ampa.issuer.language';

function resolveLanguage(explicit) {
  if (explicit && resources[explicit]) return explicit;

  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && resources[stored]) {
      return stored;
    }
  }

  if (typeof navigator !== 'undefined' && navigator.language) {
    const base = navigator.language.toLowerCase().split('-')[0];
    if (resources[base]) return base;
  }

  return 'es';
}

function getByPath(obj, path) {
  return path.split('.').reduce((acc, segment) => {
    if (acc && Object.prototype.hasOwnProperty.call(acc, segment)) {
      return acc[segment];
    }
    return undefined;
  }, obj);
}

function interpolate(text, params = {}) {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      return String(params[key]);
    }
    return `{{${key}}}`;
  });
}

const I18nContext = createContext({
  language: 'es',
  setLanguage: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }) {
  const [language, setLanguage] = useState(() => resolveLanguage());

  const setLanguageWithPersistence = (nextLanguage) => {
    setLanguage(nextLanguage);
    if (typeof localStorage !== 'undefined' && resources[nextLanguage]) {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    }
  };

  const value = useMemo(() => {
    const safeLanguage = resources[language] ? language : 'es';
    const current = resources[safeLanguage];
    const fallback = resources.en;

    const t = (key, params) => {
      const fromCurrent = getByPath(current, key);
      const fromFallback = getByPath(fallback, key);
      const template = typeof fromCurrent === 'string'
        ? fromCurrent
        : (typeof fromFallback === 'string' ? fromFallback : key);
      return interpolate(template, params);
    };

    return { language: safeLanguage, setLanguage: setLanguageWithPersistence, t };
  }, [language]);

  return createElement(I18nContext.Provider, { value }, children);
}

export function useI18n() {
  return useContext(I18nContext);
}

export const i18nResources = resources;
export { resolveLanguage as _resolveLanguage };
