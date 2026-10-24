const originalDebug = process.env.REACT_APP_DEBUG;
const originalDebugAlias = process.env.REACT_APP_DEBUG_MODE;
const originalApiKey = process.env.REACT_APP_FIREBASE_API_KEY;
const originalProjectId = process.env.REACT_APP_FIREBASE_PROJECT_ID;
const originalAppId = process.env.REACT_APP_FIREBASE_APP_ID;

const mockFirebase = () => {
  jest.doMock('firebase/app', () => ({
    initializeApp: jest.fn(() => ({ name: 'test-app' })),
  }));
  jest.doMock('firebase/analytics', () => ({
    getAnalytics: jest.fn(),
    isSupported: jest.fn(() => Promise.resolve(false)),
  }));
  jest.doMock('firebase/auth', () => ({
    getAuth: jest.fn(() => ({ name: 'test-auth' })),
  }));
  jest.doMock('firebase/firestore', () => ({
    getFirestore: jest.fn(() => ({ name: 'test-db' })),
  }));
};

describe('Firebase configuration', () => {
  beforeEach(() => {
    jest.resetModules();
    delete process.env.REACT_APP_FIREBASE_API_KEY;
    delete process.env.REACT_APP_DEBUG_MODE;
    process.env.REACT_APP_DEBUG = 'true';
    mockFirebase();
  });

  afterEach(() => {
    [
      ['REACT_APP_DEBUG', originalDebug],
      ['REACT_APP_DEBUG_MODE', originalDebugAlias],
      ['REACT_APP_FIREBASE_API_KEY', originalApiKey],
      ['REACT_APP_FIREBASE_PROJECT_ID', originalProjectId],
      ['REACT_APP_FIREBASE_APP_ID', originalAppId],
    ].forEach(([key, value]) => {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });
  });

  test('skips Firebase initialization without credentials in debug mode', () => {
    const { initializeApp } = require('firebase/app');
    const { getAuth } = require('firebase/auth');
    const { getFirestore } = require('firebase/firestore');
    const config = require('./config');

    expect(initializeApp).not.toHaveBeenCalled();
    expect(getAuth).not.toHaveBeenCalled();
    expect(getFirestore).not.toHaveBeenCalled();
    expect(config.auth).toBeNull();
    expect(config.db).toBeNull();
  });

  test('supports the legacy debug flag when Firebase credentials are absent', () => {
    process.env.REACT_APP_DEBUG = '';
    process.env.REACT_APP_DEBUG_MODE = 'true';

    const { initializeApp } = require('firebase/app');
    const config = require('./config');

    expect(initializeApp).not.toHaveBeenCalled();
    expect(config.auth).toBeNull();
    expect(config.db).toBeNull();
  });

  test('initializes Firebase when debug mode is disabled and credentials are present', () => {
    process.env.REACT_APP_DEBUG = 'false';
    process.env.REACT_APP_FIREBASE_API_KEY = 'test-api-key';
    process.env.REACT_APP_FIREBASE_PROJECT_ID = 'test-project';
    process.env.REACT_APP_FIREBASE_APP_ID = 'test-app-id';

    const { initializeApp } = require('firebase/app');
    const { getAuth } = require('firebase/auth');
    const { getFirestore } = require('firebase/firestore');
    const config = require('./config');

    expect(initializeApp).toHaveBeenCalledTimes(1);
    expect(getAuth).toHaveBeenCalledTimes(1);
    expect(getFirestore).toHaveBeenCalledTimes(1);
    expect(config.auth).toEqual({ name: 'test-auth' });
    expect(config.db).toEqual({ name: 'test-db' });
  });
});
