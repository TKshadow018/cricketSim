import { getPhase, summarizeMatch } from '../../../../scripts/calibration/cricsheetData.cjs';
import { bootstrapIntervals, summarizeMetrics } from '../../../../scripts/calibration/statistics.cjs';
import { summarizeSimulation } from '../../../../scripts/calibration/simulationMetrics.cjs';

const delivery = (batter, extras = {}, wickets = []) => ({
  runs: { batter, extras: Object.values(extras).reduce((sum, value) => sum + value, 0), total: batter + Object.values(extras).reduce((sum, value) => sum + value, 0) },
  ...(Object.keys(extras).length ? { extras } : {}),
  ...(wickets.length ? { wickets: wickets.map((kind) => ({ kind })) } : {}),
});

test('Cricsheet aggregation keeps legal balls, extras, dismissals and Super Overs separate', () => {
  const match = {
    info: { dates: ['2021-06-01'], match_type: 'T20', outcome: { winner: 'A' } },
    innings: [
      { team: 'A', overs: [{ over: 0, deliveries: [
        delivery(0), delivery(1), delivery(2, { noballs: 1 }), delivery(0, { wides: 2 }),
        delivery(0, { byes: 1 }), delivery(0, {}, ['caught']),
      ] }] },
      { team: 'B', super_over: true, overs: [{ over: 0, deliveries: [delivery(6)] }] },
    ],
  };
  const summary = summarizeMatch(match, 't20');
  expect(summary).toMatchObject({
    year: 2021,
    attempts: 6,
    legal: 4,
    runs: 7,
    wickets: 1,
    wides: 1,
    noBalls: 1,
    byes: 1,
    outcomes: { 0: 2, 1: 1, 2: 0, 3: 0, 4: 0, 6: 0, wide: 1, nb: 1, W: 1, other: 0 },
  });
  expect(summary.phases.powerplay.legal).toBe(4);
  expect(summary.extraDetails).toMatchObject({
    wideRuns: { 2: 1 },
    noBallBatRuns: { 2: 1 },
    legalByeRuns: { 1: 1 },
  });
});

test('formats, no-result matches and phase boundaries are handled explicitly', () => {
  expect(summarizeMatch({ info: { dates: ['2021-01-01'], match_type: 'T20', outcome: { result: 'no result' } }, innings: [] }, 't20')).toBeNull();
  expect(getPhase('t20', 5)).toBe('powerplay');
  expect(getPhase('t20', 6)).toBe('middle');
  expect(getPhase('t20', 16)).toBe('death');
  expect(getPhase('odi', 9)).toBe('powerplay');
  expect(getPhase('odi', 10)).toBe('middle');
  expect(getPhase('odi', 40)).toBe('death');
  expect(getPhase('test', 10)).toBe('established');
});

test('match-level bootstrap intervals are deterministic and use legal-ball denominators', () => {
  const makeSummary = (score) => summarizeMatch({
    info: { dates: ['2021-01-01'], match_type: 'T20', outcome: { winner: 'A' } },
    innings: [{ team: 'A', overs: [{ over: 0, deliveries: [delivery(score), delivery(0, { wides: 1 })] }] }],
  }, 't20');
  const matches = [makeSummary(0), makeSummary(4)];
  expect(summarizeMetrics(matches)).toMatchObject({ matches: 2, legal: 2, runsPerLegalBall: 3 });
  const first = bootstrapIntervals(matches, { seed: 7, repetitions: 50 });
  expect(bootstrapIntervals(matches, { seed: 7, repetitions: 50 })).toEqual(first);
  expect(first.runsPerLegalBall.lower).toBeLessThanOrEqual(3);
  expect(first.runsPerLegalBall.upper).toBeGreaterThanOrEqual(3);
});

test('simulator events use the same definitions as historical data', () => {
  const result = {
    firstInnings: { deliveryEvents: [
      { overNumber: 1, token: 'nb', runs: 4, extras: 1, isLegalDelivery: false, extraBreakdown: { noBall: 1 } },
      { overNumber: 1, token: 'bye', runs: 0, extras: 1, isLegalDelivery: true, extraBreakdown: { bye: 1 } },
    ] },
    secondInnings: { deliveryEvents: [
      { overNumber: 1, token: 'W', runs: 0, extras: 0, isLegalDelivery: true, isWicket: true, dismissal: { type: 'runOut' } },
    ] },
  };
  expect(summarizeSimulation(result, 't20')).toMatchObject({
    attempts: 3, legal: 2, runs: 6, wickets: 1, noBalls: 1, byes: 1,
  });
});
