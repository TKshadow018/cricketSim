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

describe('career schedule and player workflows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('handles default and empty inputs across career utility entry points', () => {
    expect(createDomesticTeamsForCountry('India')).toHaveLength(12);
    expect(createDomesticTeamsForAllCountries().length).toBeGreaterThan(0);
    expect(createGlobalCareerPlayerPool().length).toBeGreaterThan(0);
    expect(assignGlobalPoolPlayersToDomesticTeams({})).toEqual({ domesticTeams: [], globalPlayerPool: [] });
    expect(runCareerAuction({})).toMatchObject({ careerTeam: '', domesticTeams: [], globalPlayerPool: [] });
    expect(buildCareerOffers()).toEqual([]);
    expect(buildCareerSeasonSchedule()).toEqual([]);
    expect(resolveNextCareerMatch()).toBeNull();
    expect(buildCareerStandings()).toEqual({ t20: {}, odi: {}, firstClass: {} });
    expect(getCareerFormatStandings()).toEqual({});
    expect(sortStandings()).toEqual([]);
    expect(applyEndOfSeasonPlayerAbilityUpdates({})).toEqual([]);
    expect(applyDomesticMatchPlayerUpdates({})).toEqual([]);

    const emptyFixture = simulateCareerFixture({
      match: { teamA: 'Team A', teamB: 'Team B', format: 't20' },
    });
    expect(emptyFixture.updatedStats).toEqual({});
    expect(emptyFixture.updatedDomesticTeams).toEqual([]);
    expect(emptyFixture.result.scorecard.previousInnings.battingRows).toEqual([]);
  });

  test('formats known and unknown match formats', () => {
    expect(formatCareerMatchLabel('t20')).toBe('T20');
    expect(formatCareerMatchLabel('firstClass')).toBe('First Class');
    expect(formatCareerMatchLabel('unknown')).toBe('UNKNOWN');
    expect(formatCareerMatchLabel()).toBe('');
  });

  test('creates generated player metadata for a selected role and falls back after faker errors', () => {
    const player = createGeneratedDomesticPlayer({
      id: 'player-1',
      country: 'India',
      playerType: 'wicketkeeper',
    });

    expect(player).toMatchObject({
      id: 'player-1',
      country: 'India',
      playerType: 'wicketkeeper',
      fitness: 100,
    });
    const fakerOptions = createPerson.mock.calls[0][0];
    expect(fakerOptions.custom.find((entry) => entry.field === 'isWicketKeeper').value).toBe(true);
    expect(fakerOptions.custom.find((entry) => entry.field === 'abilityToPlayPaceBall')).toMatchObject({
      min: 40,
      max: 80,
    });
    expect(createPerson).toHaveBeenCalledWith(
      expect.objectContaining({ country: ['India'], minAge: 17, maxAge: 38, gender: 'male' })
    );

    createPerson.mockImplementationOnce(() => {
      throw new Error('faker country not supported');
    });
    const fallbackPlayer = createGeneratedDomesticPlayer({
      id: 'player-2',
      country: 'Unknown',
      playerType: 'bowler pacer',
    });

    expect(fallbackPlayer.id).toBe('player-2');
    expect(fallbackPlayer.country).toBe('Unknown');
    expect(fallbackPlayer.name).toMatch(/\S+ \S+/);
    expect(createPerson).toHaveBeenCalledTimes(3);
  });

  test('generates custom attributes for every player archetype and handles mixed country rows', () => {
    [
      ['batsman', false],
      ['bowler spinner', false],
      ['bowler pacer', false],
      ['wicketkeeper', true],
      ['pace allrounder', false],
      ['spin allrounder', false],
      ['unrecognized role', false],
    ].forEach(([playerType, isWicketKeeper]) => {
      const player = createGeneratedDomesticPlayer({ id: playerType, country: 'India', playerType });
      expect(player).toMatchObject({ id: playerType, playerType });
      const latestCustom = createPerson.mock.calls[createPerson.mock.calls.length - 1][0].custom;
      expect(latestCustom.find((entry) => entry.field === 'isWicketKeeper').value).toBe(isWicketKeeper);
    });

    const teams = createDomesticTeamsForAllCountries([
      'India',
      { name: 'Australia', current_ranking: 0 },
      null,
      { name: '', current_ranking: 1 },
    ]);
    expect(teams).toHaveLength(24);
    expect(teams.find((team) => team.country === 'Australia').countryRank).toBe(999);
  });

  test('selects each generated archetype from the weighted distribution', () => {
    [
      [0, 'batsman'],
      [0.35, 'bowler spinner'],
      [0.45, 'bowler pacer'],
      [0.6, 'wicketkeeper'],
      [0.75, 'pace allrounder'],
      [0.85, 'spin allrounder'],
    ].forEach(([roll, expectedType]) => {
      const random = jest.spyOn(Math, 'random');
      random.mockReturnValueOnce(roll).mockReturnValue(0.5);

      const player = createGeneratedDomesticPlayer({ id: expectedType, country: 'India' });

      expect(player.playerType).toBe(expectedType);
      random.mockRestore();
    });
  });

  test('uses faker-provided nationality when no domestic country is selected', () => {
    createPerson.mockImplementationOnce(({ custom = [] } = {}) => ({
      name: 'Generated Nationality Player',
      country: 'Generated Country',
      ...custom.reduce((attributes, entry) => {
        attributes[entry.field] = entry.type === 'fixed' ? entry.value : entry.min;
        return attributes;
      }, {}),
    }));
    const player = createGeneratedDomesticPlayer({ id: 'generated-country' });

    expect(player.country).toBe('Generated Country');
    expect(createPerson).toHaveBeenCalledWith(expect.objectContaining({
      country: undefined,
      minAge: 17,
      maxAge: 38,
    }));
  });

  test('defaults nationality when both the domestic country and generated country are absent', () => {
    createPerson.mockImplementationOnce(({ custom = [] } = {}) => ({
      name: 'Countryless Player',
      ...custom.reduce((attributes, entry) => {
        attributes[entry.field] = entry.type === 'fixed' ? entry.value : entry.min;
        return attributes;
      }, {}),
    }));

    expect(createGeneratedDomesticPlayer({ id: 'countryless' })).toMatchObject({
      id: 'countryless',
      name: 'Countryless Player',
      country: '',
    });
  });

  test('creates domestic clubs with and without balanced rosters', () => {
    const emptyTeams = createDomesticTeamsForCountry('India', { withPlayers: false });
    expect(emptyTeams).toHaveLength(12);
    expect(emptyTeams.every((team) => team.players.length === 0)).toBe(true);
    expect(new Set(emptyTeams.map((team) => team.location)).size).toBe(12);

    const populatedTeams = createDomesticTeamsForCountry('India', { startId: 9000 });
    expect(populatedTeams).toHaveLength(12);
    expect(populatedTeams.every((team) => team.players.length === 23)).toBe(true);
    expect(populatedTeams.flatMap((team) => team.players)).toHaveLength(276);
    expect(populatedTeams.every((team) => team.players.every((player) => player.country === 'India'))).toBe(true);
    const zeroStartIdTeams = createDomesticTeamsForCountry('India', { withPlayers: true, startId: 0 });
    const zeroStartIds = zeroStartIdTeams.flatMap((team) => team.players).map((player) => Number(player.id));
    expect(Math.min(...zeroStartIds)).toBe(10000);
    expect(Math.max(...zeroStartIds)).toBe(10275);
  });

  test('builds ranked domestic clubs and a country-scaled global player pool', () => {
    const countryRows = [
      { name: 'Lower-ranked Country', current_ranking: 11 },
      { name: 'Top-ranked Country', current_ranking: 1 },
    ];
    const teams = createDomesticTeamsForAllCountries(countryRows);

    expect(teams).toHaveLength(24);
    expect(teams.filter((team) => team.country === 'Top-ranked Country')).toHaveLength(12);
    expect(teams.find((team) => team.country === 'Top-ranked Country').countryRank).toBe(1);
    expect(teams.every((team) => team.players.length === 0)).toBe(true);

    const pool = createGlobalCareerPlayerPool(countryRows);
    expect(pool).toHaveLength((35 + 25) * 12);
    expect(new Set(pool.map((player) => player.id)).size).toBe(pool.length);
    expect(pool.filter((player) => player.country === 'Top-ranked Country')).toHaveLength(35 * 12);
    expect(pool.filter((player) => player.country === 'Lower-ranked Country')).toHaveLength(25 * 12);
    expect(pool.every((player) => player.baseMarketPrice > 0 && Number.isFinite(player.abilityScore))).toBe(true);
  });

  test('estimates fallback market prices across player age bands', () => {
    const players = [20, 27, 28, 32, 33].map((age) => ({
      id: `age-${age}`,
      country: 'India',
      age,
      abilityToPlayPaceBall: 50,
      abilityToPlaySpinBall: 50,
      battingAggresion: 50,
      paceAbility: 20,
      spinAbility: 20,
    }));
    const result = runCareerAuction({
      globalPlayerPool: players,
      leagueCountry: 'India',
    });
    const pricesByAge = Object.fromEntries(
      result.globalPlayerPool.map((player) => [player.age, player.baseMarketPrice])
    );

    expect(pricesByAge[20]).toBeGreaterThan(pricesByAge[27]);
    expect(pricesByAge[27]).toBeGreaterThan(pricesByAge[28]);
    expect(pricesByAge[28]).toBeGreaterThan(pricesByAge[33]);
    expect(result.globalPlayerPool.every((player) => player.baseMarketPrice > 0)).toBe(true);
  });

  test('assigns local and foreign pool players without mutating the source pool', () => {
    const domesticTeams = [
      { id: 'club-1', name: 'Home Club', country: 'India', players: [] },
      {
        id: 'club-2',
        name: 'Already Full',
        country: 'India',
        players: Array.from({ length: 25 }, (_, index) => ({ id: `existing-${index}`, country: 'India' })),
      },
    ];
    const globalPlayerPool = [
      { id: 'local-1', name: 'Local One', country: 'India' },
      { id: 'local-2', name: 'Local Two', country: 'India' },
      { id: 'foreign-1', name: 'Foreign One', country: 'Australia' },
      { id: 'assigned', name: 'Already Assigned', country: 'India', assignedTeamId: 'other-club' },
    ];

    const result = assignGlobalPoolPlayersToDomesticTeams({
      domesticTeams,
      globalPlayerPool,
      countryRows: [{ name: 'India', current_ranking: 11 }],
      stepPerTeam: 2,
      minimumLocalRatio: 0.5,
    });

    const homeClub = result.domesticTeams.find((team) => team.id === 'club-1');
    expect(homeClub.players).toHaveLength(2);
    expect(homeClub.players.filter((player) => player.country === 'India')).toHaveLength(1);
    expect(homeClub.players.find((player) => player.country === 'Australia').assignedTeamId).toBe('club-1');
    expect(result.domesticTeams.find((team) => team.id === 'club-2').players).toHaveLength(25);
    expect(globalPlayerPool.every((player) => !player.assignedTeamId || player.assignedTeamId === 'other-club')).toBe(true);
  });

  test('assigns players with missing identities and skips teams that need no more players', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.999);
    const result = assignGlobalPoolPlayersToDomesticTeams({
      domesticTeams: [
        { id: 'club-1', name: 'No IDs', country: 'India', players: [] },
        {
          id: 'club-2',
          name: 'Already Full',
          country: 'India',
          players: Array.from({ length: 25 }, (_, index) => ({ id: `existing-${index}`, country: 'India' })),
        },
        {
          id: 'club-3',
          name: 'Partially Filled',
          country: 'India',
          players: [{ id: 'existing-foreign', country: 'Australia' }],
        },
      ],
      globalPlayerPool: [
        { id: 'already-assigned', country: 'India', assignedTeamId: 'other-club' },
        { name: 'Local without ID', country: 'India' },
        { id: 'foreign-1', name: 'Foreign Player', country: 'Australia' },
        { id: 'local-2', name: 'Second Local', country: 'India' },
      ],
      countryRows: [{ name: 'India', current_ranking: 11 }],
      stepPerTeam: 2,
      minimumLocalRatio: 0,
    });

    expect(result.domesticTeams[0].players.map(({ name }) => name)).toEqual([
      'Foreign Player',
      'Local without ID',
    ]);
    expect(result.domesticTeams[1].players).toHaveLength(25);
    expect(result.domesticTeams[2].players).toHaveLength(2);
    expect(result.domesticTeams[0].players[1].assignedTeamId).toBe('club-1');
  });

  test('prevents duplicate identities from filling local and foreign assignment slots', () => {
    const result = assignGlobalPoolPlayersToDomesticTeams({
      domesticTeams: [{ id: 'club-1', name: 'Home Club', country: 'India', players: [] }],
      globalPlayerPool: [
        { id: 'duplicate', name: 'Local Player', country: 'India' },
        { id: 'duplicate', name: 'Duplicate Foreign Player', country: 'Australia' },
        { id: 'foreign-1', name: 'Unique Foreign Player', country: 'Australia' },
      ],
      countryRows: [{ name: 'India', current_ranking: 11 }],
      stepPerTeam: 2,
      minimumLocalRatio: 0.5,
    });

    expect(result.domesticTeams[0].players.map(({ id }) => id)).toEqual(['duplicate', 'foreign-1']);
  });

  test('fills roster gaps with foreign players when the local pool cannot meet its target', () => {
    const result = assignGlobalPoolPlayersToDomesticTeams({
      domesticTeams: [{ id: 'club-1', name: 'Home Club', country: 'India', players: [] }],
      globalPlayerPool: [
        { id: 'foreign', name: 'Foreign Player', country: 'Australia' },
        { id: 'local', name: 'Local Player', country: 'India' },
      ],
      countryRows: [{ name: 'India', current_ranking: 11 }],
      stepPerTeam: 2,
      minimumLocalRatio: 1,
    });

    expect(result.domesticTeams[0].players.map(({ id }) => id)).toEqual(['local', 'foreign']);
    expect(result.domesticTeams[0].players[0].country).toBe('India');
    expect(result.domesticTeams[0].players[1].assignedTeamId).toBe('club-1');
  });

  test('creates a capped set of distinct career offers with display labels', () => {
    const offers = buildCareerOffers([
      { name: 'Club A', location: 'A City', country: 'India' },
      { name: 'Club B', country: 'Australia' },
      { name: 'Club C', location: 'C City', country: 'England' },
      { name: 'Club D', country: 'Ireland' },
    ]);

    expect(offers).toHaveLength(3);
    expect(new Set(offers.map((offer) => offer.team)).size).toBe(3);
    offers.forEach((offer) => {
      expect(offer.amountLabel).toBe(`$${offer.amount.toLocaleString('en-US')}`);
      expect(offer.amount).toBeGreaterThan(0);
    });
    expect(buildCareerOffers([], 3)).toEqual([]);
    const fourOffers = buildCareerOffers([
      { name: 'Club A' },
      { name: 'Club B' },
      { name: 'Club C' },
      { name: 'Club D' },
    ], 4);
    expect(fourOffers).toHaveLength(4);
    expect(fourOffers[3].amount).toBeGreaterThan(fourOffers[2].amount);
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

  test('signs a created player during the career auction and records the team result', () => {
    const result = runCareerAuction({
      domesticTeams: [{ id: 'club-1', name: 'Home Club', country: 'India', players: [] }],
      leagueCountry: 'India',
      careerPlayer: { id: 'career-player', name: 'Created Player', country: 'India' },
    });

    expect(result.domesticTeams).toHaveLength(1);
    expect(result.careerTeam).toBe('Home Club');
    expect(result.auctionSummary.teamCount).toBe(1);
    expect(result.auctionSummary.careerPlayerEvent).toMatchObject({
      playerId: 'career-player',
      playerName: 'Created Player',
      isCareerPlayer: true,
      isSold: true,
      winnerTeam: 'Home Club',
    });
    expect(result.globalPlayerPool).toEqual([]);
  });

  test('completes squad auction targets and preserves role minimums', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.99);
    const playerPool = (country, prefix, count) =>
      Array.from({ length: count }, (_, index) => ({
        id: `${prefix}-${index}`,
        name: `${prefix} Player ${index}`,
        country,
        playerType: index < 2 ? 'wicketkeeper' : 'pace allrounder',
        isWicketKeeper: index < 2,
        abilityScore: 340,
        baseMarketPrice: 200000,
        abilityToPlayPaceBall: 70,
        abilityToPlaySpinBall: 70,
        battingAggresion: 70,
        paceAbility: 70,
        spinAbility: 40,
      }));
    const result = runCareerAuction({
      domesticTeams: [{ id: 'club-1', name: 'Home Club', country: 'India', players: [] }],
      globalPlayerPool: [
        ...playerPool('India', 'local', 30),
        ...playerPool('Australia', 'foreign', 12),
      ],
      countryRows: [{ name: 'India', current_ranking: 1 }, { name: 'Australia', current_ranking: 2 }],
      leagueCountry: 'India',
    });
    const team = result.domesticTeams[0];

    expect(team.players).toHaveLength(28);
    expect(result.auctionSummary.budgetTable[0]).toMatchObject({
      domesticPlayers: 20,
      foreignPlayers: 8,
      targetSize: 28,
    });
    expect(team.players.filter((player) => player.isWicketKeeper || player.playerType === 'wicketkeeper').length).toBeGreaterThanOrEqual(2);
    expect(team.players.filter((player) => player.playerType.includes('allrounder')).length).toBeGreaterThanOrEqual(10);
    expect(result.auctionSummary.auctionTimeline.length).toBeGreaterThanOrEqual(28);
    expect(result.auctionSummary.auctionTimeline.some((event) => event.isSold)).toBe(true);
  });

  test('covers auction demand tiers, unsold players, and forced career-player placement', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.999);
    const tieredAuction = runCareerAuction({
      domesticTeams: [{ id: 'club-1', name: 'Home Club', country: 'India', players: [] }],
      globalPlayerPool: [240, 250, 280, 285, 305, 310].map((abilityScore) => ({
        id: `player-${abilityScore}`,
        name: `Player ${abilityScore}`,
        country: 'India',
        playerType: 'batsman',
        abilityScore,
        baseMarketPrice: 200000,
      })),
      countryRows: [{ name: 'India', current_ranking: 1 }],
      leagueCountry: 'India',
    });
    expect(tieredAuction.auctionSummary.auctionTimeline).toHaveLength(6);
    expect(tieredAuction.auctionSummary.auctionTimeline.every((event) => event.isSold)).toBe(true);

    jest.spyOn(Math, 'random').mockReturnValue(0);
    const unsoldAuction = runCareerAuction({
      domesticTeams: [{ id: 'club-2', name: 'Home Club', country: 'India', players: [] }],
      globalPlayerPool: [{
        id: 'unsold',
        name: 'Unsold Player',
        country: 'India',
        playerType: 'fielder',
        abilityScore: 240,
        baseMarketPrice: 200000,
      }],
      countryRows: [{ name: 'India', current_ranking: 1 }],
      leagueCountry: 'India',
    });
    expect(unsoldAuction.auctionSummary.auctionTimeline[0]).toMatchObject({
      playerId: 'unsold',
      isSold: false,
      winnerTeam: '',
    });

    const sparseAuction = runCareerAuction({
      domesticTeams: [{ id: 'club-sparse', name: 'Sparse Club', country: 'India', players: [] }],
      globalPlayerPool: [{ id: 'sparse', name: 'Sparse Player', country: 'India' }],
      leagueCountry: 'India',
    });
    expect(sparseAuction.auctionSummary.auctionTimeline[0]).toMatchObject({
      playerId: 'sparse',
      abilityScore: 0,
      basePrice: 80000,
      isSold: false,
    });

    const forcedCareerPlayer = runCareerAuction({
      domesticTeams: [{ id: 'club-3', name: 'Home Club', country: 'India', players: [] }],
      leagueCountry: 'India',
      careerPlayer: {
        id: 'career-fielder',
        name: 'Career Fielder',
        country: 'India',
        playerType: 'fielder',
      },
    });
    expect(forcedCareerPlayer.auctionSummary.careerPlayerEvent).toMatchObject({
      playerId: 'career-fielder',
      isSold: true,
      winnerTeam: 'Home Club',
    });

    const forcedForeignPlayer = runCareerAuction({
      domesticTeams: [{ id: 'club-4', name: 'Home Club', country: 'India', players: [] }],
      leagueCountry: 'India',
      careerPlayer: {
        id: 'career-foreign',
        name: 'Foreign Career Player',
        country: 'Australia',
        playerType: 'fielder',
      },
    });
    expect(forcedForeignPlayer.auctionSummary.budgetTable[0].foreignPlayers).toBe(1);
    expect(forcedForeignPlayer.auctionSummary.careerPlayerEvent).toMatchObject({
      playerId: 'career-foreign',
      isSold: true,
      winnerTeam: 'Home Club',
    });
  });

  test('stops auction nominations once every team is full and respects foreign squad caps', () => {
    const emptyAuction = runCareerAuction({
      careerPlayer: { id: 'career-only', name: 'Career Player', country: 'India' },
    });
    expect(emptyAuction.auctionSummary.auctionTimeline).toEqual([]);

    jest.spyOn(Math, 'random').mockReturnValue(0.999);
    const players = (country, prefix) => Array.from({ length: 12 }, (_, index) => ({
      id: `${prefix}-${index}`,
      name: `${prefix} Player ${index}`,
      country,
      playerType: 'pace allrounder',
      abilityScore: 340,
      baseMarketPrice: 200000,
    }));
    const result = runCareerAuction({
      domesticTeams: [{ id: 'club-1', name: 'Home Club', country: 'India', players: [] }],
      globalPlayerPool: [...players('India', 'local'), ...players('Australia', 'foreign')],
      leagueCountry: 'India',
    });

    expect(result.auctionSummary.budgetTable[0]).toMatchObject({
      domesticPlayers: 12,
      foreignPlayers: 8,
    });
    expect(result.domesticTeams[0].players).toHaveLength(20);
  });

  test('resolves competing bids and forced-player team ties deterministically', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.999);
    const bidTeams = [
      { id: 'club-a', name: 'Falcons', country: 'India', players: [] },
      { id: 'club-b', name: 'Ravens', country: 'India', players: [] },
    ];
    const bidding = runCareerAuction({
      domesticTeams: bidTeams,
      globalPlayerPool: Array.from({ length: 24 }, (_, index) => ({
        id: `player-${index}`,
        name: `Player ${index}`,
        country: 'India',
        playerType: 'pace allrounder',
        abilityScore: 340,
        baseMarketPrice: 200000,
      })),
      leagueCountry: 'India',
    });

    expect(bidding.auctionSummary.auctionTimeline.some((event) => event.bids.length === 2)).toBe(true);
    expect(new Set(bidding.auctionSummary.budgetTable.map(({ team }) => team))).toEqual(new Set(['Falcons', 'Ravens']));
    expect(bidding.auctionSummary.budgetTable[0].spent).toBeGreaterThanOrEqual(bidding.auctionSummary.budgetTable[1].spent);

    const equalBudgets = runCareerAuction({
      domesticTeams: [
        { id: 'club-b', name: 'Beta Club', country: 'India', players: [] },
        { id: 'club-a', name: 'Alpha Club', country: 'India', players: [] },
      ],
      leagueCountry: 'India',
    });
    expect(equalBudgets.auctionSummary.budgetTable.map(({ team }) => team)).toEqual(['Alpha Club', 'Beta Club']);

    const forcedCareerPlayer = {
      id: 'career-forced',
      name: 'Career Player',
      country: 'India',
      playerType: 'fielder',
    };
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const differentNeeds = runCareerAuction({
      domesticTeams: [
        { id: 'club-india', name: 'India Club', country: 'India', players: [] },
        { id: 'club-australia', name: 'Australia Club', country: 'Australia', players: [] },
      ],
      careerPlayer: forcedCareerPlayer,
    });
    expect(differentNeeds.auctionSummary.careerPlayerEvent.winnerTeam).toBe('India Club');

    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    const tiedNeeds = runCareerAuction({
      domesticTeams: [
        { id: 'club-a', name: 'Alpha Club', country: 'India', players: [] },
        { id: 'club-b', name: 'Beta Club', country: 'India', players: [] },
      ],
      careerPlayer: { ...forcedCareerPlayer, country: 'Australia' },
    });
    expect(tiedNeeds.auctionSummary.careerPlayerEvent.winnerTeam).toBe('Alpha Club');
  });

  test('records a no-bid nomination after the team has filled its role deficits', () => {
    let randomCall = 0;
    jest.spyOn(Math, 'random').mockImplementation(() => {
      randomCall += 1;
      if (randomCall <= 32 || randomCall === 78) {
        return 0.999;
      }
      return 0;
    });
    const rolePlayers = [
      ...Array.from({ length: 2 }, (_, index) => ({
        id: `keeper-${index}`,
        country: 'India',
        playerType: 'wicketkeeper',
        isWicketKeeper: true,
      })),
      ...Array.from({ length: 10 }, (_, index) => ({
        id: `allrounder-${index}`,
        country: 'India',
        playerType: 'pace allrounder',
      })),
      ...Array.from({ length: 3 }, (_, index) => ({
        id: `batter-${index}`,
        country: 'India',
        playerType: 'batsman',
      })),
      { id: 'weak-fielder', country: 'India', playerType: 'fielder', abilityScore: 0, baseMarketPrice: 100000 },
    ].map((player) => ({
      name: player.id,
      abilityScore: 340,
      baseMarketPrice: 200000,
      ...player,
    }));
    rolePlayers[rolePlayers.length - 1].abilityScore = 0;
    const result = runCareerAuction({
      domesticTeams: [{ id: 'club-1', name: 'Home Club', country: 'India', players: [] }],
      globalPlayerPool: rolePlayers,
      leagueCountry: 'India',
    });

    expect(result.auctionSummary.auctionTimeline.find(({ playerId }) => playerId === 'weak-fielder')).toMatchObject({
      isSold: false,
      amount: 0,
    });
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
