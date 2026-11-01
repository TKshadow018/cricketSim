import { simulateCareerFixture } from './careerFixtureSimulationUtils';

jest.mock('faker-user', () => ({ createPerson: jest.fn() }));

const roster = (team) => Array.from({ length: 11 }, (_, index) => ({
  id: `${team}-${index}`,
  name: `${team} ${index}`,
  playerType: index < 6 ? 'bowler pacer' : 'batsman',
  battingOrderCoeff: 100 - index,
  abilityToPlayPaceBall: 65,
  abilityToPlaySpinBall: 65,
  paceAbility: index < 6 ? 65 : 10,
  spinAbility: 20,
  isWicketKeeper: index === 10,
}));

test('realism career fixtures derive results and scorecards from a seeded shared match', () => {
  const teams = [
    { name: 'A', players: roster('A') },
    { name: 'B', players: roster('B') },
  ];
  const { result } = simulateCareerFixture({
    match: { teamA: 'A', teamB: 'B', format: 't20' },
    domesticTeams: teams,
    ruleset: 'realism',
    seed: 104,
  });

  expect(result).toMatchObject({ simulationModel: 'realism-v1', simulationSeed: 104 });
  const first = result.scorecard.previousInnings;
  const second = result.scorecard.currentInnings;
  expect(first.battingRows.reduce((sum, row) => sum + row.runs, 0) + first.extras.total).toBe(result.teamAScore);
  expect(second.battingRows.reduce((sum, row) => sum + row.runs, 0) + second.extras.total).toBe(result.teamBScore);
  expect(first.battingRows.filter((row) => row.dismissal.startsWith('b A '))).toHaveLength(0);
  expect(second.battingRows.filter((row) => row.dismissal.startsWith('b B '))).toHaveLength(0);
  if (result.teamBScore > result.teamAScore) {
    expect(result.summary).toBe(`B won by ${10 - result.teamBWickets} wickets`);
  } else if (result.teamAScore > result.teamBScore) {
    expect(result.summary).toBe(`A won by ${result.teamAScore - result.teamBScore} runs`);
  } else {
    expect(result.winner).toBe('Tie');
  }
});

test('first-class career fixtures retain individual innings and reconcile aggregated player figures', () => {
  const teams = [
    { name: 'A', players: roster('A') },
    { name: 'B', players: roster('B') },
  ];
  const { result, updatedStats } = simulateCareerFixture({
    match: { teamA: 'A', teamB: 'B', format: 'firstClass' },
    domesticTeams: teams,
    ruleset: 'realism',
    seed: 104,
  });
  expect(result).toMatchObject({ simulationModel: 'realism-v1', simulationSeed: 104 });
  expect(result.scorecard.innings.length).toBeGreaterThan(0);
  const totals = { A: 0, B: 0 };
  result.scorecard.innings.forEach(({ team, scorecard, score }) => {
    expect(scorecard.battingRows.reduce((sum, row) => sum + row.runs, 0) + scorecard.extras.total).toBe(score);
    totals[team] += score;
  });
  expect(result.teamAScore).toBe(totals.A);
  expect(result.teamBScore).toBe(totals.B);
  for (const team of ['A', 'B']) {
    const playerRuns = Object.values(updatedStats)
      .filter((entry) => entry.team === team)
      .reduce((sum, entry) => sum + entry.runs, 0);
    const battingRuns = result.scorecard.innings
      .filter((entry) => entry.team === team)
      .flatMap((entry) => entry.scorecard.battingRows)
      .reduce((sum, row) => sum + row.runs, 0);
    expect(playerRuns).toBe(battingRuns);
  }
});

test('arcade career fixtures with complete teams use the shared delivery engine', () => {
  const teams = [
    { name: 'A', players: roster('A') },
    { name: 'B', players: roster('B') },
  ];
  const { result } = simulateCareerFixture({
    match: { teamA: 'A', teamB: 'B', format: 't20' },
    domesticTeams: teams,
    ruleset: 'arcade',
    seed: 104,
  });
  expect(result).toMatchObject({ simulationModel: 'arcade-v1', simulationSeed: 104 });
  expect(result.scorecard.previousInnings.extras.total).toBeGreaterThanOrEqual(0);
});

test('a fixture seed also controls squad rotation and post-match player updates', () => {
  const teams = [
    { name: 'A', players: [...roster('A'), ...roster('A-bench').slice(0, 4)] },
    { name: 'B', players: [...roster('B'), ...roster('B-bench').slice(0, 4)] },
  ];
  const previousFixturesByTeam = Object.fromEntries(teams.map((team) => [
    team.name,
    { result: { scorecard: { previousInnings: {
      title: `${team.name} Innings`,
      battingRows: team.players.slice(0, 11).map(({ id, name }) => ({ playerId: id, name, runs: 15 })),
      bowlingRows: [],
    } } } },
  ]));
  const input = {
    match: { teamA: 'A', teamB: 'B', format: 't20' },
    domesticTeams: teams,
    previousFixturesByTeam,
    ruleset: 'realism',
    seed: 875,
  };
  const random = jest.spyOn(Math, 'random');
  random.mockReturnValue(0.1);
  const first = simulateCareerFixture(input);
  random.mockReturnValue(0.9);
  const second = simulateCareerFixture(input);
  expect(second).toEqual(first);
  random.mockRestore();
});
