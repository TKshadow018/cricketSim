import { advanceSuperOver, startSuperOver } from './superOver';

const players = (team) => Array.from({ length: 11 }, (_, index) => ({
  id: `${team}-${index}`,
  name: `${team} ${index}`,
  battingOrderCoeff: 100 - index,
  abilityToPlayPaceBall: 70,
  abilityToPlaySpinBall: 70,
  paceAbility: 60,
  spinAbility: 20,
}));
const context = {
  ownPlayers: players('A'),
  opponentPlayers: players('B'),
  ownTeam: 'A',
  opponentTeam: 'B',
  userTeamName: 'A',
  randomSeed: 123,
};

test('the team batting second in the match bats first in the first Super Over', () => {
  const state = startSuperOver({ ...context, originalFirstSide: 'own' });
  expect(state).toMatchObject({ round: 1, firstSide: 'opponent', phase: 'first', winnerTeam: '' });
  expect(state.firstInnings.waitingForNextBowler).toBe(true);
  expect(state.secondInnings.needsOpeners).toBe(true);
});

test('a tied Super Over reverses the order and excludes previously dismissed batters and bowlers', () => {
  const first = startSuperOver({ ...context, originalFirstSide: 'own' });
  const next = advanceSuperOver({
    ...context,
    state: {
      ...first,
      phase: 'complete',
      firstInnings: { ...first.firstInnings, score: 10, wickets: 1, outBatterIndices: [0], currentBowlerIndex: 2 },
      secondInnings: { ...first.secondInnings, score: 10, wickets: 1, outBatterIndices: [1], currentBowlerIndex: 3 },
    },
  });
  expect(next).toMatchObject({
    round: 2,
    firstSide: 'own',
    phase: 'first',
    excludedBatters: { own: [1], opponent: [0] },
    lastBowlers: { own: 2, opponent: 3 },
  });
  expect(next.firstInnings.outBatterIndices).toContain(1);
  expect(next.secondInnings.outBatterIndices).toContain(0);
  expect(next.firstInnings.lastOverBowlerIndex).toBe(3);
  expect(next.secondInnings.lastOverBowlerIndex).toBe(2);
  expect(next.rounds).toHaveLength(1);
});

test('a winner resolves the tiebreak without changing the original match score', () => {
  const first = startSuperOver({ ...context, originalFirstSide: 'own' });
  const resolved = advanceSuperOver({
    ...context,
    state: {
      ...first,
      phase: 'complete',
      firstInnings: { ...first.firstInnings, score: 12 },
      secondInnings: { ...first.secondInnings, score: 13 },
    },
  });
  expect(resolved).toMatchObject({ phase: 'resolved', winnerTeam: 'A', round: 1 });
  expect(resolved.rounds[0]).toMatchObject({ firstSide: 'opponent', firstScore: 12, secondScore: 13 });
});
