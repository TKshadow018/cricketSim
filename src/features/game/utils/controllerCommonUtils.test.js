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

describe('tournament fixtures and team selection', () => {
  test('builds fixtures from valid teams and rejects malformed pairings', () => {
    expect(buildRoundOneFixtures()).toEqual([]);
    expect(areRoundFixturesValid()).toBe(false);
    expect(buildRoundOneFixtures(['A', '', 'B', 'C', 'D'], '2025-01-01')).toEqual([
      {
        id: 'R1-M1',
        round: 1,
        matchNumber: 1,
        teamA: 'A',
        teamB: 'B',
        date: '2025-01-01',
        winnerTeam: '',
        summary: '',
        isComplete: false,
      },
      {
        id: 'R1-M2',
        round: 1,
        matchNumber: 2,
        teamA: 'C',
        teamB: 'D',
        date: '2025-01-02',
        winnerTeam: '',
        summary: '',
        isComplete: false,
      },
    ]);
    expect(areRoundFixturesValid([], ['A', 'B'])).toBe(false);
    expect(areRoundFixturesValid([{ teamA: 'A', teamB: 'B' }], ['A', 'B', 'C'])).toBe(false);
    expect(areRoundFixturesValid([{ teamA: 'A', teamB: '' }], ['A', 'B'])).toBe(false);
    expect(areRoundFixturesValid([{ teamA: 'A', teamB: 'A' }], ['A', 'B'])).toBe(false);
    expect(areRoundFixturesValid([{ teamA: 'A', teamB: 'B' }], ['A', 'B'])).toBe(true);
  });

  test('normalizes selected players and assigns valid default or sanitized roles', () => {
    const players = Array.from({ length: 12 }, (_, index) => ({
      id: index + 1,
      name: `Player ${index + 1}`,
      battingOrderCoeff: 100 - index,
      isWicketKeeper: index === 2,
    }));
    expect(normalizePlayingXIIds(players, [1, 1, 99, ...players.map(({ id }) => id)])).toHaveLength(11);
    expect(normalizePlayingXIIds(players, null)).toEqual([]);
    expect(sanitizeRoles({ captainId: 1, viceCaptainId: 99 }, [1, 2])).toEqual({
      captainId: 1,
      viceCaptainId: null,
      wicketKeeperId: null,
    });
    expect(sanitizeRoles(null, [])).toEqual({ captainId: null, viceCaptainId: null, wicketKeeperId: null });
    expect(sanitizeRoles({ captainId: 1, viceCaptainId: 2, wicketKeeperId: 3 }, [1, 2, 3])).toEqual({
      captainId: 1,
      viceCaptainId: 2,
      wicketKeeperId: 3,
    });
    expect(sanitizeRoles(undefined, [1])).toEqual({ captainId: null, viceCaptainId: null, wicketKeeperId: null });
    expect(pickDefaultRoles(players, [1, 2, 3])).toEqual({
      captainId: 1,
      viceCaptainId: 2,
      wicketKeeperId: 3,
    });
    expect(pickDefaultRoles(players, [1])).toEqual({
      captainId: 1,
      viceCaptainId: 1,
      wicketKeeperId: 1,
    });
    expect(pickDefaultRoles(players, [])).toEqual({
      captainId: null,
      viceCaptainId: null,
      wicketKeeperId: null,
    });
    expect(pickDefaultRoles()).toEqual({ captainId: null, viceCaptainId: null, wicketKeeperId: null });
    expect(buildPlayingXI(players, players.slice(0, 11).map(({ id }) => id))).toHaveLength(11);
    expect(buildPlayingXI(players, [999])).toHaveLength(11);
  });
});

