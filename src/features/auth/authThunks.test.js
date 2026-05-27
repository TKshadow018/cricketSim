describe('authThunks', () => {
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
    delete process.env.REACT_APP_DEBUG;
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

  test('logoutUser keeps the debug user available in debug mode', async () => {
    process.env.REACT_APP_DEBUG = 'true';
    const { logoutUser, authService } = loadModule();

    const action = await logoutUser()(jest.fn(), () => ({}), undefined);

    expect(action.type).toBe('auth/logoutUser/fulfilled');
    expect(action.payload).toMatchObject({
      uid: 'debug-local-user',
    });
    expect(authService.logout).not.toHaveBeenCalled();
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
});
