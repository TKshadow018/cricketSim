import en from './locales/en';

export const DEFAULT_LOCALE = 'en';

export const LOCALES = {
  en,
};

const getByPath = (obj, path) =>
  path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);

export const getLocaleStrings = (locale = DEFAULT_LOCALE) => LOCALES[locale] || LOCALES[DEFAULT_LOCALE];

export const translate = (locale, key, params = {}) => {
  const strings = getLocaleStrings(locale);
  const value = getByPath(strings, key);

  if (typeof value !== 'string') {
    return key;
  }

  return value.replace(/\{(\w+)\}/g, (_, token) => String(params[token] ?? `{${token}}`));
};

export const translateStatic = (key, params = {}, locale = DEFAULT_LOCALE) =>
  translate(locale, key, params);
