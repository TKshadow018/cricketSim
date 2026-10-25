import { matchStatusEnum } from "../../../../gameData/matchStatusEnum";
import { domesticTeams, makeFlow, makePlayers, resetCareerFlowMocks } from "./controllerCareerTestSupport";

describe("career offseason transfers and awards", () => {
  beforeEach(resetCareerFlowMocks);
  afterEach(() => jest.restoreAllMocks());

test('builds fallback transfer offers from flat standings when the career team is absent', () => {
    const run = makeFlow({
      stage: matchStatusEnum.MatchEnd,
      careerTeam: 'Unlisted Club',
      careerPlayerProfile: null,
      careerDomesticTeams: [{ name: 'Falcons' }, { name: 'Ravens' }],
      careerStandings: {
        Falcons: { points: 10 },
        Ravens: { points: 20 },
      },
    });

    run.flow.handleCareerMatchPrimaryAction();

    const offerAction = run.dispatch.mock.calls
      .map(([action]) => action)
      .find((action) => action.type === 'setCareerOffersAction');
    expect(offerAction.payload).toContainEqual(expect.objectContaining({
      team: 'Unlisted Club',
      location: '',
      country: '',
      isCurrentTeam: true,
      offerType: 'stay',
    }));
    const transferOffers = offerAction.payload.filter(({ isCurrentTeam }) => !isCurrentTeam);
    expect(transferOffers).toHaveLength(1);
    expect(['Falcons', 'Ravens']).toContain(transferOffers[0].team);
    expect(transferOffers[0]).toMatchObject({ location: '', country: '' });
  });

test('processes offseason progression, transfers, assignment, and retirement', () => {
    const { flow, dispatch } = makeFlow({
      careerPlayerStats: {
        batter: { playerId: 'Falcons-1', name: 'Falcons Player 1', team: 'Falcons', runs: 180, outs: 5, balls: 120, matches: 5 },
        bowler: { playerId: 'Ravens-2', name: 'Ravens Player 2', team: 'Ravens', wickets: 12, runsConceded: 180, ballsBowled: 120, matches: 5 },
      },
      careerSchedule: [{
        id: 'done',
        teamA: 'Falcons',
        teamB: 'Ravens',
        round: 1,
        matchNumber: 1,
        isComplete: true,
        result: { momAward: { playerId: 'Falcons-1', team: 'Falcons', name: 'Falcons Player 1' } },
      }],
    });
    flow.handleStartNextCareerSeason({ selectedTeam: 'Ravens', countryList: [{ country: 'Country A' }] });
    expect(dispatch).toHaveBeenCalledWith({ type: 'setCareerSeasonAction', payload: 2 });
    expect(dispatch).toHaveBeenCalledWith({ type: 'setCareerTeamAction', payload: 'Ravens' });
    expect(dispatch).toHaveBeenCalledWith({ type: 'setCareerOffersAction', payload: [] });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'setStageAction',
      payload: matchStatusEnum.CareerSeasonSchedule,
    });
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'setCareerSeasonHistoryAction',
      payload: [expect.objectContaining({ season: 1, seasonReport: expect.objectContaining({ awards: expect.any(Array) }) })],
    }));

    const retired = makeFlow({ careerPlayerProfile: { age: 40, name: 'Old Player' } });
    retired.flow.handleStartNextCareerSeason();
    expect(retired.dispatch).toHaveBeenCalledWith({ type: 'setCareerRetiredAction', payload: true });
    expect(retired.dispatch).toHaveBeenCalledWith({ type: 'setStageAction', payload: matchStatusEnum.CareerHistory });
  });

test('retires an over-age player before starting another season', () => {
    const overAge = makeFlow({
      careerPlayerProfile: { name: 'Veteran', age: 39 },
      careerSeason: 2,
    });
    overAge.flow.handleStartNextCareerSeason();
    expect(overAge.dispatch).toHaveBeenCalledWith({ type: 'setCareerRetiredAction', payload: true });
    expect(overAge.dispatch).toHaveBeenCalledWith({ type: 'setStageAction', payload: matchStatusEnum.CareerHistory });

    const alreadyRetired = makeFlow({ careerRetired: true });
    alreadyRetired.flow.handleStartNextCareerSeason();
    expect(alreadyRetired.dispatch).not.toHaveBeenCalled();

  });

