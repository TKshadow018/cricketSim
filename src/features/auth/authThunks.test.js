describe('authThunks', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  const loadModule = () => {
    const authService = {
      deleteRegisteredUser: jest.fn(),
      loginWithGoogle: jest.fn(),
      loginWithEmail: jest.fn(),
      registerWithEmail: jest.fn(),
      subscribeToAuth: jest.fn(),
      logout: jest.fn(),
    };
    const firestoreService = {
      getUserProfile: jest.fn(),
      upsertUserProfile: jest.fn(),
    };

    jest.doMock('../../firebase/authService', () => authService);
    jest.doMock('../../firebase/firestoreService', () => firestoreService);
    jest.doMock('../../localization', () => ({
      translateStatic: (key) => key,
    }));

    return {
      ...require('./authThunks'),
      authService,
      firestoreService,
    };
  };

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env.NODE_ENV = originalNodeEnv;
    delete process.env.REACT_APP_DEBUG;
    delete process.env.REACT_APP_DEBUG_MODE;
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  test('startAuthListener returns the debug user without subscribing when debug mode is enabled', async () => {
    process.env.REACT_APP_DEBUG = 'true';
    const { startAuthListener, authService } = loadModule();

    const action = await startAuthListener()(jest.fn(), () => ({}), undefined);

    expect(action.type).toBe('auth/startAuthListener/fulfilled');
    expect(action.payload).toMatchObject({
      uid: 'debug-local-user',
      displayName: 'Debug Mode',
    });
    expect(authService.subscribeToAuth).not.toHaveBeenCalled();
  });

  test('startAuthListener returns the debug user when debug mode alias is enabled', async () => {
    process.env.REACT_APP_DEBUG_MODE = 'true';
    const { startAuthListener, authService } = loadModule();

    const action = await startAuthListener()(jest.fn(), () => ({}), undefined);

    expect(action.type).toBe('auth/startAuthListener/fulfilled');
    expect(action.payload).toMatchObject({
      uid: 'debug-local-user',
      displayName: 'Debug Mode',
    });
    expect(authService.subscribeToAuth).not.toHaveBeenCalled();
  });

  test('loginUser bypasses firebase auth when debug mode is enabled', async () => {
    process.env.REACT_APP_DEBUG = 'true';
    const { loginUser, authService } = loadModule();

    const action = await loginUser({ email: 'dev@example.com', password: 'secret123' })(
      jest.fn(),
      () => ({}),
      undefined
    );

    expect(action.type).toBe('auth/loginUser/fulfilled');
    expect(action.payload).toMatchObject({
      uid: 'debug-local-user',
      email: 'debug@cricketsim.local',
    });
    expect(authService.loginWithEmail).not.toHaveBeenCalled();
  });

  test('logoutUser skips firebase logout when debug mode is enabled', async () => {
    process.env.REACT_APP_DEBUG = 'true';
    const { logoutUser, authService } = loadModule();

    const action = await logoutUser()(jest.fn(), () => ({}), undefined);

    expect(action.type).toBe('auth/logoutUser/fulfilled');
    expect(action.payload).toBe(true);
    expect(authService.logout).not.toHaveBeenCalled();
  });

  test('registerUser and Google sign-in return debug identity without calling Firebase', async () => {
    process.env.REACT_APP_DEBUG = 'true';
    const { registerUser, loginWithGoogleUser, authService, firestoreService } = loadModule();
    let action = await registerUser({
      name: '',
      email: '',
      age: 20,
      country: 'India',
      password: 'secret',
    })(jest.fn(), () => ({}), undefined);
    expect(action.payload).toMatchObject({
      uid: 'debug-local-user',
      email: 'debug@cricketsim.local',
      displayName: 'Debug Mode',
    });

    action = await registerUser({
      name: 'Coach',
      email: 'coach@example.com',
      age: 20,
      country: 'India',
      password: 'secret',
    })(jest.fn(), () => ({}), undefined);
    expect(action.payload).toMatchObject({
      email: 'coach@example.com',
      displayName: 'Coach',
    });

    action = await loginWithGoogleUser()(jest.fn(), () => ({}), undefined);
    expect(action.payload).toMatchObject({ uid: 'debug-local-user' });
    expect(authService.registerWithEmail).not.toHaveBeenCalled();
    expect(authService.loginWithGoogle).not.toHaveBeenCalled();
    expect(firestoreService.upsertUserProfile).not.toHaveBeenCalled();
  });

  test('startAuthListener uses firebase auth when debug mode is disabled', async () => {
    const { startAuthListener, authService, firestoreService } = loadModule();
    const unsubscribe = jest.fn();
    authService.subscribeToAuth.mockImplementation((onChange) => {
      Promise.resolve().then(() =>
        onChange({
          uid: 'user-123',
          email: 'player@example.com',
          displayName: 'Player',
        })
      );
      return unsubscribe;
    });
    firestoreService.getUserProfile.mockResolvedValue({
      displayName: 'Profile Name',
    });

    const action = await startAuthListener()(jest.fn(), () => ({}), undefined);

    expect(action.type).toBe('auth/startAuthListener/fulfilled');
    expect(action.payload).toEqual({
      uid: 'user-123',
      email: 'player@example.com',
      displayName: 'Profile Name',
    });
    expect(authService.subscribeToAuth).toHaveBeenCalledTimes(1);
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  test('startAuthListener does not bypass auth in production builds', async () => {
    process.env.NODE_ENV = 'production';
    process.env.REACT_APP_DEBUG = 'true';
    const { startAuthListener, authService } = loadModule();
    const unsubscribe = jest.fn();
    authService.subscribeToAuth.mockImplementation((onChange) => {
      Promise.resolve().then(() => onChange(null));
      return unsubscribe;
    });

    const action = await startAuthListener()(jest.fn(), () => ({}), undefined);

    expect(action.type).toBe('auth/startAuthListener/fulfilled');
    expect(action.payload).toBeNull();
    expect(authService.subscribeToAuth).toHaveBeenCalledTimes(1);
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  test('login resolves profile names, ignores profile permission failures, and reports other errors', async () => {
    const { loginUser, authService, firestoreService } = loadModule();
    authService.loginWithEmail.mockResolvedValue({
      uid: 'user-1',
      email: 'player@example.com',
      displayName: 'Auth Name',
    });
    firestoreService.getUserProfile.mockResolvedValueOnce({ displayName: 'Profile Name' });

    let action = await loginUser({ email: 'player@example.com', password: 'secret' })(
      jest.fn(),
      () => ({}),
      undefined
    );
    expect(action.payload).toEqual({
      uid: 'user-1',
      email: 'player@example.com',
      displayName: 'Profile Name',
    });

    firestoreService.getUserProfile.mockRejectedValueOnce({ code: 'permission-denied' });
    action = await loginUser({ email: 'player@example.com', password: 'secret' })(
      jest.fn(),
      () => ({}),
      undefined
    );
    expect(action.payload.displayName).toBe('Auth Name');

    firestoreService.getUserProfile.mockRejectedValueOnce(new Error('profile read failed'));
    action = await loginUser({ email: 'player@example.com', password: 'secret' })(
      jest.fn(),
      () => ({}),
      undefined
    );
    expect(action.type).toBe('auth/loginUser/rejected');
    expect(action.payload).toBe('profile read failed');

    authService.loginWithEmail.mockResolvedValueOnce({
      uid: 'user-1',
      email: 'player@example.com',
      displayName: '',
    });
    firestoreService.getUserProfile.mockResolvedValueOnce(null);
    action = await loginUser({ email: 'player@example.com', password: 'secret' })(
      jest.fn(),
      () => ({}),
      undefined
    );
    expect(action.payload.displayName).toBe('');

    authService.loginWithEmail.mockRejectedValueOnce({});
    action = await loginUser({ email: 'player@example.com', password: 'secret' })(
      jest.fn(),
      () => ({}),
      undefined
    );
    expect(action.payload).toBe('auth.errors.loginFailed');
  });

  test('register saves profiles and rolls back accounts when profile writes fail', async () => {
    const { registerUser, authService, firestoreService } = loadModule();
    const user = { uid: 'user-2', email: 'player@example.com' };
    authService.registerWithEmail.mockResolvedValue(user);
    firestoreService.upsertUserProfile.mockResolvedValue(undefined);

    let action = await registerUser({
      name: 'Player',
      age: 20,
      country: 'India',
      email: user.email,
      password: 'secret',
    })(jest.fn(), () => ({}), undefined);
    expect(action.payload).toEqual({ uid: user.uid, email: user.email, displayName: 'Player' });
    expect(firestoreService.upsertUserProfile).toHaveBeenCalledWith(
      user.uid,
      expect.objectContaining({ displayName: 'Player', age: 20, country: 'India', key: 'secret' })
    );

    firestoreService.upsertUserProfile.mockRejectedValueOnce({ code: 'firestore/permission-denied' });
    action = await registerUser({
      name: 'Player',
      age: 20,
      country: 'India',
      email: user.email,
      password: 'secret',
    })(jest.fn(), () => ({}), undefined);
    expect(authService.deleteRegisteredUser).toHaveBeenCalledWith(user);
    expect(action.payload).toBe('auth.errors.registerProfileSaveFailed');

    const logError = jest.spyOn(console, 'error').mockImplementation(() => {});
    authService.deleteRegisteredUser.mockRejectedValueOnce(new Error('rollback failed'));
    firestoreService.upsertUserProfile.mockRejectedValueOnce({ message: 'insufficient permissions' });
    action = await registerUser({
      name: 'Player',
      age: 20,
      country: 'India',
      email: user.email,
      password: 'secret',
    })(jest.fn(), () => ({}), undefined);
    expect(logError).toHaveBeenCalledWith('auth.errors.rollbackFailed', expect.any(Error));
    expect(action.payload).toBe('auth.errors.registerProfileSaveFailed');
    logError.mockRestore();

    authService.registerWithEmail.mockRejectedValueOnce({});
    action = await registerUser({
      name: 'Player',
      age: 20,
      country: 'India',
      email: user.email,
      password: 'secret',
    })(jest.fn(), () => ({}), undefined);
    expect(action.payload).toBe('auth.errors.registerFailed');
  });

  test('supports Google sign-in and handles profile, listener, and logout failures', async () => {
    const { loginWithGoogleUser, startAuthListener, logoutUser, authService, firestoreService } = loadModule();
    const user = { uid: 'user-3', email: 'google@example.com', displayName: 'Google User' };
    authService.loginWithGoogle.mockResolvedValue(user);
    firestoreService.upsertUserProfile.mockRejectedValueOnce({ code: 'permission-denied' });
    firestoreService.getUserProfile.mockResolvedValueOnce(null);

    let action = await loginWithGoogleUser()(jest.fn(), () => ({}), undefined);
    expect(action.payload).toEqual({ uid: user.uid, email: user.email, displayName: user.displayName });

    const unnamedUser = { uid: 'user-3', email: 'google@example.com' };
    authService.loginWithGoogle.mockResolvedValueOnce(unnamedUser);
    firestoreService.upsertUserProfile.mockResolvedValueOnce(undefined);
    firestoreService.getUserProfile.mockResolvedValueOnce(null);
    action = await loginWithGoogleUser()(jest.fn(), () => ({}), undefined);
    expect(action.payload.displayName).toBe('');

    firestoreService.upsertUserProfile.mockRejectedValueOnce(new Error('profile write failed'));
    action = await loginWithGoogleUser()(jest.fn(), () => ({}), undefined);
    expect(action.payload).toBe('profile write failed');

    firestoreService.upsertUserProfile.mockResolvedValue(undefined);
    firestoreService.getUserProfile.mockRejectedValueOnce(new Error('profile read failed'));
    action = await loginWithGoogleUser()(jest.fn(), () => ({}), undefined);
    expect(action.payload).toBe('profile read failed');

    authService.loginWithGoogle.mockRejectedValueOnce({});
    action = await loginWithGoogleUser()(jest.fn(), () => ({}), undefined);
    expect(action.payload).toBe('auth.errors.googleSignInFailed');

    const unsubscribe = jest.fn();
    authService.subscribeToAuth.mockImplementation((onChange) => {
      Promise.resolve().then(() => onChange(null));
      return unsubscribe;
    });
    action = await startAuthListener()(jest.fn(), () => ({}), undefined);
    expect(action.payload).toBeNull();
    expect(unsubscribe).toHaveBeenCalledTimes(1);

    authService.subscribeToAuth.mockImplementation(() => {
      throw new Error('subscription failed');
    });
    action = await startAuthListener()(jest.fn(), () => ({}), undefined);
    expect(action.payload).toBe('subscription failed');

    authService.subscribeToAuth.mockImplementation(() => {
      throw {};
    });
    action = await startAuthListener()(jest.fn(), () => ({}), undefined);
    expect(action.payload).toBe('auth.errors.sessionStartFailed');

    authService.logout.mockResolvedValue(undefined);
    action = await logoutUser()(jest.fn(), () => ({}), undefined);
    expect(action.payload).toBe(true);
    authService.logout.mockRejectedValueOnce({});
    action = await logoutUser()(jest.fn(), () => ({}), undefined);
    expect(action.payload).toBe('auth.errors.logoutFailed');
  });
});
