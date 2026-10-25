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

describe("career schedules and season progression", () => {
beforeEach(() => {
    jest.clearAllMocks();
  });

afterEach(() => {
    jest.restoreAllMocks();
  });

test('builds full and short season schedules with stable dates and opposing teams', () => {
    const domesticTeams = [{ name: 'Team A' }, { name: 'Team B' }, { name: 'Team C' }];
    const shortSchedule = buildCareerSeasonSchedule('Team A', domesticTeams, 'short', {
      leagueCountry: 'India',
      seasonStartDate: '2024-01-01',
    });
    const fullSchedule = buildCareerSeasonSchedule('Team A', domesticTeams, 'full', {
      seasonStartDate: '2024-01-01',
    });

    expect(shortSchedule).toHaveLength(9);
    expect(fullSchedule).toHaveLength(18);
    expect(shortSchedule.every((match) => match.leagueCountry === 'India')).toBe(true);
    expect(shortSchedule.some((match) => !match.isUserMatch)).toBe(true);
    expect(shortSchedule.filter((match) => match.isUserMatch).every((match) => Boolean(match.opponent))).toBe(true);
    expect(shortSchedule[0]).toMatchObject({
      seasonCycle: 1,
      scheduledDate: '2024-01-01',
      isComplete: false,
    });
    expect(new Set(shortSchedule.map((match) => match.globalMatchNumber)).size).toBe(9);
    const invalidDateSchedule = buildCareerSeasonSchedule('Team A', [...domesticTeams, { name: 'Team D' }], 'standard', {
      seasonStartDate: 'not a date',
    });
    expect(invalidDateSchedule).toHaveLength(18);
    expect(invalidDateSchedule.every((match) => !Number.isNaN(Date.parse(match.scheduledDate)))).toBe(true);
    expect(buildCareerSeasonSchedule(null, domesticTeams)).toEqual([]);
    expect(buildCareerSeasonSchedule('Team A', [{ name: 'Team A' }])).toEqual([]);
  });

test('resolves the next unplayed fixture and handles empty schedules', () => {
    const completed = { id: 'completed', isComplete: true };
    const upcoming = { id: 'upcoming', isComplete: false };

    expect(resolveNextCareerMatch([completed, upcoming])).toBe(upcoming);
    expect(resolveNextCareerMatch([completed])).toBeNull();
    expect(resolveNextCareerMatch()).toBeNull();
  });

test('builds per-format standings from completed wins, ties, unknown formats, and unfinished fixtures', () => {
    const standings = buildCareerStandings(
      'Team A',
      [
        { format: 't20', isComplete: true, teamA: 'Team A', teamB: 'Team B', result: { winner: 'Team A' } },
        { format: 'odi', isComplete: true, teamA: 'Team A', teamB: 'Team C', result: { winner: 'Tie' } },
        { format: 'unexpected', isComplete: true, teamA: 'Team D', teamB: 'Team E', result: { winner: 'Team E' } },
        { format: 'firstClass', isComplete: false, teamA: 'Team A', teamB: 'Team B', result: { winner: 'Team B' } },
        { format: 't20', isComplete: true, teamA: 'Team B', teamB: 'Team C' },
      ],
      [{ name: 'Team A' }, { name: 'Team B' }]
    );

    expect(standings.t20['Team A']).toEqual({ wins: 1, losses: 0, ties: 0, points: 2, played: 1 });
    expect(standings.t20['Team B']).toEqual({ wins: 0, losses: 1, ties: 0, points: 0, played: 1 });
    expect(standings.odi['Team A']).toEqual({ wins: 0, losses: 0, ties: 1, points: 1, played: 1 });
    expect(standings.odi['Team C'].points).toBe(1);
    expect(standings.t20['Team E'].wins).toBe(1);
    expect(standings.firstClass['Team A'].played).toBe(0);
  });

test('selects standings format and sorts standings by points, wins, losses, then team', () => {
    const byFormat = { t20: { TeamA: { points: 3, wins: 1, losses: 0 } }, odi: { TeamB: { points: 2 } } };
    const plainStandings = { TeamC: { points: 1 } };

    expect(getCareerFormatStandings(byFormat, 'odi')).toBe(byFormat.odi);
    expect(getCareerFormatStandings(byFormat, 'firstClass')).toEqual({});
    expect(getCareerFormatStandings(plainStandings)).toBe(plainStandings);
    expect(getCareerFormatStandings(null)).toEqual({});
    expect(sortStandings({
      Zulu: { points: 2, wins: 1, losses: 2 },
      Alpha: { points: 2, wins: 1, losses: 1 },
      Beta: { points: 2, wins: 2, losses: 4 },
      Leader: { points: 3, wins: 0, losses: 0 },
    }).map(({ team }) => team)).toEqual(['Leader', 'Beta', 'Alpha', 'Zulu']);
    expect(sortStandings({
      Zulu: { points: 2, wins: 1, losses: 1 },
      Alpha: { points: 2, wins: 1, losses: 1 },
    }).map(({ team }) => team)).toEqual(['Alpha', 'Zulu']);
    expect(sortStandings()).toEqual([]);
    expect(buildCareerStandings('User Team', [], [{ name: 'Other Team' }]).t20['User Team']).toEqual({
      wins: 0,
      losses: 0,
      ties: 0,
      points: 0,
      played: 0,
    });
  });

test('applies age-based season development and leaderboard bonuses to player abilities', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    const domesticTeams = [
      {
        name: 'Team A',
        players: [
          {
            id: 'career-1',
            name: 'Career Star',
            age: 22,
            playerType: 'batsman',
            abilityToPlayPaceBall: 50,
            abilityToPlaySpinBall: 50,
            battingAggresion: 50,
            paceAbility: 20,
            spinAbility: 20,
          },
        ],
      },
      {
        name: 'Team B',
        players: [
          {
            id: 'veteran-1',
            name: 'Veteran Bowler',
            age: 40,
            playerType: 'bowler pacer',
            abilityToPlayPaceBall: 50,
            abilityToPlaySpinBall: 50,
            battingAggresion: 50,
            paceAbility: 20,
            spinAbility: 20,
          },
        ],
      },
    ];
    const updatedTeams = applyEndOfSeasonPlayerAbilityUpdates({
      domesticTeams,
      currentAge: 25,
      careerTeam: 'Team A',
      careerPlayerProfile: { playerId: 'career-1' },
      careerPlayerStats: {
        star: {
          key: 'Team A::career-1::Career Star',
          name: 'Career Star',
          formatStats: {
            t20: { runs: 500, wickets: 10, balls: 300, runsConceded: 100, matches: 20 },
          },
        },
      },
    });
    const careerPlayer = updatedTeams[0].players[0];
    const veteran = updatedTeams[1].players[0];
    const abilityTotal = (player) =>
      player.abilityToPlayPaceBall +
      player.abilityToPlaySpinBall +
      player.battingAggresion +
      player.paceAbility +
      player.spinAbility;

    expect(abilityTotal(careerPlayer)).toBe(203);
    expect(abilityTotal(veteran)).toBe(170);
    expect(domesticTeams[0].players[0].abilityToPlayPaceBall).toBe(50);
  });

test('applies development across age bands and player roles with tied leaderboards', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    const roster = [
      { id: 'young', name: 'Young Keeper', age: 20, playerType: 'wicketkeeper', isWicketKeeper: true },
      { id: 'prime', name: 'Prime Bowler', age: 28, playerType: 'bowler pacer', paceAbility: 70, spinAbility: 30 },
      { id: 'veteran', name: 'Veteran Allrounder', age: 34, playerType: 'pace allrounder', paceAbility: 30, spinAbility: 20 },
      { id: 'retiring', name: 'Retiring Batter', age: 35, playerType: 'batsman' },
    ].map((player) => ({
      abilityToPlayPaceBall: 50,
      abilityToPlaySpinBall: 50,
      battingAggresion: 50,
      paceAbility: 50,
      spinAbility: 50,
      ...player,
    }));
    const updated = applyEndOfSeasonPlayerAbilityUpdates({
      domesticTeams: [{ name: 'Team A', players: roster }],
      careerPlayerStats: {
        young: {
          key: 'Team A::young::Young Keeper',
          name: 'Young Keeper',
          formatStats: { t20: { runs: 100, wickets: 2, balls: 50, runsConceded: 20, matches: 4 } },
        },
        prime: {
          key: 'Team A::prime::Prime Bowler',
          name: 'Prime Bowler',
          formatStats: {
            t20: { runs: 100, wickets: 2, balls: 50, runsConceded: 20, matches: 4 },
            odi: { runs: 80, wickets: 4, balls: 40, runsConceded: 30, matches: 3 },
          },
        },
        veteran: {
          key: 'Team A::veteran::Veteran Allrounder',
          name: 'Veteran Allrounder',
          formatStats: { firstClass: { runs: 160, wickets: 8, balls: 120, runsConceded: 100, matches: 8 } },
        },
        retiring: {
          key: 'Team A::retiring::Retiring Batter',
          name: 'Retiring Batter',
          formatStats: { t20: { runs: 50, wickets: 0, balls: 40, runsConceded: 0, matches: 2 } },
        },
        extraOne: {
          key: 'Team B::extra-1::Extra One',
          name: 'Extra One',
          formatStats: { t20: { runs: 40, wickets: 1, balls: 30, runsConceded: 20, matches: 2 } },
        },
        extraTwo: {
          key: 'Team B::extra-2::Extra Two',
          name: 'Extra Two',
          formatStats: { t20: { runs: 30, wickets: 1, balls: 20, runsConceded: 15, matches: 1 } },
        },
        extraThree: {
          key: 'Team B::extra-3::Extra Three',
          name: 'Extra Three',
          formatStats: { t20: { runs: 20, wickets: 0, balls: 20, runsConceded: 0, matches: 1 } },
        },
        noKey: { name: 'No Ranking Key', formatStats: { odi: { runs: 40, matches: 1 } } },
        noSeasonStats: {
          key: 'Team A::inactive::Inactive',
          name: 'Inactive',
          formatStats: { t20: { runs: 0, wickets: 0, matches: 0 } },
        },
      },
    })[0].players;
    const abilityTotal = (player) =>
      player.abilityToPlayPaceBall +
      player.abilityToPlaySpinBall +
      player.battingAggresion +
      player.paceAbility +
      player.spinAbility;

    expect(updated.map(abilityTotal)).not.toEqual(roster.map(abilityTotal));
    expect(updated.map((player) => player.id)).toEqual(roster.map((player) => player.id));
  });

