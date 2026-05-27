const trueValues = new Set(['1', 'true', 'yes', 'on']);

export const readEnvFlagAsBoolean = (key) => trueValues.has((process.env[key] || '').trim().toLowerCase());

export const isDebugMode = readEnvFlagAsBoolean('REACT_APP_DEBUG');

export const debugAuthUser = {
  uid: 'debug-local-user',
  email: 'debug@cricketsim.local',
  displayName: 'Debug Mode',
};

export const getEffectiveAuthUser = (user) => (isDebugMode ? debugAuthUser : user);