test('ranks season awards by batting and bowling tie-breakers and MOM counts', () => {
    const players = [
      { id: 'a', name: 'Alpha', age: 20 },
      { id: 'b', name: 'Beta', age: 21 },
      { id: 'c', name: 'Charlie', age: 22 },
      { id: 'd', name: 'Delta', age: 24 },
      { id: 'mom', name: 'MOM Winner', age: 25 },
    ].map((player) => ({ ...player, playerType: 'batsman' }));
    const makeStats = (player, values) => ({
      playerId: player.id,
      team: 'Falcons',
      name: player.name,
      runs: 100,
      outs: 5,
      balls: 100,
      wickets: 4,
      runsConceded: 20,
      ballsBowled: 30,
      matches: 5,
      ...values,
    });
    const awardsFlow = makeFlow({
      careerDomesticTeams: [
        { name: 'Falcons', country: 'Country A', players },
        { name: 'Ravens', country: 'Country A', players: [] },
      ],
      careerPlayerStats: {
        alpha: makeStats(players[0]),
        beta: makeStats(players[1]),
        charlie: makeStats(players[2], { balls: 60, runsConceded: 40 }),
        delta: makeStats(players[3], { runs: 80, balls: 40, runsConceded: 10, ballsBowled: 60 }),
        mom: makeStats(players[4], { runs: 40, wickets: 8 }),
      },
      careerSchedule: [
        { id: 'mom-award', isComplete: true, result: { momAward: { playerId: 'mom', team: 'Falcons', name: 'MOM Winner' } } },
        { id: 'mom-shortlist', isComplete: true, result: { momShortlist: [{ playerId: 'mom', team: 'Falcons', name: 'MOM Winner' }] } },
        { id: 'invalid-award', isComplete: true, result: { momAward: { name: 'No Team' } } },
        { id: 'incomplete-award', isComplete: false, result: { momAward: { playerId: 'alpha', team: 'Falcons', name: 'Alpha' } } },
      ],
    });
    awardsFlow.flow.handleStartNextCareerSeason();

    const seasonHistory = awardsFlow.dispatch.mock.calls
      .map(([action]) => action)
      .find((action) => action.type === 'setCareerSeasonHistoryAction').payload;
    const awards = seasonHistory[0].seasonReport.awards;
    expect(awards.find(({ id }) => id === 'best-batsman').winner.name).toBe('Charlie');
    expect(awards.find(({ id }) => id === 'best-bowler').winner.name).toBe('MOM Winner');
    expect(awards.find(({ id }) => id === 'most-mom').summary).toBe('2 awards');
  });

