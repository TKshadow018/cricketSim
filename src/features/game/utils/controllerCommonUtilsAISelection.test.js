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
