import { createPerson } from 'faker-user';
import {
  assignGlobalPoolPlayersToDomesticTeams,
  buildCareerOffers,
  buildCareerSeasonSchedule,
  buildCareerStandings,
  applyEndOfSeasonPlayerAbilityUpdates,
  applyDomesticMatchPlayerUpdates,
  createDomesticTeamsForAllCountries,
  createDomesticTeamsForCountry,
  createGeneratedDomesticPlayer,
  createGlobalCareerPlayerPool,
  formatCareerMatchLabel,
  getCareerFormatStandings,
  resolveNextCareerMatch,
  runCareerAuction,
  simulateCareerFixture,
  sortStandings,
} from './controllerCareerScheduleUtils';

jest.mock('faker-user', () => ({
  createPerson: jest.fn(({ country, custom = [] } = {}) => ({
    name: 'Generated Player',
    age: 20,
    ...(country ? { fakerCountry: country[0] } : {}),
    ...custom.reduce((attributes, entry) => {
      attributes[entry.field] = entry.type === 'fixed' ? entry.value : entry.min;
      return attributes;
    }, {}),
  })),
}));

describe("career fixture simulation", () => {
beforeEach(() => {
    jest.clearAllMocks();
  });

afterEach(() => {
    jest.restoreAllMocks();
  });

test('simulates a playerless career fixture and records the created player contribution', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const result = simulateCareerFixture({
      match: { format: 'firstClass', teamA: 'Team A', teamB: 'Team B', isUserMatch: true },
      careerTeam: 'Team A',
      careerPlayerProfile: { name: 'New Player' },
      seasonNumber: 2,
    });

    const playerStats = result.updatedStats['career-player-new-player'];
    expect(result.result.winner).toBe('Tie');
    expect(result.result.teamAScore).toBe(result.result.teamBScore);
    expect(result.result.scorecard.previousInnings.title).toContain('Team A');
    expect(result.result.scorecard.currentInnings.title).toContain('Team B');
    expect(playerStats).toMatchObject({
      team: 'Team A',
      name: 'New Player',
      runs: 0,
      balls: 20,
      outs: 1,
      wickets: 0,
      ballsBowled: 0,
      runsConceded: 0,
      matches: 1,
      season: 2,
    });
  });

test.each(['t20', 'odi', 'firstClass'])(
    'records an unbeaten created-player contribution in %s when no domestic rosters exist',
    (format) => {
      jest.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.99).mockReturnValue(0.99);
      const result = simulateCareerFixture({
        match: { format, teamA: 'Team A', teamB: 'Team B', isUserMatch: true },
        careerTeam: 'Team A',
        careerPlayerProfile: { name: 'Created Batter' },
      });
      const playerStats = result.updatedStats['career-player-created-batter'];

      expect(playerStats).toMatchObject({
        team: 'Team A',
        name: 'Created Batter',
        outs: 0,
        matches: 1,
      });
      expect(playerStats.runs).toBeGreaterThan(0);
      expect(playerStats.balls).toBeGreaterThan(0);
    }
  );

test('uses fallback format ranges and non-tie results when a fixture has no team rosters', () => {
    jest.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.99).mockReturnValue(0.5);
    const result = simulateCareerFixture({
      match: { format: 'unknown', teamA: 'Team A', teamB: 'Team B', isUserMatch: false },
      careerTeam: 'Team A',
      careerPlayerProfile: { name: 'Unregistered Player' },
      domesticTeams: null,
      existingStats: null,
      previousFixturesByTeam: null,
    });

    expect(result.result).toMatchObject({
      winner: 'Team B',
      teamAScore: 120,
      teamBScore: 239,
      summary: 'UNKNOWN: Team B won by 5 runs',
    });
    expect(result.result.scorecard.previousInnings.battingRows).toEqual([]);
    expect(result.result.scorecard.currentInnings.bowlingRows).toEqual([]);
    expect(result.updatedStats).toEqual({});
    expect(result.updatedDomesticTeams).toEqual([]);
  });

