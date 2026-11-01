import { simulateHeadlessMatch } from './headlessMatch';
import { simulateHeadlessTestMatch } from './headlessTestMatch';

const roster = (team) => Array.from({ length: 11 }, (_, index) => ({
  id: `${team}-${index}`,
  name: `${team} ${index}`,
  battingOrderCoeff: 100 - index,
  abilityToPlayPaceBall: 70,
  abilityToPlaySpinBall: 70,
  paceAbility: index < 6 ? 70 : 20,
  spinAbility: 20,
  isWicketKeeper: index === 10,
}));

const playersA = roster('A');
const playersB = roster('B');

const expectInningsToReconcile = (innings, battingSide, bowlingSide) => {
  const batting = Object.fromEntries(battingSide.map(({ name }) => [name, { runs: 0, balls: 0 }]));
  const bowling = Object.fromEntries(bowlingSide.map(({ name }) => [name, { runsConceded: 0, balls: 0, wickets: 0 }]));
  const dismissals = [];
  let score = 0;
  let legalBalls = 0;

  innings.deliveryEvents.forEach((event) => {
    expect(batting[event.striker]).toBeDefined();
    expect(bowling[event.bowler]).toBeDefined();
    batting[event.striker].runs += event.runs;
    batting[event.striker].balls += event.token === 'wide' ? 0 : 1;
    bowling[event.bowler].runsConceded += event.runs + event.extras -
      event.extraBreakdown.bye - event.extraBreakdown.legBye;
    bowling[event.bowler].balls += event.isLegalDelivery ? 1 : 0;
    score += event.runs + event.extras;
    legalBalls += event.isLegalDelivery ? 1 : 0;

    if (event.isWicket) {
      expect(event.dismissal).toBeDefined();
      expect(battingSide[event.dismissal.batterIndex]).toBeDefined();
      if (event.dismissal.fielderName) {
        expect(bowling[event.dismissal.fielderName]).toBeDefined();
      }
      dismissals.push(event.dismissal.batterIndex);
      bowling[event.bowler].wickets += event.dismissal.type === 'runOut' ? 0 : 1;
    }
  });

  expect(innings.historyComplete).toBe(true);
  expect(innings.score).toBe(score);
  expect(innings.score).toBe(
    innings.battingStats.reduce((sum, stat) => sum + stat.runs, 0) +
    innings.wides + innings.noBalls + innings.byes + innings.legByes
  );
  expect(innings.balls).toBe(legalBalls);
  expect(innings.wickets).toBe(dismissals.length);
  expect(new Set(dismissals).size).toBe(dismissals.length);

  battingSide.forEach(({ name }, index) => {
    expect(innings.battingStats[index]).toMatchObject(batting[name]);
  });
  bowlingSide.forEach(({ name }, index) => {
    expect(innings.bowlingStats[index]).toMatchObject(bowling[name]);
  });
};

test.each([
  ['t20', 'realism', 104],
  ['t20', 'realism', 777],
  ['odi', 'realism', 104],
  ['odi', 'realism', 777],
  ['t20', 'arcade', 104],
  ['odi', 'arcade', 777],
])('%s %s seed %i reconciles every innings with its delivery ledger', (format, ruleset, seed) => {
  const result = simulateHeadlessMatch({ teamA: 'A', teamB: 'B', playersA, playersB, format, ruleset, seed });
  expectInningsToReconcile(result.firstInnings, playersA, playersB);
  expectInningsToReconcile(result.secondInnings, playersB, playersA);
});

test('a complete first-class match reconciles each innings and aggregate score', () => {
  const result = simulateHeadlessTestMatch({ teamA: 'A', teamB: 'B', playersA, playersB, seed: 777 });
  const totals = { own: 0, opponent: 0 };
  result.testMatch.innings.forEach(({ side, innings }) => {
    const batting = side === 'own' ? playersA : playersB;
    const bowling = side === 'own' ? playersB : playersA;
    expectInningsToReconcile(innings, batting, bowling);
    totals[side] += innings.score;
  });
  expect(result.firstInnings.score).toBe(totals.own);
  expect(result.secondInnings.score).toBe(totals.opponent);
});
