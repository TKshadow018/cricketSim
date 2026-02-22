import React, { createContext, useContext, useMemo, useState } from 'react';
import { DEFAULT_LOCALE, getLocaleStrings, translate } from './index';

const LocalizationContext = createContext({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key) => key,
  strings: getLocaleStrings(DEFAULT_LOCALE),
});

export function LocalizationProvider({ children }) {
  const [locale, setLocale] = useState(DEFAULT_LOCALE);

  const value = useMemo(() => {
    const strings = getLocaleStrings(locale);

    return {
      locale,
      setLocale,
      strings,
      t: (key, params = {}) => translate(locale, key, params),
    };
  }, [locale]);

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
}

export const useLocalization = () => useContext(LocalizationContext);