test('simulates both team scorecards, player statistics, and post-match squad updates', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    const createRoster = (prefix) =>
      Array.from({ length: 11 }, (_, index) => ({
        id: `${prefix}-${index + 1}`,
        name: `${prefix} Player ${index + 1}`,
        playerType: index === 0 ? 'wicketkeeper' : index < 5 ? 'bowler pacer' : 'batsman',
        isWicketKeeper: index === 0,
        abilityToPlayPaceBall: 60,
        abilityToPlaySpinBall: 55,
        battingAggresion: 60,
        paceAbility: index < 5 ? 65 : 15,
        spinAbility: 15,
        battingOrderCoeff: 100 - index,
        fitness: 100,
        morale: 50,
      }));
    const domesticTeams = [
      { id: 'a', name: 'Team A', country: 'India', players: createRoster('a') },
      { id: 'b', name: 'Team B', country: 'Australia', players: createRoster('b') },
    ];
    const result = simulateCareerFixture({
      match: { format: 't20', teamA: 'Team A', teamB: 'Team B', isUserMatch: false },
      careerTeam: 'Team A',
      domesticTeams,
      seasonNumber: 3,
      previousFixturesByTeam: {
        'Team A': {
          result: {
            scorecard: {
              previousInnings: {
                title: 'Team A Innings',
                battingRows: [{ playerId: 'a-1', name: 'a Player 1', runs: 40 }],
                bowlingRows: [],
              },
            },
          },
        },
      },
    });

    expect(result.result.scorecard.previousInnings.battingRows).toHaveLength(11);
    expect(result.result.scorecard.currentInnings.battingRows).toHaveLength(11);
    expect(result.result.scorecard.previousInnings.bowlingRows.length).toBeGreaterThan(0);
    expect(Object.keys(result.updatedStats)).toHaveLength(22);
    expect(result.updatedStats['Team A::a-1::a Player 1']).toMatchObject({
      team: 'Team A',
      playerId: 'a-1',
      matches: 1,
      season: 3,
    });
    expect(result.updatedDomesticTeams).toHaveLength(2);
    expect(result.updatedDomesticTeams.flatMap((team) => team.players).every((player) => player.fitness <= 100)).toBe(true);
  });

test('simulates a fixture with only one available roster and uses its players to bowl both innings', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    const roster = Array.from({ length: 3 }, (_, index) => ({
      id: `a-${index}`,
      name: `Team A Player ${index}`,
      playerType: 'batsman',
    }));
    const result = simulateCareerFixture({
      match: { format: 'odi', teamA: 'Team A', teamB: 'Team B' },
      domesticTeams: [
        { name: 'Team A', players: roster },
        { name: 'Team B', players: [] },
      ],
    });

    expect(result.result.scorecard.previousInnings.battingRows).toHaveLength(3);
    expect(result.result.scorecard.previousInnings.bowlingRows).toHaveLength(3);
    expect(result.updatedStats).toHaveProperty('Team A::a-0::Team A Player 0');
    expect(Object.keys(result.updatedStats)).toHaveLength(3);
  });

