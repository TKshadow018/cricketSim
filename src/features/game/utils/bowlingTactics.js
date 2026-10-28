import { bowlingAction } from '../../../gameData/actionType';

export const DEFAULT_BOWLING_TACTICS = {
  overPlan: 'balanced',
  fieldPreset: 'balanced',
  line: 'stumps',
  length: 'good',
  variation: 'stock',
  specialDeliveryArmed: false,
};

export const BOWLING_OVER_PLANS = [
  { key: 'balanced', label: 'Balanced', description: 'Use the standard skill and condition matchup.' },
  { key: 'attack', label: 'Attack', description: 'Raise wicket pressure and accept more scoring risk.' },
  { key: 'pressure', label: 'Build pressure', description: 'Prioritize dots and limit easy rotation.' },
  { key: 'contain', label: 'Protect boundaries', description: 'Guard the rope and accept some singles.' },
];

export const BOWLING_FIELD_PRESETS = [
  { key: 'balanced', label: 'Balanced field', shortLabel: 'Balanced' },
  { key: 'attacking', label: 'Attacking field', shortLabel: 'Attacking' },
  { key: 'boundary', label: 'Boundary field', shortLabel: 'Boundary' },
];

export const BOWLING_LINES = [
  { key: 'outside', label: 'Outside channel' },
  { key: 'stumps', label: 'At the stumps' },
  { key: 'body', label: 'Body line' },
];

export const BOWLING_LENGTHS = [
  { key: 'yorker', label: 'Yorker' },
  { key: 'full', label: 'Full' },
  { key: 'good', label: 'Good length' },
  { key: 'short', label: 'Short' },
];

const VALID_PLANS = new Set(BOWLING_OVER_PLANS.map(({ key }) => key));
const VALID_FIELDS = new Set(BOWLING_FIELD_PRESETS.map(({ key }) => key));
const VALID_LINES = new Set(BOWLING_LINES.map(({ key }) => key));
const VALID_LENGTHS = new Set(BOWLING_LENGTHS.map(({ key }) => key));
const VALID_VARIATIONS = new Set(['stock', 'slower', 'cutter', 'flighted', 'quicker']);

const planShifts = {
  balanced: {},
  attack: { 1: 1, 4: 2, 6: 1, nb: 1, W: 4 },
  pressure: { 1: -3, 2: -2, 3: -1, 4: -1, W: 1 },
  contain: { 1: 1, 4: -3, 6: -2, nb: -1, W: -1 },
};

const fieldShifts = {
  balanced: {},
  attacking: { 4: 1, 6: 1, W: 2 },
  boundary: { 1: 1, 4: -2, 6: -2, W: -1 },
};

const lineShifts = {
  outside: { 1: -1, 4: 1, wide: 1, W: 1 },
  stumps: {},
  body: { 1: 1, W: -1 },
};

const lengthShifts = {
  yorker: { 1: -1, 4: -1, 6: -1, nb: 1, W: 1 },
  full: { 4: 1, 6: 1, W: 1 },
  good: {},
  short: { 2: 1, 3: 1, 4: 1, 6: 1, W: 1 },
};

const variationShifts = {
  stock: {},
  slower: { 1: -1, 6: -1, nb: 1, W: 1 },
  cutter: { 2: -1, 4: -1, wide: 1, W: 1 },
  flighted: { 4: 1, 6: 1, W: 2 },
  quicker: { 4: -1, 6: -1, nb: 1, W: 1 },
};

const addShifts = (...shifts) =>
  shifts.reduce((result, shift) => {
    Object.entries(shift || {}).forEach(([outcome, value]) => {
      result[outcome] = (result[outcome] || 0) + value;
    });
    return result;
  }, {});

const isValidValue = (set, value) => typeof value === 'string' && set.has(value);

