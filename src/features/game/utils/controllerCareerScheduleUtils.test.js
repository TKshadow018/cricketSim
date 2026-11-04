import { createPerson } from 'faker-user';
import BangladeshPlayers from '../../../gameData/players/Bangladesh';
import IndiaPlayers from '../../../gameData/players/India';
import { skillList } from '../../../gameData/skillList';
import { resolveDomesticTargetPerTeam } from './careerPlayerProgressionUtils';
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

describe("career player generation and assignment", () => {
beforeEach(() => {
    jest.clearAllMocks();
  });

afterEach(() => {
    jest.restoreAllMocks();
  });

test('handles default and empty inputs across career utility entry points', () => {
    expect(createDomesticTeamsForCountry('India')).toHaveLength(12);
    const domesticTeams = createDomesticTeamsForAllCountries();
    expect(domesticTeams.length).toBeGreaterThan(0);
    expect(domesticTeams.every((team) => team.players.some((player) => player.isNationalTeamPlayer))).toBe(true);
    const nationalPlayers = domesticTeams.flatMap((team) =>
      team.players.filter((player) => player.isNationalTeamPlayer)
    );
    expect(new Set(nationalPlayers.map((player) => player.id)).size).toBe(nationalPlayers.length);
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

test('creates generated player metadata using the faker-provided name', () => {
    createPerson.mockImplementationOnce(({ country } = {}) => ({
      name: `${country[0]} Generated Player`,
      country: country[0],
    }));
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
      name: 'India Generated Player',
      skills: expect.any(Array),
    });
    expect(player.skills.length).toBeLessThanOrEqual(2);
    expect(player.skills.every((skillName) =>
      skillList.find((skill) => skill.name === skillName).affects !== 'bowling'
    )).toBe(true);
    const fakerOptions = createPerson.mock.calls[0][0];
    expect(fakerOptions.custom.find((entry) => entry.field === 'isWicketKeeper').value).toBe(true);
    expect(fakerOptions.custom.find((entry) => entry.field === 'abilityToPlayPaceBall')).toMatchObject({
      min: 40,
      max: 80,
    });
    expect(createPerson).toHaveBeenCalledWith(
      expect.objectContaining({ country: ['India'], minAge: 17, maxAge: 38, gender: 'male' })
    );

  });

test('surfaces faker generation errors instead of silently retrying without a country', () => {
    createPerson.mockImplementationOnce(() => {
      throw new Error('faker country not supported');
    });

    expect(() => createGeneratedDomesticPlayer({
      id: 'player-2',
      country: 'Unknown',
      playerType: 'bowler pacer',
    })).toThrow('faker country not supported');
    expect(createPerson).toHaveBeenCalledTimes(1);
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
      expect(player).toMatchObject({ id: playerType, playerType, skills: expect.any(Array) });
      expect(player.skills.length).toBeLessThanOrEqual(2);
      const skillTypes = player.skills.map((skillName) =>
        skillList.find((skill) => skill.name === skillName).affects
      );
      expect(skillTypes.some((type) =>
        (playerType === 'batsman' && type === 'bowling') ||
        (['bowler pacer', 'bowler spinner'].includes(playerType) && type === 'batting')
      )).toBe(false);
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
    expect(populatedTeams.every((team) =>
      team.players.every((player) => Array.isArray(player.skills) && player.skills.length <= 2)
    )).toBe(true);
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
    expect(pool.every((player) => Array.isArray(player.skills) && player.skills.length <= 2)).toBe(true);
  });

test('distributes every national roster across its domestic clubs with unique career ids', () => {
    const countryRows = [
      { name: 'Bangladesh', current_ranking: 9 },
      { name: 'India', current_ranking: 1 },
    ];
    const teams = createDomesticTeamsForAllCountries(countryRows);
    const nationalPlayers = teams.flatMap((team) =>
      team.players.filter((player) => player.isNationalTeamPlayer)
    );

    expect(teams).toHaveLength(24);
    expect(teams.every((team) => team.players.some((player) => player.isNationalTeamPlayer))).toBe(true);
    expect(nationalPlayers).toHaveLength(BangladeshPlayers.length + IndiaPlayers.length);
    expect(new Set(nationalPlayers.map((player) => player.id)).size).toBe(nationalPlayers.length);
    expect(nationalPlayers.every((player) => player.skills.length <= 2)).toBe(true);
    expect(nationalPlayers.find((player) => player.name === 'Virat Kohli').skills).toContain('CoverDriveArtist');
    expect(nationalPlayers.filter((player) => player.country === 'Bangladesh').map((player) => player.name).sort())
      .toEqual(BangladeshPlayers.map((player) => player.name).sort());
    expect(nationalPlayers.filter((player) => player.country === 'India').map((player) => player.name).sort())
      .toEqual(IndiaPlayers.map((player) => player.name).sort());
  });

test('keeps national players while filling domestic clubs to their roster limit', () => {
    const countryRows = [{ name: 'Bangladesh', current_ranking: 9 }];
    const teams = createDomesticTeamsForAllCountries(countryRows);
    const playerPool = Array.from({ length: 420 }, (_, index) => ({
      id: `career-pool-${index}`,
      name: `Career Pool Player ${index}`,
      country: 'Bangladesh',
      playerType: 'pace allrounder',
    }));
    const result = assignGlobalPoolPlayersToDomesticTeams({
      domesticTeams: teams,
      globalPlayerPool: playerPool,
      countryRows,
      stepPerTeam: 100,
    });
    const rosterLimit = resolveDomesticTargetPerTeam(9);

    expect(result.domesticTeams.every((team) => team.players.length === rosterLimit)).toBe(true);
    expect(result.domesticTeams.every((team) => team.players.some((player) => player.isNationalTeamPlayer))).toBe(true);
    expect(result.domesticTeams.every((team) => team.players.length <= rosterLimit)).toBe(true);
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
});
