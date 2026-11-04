import {
  areRoundFixturesValid,
  buildPlayingXI,
  buildRandomBattingOrderCoeff,
  buildRoundOneFixtures,
  buildScorecard,
  collectTeamStatsForInnings,
  ensurePlayerMeta,
  formatOvers,
  getBattingOrderCoeffRange,
  normalizePlayingXIIds,
  pickDefaultRoles,
  randomKey,
  resolveSeriesStanding,
  runMilestoneBonus,
  sanitizeRoles,
  selectAIPlayingXI,
  shuffleArray,
  sortPlayersByBattingOrder,
  wicketMilestoneBonus,
} from './controllerCommonUtils';

const makePlayer = (id, playerType, offset = 0) => ({
  id,
  name: `Player ${id}`,
  playerType,
  abilityToPlayPaceBall: 65 + offset,
  abilityToPlaySpinBall: 65 + offset,
  paceAbility: playerType === 'bowler' ? 60 + offset : 10,
  spinAbility: playerType === 'spinner' ? 60 + offset : 10,
});

describe('match and player helpers', () => {
  afterEach(() => jest.restoreAllMocks());

  test('builds scorecards and selects random map keys safely', () => {
    expect(
      buildScorecard('India', { score: 120, wickets: 4 }, { battingRows: ['batting'], bowlingRows: ['bowling'] }, '20.0')
    ).toEqual({
      title: 'India',
      line: 'India 120/4',
      overs: '20.0',
      battingRows: ['batting'],
      bowlingRows: ['bowling'],
    });
    expect(randomKey()).toBe('');
    expect(randomKey(null)).toBe('');
    jest.spyOn(Math, 'random').mockReturnValue(0.99);
    expect(randomKey({ first: 1, last: 2 })).toBe('last');
  });

  test('awards milestone bonuses at and between scoring boundaries', () => {
    expect([runMilestoneBonus(29), runMilestoneBonus(30), runMilestoneBonus(50), runMilestoneBonus(100), runMilestoneBonus(150), runMilestoneBonus(200)])
      .toEqual([0, 1, 2, 5, 10, 20]);
    expect([wicketMilestoneBonus(2), wicketMilestoneBonus(3), wicketMilestoneBonus(4), wicketMilestoneBonus(5), wicketMilestoneBonus(6), wicketMilestoneBonus(8)])
      .toEqual([0, 1, 2, 5, 10, 20]);
    expect(formatOvers(13)).toBe('2.1');
  });

  test('classifies player batting-order ranges and clamps invalid profile metrics', () => {
    expect(getBattingOrderCoeffRange({ playerType: 'bowler spinner' })).toEqual([1, 30]);
    expect(getBattingOrderCoeffRange({ isWicketKeeper: true })).toEqual([40, 90]);
    expect(getBattingOrderCoeffRange({ playerType: 'pace allrounder' })).toEqual([40, 90]);
    expect(getBattingOrderCoeffRange({ playerType: 'batsman' })).toEqual([50, 100]);
    expect(getBattingOrderCoeffRange({ paceAbility: 40, abilityToPlayPaceBall: 50, abilityToPlaySpinBall: 30 })).toEqual([40, 90]);
    expect(getBattingOrderCoeffRange({ spinAbility: 40 })).toEqual([1, 30]);
    expect(getBattingOrderCoeffRange()).toEqual([50, 100]);

    const random = jest.spyOn(Math, 'random').mockReturnValue(0.5);
    expect(buildRandomBattingOrderCoeff({ playerType: 'bowler' })).toBe(16);
    expect(buildRandomBattingOrderCoeff()).toBe(75);
    expect(formatOvers()).toBe('0.0');
    random.mockRestore();
    expect(ensurePlayerMeta()).toMatchObject({ fitness: 100, morale: 50, form: 50, confidence: 50 });
    expect(
      ensurePlayerMeta({
        id: 'clamped',
        fitness: 'not-a-number',
        morale: 120,
        form: -5,
        confidence: null,
        battingOrderCoeff: 0,
      })
    ).toMatchObject({ fitness: 0, morale: 100, form: 0, confidence: 50, battingOrderCoeff: 1 });
  });

  test('sorts players by batting order and then batting skill', () => {
    const sorted = sortPlayersByBattingOrder([
      { id: 'low', name: 'Low', battingOrderCoeff: 20, abilityToPlayPaceBall: 100 },
      { id: 'high-a', name: 'A', battingOrderCoeff: 80, abilityToPlayPaceBall: 50 },
      { id: 'high-z', name: 'Z', battingOrderCoeff: 80, abilityToPlayPaceBall: 60 },
    ]);
    expect(sorted.map(({ id }) => id)).toEqual(['high-z', 'high-a', 'low']);
    expect(sortPlayersByBattingOrder()).toEqual([]);
    expect(sortPlayersByBattingOrder(null)).toEqual([]);
    expect(sortPlayersByBattingOrder([
      { id: 'z', name: 'Zulu', battingOrderCoeff: 50, abilityToPlayPaceBall: 50, abilityToPlaySpinBall: 50 },
      { id: 'a', name: 'Alpha', battingOrderCoeff: 50, abilityToPlayPaceBall: 50, abilityToPlaySpinBall: 50 },
    ]).map(({ id }) => id)).toEqual(['a', 'z']);
    expect(sortPlayersByBattingOrder([
      { id: 'zero-a', name: '', battingOrderCoeff: 50, abilityToPlayPaceBall: 0, abilityToPlaySpinBall: 0 },
      { id: 'zero-b', name: '', battingOrderCoeff: 50, abilityToPlayPaceBall: 0, abilityToPlaySpinBall: 0 },
    ]).map(({ id }) => id)).toEqual(['zero-a', 'zero-b']);
  });

  test('accumulates batting and bowling stats while preserving player identity fields', () => {
    const stats = {};
    const player = {
      id: 'p1',
      name: 'Player One',
      playerType: 'batsman',
      paceAbility: 20,
      spinAbility: 10,
      abilityToPlayPaceBall: 70,
      abilityToPlaySpinBall: 60,
    };
    collectTeamStatsForInnings({
      teamName: 'Team A',
      players: [player, null, { id: 'p2', name: 'Player Two' }],
      battingStats: [{ runs: 30, isOut: true, balls: 20 }, {}, { runs: 4 }],
      bowlingStats: [{ wickets: 2, balls: 18, runsConceded: 22 }],
      targetMap: stats,
    });
    collectTeamStatsForInnings({
      teamName: 'Team A',
      players: [player],
      battingStats: [{ runs: 5, isOut: false, balls: 3 }],
      bowlingStats: [{ wickets: 1, balls: 6, runsConceded: 7 }],
      targetMap: stats,
    });

    expect(stats['Team A::p1::Player One']).toMatchObject({
      playerId: 'p1',
      team: 'Team A',
      name: 'Player One',
      playerType: 'batsman',
      runs: 35,
      outs: 1,
      wickets: 3,
      balls: 23,
      ballsBowled: 24,
      runsConceded: 29,
      matches: 2,
    });
    expect(stats['Team A::p2::Player Two']).toMatchObject({
      playerType: '',
      isWicketKeeper: false,
      fitness: 100,
      morale: 50,
      runs: 4,
      matches: 1,
    });

    collectTeamStatsForInnings({ teamName: 'Empty', targetMap: {} });
    collectTeamStatsForInnings({
      teamName: 'Team B',
      players: [{
        id: 'complete',
        name: 'Complete Player',
        playerType: 'bowler',
        isWicketKeeper: true,
        paceAbility: 20,
        spinAbility: 30,
        abilityToPlayPaceBall: 40,
        abilityToPlaySpinBall: 50,
        fitness: 80,
        morale: 70,
        battingOrderCoeff: 60,
      }],
      battingStats: [{ runs: 1, balls: 1 }],
      bowlingStats: [{ wickets: 1, balls: 1, runsConceded: 1 }],
      targetMap: {},
    });
    collectTeamStatsForInnings({ teamName: 'Team C', players: [{ id: 'no-stats', name: 'No Stats' }], targetMap: {} });
  });

  test('counts series wins and ties and shuffles without mutating the input', () => {
    expect(
      resolveSeriesStanding(
        [{ winnerTeam: 'A' }, { winnerTeam: 'B' }, { winnerTeam: '' }],
        'A',
        'B'
      )
    ).toEqual({ ownWins: 1, opponentWins: 1, ties: 1 });
    expect(resolveSeriesStanding()).toEqual({ ownWins: 0, opponentWins: 0, ties: 0 });
    expect(resolveSeriesStanding(null)).toEqual({ ownWins: 0, opponentWins: 0, ties: 0 });

    const input = [1, 2, 3];
    jest.spyOn(Math, 'random').mockReturnValue(0);
    expect(shuffleArray(input)).toEqual([2, 3, 1]);
    expect(input).toEqual([1, 2, 3]);
    expect(shuffleArray([1])).toEqual([1]);
    expect(shuffleArray()).toEqual([]);
  });
});