test('uses profile-name identity and leaves players unchanged when season development rounds to zero', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    const teams = [{
      name: 'Team A',
      players: [
        { name: 'Career Player', age: 25, playerType: 'spin allrounder', paceAbility: 10, spinAbility: 80 },
        { name: 'Unranked Player', age: 30, playerType: 'batsman', abilityToPlayPaceBall: 45 },
      ],
    }];
    const unchangedBefore = { ...teams[0].players[1] };
    const updated = applyEndOfSeasonPlayerAbilityUpdates({
      domesticTeams: teams,
      careerPlayerProfile: { name: 'Career Player' },
      careerTeam: 'Team A',
    })[0].players;

    expect(updated[0].paceAbility).toBeGreaterThan(10);
    expect(updated[0].spinAbility).toBeGreaterThan(80);
    expect(updated[1]).toMatchObject(unchangedBefore);
  });

test('updates player fitness, morale, form, and abilities from participation, impact, shortlist, and injury', () => {
    const teams = [
      {
        name: 'Team A',
        players: [
          { id: 'winner', name: 'Winner', playerType: 'batsman', abilityToPlayPaceBall: 50, abilityToPlaySpinBall: 50, paceAbility: 10, spinAbility: 10 },
          { id: 'runner-up', name: 'Runner Up', playerType: 'batsman', abilityToPlayPaceBall: 40, abilityToPlaySpinBall: 40, paceAbility: 10, spinAbility: 10 },
        ],
      },
      { name: 'Team B', players: [{ id: 'reserve', name: 'Reserve' }] },
      { name: 'Team C', players: [{ id: 'outside', name: 'Outside' }] },
    ];
    const updated = applyDomesticMatchPlayerUpdates({
      domesticTeams: teams,
      teamAName: 'Team A',
      teamBName: 'Team B',
      teamAXIIds: ['winner'],
      teamBXIIds: ['reserve'],
      momShortlist: [
        { team: 'Team A', playerId: 'winner', name: 'Winner' },
        { team: 'Team A', playerId: 'runner-up', name: 'Runner Up' },
      ],
      matchContributionsByTeam: {
        'Team A': { winner: { didBat: true }, 'Runner Up': { didBowl: true } },
      },
      injuryChance: 0,
    });

    const teamAPlayers = updated.find(({ name }) => name === 'Team A').players;
    const winner = teamAPlayers.find(({ id }) => id === 'winner');
    const runnerUp = teamAPlayers.find(({ id }) => id === 'runner-up');
    const reserve = updated.find(({ name }) => name === 'Team B').players[0];
    const outside = updated.find(({ name }) => name === 'Team C').players[0];

    expect(winner).toMatchObject({ morale: 61, form: 54, confidence: 54 });
    expect(winner.abilityToPlayPaceBall).toBeGreaterThan(50);
    expect(runnerUp).toMatchObject({ morale: 53, form: 48, confidence: 50 });
    expect(runnerUp.abilityToPlayPaceBall).toBeGreaterThan(40);
    expect(reserve).toMatchObject({ morale: 51, form: 50, confidence: 51 });
    expect(outside.fitness).toBe(100);

    jest.spyOn(Math, 'random').mockReturnValue(0);
    const injured = applyDomesticMatchPlayerUpdates({
      domesticTeams: [{ name: 'Team A', players: [{ id: 'injured', name: 'Injured', abilityToPlayPaceBall: 50 }] }],
      teamAName: 'Team A',
      teamAXIIds: ['injured'],
      injuryChance: 1,
    })[0].players[0];
    expect(injured).toMatchObject({ fitness: 90, form: 45, confidence: 46 });
    expect(injured.abilityToPlayPaceBall).toBeLessThan(50);
    expect(applyDomesticMatchPlayerUpdates({ domesticTeams: [{ name: 'Other', players: [] }] })).toEqual([
      { name: 'Other', players: [] },
    ]);
  });

