import authReducer, { clearAuthError } from './authSlice';

jest.mock('./authThunks', () => {
  const makeAction = (type) => Object.assign(
    (payload) => ({ type, payload }),
    { type, toString: () => type }
  );
  const makeThunk = (name) => ({
    pending: makeAction(`${name}/pending`),
    fulfilled: makeAction(`${name}/fulfilled`),
    rejected: makeAction(`${name}/rejected`),
  });
  return {
    loginUser: makeThunk('auth/loginUser'),
    loginWithGoogleUser: makeThunk('auth/loginWithGoogleUser'),
    logoutUser: makeThunk('auth/logoutUser'),
    registerUser: makeThunk('auth/registerUser'),
    startAuthListener: makeThunk('auth/startAuthListener'),
  };
});

test('clears errors and handles auth listener lifecycle', () => {
  const thunks = jest.requireMock('./authThunks');
  let state = authReducer(undefined, { type: '@@init' });
  expect(state).toEqual({ user: null, isLoading: false, isSessionLoading: true, error: null });
  state = authReducer({ ...state, error: 'old' }, clearAuthError());
  expect(state.error).toBeNull();
  state = authReducer({ ...state, error: 'old' }, thunks.startAuthListener.pending());
  expect(state.isSessionLoading).toBe(true);
  expect(state.error).toBeNull();
  state = authReducer(state, thunks.startAuthListener.fulfilled({ uid: 'user-1' }));
  expect(state.user).toEqual({ uid: 'user-1' });
  expect(state.isSessionLoading).toBe(false);
  state = authReducer(state, thunks.startAuthListener.rejected('failed'));
  expect(state).toEqual(expect.objectContaining({ user: null, isSessionLoading: false, error: 'failed' }));
});

test.each(['loginUser', 'loginWithGoogleUser', 'registerUser', 'logoutUser'])(
  'handles pending, fulfilled, and rejected states for %s',
  (thunkName) => {
    const thunk = jest.requireMock('./authThunks')[thunkName];
    let state = authReducer(
      { user: null, isLoading: false, isSessionLoading: false, error: 'old' },
      thunk.pending()
    );
    expect(state.isLoading).toBe(true);
    expect(state.error).toBeNull();

    state = authReducer(state, thunk.fulfilled({ uid: 'user-2' }));
    expect(state.isLoading).toBe(false);
    if (thunkName === 'logoutUser') {
      expect(state.user).toBeNull();
    } else {
      expect(state.user).toEqual({ uid: 'user-2' });
    }

    state = authReducer(state, thunk.rejected('auth error'));
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('auth error');
  }
);
