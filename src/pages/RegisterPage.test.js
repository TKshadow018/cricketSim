import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import RegisterPage from './RegisterPage';
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
  registerUser: jest.fn((payload) => ({ type: 'auth/registerUser', payload })),
}));

const renderPage = () => render(
  <LocalizationProvider>
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<p>Dashboard route</p>} />
      </Routes>
    </MemoryRouter>
  </LocalizationProvider>
);

const changeField = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const submitForm = (container) => fireEvent.submit(container.querySelector('form'));

const fillValidForm = () => {
  changeField('Full Name', 'Coach');
  changeField('Age', '20');
  changeField('Country', 'India');
  changeField('Email', 'coach@example.com');
  changeField('Password', 'secret1');
  changeField('Confirm Password', 'secret1');
};

describe('RegisterPage', () => {
  beforeEach(() => {
    mockAuthState = { user: null, isLoading: false, error: null };
    mockDispatch = jest.fn((action) => Promise.resolve(action));
    jest.requireMock('../features/auth/authThunks').registerUser
      .mockImplementation((payload) => ({ type: 'auth/registerUser', payload }));
  });

  test('validates each registration field and submits normalized values', async () => {
    const { container } = renderPage();
    fillValidForm();

    const invalidCases = [
      ['Full Name', 'A', 'Name should be at least 2 characters.'],
      ['Age', '', 'Age must be between 13 and 100.'],
      ['Age', '12', 'Age must be between 13 and 100.'],
      ['Age', '101', 'Age must be between 13 and 100.'],
      ['Country', 'Atlantis', 'Please select a valid country.'],
      ['Email', 'invalid', 'Please enter a valid email address.'],
      ['Password', '123', 'Password must be at least 6 characters.'],
      ['Confirm Password', 'different', 'Passwords do not match.'],
    ];

    for (const [label, value, error] of invalidCases) {
      changeField(label, value);
      submitForm(container);
      expect(screen.getByText(error)).toBeInTheDocument();
      fillValidForm();
    }

    submitForm(container);
    await waitFor(() => expect(mockDispatch).toHaveBeenCalledWith({
      type: 'auth/registerUser',
      payload: {
        name: 'Coach',
        age: 20,
        country: 'India',
        email: 'coach@example.com',
        password: 'secret1',
      },
    }));
  });

  test('clears server errors on edits and redirects authenticated users', () => {
    mockAuthState.error = 'Registration failed';
    renderPage();
    expect(screen.getByText('Registration failed')).toBeInTheDocument();
    changeField('Full Name', 'Coach');
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'auth/clearAuthError' });

    mockAuthState.user = { uid: 'user-2' };
    renderPage();
    expect(screen.getByText('Dashboard route')).toBeInTheDocument();
  });
});
