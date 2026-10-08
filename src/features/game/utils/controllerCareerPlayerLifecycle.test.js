import { applyDomesticMatchPlayerUpdates, applyEndOfSeasonPlayerAbilityUpdates } from './controllerCareerScheduleUtils';
import { buildPlayingXI, ensurePlayerMeta, getBattingOrderCoeffRange, selectAIPlayingXI } from './controllerCommonUtils';

describe('player lifecycle metadata', () => {
  test('assigns default fitness, morale, form, confidence, and batting-order coefficient within type range', () => {
    const player = ensurePlayerMeta({
      id: 'bat-1',
      name: 'Top Batter',
      playerType: 'batsman',
      abilityToPlayPaceBall: 70,
      abilityToPlaySpinBall: 74,
    });

    const [minCoeff, maxCoeff] = getBattingOrderCoeffRange(player);

    expect(player.fitness).toBe(100);
    expect(player.morale).toBe(50);
    expect(player.form).toBe(50);
    expect(player.confidence).toBe(50);
    expect(player.battingOrderCoeff).toBeGreaterThanOrEqual(minCoeff);
    expect(player.battingOrderCoeff).toBeLessThanOrEqual(maxCoeff);
  });

  test('orders the playing XI by batting-order coefficient before match use', () => {
    const players = [
      { id: 1, name: 'Finisher', battingOrderCoeff: 61 },
      { id: 2, name: 'Opener', battingOrderCoeff: 92 },
      { id: 3, name: 'Bowler', battingOrderCoeff: 14 },
    ];

    const playingXI = buildPlayingXI(players, [1, 2, 3]);

    expect(playingXI.map((player) => player.name)).toEqual(['Opener', 'Finisher', 'Bowler']);
  });

  test('applies domestic recovery, participation penalties, and morale changes after a match', () => {
    const domesticTeams = [
      {
        name: 'Team A',
        players: [
          { id: 'a1', name: 'A One', playerType: 'batsman', fitness: 100, morale: 50, battingOrderCoeff: 90 },
          { id: 'a2', name: 'A Bench', playerType: 'bowler', fitness: 100, morale: 50, battingOrderCoeff: 15 },
        ],
      },
      {
        name: 'Team B',
        players: [
          { id: 'b1', name: 'B One', playerType: 'batsman', fitness: 100, morale: 50, battingOrderCoeff: 88 },
          { id: 'b2', name: 'B Bench', playerType: 'bowler', fitness: 100, morale: 50, battingOrderCoeff: 19 },
        ],
      },
      {
        name: 'Team C',
        players: [{ id: 'c1', name: 'C Recovery', playerType: 'batsman', fitness: 96, morale: 50, battingOrderCoeff: 70 }],
      },
    ];

    const updatedTeams = applyDomesticMatchPlayerUpdates({
      domesticTeams,
      teamAName: 'Team A',
      teamBName: 'Team B',
      teamAXIIds: ['a1'],
      teamBXIIds: ['b1'],
      momShortlist: [
        { team: 'Team A', playerId: 'a1', name: 'A One' },
        { team: 'Team B', playerId: 'b1', name: 'B One' },
      ],
      injuryChance: 0,
    });

    const teamA = updatedTeams.find((team) => team.name === 'Team A');
    const teamB = updatedTeams.find((team) => team.name === 'Team B');
    const teamC = updatedTeams.find((team) => team.name === 'Team C');
    const aOne = teamA.players.find((player) => player.id === 'a1');
    const aBench = teamA.players.find((player) => player.id === 'a2');
    const bOne = teamB.players.find((player) => player.id === 'b1');
    const cRecovery = teamC.players.find((player) => player.id === 'c1');

    expect(aOne.fitness).toBeGreaterThanOrEqual(70);
    expect(aOne.fitness).toBeLessThanOrEqual(90);
    expect(aOne.morale).toBe(61);
    expect(aBench.fitness).toBe(100);
    expect(aBench.morale).toBe(48);
    expect(bOne.fitness).toBeGreaterThanOrEqual(70);
    expect(bOne.fitness).toBeLessThanOrEqual(90);
    expect(bOne.morale).toBe(56);
    expect(cRecovery.fitness).toBe(100);
    expect(cRecovery.morale).toBe(50);
  });

  test('applies MOM ability change only when player batted or bowled', () => {
    const domesticTeams = [
      {
        name: 'Team A',
        players: [
          {
            id: 'a1',
            name: 'Impact Batter',
            playerType: 'batsman',
            abilityToPlayPaceBall: 50,
            abilityToPlaySpinBall: 50,
            battingAggresion: 50,
            paceAbility: 10,
            spinAbility: 10,
            fitness: 100,
            morale: 50,
          },
          {
            id: 'a2',
            name: 'Unused Player',
            playerType: 'batsman',
            abilityToPlayPaceBall: 50,
            abilityToPlaySpinBall: 50,
            battingAggresion: 50,
            paceAbility: 10,
            spinAbility: 10,
            fitness: 100,
            morale: 50,
          },
        ],
      },
      {
        name: 'Team B',
        players: [{ id: 'b1', name: 'B One', playerType: 'batsman', fitness: 100, morale: 50 }],
      },
    ];

    const updatedTeams = applyDomesticMatchPlayerUpdates({
      domesticTeams,
      teamAName: 'Team A',
      teamBName: 'Team B',
      teamAXIIds: ['a1', 'a2'],
      teamBXIIds: ['b1'],
      momShortlist: [
        { team: 'Team A', playerId: 'a1', name: 'Impact Batter' },
        { team: 'Team A', playerId: 'a2', name: 'Unused Player' },
      ],
      matchContributionsByTeam: {
        'Team A': {
          a1: { didBat: true, didBowl: false },
          a2: { didBat: false, didBowl: false },
        },
      },
      injuryChance: 0,
    });

    const teamA = updatedTeams.find((team) => team.name === 'Team A');
    const impact = teamA.players.find((player) => player.id === 'a1');
    const unused = teamA.players.find((player) => player.id === 'a2');

    expect(impact.abilityToPlayPaceBall + impact.abilityToPlaySpinBall + impact.battingAggresion).toBeGreaterThan(150);
    expect(unused.abilityToPlayPaceBall + unused.abilityToPlaySpinBall + unused.battingAggresion).toBe(150);
    expect(impact.form).toBeGreaterThan(unused.form);
    expect(impact.confidence).toBeGreaterThan(unused.confidence);
  });

  test('selects first-match AI XI with keeper, top batters, and top bowlers', () => {
    const roster = [
      { id: 'wk1', name: 'WK One', playerType: 'wicketkeeper', isWicketKeeper: true, abilityToPlayPaceBall: 62, abilityToPlaySpinBall: 60, paceAbility: 10, spinAbility: 10 },
      { id: 'wk2', name: 'WK Two', playerType: 'wicketkeeper', isWicketKeeper: true, abilityToPlayPaceBall: 50, abilityToPlaySpinBall: 51, paceAbility: 8, spinAbility: 8 },
      { id: 'b1', name: 'Bat 1', playerType: 'batsman', abilityToPlayPaceBall: 80, abilityToPlaySpinBall: 82, paceAbility: 10, spinAbility: 10 },
      { id: 'b2', name: 'Bat 2', playerType: 'batsman', abilityToPlayPaceBall: 76, abilityToPlaySpinBall: 75, paceAbility: 10, spinAbility: 10 },
      { id: 'b3', name: 'Bat 3', playerType: 'batsman', abilityToPlayPaceBall: 74, abilityToPlaySpinBall: 73, paceAbility: 10, spinAbility: 10 },
      { id: 'b4', name: 'Bat 4', playerType: 'batsman', abilityToPlayPaceBall: 70, abilityToPlaySpinBall: 70, paceAbility: 10, spinAbility: 10 },
      { id: 'b5', name: 'Bat 5', playerType: 'batsman', abilityToPlayPaceBall: 68, abilityToPlaySpinBall: 69, paceAbility: 10, spinAbility: 10 },
      { id: 'bo1', name: 'Bowler 1', playerType: 'bowler', abilityToPlayPaceBall: 20, abilityToPlaySpinBall: 20, paceAbility: 85, spinAbility: 25 },
      { id: 'bo2', name: 'Bowler 2', playerType: 'bowler', abilityToPlayPaceBall: 18, abilityToPlaySpinBall: 18, paceAbility: 80, spinAbility: 20 },
      { id: 'bo3', name: 'Bowler 3', playerType: 'spin allrounder', abilityToPlayPaceBall: 45, abilityToPlaySpinBall: 48, paceAbility: 20, spinAbility: 78 },
      { id: 'bo4', name: 'Bowler 4', playerType: 'pace allrounder', abilityToPlayPaceBall: 44, abilityToPlaySpinBall: 44, paceAbility: 76, spinAbility: 18 },
      { id: 'bo5', name: 'Bowler 5', playerType: 'pacer', abilityToPlayPaceBall: 15, abilityToPlaySpinBall: 15, paceAbility: 74, spinAbility: 15 },
      { id: 'benchBat', name: 'Bench Bat', playerType: 'batsman', abilityToPlayPaceBall: 52, abilityToPlaySpinBall: 52, paceAbility: 10, spinAbility: 10 },
    ];

    const xiIds = selectAIPlayingXI({ roster });
    const byId = new Map(roster.map((player) => [player.id, player]));
    const selectedPlayers = xiIds.map((id) => byId.get(id)).filter(Boolean);
    const availableBowlerAllrounders = roster.filter((player) =>
      ['bowler', 'pacer', 'spiner', 'spinner', 'allrounder'].some((token) =>
        String(player.playerType || '').toLowerCase().includes(token)
      )
    ).length;
    const selectedBatsmen = selectedPlayers.filter((player) => player.playerType === 'batsman');
    const selectedBowlerAllrounders = selectedPlayers.filter((player) =>
      ['bowler', 'pacer', 'spiner', 'spinner', 'spin allrounder', 'pace allrounder'].some((token) =>
        String(player.playerType || '').toLowerCase().includes(token)
      )
    );

    expect(xiIds).toHaveLength(11);
    expect(new Set(xiIds).size).toBe(11);
    expect(xiIds).toContain('wk1');
    expect(selectedBatsmen.length).toBeGreaterThanOrEqual(3);
    expect(selectedBatsmen.length).toBeLessThanOrEqual(4);
    expect(selectedBowlerAllrounders.length).toBeGreaterThanOrEqual(Math.min(6, availableBowlerAllrounders));
    expect(selectedBowlerAllrounders.length).toBeLessThanOrEqual(7);
    expect(xiIds).toEqual(expect.arrayContaining(['b1', 'b2', 'b3']));
    expect(xiIds).toEqual(expect.arrayContaining(['bo1', 'bo2', 'bo3', 'bo4', 'bo5']));
  });

  test('replaces low fitness, low morale, poor batters, and worst bowler from previous match XI', () => {
    const originalMathRandom = Math.random;
    Math.random = () => 0;

    try {
      const roster = [
        { id: 'wk1', name: 'WK One', playerType: 'wicketkeeper', isWicketKeeper: true, abilityToPlayPaceBall: 55, abilityToPlaySpinBall: 55, paceAbility: 10, spinAbility: 10, fitness: 90, morale: 40 },
        { id: 'wk2', name: 'WK Two', playerType: 'wicketkeeper', isWicketKeeper: true, abilityToPlayPaceBall: 48, abilityToPlaySpinBall: 48, paceAbility: 10, spinAbility: 10, fitness: 90, morale: 40 },
        { id: 'b1', name: 'Bat 1', playerType: 'batsman', abilityToPlayPaceBall: 80, abilityToPlaySpinBall: 80, paceAbility: 10, spinAbility: 10, fitness: 92, morale: 40 },
        { id: 'b2', name: 'Bat 2', playerType: 'batsman', abilityToPlayPaceBall: 78, abilityToPlaySpinBall: 78, paceAbility: 10, spinAbility: 10, fitness: 88, morale: 5 },
        { id: 'b3', name: 'Bat 3', playerType: 'batsman', abilityToPlayPaceBall: 76, abilityToPlaySpinBall: 76, paceAbility: 10, spinAbility: 10, fitness: 20, morale: 40 },
        { id: 'b4', name: 'Bat 4', playerType: 'batsman', abilityToPlayPaceBall: 74, abilityToPlaySpinBall: 74, paceAbility: 10, spinAbility: 10, fitness: 87, morale: 40 },
        { id: 'b5', name: 'Bat 5', playerType: 'batsman', abilityToPlayPaceBall: 72, abilityToPlaySpinBall: 72, paceAbility: 10, spinAbility: 10, fitness: 86, morale: 40 },
        { id: 'b6', name: 'Bat 6', playerType: 'batsman', abilityToPlayPaceBall: 84, abilityToPlaySpinBall: 83, paceAbility: 10, spinAbility: 10, fitness: 95, morale: 40 },
        { id: 'bo1', name: 'Bowler 1', playerType: 'bowler', abilityToPlayPaceBall: 20, abilityToPlaySpinBall: 20, paceAbility: 65, spinAbility: 25, fitness: 89, morale: 40 },
        { id: 'bo2', name: 'Bowler 2', playerType: 'bowler', abilityToPlayPaceBall: 20, abilityToPlaySpinBall: 20, paceAbility: 66, spinAbility: 25, fitness: 89, morale: 40 },
        { id: 'bo3', name: 'Bowler 3', playerType: 'bowler', abilityToPlayPaceBall: 20, abilityToPlaySpinBall: 20, paceAbility: 67, spinAbility: 25, fitness: 89, morale: 40 },
        { id: 'bo4', name: 'Bowler 4', playerType: 'bowler', abilityToPlayPaceBall: 20, abilityToPlaySpinBall: 20, paceAbility: 68, spinAbility: 25, fitness: 89, morale: 40 },
        { id: 'bo5', name: 'Bowler 5', playerType: 'bowler', abilityToPlayPaceBall: 20, abilityToPlaySpinBall: 20, paceAbility: 69, spinAbility: 25, fitness: 89, morale: 40 },
        { id: 'bo6', name: 'Bowler 6', playerType: 'bowler', abilityToPlayPaceBall: 20, abilityToPlaySpinBall: 20, paceAbility: 78, spinAbility: 30, fitness: 94, morale: 40 },
        { id: 'bo7', name: 'Bowler 7', playerType: 'bowler', abilityToPlayPaceBall: 18, abilityToPlaySpinBall: 18, paceAbility: 82, spinAbility: 32, fitness: 94, morale: 40 },
      ];

      const previousXIIds = ['wk1', 'b1', 'b2', 'b3', 'b4', 'b5', 'bo1', 'bo2', 'bo3', 'bo4', 'bo5'];
      const lastMatchPerformanceById = {
        b1: { runs: 42, wickets: 0 },
        b2: { runs: 8, wickets: 0 },
        b3: { runs: 6, wickets: 0 },
        b4: { runs: 25, wickets: 0 },
        b5: { runs: 14, wickets: 0 },
        bo1: { runs: 3, wickets: 0 },
        bo2: { runs: 1, wickets: 2 },
        bo3: { runs: 1, wickets: 1 },
        bo4: { runs: 1, wickets: 3 },
        bo5: { runs: 1, wickets: 2 },
      };

      const xiIds = selectAIPlayingXI({
        roster,
        previousXIIds,
        lastMatchPerformanceById,
      });

      expect(xiIds).toHaveLength(11);
      expect(xiIds).not.toContain('b2');
      expect(xiIds).not.toContain('b3');
      expect(xiIds).not.toContain('bo1');
      expect(xiIds).toContain('b6');
      expect(xiIds).toContain('bo7');
    } finally {
      Math.random = originalMathRandom;
    }
  });

  test('can replace unavailable allrounder with batsman when selected batsmen are below four', () => {
    const roster = [
      { id: 'wk1', name: 'WK One', playerType: 'wicketkeeper', isWicketKeeper: true, abilityToPlayPaceBall: 55, abilityToPlaySpinBall: 55, paceAbility: 10, spinAbility: 10, fitness: 90, morale: 40 },
      { id: 'b1', name: 'Bat 1', playerType: 'batsman', abilityToPlayPaceBall: 80, abilityToPlaySpinBall: 80, paceAbility: 10, spinAbility: 10, fitness: 92, morale: 40 },
      { id: 'b2', name: 'Bat 2', playerType: 'batsman', abilityToPlayPaceBall: 78, abilityToPlaySpinBall: 78, paceAbility: 10, spinAbility: 10, fitness: 92, morale: 40 },
      { id: 'b3', name: 'Bat 3', playerType: 'batsman', abilityToPlayPaceBall: 76, abilityToPlaySpinBall: 76, paceAbility: 10, spinAbility: 10, fitness: 92, morale: 40 },
      { id: 'ar1', name: 'AR One', playerType: 'pace allrounder', abilityToPlayPaceBall: 70, abilityToPlaySpinBall: 70, paceAbility: 68, spinAbility: 30, fitness: 85, morale: 5 },
      { id: 'bo1', name: 'Bowler 1', playerType: 'bowler', abilityToPlayPaceBall: 20, abilityToPlaySpinBall: 20, paceAbility: 66, spinAbility: 25, fitness: 89, morale: 40 },
      { id: 'bo2', name: 'Bowler 2', playerType: 'bowler', abilityToPlayPaceBall: 20, abilityToPlaySpinBall: 20, paceAbility: 65, spinAbility: 25, fitness: 89, morale: 40 },
      { id: 'bo3', name: 'Bowler 3', playerType: 'bowler', abilityToPlayPaceBall: 20, abilityToPlaySpinBall: 20, paceAbility: 64, spinAbility: 25, fitness: 89, morale: 40 },
      { id: 'bo4', name: 'Bowler 4', playerType: 'bowler', abilityToPlayPaceBall: 20, abilityToPlaySpinBall: 20, paceAbility: 63, spinAbility: 25, fitness: 89, morale: 40 },
      { id: 'bo5', name: 'Bowler 5', playerType: 'bowler', abilityToPlayPaceBall: 20, abilityToPlaySpinBall: 20, paceAbility: 62, spinAbility: 25, fitness: 89, morale: 40 },
      { id: 'bo6', name: 'Bowler 6', playerType: 'bowler', abilityToPlayPaceBall: 20, abilityToPlaySpinBall: 20, paceAbility: 61, spinAbility: 25, fitness: 89, morale: 40 },
      { id: 'b4', name: 'Bat 4', playerType: 'batsman', abilityToPlayPaceBall: 82, abilityToPlaySpinBall: 82, paceAbility: 10, spinAbility: 10, fitness: 95, morale: 40 },
      { id: 'ar2', name: 'AR Two', playerType: 'spin allrounder', abilityToPlayPaceBall: 68, abilityToPlaySpinBall: 68, paceAbility: 30, spinAbility: 67, fitness: 95, morale: 40 },
    ];

    const previousXIIds = ['wk1', 'b1', 'b2', 'b3', 'ar1', 'bo1', 'bo2', 'bo3', 'bo4', 'bo5', 'bo6'];
    const xiIds = selectAIPlayingXI({
      roster,
      previousXIIds,
    });

    expect(xiIds).toContain('b4');
    expect(xiIds).not.toContain('ar1');
  });

  test('applies end-of-season age and leaderboard bonuses to abilities', () => {
    const originalMathRandom = Math.random;
    Math.random = () => 0;

    try {
      const domesticTeams = [
        {
          name: 'Team A',
          players: [
            {
              id: 'a1',
              name: 'Young Star',
              age: 19,
              playerType: 'batsman',
              abilityToPlayPaceBall: 50,
              abilityToPlaySpinBall: 50,
              battingAggresion: 50,
              paceAbility: 10,
              spinAbility: 10,
            },
          ],
        },
      ];

      const careerPlayerStats = {
        'Team A::a1::Young Star': {
          key: 'Team A::a1::Young Star',
          name: 'Young Star',
          team: 'Team A',
          formatStats: {
            t20: { runs: 500, wickets: 0, balls: 300, ballsBowled: 0, runsConceded: 0, matches: 12 },
          },
        },
      };

      const updated = applyEndOfSeasonPlayerAbilityUpdates({
        domesticTeams,
        careerPlayerStats,
        currentAge: 19,
        careerTeam: 'Team A',
        careerPlayerProfile: { playerId: 'a1', name: 'Young Star' },
      });

      const player = updated[0].players[0];
      expect(player.abilityToPlayPaceBall).toBeGreaterThan(50);
      expect(player.abilityToPlaySpinBall).toBeGreaterThan(50);
      expect(player.battingAggresion).toBeGreaterThan(50);
    } finally {
      Math.random = originalMathRandom;
    }
  });
});