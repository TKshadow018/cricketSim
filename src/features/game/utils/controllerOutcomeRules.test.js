import { buildOutcomeWeights, resolveOutcome } from './controllerOutcomeUtils';

const input = {
  striker: { abilityToPlayPaceBall: 70, abilityToPlaySpinBall: 70 },
  bowler: { paceAbility: 70, spinAbility: 40 },
  inningState: { balls: 0, freeHitArmed: true },
  isUserBatting: false,
  isUserBowling: true,
  battingRoles: {},
  bowlingRoles: {},
  matchCondition: { weather: 'cloudy', pitch: 'sporting', outfield: 'lushGreen' },
  matchType: { over: 20 },
  matchTypeKey: 't20',
};

test('an armed free hit protects the computer batter from ordinary wickets', () => {
  expect(buildOutcomeWeights(input).W).toBe(0);
});

test('a zero ability is not replaced by the missing-value default', () => {
  const weights = (ability) => buildOutcomeWeights({
    ...input,
    inningState: { ...input.inningState, freeHitArmed: false },
    striker: { ...input.striker, abilityToPlayPaceBall: ability },
  });
  expect(weights(0)).not.toEqual(weights(50));
  expect(weights(0)).toEqual(weights(1));
});

test('a free hit can still produce a structured run-out for either batter', () => {
  const play = { ...input, inningState: { ...input.inningState, strikerIndex: 0, nonStrikerIndex: 1 } };
  const weights = buildOutcomeWeights(play);
  expect(weights.runOut).toBeGreaterThan(0);
  expect(Object.values(weights).reduce((total, value) => total + value, 0)).toBe(100);

  const random = jest.spyOn(Math, 'random');
  random.mockReturnValue((weights['0'] + 0.1) / 100);
  expect(resolveOutcome(play)).toMatchObject({
    isWicket: true,
    dismissal: { type: 'runOut', batterIndex: 0 },
  });
  random.mockReturnValue((weights['0'] + 0.9) / 100);
  expect(resolveOutcome(play)).toMatchObject({
    isWicket: true,
    dismissal: { type: 'runOut', batterIndex: 1 },
  });
  random.mockRestore();
});

test('ordinary wickets carry a sampled dismissal rather than only a commentary label', () => {
  const play = { ...input, inningState: { ...input.inningState, freeHitArmed: false, strikerIndex: 0, nonStrikerIndex: 1 } };
  const weights = buildOutcomeWeights(play);
  const start = 1 - weights.W / 100;
  const random = jest.spyOn(Math, 'random');
  random.mockReturnValue(start + 0.2 * weights.W / 100);
  expect(resolveOutcome(play).dismissal.type).toBe('caught');
  random.mockReturnValue(start + 0.6 * weights.W / 100);
  expect(resolveOutcome(play).dismissal.type).toBe('bowled');
  random.mockRestore();
});
