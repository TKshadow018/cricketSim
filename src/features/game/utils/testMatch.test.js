import { aggregateTestMatch, chooseFollowOn, finishTestInnings, formatTestResult, shouldDeclareTestInnings, startTestMatch } from './testMatch';

const players = (team) => Array.from({ length: 11 }, (_, index) => ({
  id: `${team}-${index}`,
  name: `${team} ${index}`,
  battingOrderCoeff: 100 - index,
  paceAbility: 60,
  spinAbility: 20,
}));
const context = {
  ownPlayers: players('A'),
  opponentPlayers: players('B'),
  ownTeam: 'A',
  opponentTeam: 'B',
  userTeamName: 'A',
};
const finish = (state, score, wickets, balls, reason = 'allOut') => finishTestInnings({
  ...context,
  state: { ...state, currentInnings: { ...state.currentInnings, score, wickets, balls } },
  reason,
});

test('a follow-on can produce an innings victory without a fourth innings', () => {
  let state = startTestMatch({ ...context, firstSide: 'own', randomSeed: 1 });
  state = finish(state, 350, 10, 500);
  state = finish(state, 140, 10, 300);
  expect(state).toMatchObject({ phase: 'followOnChoice', followOnLead: 210 });
  state = chooseFollowOn({ ...context, state, enforce: true });
  expect(state.currentSide).toBe('opponent');
  state = finish(state, 180, 10, 300);
  expect(state.result).toMatchObject({ type: 'win', winnerSide: 'own', marginType: 'innings', margin: 30 });
  expect(state.innings).toHaveLength(3);
});

test('declining the follow-on leads to a fourth-innings chase and a wickets victory', () => {
  let state = startTestMatch({ ...context, firstSide: 'own', randomSeed: 2 });
  state = finish(state, 350, 10, 500);
  state = finish(state, 140, 10, 300);
  state = chooseFollowOn({ ...context, state, enforce: false });
  expect(state.currentSide).toBe('own');
  state = finish(state, 150, 3, 250, 'declared');
  expect(state).toMatchObject({ currentSide: 'opponent', target: 361, phase: 'batting' });
  state = finish(state, 361, 6, 400, 'targetReached');
  expect(state.result).toMatchObject({ type: 'win', winnerSide: 'opponent', marginType: 'wickets', margin: 4 });
});

test('time expiry is a draw, independent of aggregate scores', () => {
  let state = startTestMatch({ ...context, firstSide: 'own', randomSeed: 3, days: 1, oversPerDay: 1 });
  state = finish(state, 20, 0, 6, 'time');
  expect(state.result).toMatchObject({ type: 'draw' });
  expect(state.phase).toBe('result');
});

test('a level fourth-innings aggregate after all out is a tie', () => {
  let state = startTestMatch({ ...context, firstSide: 'own', randomSeed: 4 });
  state = finish(state, 100, 10, 100);
  state = finish(state, 120, 10, 100);
  state = finish(state, 50, 10, 100);
  expect(state.target).toBe(31);
  state = finish(state, 30, 10, 100);
  expect(state.result).toMatchObject({ type: 'tie' });
});

test('an innings victory on the last scheduled ball takes precedence over a draw', () => {
  let state = startTestMatch({ ...context, firstSide: 'own', randomSeed: 5, days: 1, oversPerDay: 50 });
  state = finish(state, 300, 10, 100);
  state = finish(state, 100, 10, 100);
  state = chooseFollowOn({ ...context, state, enforce: true });
  state = finish(state, 50, 10, 100);
  expect(state.result).toMatchObject({ type: 'win', winnerSide: 'own', marginType: 'innings', margin: 150 });
});

test('aggregates both innings of a side without losing individual dismissal counts', () => {
  let state = startTestMatch({ ...context, firstSide: 'own', randomSeed: 6 });
  state.currentInnings.battingStats[0] = { runs: 40, balls: 60, isOut: true };
  state = finish(state, 100, 10, 100);
  state = finish(state, 120, 10, 100);
  state.currentInnings.battingStats[0] = { runs: 20, balls: 40, isOut: true };
  state = finish(state, 50, 10, 100);
  state = finish(state, 30, 10, 100);
  const aggregate = aggregateTestMatch(state);
  expect(aggregate.firstInnings).toMatchObject({
    score: 150,
    wickets: 20,
    battingStats: expect.arrayContaining([expect.objectContaining({ runs: 60, balls: 100, outs: 2 })]),
  });

  expect(aggregate.secondInnings.score).toBe(150);
  expect(formatTestResult(state, context)).toBe('The match is tied.');
});

test('an AI declaration requires a substantial lead and enough time left to bowl', () => {
  let state = startTestMatch({ ...context, firstSide: 'own', randomSeed: 10 });
  state = finish(state, 300, 10, 500);
  state = finish(state, 250, 10, 500);
  state.currentInnings = { ...state.currentInnings, score: 200, balls: 950 };
  expect(shouldDeclareTestInnings(state)).toBe(true);
  expect(shouldDeclareTestInnings({ ...state, currentInnings: { ...state.currentInnings, score: 50 } })).toBe(false);
  expect(shouldDeclareTestInnings({ ...state, target: 200 })).toBe(false);
});
