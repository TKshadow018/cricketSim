import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import LoginPage from './LoginPage';
import { LocalizationProvider } from '../localization/LocalizationProvider';

let mockAuthState;
let mockDispatch;

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector) => selector({ auth: mockAuthState }),
}));
jest.mock('../features/auth/authSlice', () => ({
  clearAuthError: () => ({ type: 'auth/clearAuthError' }),
}));
jest.mock('../features/auth/authThunks', () => ({
  loginUser: jest.fn((payload) => ({ type: 'auth/loginUser', payload })),
  loginWithGoogleUser: jest.fn(() => ({ type: 'auth/loginWithGoogleUser' })),
}));

const renderPage = (path = '/login') => render(
  <LocalizationProvider>
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<p>Dashboard route</p>} />
      </Routes>
    </MemoryRouter>
  </LocalizationProvider>
);

describe('LoginPage', () => {
  beforeEach(() => {
    mockAuthState = { user: null, isLoading: false, error: null };
    mockDispatch = jest.fn((action) => Promise.resolve(action));
    const authThunks = jest.requireMock('../features/auth/authThunks');
    authThunks.loginUser.mockImplementation((payload) => ({ type: 'auth/loginUser', payload }));
    authThunks.loginWithGoogleUser.mockImplementation(() => ({ type: 'auth/loginWithGoogleUser' }));
  });

  test('validates credentials before dispatching login', async () => {
    const { container } = renderPage();
    fireEvent.submit(container.querySelector('form'));

    expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByText('Password must be at least 6 characters.')).toBeInTheDocument();
    expect(mockDispatch).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'coach@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret1' } });
    fireEvent.submit(container.querySelector('form'));

    await waitFor(() => expect(mockDispatch).toHaveBeenCalledWith({
      type: 'auth/loginUser',
      payload: { email: 'coach@example.com', password: 'secret1' },
    }));
    expect(screen.queryByText('Please enter a valid email address.')).not.toBeInTheDocument();
  });

  test('clears server errors on edits and attempts Google sign-in', async () => {
    mockAuthState.error = 'Authentication failed';
    renderPage();

    expect(screen.getByText('Authentication failed')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'coach@example.com' } });
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'auth/clearAuthError' });
    fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }));
    await waitFor(() => expect(mockDispatch).toHaveBeenCalledWith({
      type: 'auth/loginWithGoogleUser',
    }));
  });

  test('redirects an authenticated user to the dashboard', () => {
    mockAuthState.user = { uid: 'user-1' };
    renderPage();
    expect(screen.getByText('Dashboard route')).toBeInTheDocument();
  });

  test('starts Google sign-in without an existing server error', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }));
    await waitFor(() => expect(mockDispatch).toHaveBeenCalledWith({
      type: 'auth/loginWithGoogleUser',
    }));
  });
});
