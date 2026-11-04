import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import AppButton from './AppButton';
import { LocalizationProvider } from '../../localization/LocalizationProvider';

describe('AppButton', () => {
  test('uses defaults, displays localized loading text, and disables while busy', () => {
    const onClick = jest.fn();
    const { rerender } = render(
      <LocalizationProvider>
        <AppButton text="Start" onClick={onClick} />
      </LocalizationProvider>
    );
    const button = screen.getByRole('button', { name: 'Start' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('app-button-primary', 'app-button-full');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(
      <LocalizationProvider>
        <AppButton text="Start" onClick={onClick} isLoading className="extra" variant="secondary" fullWidth={false} />
      </LocalizationProvider>
    );
    const loadingButton = screen.getByRole('button', { name: 'Please wait...' });
    expect(loadingButton).toBeDisabled();
    expect(loadingButton).toHaveAttribute('aria-busy', 'true');
    expect(loadingButton).toHaveClass('app-button-secondary', 'extra');
    expect(loadingButton).not.toHaveClass('app-button-full');

    rerender(
      <LocalizationProvider>
        <AppButton text="Disabled" disabled />
      </LocalizationProvider>
    );
    expect(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled();
  });
});
