import React from 'react';
import { render, screen } from '@testing-library/react';
import AuthCard from './AuthCard';

test('renders its accessible title, subtitle, and nested content', () => {
  render(
    <AuthCard title="Welcome" subtitle="Sign in">
      <button>Continue</button>
    </AuthCard>
  );

  expect(screen.getByRole('region', { name: 'Welcome' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Welcome' })).toBeInTheDocument();
  expect(screen.getByText('Sign in')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
});
