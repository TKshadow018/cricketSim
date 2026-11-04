import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import { startAuthListener } from '../features/auth/authThunks';

let mockDebugAuthBypassEnabled = false;

jest.mock('../pages/LoginPage', () => () => <p>Login page</p>);
jest.mock('../pages/RegisterPage', () => () => <p>Register page</p>);
jest.mock('../pages/DashboardPage', () => () => <p>Dashboard page</p>);

jest.mock('./RouteGuards', () => {
  const ReactActual = jest.requireActual('react');
  const { Outlet } = jest.requireActual('react-router-dom');
  return {
    ProtectedRoute: () => ReactActual.createElement(Outlet),
    PublicOnlyRoute: () => ReactActual.createElement(Outlet),
  };
});

jest.mock('../features/auth/authThunks', () => ({
  startAuthListener: jest.fn(),
}));

jest.mock('../utils/runtimeFlags', () => ({
  get isDebugAuthBypassEnabled() {
    return mockDebugAuthBypassEnabled;
  },
}));

function RouteControls() {
  const navigate = useNavigate();
  return (
    <>
      <button onClick={() => navigate('/register')}>Go to register</button>
      <button onClick={() => navigate('/dashboard')}>Go to dashboard</button>
    </>
  );
}

const renderRoutes = (initialPath) => {
  const store = configureStore({ reducer: (state = {}) => state });
  const dispatchSpy = jest.spyOn(store, 'dispatch');
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialPath]}>
        <AppRoutes />
        <RouteControls />
      </MemoryRouter>
    </Provider>
  );
  return { store, dispatchSpy };
};

describe('AppRoutes', () => {
  beforeEach(() => {
    mockDebugAuthBypassEnabled = false;
    startAuthListener.mockReturnValue({ type: 'auth/startAuthListener' });
  });

  test('renders public and dashboard routes while updating SEO metadata', async () => {
    const { dispatchSpy } = renderRoutes('/login');
    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(document.title).toBe('Play Cricket Games Online | Cricket Sim Arena Login');
    expect(document.head.querySelector('meta[name="description"]')).toHaveAttribute(
      'content',
      expect.stringContaining('Log in to Cricket Sim Arena')
    );
    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'index,follow');
    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute('href', 'http://localhost/login');
    expect(dispatchSpy).toHaveBeenCalledWith({ type: 'auth/startAuthListener' });

    fireEvent.click(screen.getByRole('button', { name: 'Go to register' }));
    await waitFor(() => expect(screen.getByText('Register page')).toBeInTheDocument());
    expect(document.title).toBe('Create Account | Cricket Sim Arena Cricket Game');

    fireEvent.click(screen.getByRole('button', { name: 'Go to dashboard' }));
    await waitFor(() => expect(screen.getByText('Dashboard page')).toBeInTheDocument());
    expect(document.title).toBe('Cricket Match Simulator Dashboard | Cricket Sim Arena');
    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute('href', 'http://localhost/dashboard');
    expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(1);
    expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
  });

  test('redirects unknown routes to login outside debug mode', async () => {
    renderRoutes('/unknown');
    await waitFor(() => expect(screen.getByText('Login page')).toBeInTheDocument());
  });

  test('redirects unknown routes to the dashboard in debug mode', async () => {
    mockDebugAuthBypassEnabled = true;
    renderRoutes('/unknown');
    await waitFor(() => expect(screen.getByText('Dashboard page')).toBeInTheDocument());
  });
});
