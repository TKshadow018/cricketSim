import { battingAction } from '../../../gameData/actionType';

export const DEFAULT_BATTING_TACTICS = {
  approach: 'balanced',
  shot: 'rotate',
  target: 'straight',
  retainShotAndTarget: false,
};

export const BATTING_APPROACHES = [
  { key: 'defend', label: 'Defend', description: 'Value your wicket and take fewer risks.' },
  { key: 'balanced', label: 'Balanced', description: 'Play the ball on its merit.' },
  { key: 'attack', label: 'Attack', description: 'Look for boundaries and accept extra risk.' },
];

export const BATTING_SHOTS = [
  { key: 'leave', label: 'Leave / defend', description: 'Prioritize survival and play late.' },
  { key: 'rotate', label: 'Rotate strike', description: 'Work the ball into low-risk scoring.' },
  { key: 'drive', label: 'Drive', description: 'Commit to a front-foot scoring option.' },
  { key: 'cutPull', label: 'Cut / pull', description: 'Attack width or short length.' },
  { key: 'loft', label: 'Loft', description: 'Clear the infield with the highest risk.' },
];

export const BATTING_TARGETS = [
  { key: 'thirdMan', label: 'Third man' },
  { key: 'point', label: 'Point' },
  { key: 'cover', label: 'Cover' },
  { key: 'midOff', label: 'Mid-off' },
  { key: 'straight', label: 'Straight' },
  { key: 'midOn', label: 'Mid-on' },
  { key: 'midWicket', label: 'Midwicket' },
  { key: 'squareLeg', label: 'Square leg' },
  { key: 'fineLeg', label: 'Fine leg' },
];

const VALID_APPROACHES = new Set(BATTING_APPROACHES.map(({ key }) => key));
const VALID_SHOTS = new Set(BATTING_SHOTS.map(({ key }) => key));
const VALID_TARGETS = new Set(BATTING_TARGETS.map(({ key }) => key));
const VALID_BOWLING_LINES = new Set(['outside', 'stumps', 'body']);
const LEGACY_TARGETS = { off: 'cover', leg: 'midWicket' };

const approachShifts = {
  defend: { 0: 15, 1: -4, 2: -2, 3: -1, 4: -4, 6: -2, W: -2 },
  balanced: {},
  attack: { 0: -10, 1: 4, 2: 1, 3: 1, 4: 2, 6: 1, W: 1 },
};

const shotShifts = {
  leave: { 0: 8, 1: -2, 2: -1, 4: -3, 6: -1, W: -1 },
  rotate: {},
  drive: { 0: -5, 1: 1, 2: 1, 4: 4, W: -1 },
  cutPull: { 0: -5, 1: 1, 2: 1, 4: 1, 6: 3, W: -1 },
  loft: { 0: -10, 1: 1, 2: 1, 4: 3, 6: 3, W: 2 },
};

const targetShifts = {
  thirdMan: { 0: -1, 1: 1 },
  point: { 0: -2, 1: 1, 2: 1 },
  cover: { 0: -4, 1: 1, 4: 3 },
  midOff: { 0: -2, 1: 2 },
  straight: {},
  midOn: { 0: -1, 2: 1 },
  midWicket: { 0: -4, 1: 1, 2: 1, 6: 2 },
  squareLeg: { 0: -3, 1: 1, 2: 2 },
  fineLeg: { 0: -2, 3: 2 },
};

const targetLineBySector = {
  thirdMan: 'outside',
  point: 'outside',
  cover: 'outside',
  midOff: 'outside',
  straight: 'stumps',
  midOn: 'body',
  midWicket: 'body',
  squareLeg: 'body',
  fineLeg: 'body',
};

const addShifts = (...shifts) =>
  shifts.reduce((result, shift) => {
    Object.entries(shift || {}).forEach(([outcome, value]) => {
      result[outcome] = (result[outcome] || 0) + value;
    });
    return result;
  }, {});

const isValidValue = (set, value) => typeof value === 'string' && set.has(value);

const resolveValue = (set, source, fallback, defaultValue) => {
  if (isValidValue(set, source)) return source;
  if (isValidValue(set, fallback)) return fallback;
  return defaultValue;
};

