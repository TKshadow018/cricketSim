const { sumCounts } = require('./cricsheetData.cjs');
const { createSeededRandom } = require('../../src/features/game/utils/seededRandomCore.js');

const metricNames = [
  'runsPerLegalBall',
  'dotsPer100Legal',
  'boundariesPer100Legal',
  'wicketsPer100Legal',
  'widesPer100Attempts',
  'noBallsPer100Attempts',
];

const metricsFromCounts = (counts) => {
  if (!counts.legal || !counts.attempts) throw new Error('Metrics require deliveries and legal balls.');
  return {
    runsPerLegalBall: counts.runs / counts.legal,
    dotsPer100Legal: counts.dots * 100 / counts.legal,
    boundariesPer100Legal: counts.boundaries * 100 / counts.legal,
    wicketsPer100Legal: counts.wickets * 100 / counts.legal,
    widesPer100Attempts: counts.wides * 100 / counts.attempts,
    noBallsPer100Attempts: counts.noBalls * 100 / counts.attempts,
  };
};

const summarizeMetrics = (matches) => {
  if (!matches.length) throw new Error('At least one match is required.');
  const counts = sumCounts(matches);
  const scores = matches.flatMap((match) => match.inningsScores || []);
  const firstScores = matches.map((match) => match.inningsScores?.[0]).filter(Number.isFinite);
  const phaseNames = [...new Set(matches.flatMap((match) => Object.keys(match.phases || {})))];
  return {
    matches: matches.length,
    innings: scores.length,
    legal: counts.legal,
    attempts: counts.attempts,
    ...metricsFromCounts(counts),
    meanInningsScore: scores.reduce((sum, score) => sum + score, 0) / scores.length,
    meanFirstInningsScore: firstScores.reduce((sum, score) => sum + score, 0) / firstScores.length,
    phases: Object.fromEntries(phaseNames.map((name) => {
      const phaseCounts = sumCounts(matches.map((match) => match.phases[name]).filter(Boolean));
      return [name, { legal: phaseCounts.legal, ...metricsFromCounts(phaseCounts) }];
    })),
  };
};

const bootstrapIntervals = (matches, { seed = 41, repetitions = 400 } = {}) => {
  if (!matches.length || !Number.isInteger(repetitions) || repetitions < 1) {
    throw new Error('Bootstrap sampling requires matches and a positive repetition count.');
  }
  const random = createSeededRandom(seed).next;
  const samples = Object.fromEntries(metricNames.map((name) => [name, []]));
  for (let iteration = 0; iteration < repetitions; iteration += 1) {
    const totals = { attempts: 0, legal: 0, runs: 0, wickets: 0, dots: 0, boundaries: 0, wides: 0, noBalls: 0 };
    for (let index = 0; index < matches.length; index += 1) {
      const match = matches[Math.floor(random() * matches.length)];
      Object.keys(totals).forEach((key) => { totals[key] += match[key]; });
    }
    const metrics = metricsFromCounts(totals);
    metricNames.forEach((name) => samples[name].push(metrics[name]));
  }
  return Object.fromEntries(metricNames.map((name) => {
    const values = samples[name].sort((a, b) => a - b);
    return [name, {
      lower: values[Math.floor((values.length - 1) * 0.025)],
      upper: values[Math.ceil((values.length - 1) * 0.975)],
    }];
  }));
};

module.exports = { summarizeMetrics, bootstrapIntervals };
