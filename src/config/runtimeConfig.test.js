const originalEnv = {
  nodeEnv: process.env.NODE_ENV,
  debug: process.env.REACT_APP_DEBUG,
};

describe('runtimeConfig', () => {
  afterEach(() => {
    jest.resetModules();
    if (originalEnv.nodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalEnv.nodeEnv;
    if (originalEnv.debug === undefined) delete process.env.REACT_APP_DEBUG;
    else process.env.REACT_APP_DEBUG = originalEnv.debug;
  });

  test('normalizes debug flags and uses the debug identity outside production', () => {
    process.env.NODE_ENV = 'test';
    process.env.REACT_APP_DEBUG = ' YES ';
    jest.resetModules();
    const { debugAuthUser, getEffectiveAuthUser, isDebugMode, readEnvFlagAsBoolean } = require('./runtimeConfig');
    expect(readEnvFlagAsBoolean('REACT_APP_DEBUG')).toBe(true);
    expect(isDebugMode).toBe(true);
    expect(getEffectiveAuthUser({ uid: 'real-user' })).toBe(debugAuthUser);
    process.env.REACT_APP_DEBUG = 'off';
    expect(readEnvFlagAsBoolean('REACT_APP_DEBUG')).toBe(false);
    expect(readEnvFlagAsBoolean('MISSING_RUNTIME_FLAG')).toBe(false);
  });

  test('preserves the real user in production even when a debug flag is set', () => {
    process.env.NODE_ENV = 'production';
    process.env.REACT_APP_DEBUG = 'true';
    jest.resetModules();
    const { getEffectiveAuthUser, isDebugMode } = require('./runtimeConfig');
    const user = { uid: 'real-user' };
    expect(isDebugMode).toBe(false);
    expect(getEffectiveAuthUser(user)).toBe(user);
  });
});
