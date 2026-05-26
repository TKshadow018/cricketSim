import authReducer, { clearAuthError } from './authSlice';

// Mock Firebase-dependent thunks so the test environment doesn't need
// the `undici` / TextEncoder globals that Firebase auth requires.
jest.mock('./authThunks', () => ({
  loginUser: { pending: { type: 'auth/loginUser/pending' }, fulfilled: { type: 'auth/loginUser/fulfilled' }, rejected: { type: 'auth/loginUser/rejected' } },
  loginWithGoogleUser: { pending: { type: 'auth/loginWithGoogleUser/pending' }, fulfilled: { type: 'auth/loginWithGoogleUser/fulfilled' }, rejected: { type: 'auth/loginWithGoogleUser/rejected' } },
  logoutUser: { pending: { type: 'auth/logoutUser/pending' }, fulfilled: { type: 'auth/logoutUser/fulfilled' }, rejected: { type: 'auth/logoutUser/rejected' } },
  registerUser: { pending: { type: 'auth/registerUser/pending' }, fulfilled: { type: 'auth/registerUser/fulfilled' }, rejected: { type: 'auth/registerUser/rejected' } },
  startAuthListener: { pending: { type: 'auth/startAuthListener/pending' }, fulfilled: { type: 'auth/startAuthListener/fulfilled' }, rejected: { type: 'auth/startAuthListener/rejected' } },
}));

const initialState = {
  user: null,
  isLoading: false,
  isSessionLoading: true,
  error: null,
};

describe('authSlice', () => {
  describe('initial state', () => {
    it('has user as null', () => {
      expect(authReducer(undefined, { type: '@@INIT' }).user).toBeNull();
    });

    it('has isLoading as false', () => {
      expect(authReducer(undefined, { type: '@@INIT' }).isLoading).toBe(false);
    });

    it('has isSessionLoading as true', () => {
      expect(authReducer(undefined, { type: '@@INIT' }).isSessionLoading).toBe(true);
    });

    it('has error as null', () => {
      expect(authReducer(undefined, { type: '@@INIT' }).error).toBeNull();
    });
  });

  describe('clearAuthError', () => {
    it('resets error to null', () => {
      const stateWithError = { ...initialState, error: 'Something went wrong' };
      const newState = authReducer(stateWithError, clearAuthError());
      expect(newState.error).toBeNull();
    });

    it('does not affect other state fields', () => {
      const stateWithUser = { ...initialState, user: { uid: 'abc' }, error: 'oops' };
      const newState = authReducer(stateWithUser, clearAuthError());
      expect(newState.user).toEqual({ uid: 'abc' });
    });
  });

  describe('loginUser thunk actions', () => {
    it('sets isLoading=true and clears error on pending', () => {
      const state = authReducer(initialState, { type: 'auth/loginUser/pending' });
      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('sets user and isLoading=false on fulfilled', () => {
      const user = { uid: 'user1', email: 'test@test.com' };
      const state = authReducer(initialState, { type: 'auth/loginUser/fulfilled', payload: user });
      expect(state.user).toEqual(user);
      expect(state.isLoading).toBe(false);
    });

    it('sets error and isLoading=false on rejected', () => {
      const state = authReducer(initialState, { type: 'auth/loginUser/rejected', payload: 'Login failed' });
      expect(state.error).toBe('Login failed');
      expect(state.isLoading).toBe(false);
    });
  });

  describe('registerUser thunk actions', () => {
    it('sets isLoading=true on pending', () => {
      const state = authReducer(initialState, { type: 'auth/registerUser/pending' });
      expect(state.isLoading).toBe(true);
    });

    it('sets user on fulfilled', () => {
      const user = { uid: 'newuser' };
      const state = authReducer(initialState, { type: 'auth/registerUser/fulfilled', payload: user });
      expect(state.user).toEqual(user);
    });

    it('sets error on rejected', () => {
      const state = authReducer(initialState, { type: 'auth/registerUser/rejected', payload: 'Register failed' });
      expect(state.error).toBe('Register failed');
    });
  });

  describe('loginWithGoogleUser thunk actions', () => {
    it('sets isLoading=true on pending', () => {
      const state = authReducer(initialState, { type: 'auth/loginWithGoogleUser/pending' });
      expect(state.isLoading).toBe(true);
    });

    it('sets user on fulfilled', () => {
      const user = { uid: 'googleuser' };
      const state = authReducer(initialState, { type: 'auth/loginWithGoogleUser/fulfilled', payload: user });
      expect(state.user).toEqual(user);
    });

    it('sets error on rejected', () => {
      const state = authReducer(initialState, { type: 'auth/loginWithGoogleUser/rejected', payload: 'Google login failed' });
      expect(state.error).toBe('Google login failed');
    });
  });

  describe('logoutUser thunk actions', () => {
    it('sets isLoading=true on pending', () => {
      const state = authReducer({ ...initialState, user: { uid: 'abc' } }, { type: 'auth/logoutUser/pending' });
      expect(state.isLoading).toBe(true);
    });

    it('clears user on fulfilled', () => {
      const loggedInState = { ...initialState, user: { uid: 'abc' }, isLoading: true };
      const state = authReducer(loggedInState, { type: 'auth/logoutUser/fulfilled' });
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
    });

    it('sets error on rejected', () => {
      const state = authReducer(initialState, { type: 'auth/logoutUser/rejected', payload: 'Logout failed' });
      expect(state.error).toBe('Logout failed');
    });
  });

  describe('startAuthListener thunk actions', () => {
    it('sets isSessionLoading=true on pending', () => {
      const state = authReducer(initialState, { type: 'auth/startAuthListener/pending' });
      expect(state.isSessionLoading).toBe(true);
    });

    it('sets user and isSessionLoading=false on fulfilled', () => {
      const user = { uid: 'session-user' };
      const state = authReducer(initialState, { type: 'auth/startAuthListener/fulfilled', payload: user });
      expect(state.user).toEqual(user);
      expect(state.isSessionLoading).toBe(false);
    });

    it('clears user and sets isSessionLoading=false on rejected', () => {
      const state = authReducer(
        { ...initialState, user: { uid: 'old' } },
        { type: 'auth/startAuthListener/rejected', payload: 'Session error' }
      );
      expect(state.user).toBeNull();
      expect(state.isSessionLoading).toBe(false);
      expect(state.error).toBe('Session error');
    });
  });
});
