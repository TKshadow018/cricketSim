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

describe("career auction", () => {
beforeEach(() => {
    jest.clearAllMocks();
  });

afterEach(() => {
    jest.restoreAllMocks();
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
});
