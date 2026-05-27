const truthyValues = new Set(['1', 'true', 'yes', 'on']);
const isNonProduction = process.env.NODE_ENV !== 'production';

export const isDebugAuthBypassEnabled =
  isNonProduction && truthyValues.has((process.env.REACT_APP_DEBUG_MODE || '').trim().toLowerCase());
