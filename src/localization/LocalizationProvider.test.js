import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { COUNTRY_NAMES } from '../constants/countries';
import {
  DEFAULT_LOCALE,
  getLocaleStrings,
  translate,
  translateStatic,
} from './index';
import { LocalizationProvider, useLocalization } from './LocalizationProvider';

function LocaleDetails() {
  const { locale, setLocale, strings, t } = useLocalization();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="brand">{t('brand.name')}</span>
      <span data-testid="strings-brand">{strings.brand.name}</span>
      <button onClick={() => setLocale('unknown')}>Change locale</button>
    </div>
  );
}

test('provides default locale, fallback strings, and translated parameterized copy', () => {
  expect(DEFAULT_LOCALE).toBe('en');
  expect(getLocaleStrings()).toBe(getLocaleStrings('en'));
  expect(getLocaleStrings('unknown')).toBe(getLocaleStrings('en'));
  expect(translate('en', 'brand.name')).toBe('Cricket Sim');
  expect(translate('en', 'auth.validation.invalidAgeRange', { min: 13, max: 100 }))
    .toBe('Age must be between 13 and 100.');
  expect(translate('en', 'auth.validation.invalidAgeRange')).toBe('Age must be between {min} and {max}.');
  expect(translateStatic('missing.translation')).toBe('missing.translation');
  expect(translate('en', 'missing.translation')).toBe('missing.translation');
  expect(COUNTRY_NAMES).toBe(getLocaleStrings().countries);
  expect(Object.keys(COUNTRY_NAMES).length).toBeGreaterThan(0);
});

test('exposes default context outside the provider and updates provider locale state', () => {
  function OutsideProvider() {
    const context = useLocalization();
    return (
      <>
        <span>{context.t('missing.key')}</span>
        <button onClick={() => context.setLocale('bn')}>Set outside locale</button>
      </>
    );
  }
  const { unmount } = render(<OutsideProvider />);
  expect(screen.getByText('missing.key')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Set outside locale' }));
  unmount();

  render(
    <LocalizationProvider>
      <LocaleDetails />
    </LocalizationProvider>
  );
  expect(screen.getByTestId('locale')).toHaveTextContent('en');
  expect(screen.getByTestId('brand')).toHaveTextContent('Cricket Sim');
  fireEvent.click(screen.getByRole('button', { name: 'Change locale' }));
  expect(screen.getByTestId('locale')).toHaveTextContent('unknown');
  expect(screen.getByTestId('strings-brand')).toHaveTextContent('Cricket Sim');
});
