jest.mock('firebase/app', () => ({ initializeApp: jest.fn(() => ({ name: 'app' })) }));
jest.mock('firebase/analytics', () => ({
  getAnalytics: jest.fn(() => ({ name: 'analytics' })),
  isSupported: jest.fn(),
}));
jest.mock('firebase/auth', () => ({ getAuth: jest.fn(() => ({ name: 'auth' })) }));
jest.mock('firebase/firestore', () => ({ getFirestore: jest.fn(() => ({ name: 'firestore' })) }));

const firebaseEnvKeys = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_APP_ID',
  'REACT_APP_FIREBASE_MEASUREMENT_ID',
];
const originalEnv = Object.fromEntries(firebaseEnvKeys.map((key) => [key, process.env[key]]));

describe('firebase config initialization', () => {
  beforeEach(() => {
    jest.resetModules();
    firebaseEnvKeys.forEach((key) => delete process.env[key]);
    jest.doMock('../config/runtimeConfig', () => ({ isDebugMode: false }));
    jest.requireMock('firebase/app').initializeApp.mockReturnValue({ name: 'app' });
    jest.requireMock('firebase/analytics').getAnalytics.mockReturnValue({ name: 'analytics' });
    jest.requireMock('firebase/auth').getAuth.mockReturnValue({ name: 'auth' });
    jest.requireMock('firebase/firestore').getFirestore.mockReturnValue({ name: 'firestore' });
  });

  afterAll(() => {
    firebaseEnvKeys.forEach((key) => {
      if (originalEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalEnv[key];
      }
    });
  });

  test('trims environment config, uses defaults, and enables analytics when supported', async () => {
    process.env.REACT_APP_FIREBASE_API_KEY = '  test-api-key  ';
    process.env.REACT_APP_FIREBASE_AUTH_DOMAIN = '  auth.example.test ';
    const analyticsSdk = jest.requireMock('firebase/analytics');
    analyticsSdk.isSupported.mockResolvedValue(true);

    const config = require('./config');
    await Promise.resolve();

    const appConfig = jest.requireMock('firebase/app').initializeApp.mock.calls[0][0];
    expect(appConfig.apiKey).toBe('test-api-key');
    expect(appConfig.authDomain).toBe('auth.example.test');
    expect(appConfig.projectId).toBe('cricketsim-6b8de');
    expect(appConfig.appId).toBe('1:992325580149:web:1413ba6281dbed12d3cf3c');
    expect(config.auth).toEqual({ name: 'auth' });
    expect(config.db).toEqual({ name: 'firestore' });
    expect(analyticsSdk.getAnalytics).toHaveBeenCalledWith({ name: 'app' });
  });

  test('reports incomplete required config and skips unsupported analytics', async () => {
    const logError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const analyticsSdk = jest.requireMock('firebase/analytics');
    analyticsSdk.isSupported.mockResolvedValue(false);

    require('./config');
    await Promise.resolve();

    expect(logError).toHaveBeenCalledWith('Firebase config is incomplete. Check your .env values.');
    expect(analyticsSdk.getAnalytics).not.toHaveBeenCalled();
    logError.mockRestore();
  });

  test('does not report missing Firebase credentials in debug mode', async () => {
    jest.doMock('../config/runtimeConfig', () => ({ isDebugMode: true }));
    const logError = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.requireMock('firebase/analytics').isSupported.mockResolvedValue(false);

    require('./config');
    await Promise.resolve();

    expect(logError).not.toHaveBeenCalled();
    logError.mockRestore();
  });

  test('initializes auth without touching analytics outside a browser', () => {
    const windowDescriptor = Object.getOwnPropertyDescriptor(global, 'window');
    delete global.window;
    try {
      const analyticsSdk = jest.requireMock('firebase/analytics');
      require('./config');
      expect(analyticsSdk.isSupported).not.toHaveBeenCalled();
    } finally {
      if (windowDescriptor) {
        Object.defineProperty(global, 'window', windowDescriptor);
      }
    }
  });
});