test('matches shortlist and match contributions by either player identity field', () => {
    const updated = applyDomesticMatchPlayerUpdates({
      domesticTeams: [{
        name: 'Team A',
        players: [
          { id: 'id-1', name: 'Name Only', form: 50, morale: 50, confidence: 50 },
          { id: 'id-2', name: 'Id Only', form: 50, morale: 50, confidence: 50 },
          { id: 'id-3', name: 'Bottom', form: 50, morale: 50, confidence: 50 },
          { id: 'id-4', name: 'Unlisted', form: 50, morale: 50, confidence: 50 },
        ],
      }],
      teamAName: 'Team A',
      teamAXIIds: ['id-1'],
      momShortlist: [
        { team: 'Team A', name: 'Name Only' },
        { team: 'Team A', playerId: 'id-2' },
        { team: '', playerId: 'missing', name: 'Invalid Team' },
        { team: 'Team A', name: 'Bottom' },
      ],
      matchContributionsByTeam: {
        'Team A': {
          'Name Only': { didBat: true },
          'id-2': { didBowl: true },
        },
      },
      injuryChance: 0,
    })[0].players;

    expect(updated.find(({ id }) => id === 'id-1')).toMatchObject({ form: 52, morale: 56, confidence: 52 });
    expect(updated.find(({ id }) => id === 'id-2')).toMatchObject({ form: 50, morale: 53, confidence: 50 });
    expect(updated.find(({ id }) => id === 'id-3').form).toBe(48);
    expect(updated.find(({ id }) => id === 'id-4').form).toBe(49);
  });

