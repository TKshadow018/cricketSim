import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ProtectedRoute, PublicOnlyRoute } from './RouteGuards';

let mockDebugAuthBypassEnabled = false;
let mockAuthState = { user: null, isSessionLoading: false };

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../localization/LocalizationProvider', () => ({
  useLocalization: () => ({ t: (key) => key }),
}));

jest.mock('../utils/runtimeFlags', () => ({
  get isDebugAuthBypassEnabled() {
    return mockDebugAuthBypassEnabled;
  },
}));

const renderProtectedRoute = () =>
  render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route path="/protected" element={<ProtectedRoute />}>
          <Route index element={<p>Protected content</p>} />
        </Route>
        <Route path="/login" element={<p>Login page</p>} />
      </Routes>
    </MemoryRouter>
  );

const renderPublicRoute = () =>
  render(
    <MemoryRouter initialEntries={['/public']}>
      <Routes>
        <Route path="/public" element={<PublicOnlyRoute />}>
          <Route index element={<p>Public content</p>} />
        </Route>
        <Route path="/dashboard" element={<p>Dashboard page</p>} />
      </Routes>
    </MemoryRouter>
  );

describe('route guards', () => {
  beforeEach(() => {
    mockDebugAuthBypassEnabled = false;
    mockAuthState = { user: null, isSessionLoading: false };
    useSelector.mockImplementation((selector) => selector({ auth: mockAuthState }));
  });

  test('allows protected content during debug bypass or for a signed-in user', () => {
    mockDebugAuthBypassEnabled = true;
    mockAuthState.isSessionLoading = true;
    const { unmount } = renderProtectedRoute();
    expect(screen.getByText('Protected content')).toBeInTheDocument();

    unmount();
    mockDebugAuthBypassEnabled = false;
    mockAuthState = { user: { uid: 'player' }, isSessionLoading: false };
    renderProtectedRoute();
    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  test('shows a loading message and redirects signed-out users from protected content', () => {
    mockAuthState.isSessionLoading = true;
    const { unmount } = renderProtectedRoute();
    expect(screen.getByText('common.checkingSession')).toBeInTheDocument();

    unmount();
    mockAuthState = { user: null, isSessionLoading: false };
    renderProtectedRoute();
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  test('redirects signed-in users or debug sessions away from public pages', () => {
    mockDebugAuthBypassEnabled = true;
    const { unmount } = renderPublicRoute();
    expect(screen.getByText('Dashboard page')).toBeInTheDocument();

    unmount();
    mockDebugAuthBypassEnabled = false;
    mockAuthState = { user: { uid: 'player' }, isSessionLoading: false };
    renderPublicRoute();
    expect(screen.getByText('Dashboard page')).toBeInTheDocument();
  });

  test('shows a loading message and allows signed-out users on public pages', () => {
    mockAuthState.isSessionLoading = true;
    const { unmount } = renderPublicRoute();
    expect(screen.getByText('common.checkingSession')).toBeInTheDocument();

    unmount();
    mockAuthState = { user: null, isSessionLoading: false };
    renderPublicRoute();
    expect(screen.getByText('Public content')).toBeInTheDocument();
  });
});
