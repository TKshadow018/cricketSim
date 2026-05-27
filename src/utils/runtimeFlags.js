const truthyValues = new Set(['1', 'true', 'yes', 'on']);

export const isDebugAuthBypassEnabled = truthyValues.has(
  (process.env.REACT_APP_DEBUG_MODE || '').trim().toLowerCase()
);