describe('AI playing XI selection', () => {
  afterEach(() => jest.restoreAllMocks());

  test('fills first-match selections when the roster lacks specialist keepers and bowlers', () => {
    const batsmen = Array.from({ length: 8 }, (_, index) => makePlayer(`bat-${index}`, 'batsman', index));
    expect(selectAIPlayingXI({})).toEqual([]);
    expect(selectAIPlayingXI({ roster: null })).toEqual([]);
    expect(selectAIPlayingXI({ roster: batsmen })).toHaveLength(8);
    expect(selectAIPlayingXI({ roster: [] })).toEqual([]);
    expect(selectAIPlayingXI({ roster: batsmen, previousXIIds: 'invalid' })).toHaveLength(8);
  });

  test('balances a small batting group when enough bowling options are available', () => {
    const roster = [
      makePlayer('keeper', 'wicketkeeper'),
      makePlayer('bat-1', 'batsman'),
      makePlayer('bat-2', 'batsman', 1),
      ...Array.from({ length: 8 }, (_, index) => makePlayer(`bowl-${index}`, 'bowler', index)),
    ];
    expect(selectAIPlayingXI({ roster })).toHaveLength(11);
    const competingKeepers = [
      makePlayer('keeper-low', 'wicketkeeper'),
      makePlayer('keeper-high', 'wicketkeeper', 10),
      ...Array.from({ length: 4 }, (_, index) => makePlayer(`bat-${index}`, 'batsman', index)),
      ...Array.from({ length: 6 }, (_, index) => makePlayer(`bowl-${index}`, 'bowler', index)),
    ];
    const firstMatchXI = selectAIPlayingXI({ roster: competingKeepers });
    expect(firstMatchXI).toContain('keeper-high');
    expect(firstMatchXI).not.toContain('keeper-low');
  });

  test('uses name-based form when replacing poor performers and maintains an XI of eleven', () => {
    const roster = [
      makePlayer('wk', 'wicketkeeper'),
      ...Array.from({ length: 6 }, (_, index) => makePlayer(`bat-${index}`, 'batsman', index)),
      ...Array.from({ length: 7 }, (_, index) => makePlayer(`bowl-${index}`, 'bowler', index)),
    ];
    const previousXIIds = ['wk', 'bat-0', 'bat-1', 'bat-2', 'bat-3', 'bowl-0', 'bowl-1', 'bowl-2', 'bowl-3', 'bowl-4', 'bowl-5'];
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const selected = selectAIPlayingXI({
      roster,
      previousXIIds,
      lastMatchPerformanceById: {},
      lastMatchPerformanceByName: { 'Player bat-0': { runs: 2 }, 'Player bowl-0': { wickets: 0 } },
    });
    expect(selected).toHaveLength(11);
    expect(selected).not.toContain('bat-0');
    expect(selected).toContain('bat-4');
    expect(new Set(selected).size).toBe(11);
  });

  test('replaces unavailable keepers, bowlers, and allrounders with compatible bench players', () => {
    const stablePerformance = {
      'bat-0': { runs: 30 },
      'bat-1': { runs: 30 },
      'bat-2': { runs: 30 },
      'bat-3': { runs: 30 },
      'bowl-0': { wickets: 3 },
      'bowl-1': { wickets: 3 },
      'bowl-2': { wickets: 3 },
      'bowl-3': { wickets: 3 },
      'bowl-4': { wickets: 3 },
      'bowl-5': { wickets: 3 },
    };

    const keeperRoster = [
      makePlayer('wk', 'wicketkeeper'),
      ...Array.from({ length: 4 }, (_, index) => makePlayer(`bat-${index}`, 'batsman', index)),
      ...Array.from({ length: 6 }, (_, index) => makePlayer(`bowl-${index}`, 'bowler', index)),
      makePlayer('wk-bench', 'wicketkeeper', 10),
    ];
    keeperRoster[0].fitness = 10;
    const keeperXI = selectAIPlayingXI({
      roster: keeperRoster,
      previousXIIds: keeperRoster.slice(0, 11).map(({ id }) => id),
      lastMatchPerformanceById: stablePerformance,
    });
    expect(keeperXI).toContain('wk-bench');
    expect(keeperXI).not.toContain('wk');

    const bowlerRoster = [
      makePlayer('wk', 'wicketkeeper'),
      ...Array.from({ length: 4 }, (_, index) => makePlayer(`bat-${index}`, 'batsman', index)),
      ...Array.from({ length: 7 }, (_, index) => makePlayer(`bowl-${index}`, 'bowler', index)),
    ];
    bowlerRoster[5].fitness = 10;
    const bowlerXI = selectAIPlayingXI({
      roster: bowlerRoster,
      previousXIIds: bowlerRoster.slice(0, 11).map(({ id }) => id),
      lastMatchPerformanceById: stablePerformance,
    });
    expect(bowlerXI).not.toContain('bowl-0');
    expect(bowlerXI).toContain('bowl-6');

    const allrounderRoster = [
      makePlayer('wk', 'wicketkeeper'),
      ...Array.from({ length: 4 }, (_, index) => makePlayer(`bat-${index}`, 'batsman', index)),
      makePlayer('ar-1', 'pace allrounder'),
      ...Array.from({ length: 5 }, (_, index) => makePlayer(`extra-bat-${index}`, 'batsman', index)),
      makePlayer('bench-bowler', 'spinner', 10),
    ];
    allrounderRoster[5].fitness = 10;
    const allrounderXI = selectAIPlayingXI({
      roster: allrounderRoster,
      previousXIIds: allrounderRoster.slice(0, 11).map(({ id }) => id),
      lastMatchPerformanceById: stablePerformance,
    });
    expect(allrounderXI).not.toContain('ar-1');
    expect(allrounderXI).toContain('bench-bowler');
  });

  test('fills short previous selections with available players and stops at the roster size', () => {
    const roster = Array.from({ length: 8 }, (_, index) => makePlayer(`bat-${index}`, 'batsman', index));
    expect(selectAIPlayingXI({ roster, previousXIIds: ['bat-0'] })).toHaveLength(8);

    roster.slice(1).forEach((player) => {
      player.fitness = 0;
    });
    expect(selectAIPlayingXI({ roster, previousXIIds: ['bat-0'] })).toHaveLength(8);
  });

  test('keeps an unavailable player if there is no bench replacement', () => {
    const roster = [
      makePlayer('wk', 'wicketkeeper'),
      ...Array.from({ length: 4 }, (_, index) => makePlayer(`bat-${index}`, 'batsman', index)),
      ...Array.from({ length: 6 }, (_, index) => makePlayer(`bowl-${index}`, 'bowler', index)),
    ];
    roster[1].fitness = 0;
    const selected = selectAIPlayingXI({
      roster,
      previousXIIds: roster.map(({ id }) => id),
    });
    expect(selected).toHaveLength(11);
    expect(selected).toContain('bat-0');
  });

  test('infers skill-based player roles and replaces an unavailable allrounder by role', () => {
    const inferredPaceBowler = {
      ...makePlayer('inferred-pace', ''),
      abilityToPlayPaceBall: 20,
      abilityToPlaySpinBall: 20,
      paceAbility: 60,
      spinAbility: 0,
    };
    const inferredSpinBowler = {
      ...makePlayer('inferred-spin', ''),
      abilityToPlayPaceBall: 20,
      abilityToPlaySpinBall: 20,
      paceAbility: 0,
      spinAbility: 60,
    };
    const stableAllrounder = {
      ...makePlayer('ar-stable', ''),
      abilityToPlayPaceBall: 40,
      abilityToPlaySpinBall: 40,
      paceAbility: 60,
      spinAbility: 10,
    };
    const unavailableAllrounder = {
      ...makePlayer('ar-unavailable', ''),
      abilityToPlayPaceBall: 40,
      abilityToPlaySpinBall: 40,
      paceAbility: 60,
      spinAbility: 10,
      fitness: 0,
    };
    const roster = [
      makePlayer('keeper', 'wicketkeeper'),
      ...Array.from({ length: 4 }, (_, index) => makePlayer(`bat-${index}`, 'batsman', index)),
      inferredPaceBowler,
      inferredSpinBowler,
      makePlayer('pace-bowler', 'bowler pacer'),
      makePlayer('spin-bowler', 'bowler spinner'),
      stableAllrounder,
      unavailableAllrounder,
      { ...makePlayer('ar-bench', 'pace allrounder'), paceAbility: 75, spinAbility: 25 },
    ];
    const previousXIIds = roster.slice(0, 11).map(({ id }) => id);
    const lastMatchPerformanceById = Object.fromEntries(
      previousXIIds.map((id) => [id, { runs: 30, wickets: 3 }])
    );

    const selected = selectAIPlayingXI({
      roster,
      previousXIIds,
      lastMatchPerformanceById,
    });

    expect(selected).toHaveLength(11);
    expect(selected).toContain('ar-bench');
    expect(selected).not.toContain('ar-unavailable');
    expect(new Set(selected).size).toBe(11);
  });

  test('balances bowling-heavy first XIs and replaces low-morale allrounders by team need', () => {
    const bowlingHeavyRoster = [
      makePlayer('wk', 'wicketkeeper'),
      ...Array.from({ length: 6 }, (_, index) => ({
        id: `zero-${index}`,
        name: '',
        playerType: '',
        abilityToPlayPaceBall: 0,
        abilityToPlaySpinBall: 0,
        paceAbility: 0,
        spinAbility: 0,
      })),
      ...Array.from({ length: 10 }, (_, index) => makePlayer(`bowl-${index}`, 'bowler', index)),
    ];
    expect(selectAIPlayingXI({ roster: bowlingHeavyRoster })).toHaveLength(11);

    const batsmanRoster = [
      makePlayer('wk-selected', 'wicketkeeper'),
      ...Array.from({ length: 3 }, (_, index) => makePlayer(`bat-selected-${index}`, 'batsman', index)),
      { ...makePlayer('ar-low-morale', 'pace allrounder'), fitness: 80, morale: 0 },
      ...Array.from({ length: 6 }, (_, index) => makePlayer(`bowl-selected-${index}`, 'bowler', index)),
      makePlayer('bench-batsman', 'batsman', 20),
      { ...makePlayer('bench-batsman-2', 'batsman', 20), paceAbility: 20 },
    ];
    const batsmanReplacementXI = selectAIPlayingXI({
      roster: batsmanRoster,
      previousXIIds: batsmanRoster.slice(0, 11).map(({ id }) => id),
    });
    expect(batsmanReplacementXI).toContain('bench-batsman');
    expect(batsmanReplacementXI).not.toContain('ar-low-morale');

    const bowlerRoster = [
      makePlayer('wk-selected', 'wicketkeeper'),
      ...Array.from({ length: 4 }, (_, index) => makePlayer(`bat-selected-${index}`, 'batsman', index)),
      ...Array.from({ length: 8 }, (_, index) => makePlayer(`bowl-${index}`, 'bowler', index)),
    ];
    bowlerRoster[5].fitness = 10;
    bowlerRoster[11].paceAbility = 70;
    bowlerRoster[11].spinAbility = 70;
    bowlerRoster[12].paceAbility = 70;
    bowlerRoster[12].spinAbility = 70;
    const bowlerReplacementXI = selectAIPlayingXI({
      roster: bowlerRoster,
      previousXIIds: bowlerRoster.slice(0, 11).map(({ id }) => id),
    });
    expect(bowlerReplacementXI).toContain('bowl-6');
    expect(bowlerReplacementXI).not.toContain('bowl-0');

    const selectedAllrounderRoster = [
      makePlayer('wk-selected', 'wicketkeeper'),
      ...Array.from({ length: 4 }, (_, index) => makePlayer(`bat-selected-${index}`, 'batsman', index)),
      makePlayer('ar-selected', 'pace allrounder'),
      ...Array.from({ length: 5 }, (_, index) => makePlayer(`bowl-selected-${index}`, 'bowler', index)),
      makePlayer('bench-allrounder', 'spin allrounder', 20),
    ];
    const previousXIIds = selectedAllrounderRoster.slice(0, 11).map(({ id }) => id);
    const selectedAllrounderXI = selectAIPlayingXI({
      roster: selectedAllrounderRoster,
      previousXIIds,
      lastMatchPerformanceById: Object.fromEntries(
        previousXIIds.map((id) => [id, { runs: 30, wickets: id === 'ar-selected' ? 0 : 5 }])
      ),
    });
    expect(selectedAllrounderXI).toContain('bench-allrounder');
    expect(selectedAllrounderXI).not.toContain('ar-selected');

    const noBatterReplacementRoster = [
      makePlayer('wk-selected', 'wicketkeeper'),
      ...Array.from({ length: 3 }, (_, index) => makePlayer(`bat-selected-${index}`, 'batsman', index)),
      { ...makePlayer('ar-unavailable', 'pace allrounder'), fitness: 0 },
      ...Array.from({ length: 6 }, (_, index) => makePlayer(`bowl-selected-${index}`, 'bowler', index)),
    ];
    const noBatterReplacementXI = selectAIPlayingXI({
      roster: noBatterReplacementRoster,
      previousXIIds: noBatterReplacementRoster.map(({ id }) => id),
    });
    expect(noBatterReplacementXI).toContain('ar-unavailable');

    const noBowlerReplacementRoster = [
      makePlayer('wk-selected', 'wicketkeeper'),
      ...Array.from({ length: 4 }, (_, index) => makePlayer(`bat-selected-${index}`, 'batsman', index)),
      { ...makePlayer('ar-unavailable', 'pace allrounder'), fitness: 0 },
      ...Array.from({ length: 5 }, (_, index) => makePlayer(`extra-bat-${index}`, 'batsman', index)),
      makePlayer('bench-allrounder', 'spin allrounder'),
    ];
    const noBowlerReplacementXI = selectAIPlayingXI({
      roster: noBowlerReplacementRoster,
      previousXIIds: noBowlerReplacementRoster.slice(0, 11).map(({ id }) => id),
    });
    expect(noBowlerReplacementXI).toContain('bench-allrounder');
    expect(noBowlerReplacementXI).not.toContain('ar-unavailable');

    const genericReplacementRoster = [
      makePlayer('wk-selected', 'wicketkeeper'),
      ...Array.from({ length: 4 }, (_, index) => makePlayer(`bat-selected-${index}`, 'batsman', index)),
      { ...makePlayer('ar-unavailable', 'pace allrounder'), fitness: 0 },
      ...Array.from({ length: 5 }, (_, index) => makePlayer(`bowl-selected-${index}`, 'bowler', index)),
      makePlayer('generic-bench-batter', 'batsman', 20),
    ];
    const genericReplacementXI = selectAIPlayingXI({
      roster: genericReplacementRoster,
      previousXIIds: genericReplacementRoster.slice(0, 11).map(({ id }) => id),
    });
    expect(genericReplacementXI).toContain('generic-bench-batter');
    expect(genericReplacementXI).not.toContain('ar-unavailable');

    const bowlingAlternativeRoster = [
      makePlayer('wk-selected', 'wicketkeeper'),
      ...Array.from({ length: 4 }, (_, index) => makePlayer(`bat-selected-${index}`, 'batsman', index)),
      ...Array.from({ length: 5 }, (_, index) => makePlayer(`bowl-selected-${index}`, 'bowler', index)),
      makePlayer('ar-selected', 'pace allrounder'),
      makePlayer('bench-allrounder', 'spin allrounder'),
    ];
    const selectedIds = bowlingAlternativeRoster.slice(0, 11).map(({ id }) => id);
    const bowlingAlternativeXI = selectAIPlayingXI({
      roster: bowlingAlternativeRoster,
      previousXIIds: selectedIds,
      lastMatchPerformanceById: Object.fromEntries(
        selectedIds.map((id) => [id, { runs: 30, wickets: id === 'bowl-selected-0' ? 0 : 5 }])
      ),
    });
    expect(bowlingAlternativeXI).toContain('bench-allrounder');
    expect(bowlingAlternativeXI).not.toContain('bowl-selected-0');

    const sparseIdentityRoster = [
      makePlayer('wk', 'wicketkeeper'),
      ...Array.from({ length: 4 }, (_, index) => makePlayer(`bat-${index}`, 'batsman', index)),
      { playerType: '', abilityToPlayPaceBall: 0, abilityToPlaySpinBall: 0, paceAbility: 0, spinAbility: 0 },
      ...Array.from({ length: 5 }, (_, index) => makePlayer(`bowler-${index}`, 'bowler', index)),
    ];
    const sparseIdentityXI = selectAIPlayingXI({
      roster: sparseIdentityRoster,
      previousXIIds: sparseIdentityRoster.map((player) => player.id),
    });
    expect(sparseIdentityXI).toHaveLength(11);
    expect(sparseIdentityXI).toContain(undefined);
  });
});