export const normalizeBowlingTactics = (value, fallback = DEFAULT_BOWLING_TACTICS) => {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const safeFallback =
    fallback && typeof fallback === 'object' && !Array.isArray(fallback)
      ? fallback
      : DEFAULT_BOWLING_TACTICS;

  return {
    overPlan: isValidValue(VALID_PLANS, source.overPlan)
      ? source.overPlan
      : isValidValue(VALID_PLANS, safeFallback.overPlan)
        ? safeFallback.overPlan
        : DEFAULT_BOWLING_TACTICS.overPlan,
    fieldPreset: isValidValue(VALID_FIELDS, source.fieldPreset)
      ? source.fieldPreset
      : isValidValue(VALID_FIELDS, safeFallback.fieldPreset)
        ? safeFallback.fieldPreset
        : DEFAULT_BOWLING_TACTICS.fieldPreset,
    line: isValidValue(VALID_LINES, source.line)
      ? source.line
      : isValidValue(VALID_LINES, safeFallback.line)
        ? safeFallback.line
        : DEFAULT_BOWLING_TACTICS.line,
    length: isValidValue(VALID_LENGTHS, source.length)
      ? source.length
      : isValidValue(VALID_LENGTHS, safeFallback.length)
        ? safeFallback.length
        : DEFAULT_BOWLING_TACTICS.length,
    variation: isValidValue(VALID_VARIATIONS, source.variation)
      ? source.variation
      : isValidValue(VALID_VARIATIONS, safeFallback.variation)
        ? safeFallback.variation
        : DEFAULT_BOWLING_TACTICS.variation,
    specialDeliveryArmed: typeof source.specialDeliveryArmed === 'boolean'
      ? source.specialDeliveryArmed
      : typeof safeFallback.specialDeliveryArmed === 'boolean'
        ? safeFallback.specialDeliveryArmed
        : false,
  };
};

export const mergeBowlingTactics = (current, patch) => {
  const safeCurrent = normalizeBowlingTactics(current);
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    return safeCurrent;
  }
  return normalizeBowlingTactics({ ...safeCurrent, ...patch }, safeCurrent);
};

export const migrateLegacyBowlingTactics = (intent) => {
  const overPlan = intent === bowlingAction.tryForWicket
    ? 'attack'
    : intent === bowlingAction.saveRun
      ? 'contain'
      : 'balanced';

  return { ...DEFAULT_BOWLING_TACTICS, overPlan };
};

export const getLegacyBowlingIntent = (overPlan = 'balanced') => {
  if (overPlan === 'attack') return bowlingAction.tryForWicket;
  if (overPlan === 'contain') return bowlingAction.saveRun;
  return bowlingAction.normal;
};

export const getAvailableBowlingVariations = (bowler = {}) => {
  const pace = Number(bowler?.paceAbility) || 0;
  const spin = Number(bowler?.spinAbility) || 0;
  if (pace === spin) {
    return [{ key: 'stock', label: 'Stock delivery' }];
  }

  if (pace > spin) {
    return [
      { key: 'stock', label: 'Stock delivery' },
      { key: 'slower', label: 'Slower ball' },
      { key: 'cutter', label: 'Cutter' },
    ];
  }

  return [
    { key: 'stock', label: 'Stock delivery' },
    { key: 'flighted', label: 'Flighted ball' },
    { key: 'quicker', label: 'Quicker ball' },
  ];
};

export const getEffectiveBowlingVariation = (input, bowler) => {
  const tactics = normalizeBowlingTactics(input);
  const isAvailable = getAvailableBowlingVariations(bowler)
    .some(({ key }) => key === tactics.variation);
  return isAvailable ? tactics.variation : 'stock';
};

export const getBowlingTacticShift = (input, bowler) => {
  const tactics = normalizeBowlingTactics(input);
  const variation = getEffectiveBowlingVariation(tactics, bowler);

  return addShifts(
    planShifts[tactics.overPlan],
    fieldShifts[tactics.fieldPreset],
    lineShifts[tactics.line],
    lengthShifts[tactics.length],
    variationShifts[variation]
  );
};
