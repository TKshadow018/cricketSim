import { isDebugMode } from '../config/runtimeConfig';

const truthyValues = new Set(['1', 'true', 'yes', 'on']);
const isDebugModeAliasEnabled =
  process.env.NODE_ENV !== 'production' &&
  truthyValues.has((process.env.REACT_APP_DEBUG_MODE || '').trim().toLowerCase());

export const isDebugAuthBypassEnabled = isDebugMode || isDebugModeAliasEnabled;
