import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./routes/AppRoutes', () => () => <div data-testid="app-routes" />);

test('renders the application routes', () => {
  render(<App />);
  expect(screen.getByTestId('app-routes')).toBeInTheDocument();
});
