const t20 = {
  opening: { 0: 44.525, 1: 24.626, 2: 5.019, 3: 0.583, 4: 12.54, 6: 3.184, wide: 4.502, nb: 0.462, W: 4.528 },
  middle: { 0: 31.709, 1: 40.86, 2: 7.311, 3: 0.345, 4: 7.234, 6: 3.988, wide: 3.18, nb: 0.351, W: 5.013 },
  death: { 0: 24.44, 1: 34.475, 2: 10.211, 3: 0.475, 4: 9.673, 6: 6.37, wide: 4.208, nb: 0.674, W: 9.465 },
};
const odi = {
  opening: { 0: 62.451, 1: 16.48, 2: 3.892, 3: 0.866, 4: 9.946, 6: 1.038, wide: 2.719, nb: 0.271, W: 2.319 },
  middle: { 0: 48.544, 1: 34.161, 2: 4.695, 3: 0.421, 4: 6.464, 6: 1.385, wide: 1.879, nb: 0.166, W: 2.276 },
  death: { 0: 32.516, 1: 38.188, 2: 7.878, 3: 0.379, 4: 8.337, 6: 3.725, wide: 3.167, nb: 0.391, W: 5.413 },
};
const test = {
  opening: { 0: 76.935, 1: 9.87, 2: 3.553, 3: 1.076, 4: 5.992, 6: 0.131, wide: 0.156, nb: 0.517, W: 1.752 },
  middle: { 0: 71.548, 1: 15.415, 2: 3.538, 3: 0.851, 4: 5.836, 6: 0.464, wide: 0.206, nb: 0.41, W: 1.714 },
};

const profiles = {
  t20: {
    dotCount: 117855,
    wideRuns: { 1: 11631, 2: 673, 3: 132, 4: 23, 5: 379 },
    noBallBatRuns: { 0: 687, 1: 400, 2: 109, 3: 3, 4: 203, 6: 93 },
    byeRuns: { 1: 910, 2: 139, 3: 15, 4: 317, 5: 2 },
    legByeRuns: { 1: 4236, 2: 325, 3: 29, 4: 322, 5: 4 },
    wideDismissals: { runOut: 18, stumped: 38, hitWicket: 1 },
    noBallRunOuts: 8,
  },
  odi: {
    dotCount: 210232,
    wideRuns: { 1: 8925, 2: 257, 3: 92, 4: 19, 5: 319 },
    noBallBatRuns: { 0: 478, 1: 262, 2: 50, 3: 8, 4: 107, 6: 44 },
    byeRuns: { 1: 384, 2: 84, 3: 24, 4: 186 },
    legByeRuns: { 1: 2990, 2: 336, 3: 24, 4: 328, 5: 1 },
    wideDismissals: { runOut: 10, stumped: 23 },
    noBallRunOuts: 3,
  },
  test: {
    dotCount: 431565,
    wideRuns: { 1: 1021, 2: 21, 3: 8, 5: 149 },
    noBallBatRuns: { 0: 1910, 1: 359, 2: 79, 3: 21, 4: 154, 6: 6 },
    byeRuns: { 1: 562, 2: 229, 3: 46, 4: 900 },
    legByeRuns: { 1: 2519, 2: 362, 3: 39, 4: 576, 5: 3 },
    wideDismissals: { stumped: 1 },
    noBallRunOuts: 2,
  },
};

const resolveFormat = (key) => {
  const format = String(key || '').toLowerCase();
  if (['test', 'practicetestmicro', 'practicetestmini', 'firstclass'].includes(format)) return 'test';
  if (format === 'odi') return 'odi';
  if (['t20', 't10', 'mini', 'micro'].includes(format)) return 't20';
  throw new Error(`Unsupported realism format: ${key}`);
};

const interpolate = (first, second, progress) => {
  const amount = Math.max(0, Math.min(1, progress));
  return Object.fromEntries(Object.keys(first).map((key) => [
    key, first[key] + (second[key] - first[key]) * amount,
  ]));
};

export const getRealismBaseWeights = (matchTypeKey, balls, matchType = {}) => {
  const format = resolveFormat(matchTypeKey);
  if (['micro', 'mini', 't10'].includes(String(matchTypeKey).toLowerCase())) return null;
  const over = Math.max(0, Number(balls) || 0) / 6;
  const tables = format === 'odi' ? odi : format === 'test' ? test : t20;
  if (matchType.isSuperOver && tables.death) return { ...tables.death };
  const firstTransition = format === 't20' ? 6 : 10;
  if (over < firstTransition + 1) return interpolate(tables.opening, tables.middle, (over - firstTransition + 1) / 2);
  if (!tables.death) return { ...tables.middle };
  const secondTransition = format === 't20' ? 16 : 40;
  return interpolate(tables.middle, tables.death, (over - secondTransition + 1) / 2);
};

export const getRealismExtrasProfile = (matchTypeKey) => profiles[resolveFormat(matchTypeKey)];