test('clamps post-match metrics and matches contribution and shortlist data by player name', () => {
    const [team] = applyDomesticMatchPlayerUpdates({
      domesticTeams: [{
        name: 'Team A',
        players: [
          { name: 'Name Only', fitness: 100, morale: 99, form: 99, confidence: 99 },
          { id: 'unlisted', name: 'Unlisted', fitness: 0, morale: 0, form: 0, confidence: 0 },
        ],
      }],
      teamAName: 'Team A',
      teamAXIIds: [],
      momShortlist: [
        { team: 'Team A', name: 'Name Only' },
        { team: 'Team A', playerId: 'other', name: 'Other Player' },
        { team: 'Team A', name: 'Unlisted' },
      ],
      matchContributionsByTeam: {
        'Team A': { 'Name Only': { didBowl: true } },
      },
      injuryChance: 0,
    });

    expect(team.players[0]).toMatchObject({
      fitness: 100,
      morale: 100,
      form: 100,
      confidence: 100,
    });
    expect(team.players[1]).toMatchObject({
      fitness: 5,
      morale: 3,
      form: 0,
      confidence: 0,
    });
  });

test('uses the shortlist identity key when both player identifiers are absent', () => {
    const [team] = applyDomesticMatchPlayerUpdates({
      domesticTeams: [{ name: 'Team A', players: [{}] }],
      teamAName: 'Team A',
      momShortlist: [{ team: 'Team A' }],
      injuryChance: 0,
    });

    expect(team.players[0]).toMatchObject({ fitness: 100, morale: 58, form: 50, confidence: 52 });
  });
});