test('reuses sparse player records and resolves prior scorecards by partial team titles', () => {
    jest.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.999).mockReturnValue(0.999);
    const priorPlayerStats = {
      key: 'Team A::Team A-sim-2::Player 2',
      playerId: 'Team A-sim-2',
      team: 'Team A',
      name: 'Player 2',
      playerType: '',
      isWicketKeeper: false,
      paceAbility: 0,
      spinAbility: 0,
      abilityToPlayPaceBall: 0,
      abilityToPlaySpinBall: 0,
      fitness: null,
      morale: null,
      battingOrderCoeff: 0,
      runs: 0,
      outs: 0,
      wickets: 0,
      balls: 0,
      ballsBowled: 0,
      runsConceded: 0,
      matches: 0,
      formatStats: {
        odi: { runs: 0, outs: 0, wickets: 0, balls: 0, ballsBowled: 0, runsConceded: 0, matches: 0 },
      },
    };
    const result = simulateCareerFixture({
      match: { format: 'odi', teamA: 'Team A', teamB: 'Team B', isUserMatch: false },
      domesticTeams: [
        {
          name: 'Team A',
          players: [
            { playerType: 'batsman', abilityToPlayPaceBall: 0, abilityToPlaySpinBall: 0, paceAbility: 0, spinAbility: 0 },
            { id: 'a-good', name: 'A Good', playerType: 'bowler', paceAbility: 50 },
          ],
        },
        {
          name: 'Team B',
          players: [{ id: 'b-batter', name: 'B Batter' }, { id: 'b-bowler', name: 'B Bowler', playerType: 'bowler' }],
        },
      ],
      existingStats: { 'Team A::Team A-sim-2::Player 2': priorPlayerStats },
      previousFixturesByTeam: {
        'Team A': {
          result: {
            scorecard: {
              previousInnings: {
                title: 'Previous scorecard for Team A',
                battingRows: [{ runs: 10 }, { playerId: 'a-good', name: 'A Good', runs: 20 }],
                bowlingRows: [{ wickets: 1 }],
              },
            },
          },
        },
        'Team B': {
          result: {
            scorecard: {
              currentInnings: {
                title: 'Team B Innings',
                battingRows: [{ playerId: 'b-batter', name: 'B Batter', runs: 15 }],
                bowlingRows: [{ playerId: 'b-bowler', name: 'B Bowler', wickets: 2 }],
              },
            },
          },
        },
      },
    });

    expect(result.result).toMatchObject({
      winner: 'Team B',
      teamAScore: 180,
      teamBScore: 360,
      summary: 'ODI: Team B won by 8 wickets',
    });
    expect(result.updatedStats['Team A::Team A-sim-2::Player 2']).toMatchObject({
      team: 'Team A',
      name: 'Player 2',
      fitness: 100,
      morale: 50,
      matches: 1,
      formatStats: { odi: { matches: 1 } },
    });
  });

test('ignores malformed overs when deriving match contributions from scorecards', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    const commonUtils = require('./controllerCommonUtils');
    const originalBuildScorecard = commonUtils.buildScorecard;
    jest.spyOn(commonUtils, 'buildScorecard').mockImplementation((title, state, inningsView, overs) => ({
      ...originalBuildScorecard(title, state, inningsView, overs),
      battingRows: null,
      bowlingRows: inningsView.bowlingRows.map((row) => ({ ...row, overs: 'invalid.overs' })),
    }));
    const result = simulateCareerFixture({
      match: { format: 't20', teamA: 'Team A', teamB: 'Team B', isUserMatch: false },
      domesticTeams: [
        { name: 'Team A', players: [{ id: 'a-1', name: 'A Player', playerType: 'batsman' }] },
        { name: 'Team B', players: [{ id: 'b-1', name: 'B Player', playerType: 'batsman' }] },
      ],
    });

    expect(result.updatedStats['Team A::a-1::A Player'].ballsBowled).toBe(0);
    expect(result.updatedStats['Team B::b-1::B Player'].ballsBowled).toBe(0);
  });

test('handles zero-run and zero-ball rows in a highly uneven batting lineup', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.999);
    const createUnevenRoster = (prefix) => [
      { id: `${prefix}-weak`, name: `${prefix} Weak`, playerType: 'batsman', battingOrderCoeff: 100 },
      { id: `${prefix}-keeper`, name: `${prefix} Keeper`, playerType: 'wicketkeeper', isWicketKeeper: true, battingOrderCoeff: 1 },
      ...Array.from({ length: 9 }, (_, index) => ({
        id: `${prefix}-${index}`,
        name: `${prefix} Batter ${index}`,
        playerType: 'batsman',
        battingOrderCoeff: 90 - index,
        abilityToPlayPaceBall: 1000,
        abilityToPlaySpinBall: 1000,
        paceAbility: 10,
        spinAbility: 10,
      })),
    ];
    const result = simulateCareerFixture({
      match: { format: 't20', teamA: 'Team A', teamB: 'Team B', isUserMatch: false },
      domesticTeams: [
        { name: 'Team A', players: createUnevenRoster('a') },
        { name: 'Team B', players: createUnevenRoster('b') },
      ],
    });

    const weakBatter = result.result.scorecard.previousInnings.battingRows.find(({ playerId }) => playerId === 'a-weak');
    expect(weakBatter).toMatchObject({ balls: 0, runs: 0, strikeRate: '0.00' });
  });
});
