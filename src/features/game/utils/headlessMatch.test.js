import { simulateHeadlessMatch } from './headlessMatch';
import { simulateHeadlessTestMatch } from './headlessTestMatch';

const roster = (team) => Array.from({ length: 11 }, (_, index) => ({
  id: `${team}-${index}`,
  name: `${team} ${index}`,
  battingOrderCoeff: 100 - index,
  abilityToPlayPaceBall: 65,
  abilityToPlaySpinBall: 65,
  paceAbility: index < 6 ? 65 : 10,
  spinAbility: 20,
  isWicketKeeper: index === 10,
}));

test('a seeded unattended match uses the same delivery ledger and reconciles scorecards', () => {
  const options = {
    teamA: 'A',
    teamB: 'B',
    playersA: roster('A'),
    playersB: roster('B'),
    format: 't20',
    seed: 104,
  };
  const result = simulateHeadlessMatch(options);
  expect(simulateHeadlessMatch(options)).toEqual(result);
  for (const [innings, card] of [
    [result.firstInnings, result.scorecard.previousInnings],
    [result.secondInnings, result.scorecard.currentInnings],
  ]) {
    expect(innings.deliveryEvents.length).toBeGreaterThan(0);
    expect(card.battingRows.reduce((sum, row) => sum + row.runs, 0) +
      innings.wides + innings.noBalls + innings.byes + innings.legByes).toBe(innings.score);
    expect(card.battingRows.filter((row) => row.dismissal !== 'Not Out' && row.dismissal !== 'Yet to bat').length)
      .toBe(innings.wickets);
    expect(innings.bowlingStats.reduce((sum, row) => sum + row.balls, 0)).toBe(innings.balls);
  }
  if (result.secondInnings.score > result.firstInnings.score) {
    expect(result.summary).toBe(`B won by ${10 - result.secondInnings.wickets} wickets`);
  } else if (result.secondInnings.score < result.firstInnings.score) {
    expect(result.summary).toBe(`A won by ${result.firstInnings.score - result.secondInnings.score} runs`);
  } else {
    expect(result.summary).toContain('tied');
  }
});

test('a seeded first-class fixture follows the Test innings state machine', () => {
  const options = {
    teamA: 'A',
    teamB: 'B',
    playersA: roster('A'),
    playersB: roster('B'),
    seed: 104,
    days: 1,
    oversPerDay: 2,
  };
  const result = simulateHeadlessTestMatch(options);
  expect(result).toEqual(simulateHeadlessTestMatch(options));
  expect(result.testMatch.result.type).toBe('draw');
  expect(result.winner).toBe('Draw');
  expect(result.summary).toBe('The match is drawn.');
  expect(result.inningsScorecards).toHaveLength(1);
  expect(result.testMatch.innings[0].innings.balls).toBe(12);
  expect(result.firstInnings.score).toBe(result.testMatch.innings[0].innings.score);
});
