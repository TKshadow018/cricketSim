const originalEnv = {
  nodeEnv: process.env.NODE_ENV,
  alias: process.env.REACT_APP_DEBUG_MODE,
};

describe('runtime flags', () => {
  afterEach(() => {
    jest.resetModules();
    if (originalEnv.nodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalEnv.nodeEnv;
    if (originalEnv.alias === undefined) delete process.env.REACT_APP_DEBUG_MODE;
    else process.env.REACT_APP_DEBUG_MODE = originalEnv.alias;
  });

  test('accepts normalized debug aliases outside production', () => {
    process.env.NODE_ENV = 'test';
    process.env.REACT_APP_DEBUG_MODE = ' ON ';
    jest.resetModules();
    jest.doMock('../config/runtimeConfig', () => ({ isDebugMode: false }));
    expect(require('./runtimeFlags').isDebugAuthBypassEnabled).toBe(true);
  });

  test('rejects unrecognized aliases outside production when the primary flag is off', () => {
    process.env.NODE_ENV = 'test';
    delete process.env.REACT_APP_DEBUG_MODE;
    jest.resetModules();
    jest.doMock('../config/runtimeConfig', () => ({ isDebugMode: false }));
    expect(require('./runtimeFlags').isDebugAuthBypassEnabled).toBe(false);

    process.env.REACT_APP_DEBUG_MODE = 'enabled';
    jest.resetModules();
    jest.doMock('../config/runtimeConfig', () => ({ isDebugMode: false }));
    expect(require('./runtimeFlags').isDebugAuthBypassEnabled).toBe(false);
  });

  test('does not enable the alias in production and honors the primary debug flag', () => {
    process.env.NODE_ENV = 'production';
    process.env.REACT_APP_DEBUG_MODE = 'true';
    jest.resetModules();
    jest.doMock('../config/runtimeConfig', () => ({ isDebugMode: false }));
    expect(require('./runtimeFlags').isDebugAuthBypassEnabled).toBe(false);

    jest.resetModules();
    jest.doMock('../config/runtimeConfig', () => ({ isDebugMode: true }));
    expect(require('./runtimeFlags').isDebugAuthBypassEnabled).toBe(true);
  });
});
