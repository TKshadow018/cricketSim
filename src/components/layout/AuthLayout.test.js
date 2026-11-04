import React from 'react';
import { render, screen } from '@testing-library/react';
import AuthLayout from './AuthLayout';
import { LocalizationProvider } from '../../localization/LocalizationProvider';

test('renders localized branding beside its child content', () => {
  render(
    <LocalizationProvider>
      <AuthLayout>
        <form aria-label="Sign in form" />
      </AuthLayout>
    </LocalizationProvider>
  );

  expect(screen.getByText('Cricket Sim')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Build your dream match strategy.' })).toBeInTheDocument();
  expect(screen.getByText(/Train teams, simulate outcomes/)).toBeInTheDocument();
  expect(screen.getByRole('form', { name: 'Sign in form' })).toBeInTheDocument();
});