test('resolves award leaderboards through average, strike-rate, economy, and name ties', () => {
    const players = [
      { id: 'bat-alpha', name: 'Bat Alpha', age: 24 },
      { id: 'bat-beta', name: 'Bat Beta', age: 24 },
      { id: 'bat-charlie', name: 'Bat Charlie', age: 24 },
      { id: 'bat-delta', name: 'Bat Delta', age: 24 },
      { id: 'bowl-alpha', name: 'Bowl Alpha', age: 25 },
      { id: 'bowl-beta', name: 'Bowl Beta', age: 25 },
      { id: 'bowl-charlie', name: 'Bowl Charlie', age: 25 },
      { id: 'bowl-delta', name: 'Bowl Delta', age: 25 },
      { id: 'young-wickets', name: 'Young Wickets', age: 20 },
      { id: 'young-matches', name: 'Young Matches', age: 21 },
    ];
    const statsFor = (player, values = {}) => ({
      playerId: player.id,
      team: 'Falcons',
      name: player.name,
      matches: 1,
      ...values,
    });
    const stats = Object.fromEntries([
      ...players.slice(0, 4).map((player) => [
        player.id,
        statsFor(player, {
          runs: 100,
          outs: 4,
          balls: player.id === 'bat-beta' ? 50 : 100,
        }),
      ]),
      ...players.slice(4, 8).map((player, index) => [
        player.id,
        statsFor(player, {
          wickets: 4,
          runsConceded: index === 1 ? 40 : 20,
          ballsBowled: index < 2 ? 30 : 60,
        }),
      ]),
      [players[8].id, statsFor(players[8], { wickets: 1, matches: 0 })],
      [players[9].id, statsFor(players[9], { matches: 14 })],
    ]);
    const run = makeFlow({
      careerPlayerProfile: { name: 'Career Player', playerId: 'not-in-roster', age: 24 },
      careerDomesticTeams: [{ name: 'Falcons', players }],
      careerPlayerStats: stats,
      careerSchedule: [],
    });

    run.flow.handleStartNextCareerSeason();

    const history = run.dispatch.mock.calls
      .map(([action]) => action)
      .find((action) => action.type === 'setCareerSeasonHistoryAction').payload[0];
    const awards = history.seasonReport.awards;
    expect(awards.find(({ id }) => id === 'best-batsman').winner.name).toBe('Bat Beta');
    expect(awards.find(({ id }) => id === 'best-bowler').winner.name).toBe('Bowl Charlie');
    expect(awards.find(({ id }) => id === 'young-player').winner.name).toBe('Young Wickets');
  });

test('falls back to rotating transfers when random shuffles keep team order unchanged', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.999);
    const transferTeams = [
      { name: 'Falcons', country: 'Country A', players: makePlayers('Falcons').slice(0, 7) },
      { name: 'Ravens', country: 'Country A', players: makePlayers('Ravens').slice(0, 7) },
    ];
    const transferFlow = makeFlow({
      careerDomesticTeams: transferTeams,
      careerOffers: [{ team: 'Ravens', amount: 200000 }],
      careerSeasonHistory: [],
    });
    transferFlow.flow.handleStartNextCareerSeason({ selectedTeam: 'Unknown Team' });

    const updatedTeams = transferFlow.dispatch.mock.calls
      .map(([action]) => action)
      .find((action) => action.type === 'setCareerDomesticTeamsAction').payload;
    expect(updatedTeams.find(({ name }) => name === 'Falcons').players).toHaveLength(7);
    expect(updatedTeams.find(({ name }) => name === 'Ravens').players).toHaveLength(7);
    expect(updatedTeams.find(({ name }) => name === 'Falcons').players.map(({ id }) => id)).toContain('Ravens-1');
    expect(updatedTeams.find(({ name }) => name === 'Ravens').players.map(({ id }) => id)).toContain('Falcons-2');
    const history = transferFlow.dispatch.mock.calls
      .map(([action]) => action)
      .find((action) => action.type === 'setCareerSeasonHistoryAction').payload[0];
    expect(history.offseasonDecision).toMatchObject({ selectedTeam: 'Unknown Team', acceptedOffer: null });
  });

test('continues an offseason with one team and creates an empty next-season schedule', () => {
    const soloTeam = makeFlow({
      careerDomesticTeams: [{ name: 'Falcons', country: 'Country A', players: [] }],
      careerGlobalPlayerPool: null,
      careerPlayerProfile: { name: 'Career Player', playerId: 'career-1', age: 20 },
      careerOffers: [],
    });
    soloTeam.flow.handleStartNextCareerSeason({ selectedTeam: 'Missing Team' });

    expect(soloTeam.dispatch).toHaveBeenCalledWith({ type: 'setCareerDomesticCountryAction', payload: 'Country A' });
    expect(soloTeam.dispatch).toHaveBeenCalledWith({ type: 'setCareerScheduleAction', payload: [] });
    expect(soloTeam.dispatch).toHaveBeenCalledWith({ type: 'setCareerMatchIndexAction', payload: 0 });
  });
});