const normalizeTargetKey = (source, fallback) => {
  const resolveTarget = (value) => {
    const key = LEGACY_TARGETS[value] || value;
    return VALID_TARGETS.has(key) ? key : null;
  };

  return resolveTarget(source) || resolveTarget(fallback) || DEFAULT_BATTING_TACTICS.target;
};

export const getBattingTarget = (value) => {
  const key = normalizeTargetKey(value);
  return BATTING_TARGETS.find((target) => target.key === key);
};

export const normalizeBattingTactics = (value, fallback = DEFAULT_BATTING_TACTICS) => {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const safeFallback =
    fallback && typeof fallback === 'object' && !Array.isArray(fallback)
      ? fallback
      : DEFAULT_BATTING_TACTICS;

  return {
    approach: resolveValue(VALID_APPROACHES, source.approach, safeFallback.approach, DEFAULT_BATTING_TACTICS.approach),
    shot: resolveValue(VALID_SHOTS, source.shot, safeFallback.shot, DEFAULT_BATTING_TACTICS.shot),
    target: normalizeTargetKey(source.target, safeFallback.target),
    retainShotAndTarget: typeof source.retainShotAndTarget === 'boolean'
      ? source.retainShotAndTarget
      : typeof safeFallback.retainShotAndTarget === 'boolean'
        ? safeFallback.retainShotAndTarget
        : DEFAULT_BATTING_TACTICS.retainShotAndTarget,
  };
};

export const mergeBattingTactics = (current, patch) => {
  const safeCurrent = normalizeBattingTactics(current);
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    return safeCurrent;
  }
  return normalizeBattingTactics({ ...safeCurrent, ...patch }, safeCurrent);
};

export const migrateLegacyBattingTactics = (intent) => {
  const approach = intent === battingAction.defence
    ? 'defend'
    : intent === battingAction.hitBig
      ? 'attack'
      : 'balanced';

  return { ...DEFAULT_BATTING_TACTICS, approach };
};

export const getBattingTacticsResetPatch = (
  input,
  { wasFreeHit = false, freeHitArmed = false, newBatterAtStrike = false, resetAll = false } = {}
) => {
  const tactics = normalizeBattingTactics(input);
  if (resetAll) {
    return { ...DEFAULT_BATTING_TACTICS };
  }

  const shouldResetShot = !tactics.retainShotAndTarget || wasFreeHit || freeHitArmed || newBatterAtStrike;
  if (
    !shouldResetShot ||
    (tactics.shot === DEFAULT_BATTING_TACTICS.shot && tactics.target === DEFAULT_BATTING_TACTICS.target)
  ) {
    return null;
  }

  return {
    shot: DEFAULT_BATTING_TACTICS.shot,
    target: DEFAULT_BATTING_TACTICS.target,
  };
};

export const getBattingTacticShift = (input, bowlingTactics) => {
  const tactics = normalizeBattingTactics(input);
  const bowlingLine = bowlingTactics?.line;
  const hasBowlingLine = VALID_BOWLING_LINES.has(bowlingLine);
  const isDefaultLineAndTarget = tactics.target === 'straight' && bowlingLine === 'stumps';
  const lineMatchesTarget = bowlingLine === targetLineBySector[tactics.target];
  const lineTargetShift = !hasBowlingLine || isDefaultLineAndTarget
    ? {}
    : lineMatchesTarget
      ? { 0: 1, 1: -1, 4: -1, W: 1 }
      : { 0: -1, 1: 1 };
  const yorkerAgainstLoft = bowlingTactics?.length === 'yorker' && tactics.shot === 'loft'
    ? { 0: 1, 4: -1, 6: -1, W: 1 }
    : {};
  const boundaryFieldAgainstSideTarget =
    bowlingTactics?.fieldPreset === 'boundary' && tactics.target !== 'straight'
      ? { 0: 1, 4: -1 }
      : {};

  return addShifts(
    approachShifts[tactics.approach],
    shotShifts[tactics.shot],
    targetShifts[tactics.target],
    lineTargetShift,
    yorkerAgainstLoft,
    boundaryFieldAgainstSideTarget
  );
};
