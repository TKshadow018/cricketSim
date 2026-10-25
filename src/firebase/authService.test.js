import {
  deleteRegisteredUser,
  loginWithEmail,
  loginWithGoogle,
  logout,
  registerWithEmail,
  subscribeToAuth,
} from './authService';

jest.mock('./config', () => ({ auth: { name: 'test-auth' } }));
jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  deleteUser: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
  updateProfile: jest.fn(),
}));

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns users from email and Google authentication and updates registration profiles', async () => {
    const authSdk = jest.requireMock('firebase/auth');
    const user = { uid: 'user-1', displayName: 'Coach' };
    authSdk.signInWithEmailAndPassword.mockResolvedValue({ user });
    authSdk.createUserWithEmailAndPassword.mockResolvedValue({ user });
    authSdk.signInWithPopup.mockResolvedValue({ user });

    await expect(loginWithEmail('coach@example.com', 'secret')).resolves.toBe(user);
    expect(authSdk.signInWithEmailAndPassword).toHaveBeenCalledWith(
      { name: 'test-auth' },
      'coach@example.com',
      'secret'
    );
    await expect(registerWithEmail('Coach', 'coach@example.com', 'secret')).resolves.toBe(user);
    expect(authSdk.updateProfile).toHaveBeenCalledWith(user, { displayName: 'Coach' });
    await expect(loginWithGoogle()).resolves.toBe(user);
    expect(authSdk.signInWithPopup).toHaveBeenCalledWith({ name: 'test-auth' }, expect.any(Object));
  });

  test('subscribes to auth, logs out, and deletes only supplied users', async () => {
    const authSdk = jest.requireMock('firebase/auth');
    const listener = jest.fn();
    const unsubscribe = jest.fn();
    authSdk.onAuthStateChanged.mockReturnValue(unsubscribe);
    expect(subscribeToAuth(listener)).toBe(unsubscribe);
    expect(authSdk.onAuthStateChanged).toHaveBeenCalledWith({ name: 'test-auth' }, listener);

    await logout();
    expect(authSdk.signOut).toHaveBeenCalledWith({ name: 'test-auth' });
    await deleteRegisteredUser(null);
    expect(authSdk.deleteUser).not.toHaveBeenCalled();
    const user = { uid: 'user-2' };
    await deleteRegisteredUser(user);
    expect(authSdk.deleteUser).toHaveBeenCalledWith(user);
  });
});
