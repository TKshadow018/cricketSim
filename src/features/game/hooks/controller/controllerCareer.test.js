import { matchStatusEnum } from "../../../../gameData/matchStatusEnum";
import { domesticTeams, makeFlow, makePlayers, resetCareerFlowMocks } from "./controllerCareerTestSupport";

describe("career setup and fixture launch", () => {
  beforeEach(resetCareerFlowMocks);
  afterEach(() => jest.restoreAllMocks());

test('starts careers only with valid setup and creates supported player archetypes', () => {
    const { flow, dispatch } = makeFlow();
    flow.beginCareer({});
    flow.beginCareer({
      playerProfile: { name: 'Player' },
      domesticCountry: 'Country A',
      domesticTeams: [domesticTeams[0]],
    });
    expect(dispatch).not.toHaveBeenCalled();

    const profiles = [
      [' wicketkeeper ', 'wicketkeeper'],
      ['pace allrounder', 'pace allrounder'],
      ['spin allrounder', 'spin allrounder'],
      ['pacer', 'pacer'],
      ['spiner', 'spiner'],
      ['bowler', 'bowler'],
      ['batsman', 'batsman'],
      ['unknown type', 'batsman'],
    ];
    profiles.forEach(([playerType, expectedType]) => {
      const run = makeFlow();
      if (playerType === 'bowler') {
        jest.spyOn(Math, 'random').mockReturnValue(0);
      }
      run.flow.beginCareer({
        seasonLength: 'short',
        playerProfile: { name: 'New Player', age: 19, playerType },
        domesticCountry: 'Country A',
        domesticTeams,
        globalPlayerPool: [{ id: 99, name: 'Pool Player' }],
        offers: [{ team: 'Falcons', amount: 100000 }],
        countryList: [{ country: 'Country A' }],
      });
      const profileAction = run.dispatch.mock.calls
        .map(([action]) => action)
        .find((action) => action.type === 'setCareerPlayerProfileAction');
      expect(profileAction.payload.playerType).toBe(expectedType);
      expect(profileAction.payload.playerId).toMatch(/^career-player-/);
      expect(profileAction.payload.skills).toEqual(expect.any(Array));
      expect(profileAction.payload.skills.length).toBeLessThanOrEqual(2);
      expect(run.dispatch).toHaveBeenCalledWith({ type: 'setStageAction', payload: matchStatusEnum.CareerAuction });
      if (playerType === 'bowler') {
        expect(profileAction.payload.paceAbility).toBeLessThan(profileAction.payload.spinAbility);
        jest.restoreAllMocks();
      }
    });

    const noAuctionWinner = makeFlow();
    jest.requireMock('../../utils/controllerCareerScheduleUtils').runCareerAuction.mockReturnValueOnce({
      careerTeam: '',
      domesticTeams,
      globalPlayerPool: [],
    });
    noAuctionWinner.flow.beginCareer({
      playerProfile: { name: 'Unassigned Player' },
      domesticCountry: 'Country A',
      domesticTeams,
    });
    expect(noAuctionWinner.dispatch).not.toHaveBeenCalled();
  });

test('uses safe setup defaults when optional auction data is absent', () => {
    const run = makeFlow();
    jest.requireMock('../../utils/controllerCareerScheduleUtils').runCareerAuction.mockReturnValueOnce({
      careerTeam: 'Falcons',
    });

    run.flow.beginCareer({
      playerProfile: { name: 'Default Player' },
      domesticCountry: 'Country A',
      domesticTeams,
    });

    expect(run.dispatch).toHaveBeenCalledWith({ type: 'setCareerGlobalPlayerPoolAction', payload: [] });
    expect(run.dispatch).toHaveBeenCalledWith({ type: 'setCareerAuctionSummaryAction', payload: null });
    expect(run.dispatch).toHaveBeenCalledWith({ type: 'setCareerOffersAction', payload: [] });
    expect(run.dispatch).toHaveBeenCalledWith({ type: 'setCareerSeasonLengthAction', payload: 'standard' });
  });

test('normalizes missing player ids and orders generated schedules across countries by date', () => {
    const scheduleUtils = jest.requireMock('../../utils/controllerCareerScheduleUtils');
    scheduleUtils.buildCareerSeasonSchedule.mockImplementation((seedTeam, _teams, _length, options) => [{
      id: `${options.leagueCountry}-fixture`,
      teamA: seedTeam,
      teamB: 'Opponent',
      globalMatchNumber: 1,
      scheduledDate: options.leagueCountry === 'Country A' ? '2025-02-01' : '2025-01-01',
      isUserMatch: true,
      opponent: 'Opponent',
    }]);
    const teams = [
      { name: 'Falcons', country: 'Country A', players: [{ name: 'Anonymous Player' }] },
      { name: 'Ravens', country: 'Country A', players: [] },
      { name: 'Hawks', country: 'Country B', players: [] },
      { name: 'Owls', country: 'Country B', players: [] },
    ];
    const run = makeFlow();

    run.flow.beginCareer({
      playerProfile: { name: 'Career Player' },
      domesticCountry: 'Country A',
      domesticTeams: teams,
    });

    const auctionTeams = scheduleUtils.runCareerAuction.mock.calls.at(-1)[0].domesticTeams;
    const schedule = run.dispatch.mock.calls
      .map(([action]) => action)
      .find((action) => action.type === 'setCareerScheduleAction').payload;
    expect(auctionTeams[0].players[0].id).toBe('Falcons-P1-1');
    expect(schedule.map(({ leagueCountry }) => leagueCountry)).toEqual(['Country B', 'Country A']);
    expect(schedule[0].isUserMatch).toBe(false);
    expect(schedule[1].isUserMatch).toBe(true);
  });

test('continues after auction only when a career and schedule are available', () => {
    const invalid = makeFlow({ careerTeam: '' });
    invalid.flow.handleCareerContinueAfterAuction();
    expect(invalid.dispatch).not.toHaveBeenCalled();

    const valid = makeFlow({
      careerSchedule: [
        { id: 'done', isComplete: true },
        { id: 'next', isComplete: false },
      ],
    });
    valid.flow.handleCareerContinueAfterAuction();
    expect(valid.dispatch).toHaveBeenCalledWith({ type: 'setCareerMatchIndexAction', payload: 1 });
    expect(valid.dispatch).toHaveBeenCalledWith({
      type: 'setStageAction',
      payload: matchStatusEnum.CareerSeasonSchedule,
    });
  });

test('launches user fixtures with prior match XI and correctly reset match state', () => {
    const previousFixture = {
      id: 'previous',
      teamA: 'Falcons',
      teamB: 'Ravens',
      isComplete: true,
      result: {
        scorecard: {
          previousInnings: {
            title: 'Match report for Falcons',
            battingRows: [{ playerId: 'Falcons-1', name: 'Falcons Player 1', runs: 42 }],
            bowlingRows: [{ playerId: 'Falcons-2', name: 'Falcons Player 2', wickets: 2 }],
          },
          currentInnings: {
            title: 'Ravens Innings',
            battingRows: [{ playerId: 'Ravens-1', name: 'Ravens Player 1', runs: 22 }, { runs: 1 }],
            bowlingRows: [{ playerId: 'Ravens-2', name: 'Ravens Player 2', wickets: 1 }, { wickets: 1 }],
          },
        },
      },
    };
    const nextFixture = { ...makeFlow().input.careerSchedule[0], id: 'next', format: 'odi' };
    const { flow, dispatch } = makeFlow({ careerSchedule: [previousFixture, nextFixture] });
    flow.handleCareerStartNextMatch();
    expect(dispatch).toHaveBeenCalledWith({ type: 'setMatchTypeKeyAction', payload: 'ODI' });
    expect(dispatch).toHaveBeenCalledWith({ type: 'setOwnTeamAction', payload: 'Falcons' });
    expect(dispatch).toHaveBeenCalledWith({ type: 'setOpponentTeamAction', payload: 'Ravens' });
    expect(dispatch).toHaveBeenCalledWith({ type: 'setOwnPlayingXIAction', payload: expect.any(Array) });
    expect(dispatch).toHaveBeenCalledWith({ type: 'setOwnTeamRolesAction', payload: expect.objectContaining({ wicketKeeperId: expect.anything() }) });
    expect(dispatch).toHaveBeenCalledWith({ type: 'setStageAction', payload: matchStatusEnum.TossTime });

    const withoutRosters = makeFlow({ careerDomesticTeams: [] });
    withoutRosters.flow.handleCareerStartNextMatch();
    expect(withoutRosters.dispatch).toHaveBeenCalledWith({ type: 'setOwnPlayingXIAction', payload: [] });
    expect(withoutRosters.dispatch).toHaveBeenCalledWith({
      type: 'setOwnTeamRolesAction',
      payload: { captainId: null, viceCaptainId: null, wicketKeeperId: null },
    });

    const firstClassMatch = makeFlow({
      careerPlayerProfile: null,
      careerDomesticCountry: '',
      careerSchedule: [{ ...makeFlow().input.careerSchedule[0], format: 'firstClass' }],
    });
    firstClassMatch.flow.handleCareerStartNextMatch();
    expect(firstClassMatch.dispatch).toHaveBeenCalledWith({ type: 'setMatchTypeKeyAction', payload: 'test' });
    expect(firstClassMatch.dispatch).toHaveBeenCalledWith({ type: 'setLocationCountryAction', payload: '' });
    expect(firstClassMatch.dispatch).toHaveBeenCalledWith({ type: 'setCareerPlayerProfileAction', payload: null });

    const profileByName = makeFlow({
      careerPlayerProfile: { name: 'Name Only Player' },
      careerDomesticTeams: [
        { name: 'Falcons', players: [{ id: 'name-only-id', name: 'Name Only Player', isWicketKeeper: true }] },
        { name: 'Ravens', players: [] },
      ],
    });
    profileByName.flow.handleCareerStartNextMatch();
    const syncedProfile = profileByName.dispatch.mock.calls
      .map(([action]) => action)
      .find((action) => action.type === 'setCareerPlayerProfileAction');
    expect(syncedProfile.payload).toMatchObject({ name: 'Name Only Player', id: 'name-only-id' });
  });

test('launches a reversed fixture with fallback roles and a prior name-only scorecard', () => {
    const run = makeFlow({
      careerTeam: 'Ravens',
      careerPlayerProfile: null,
      careerDomesticCountry: '',
      careerDomesticTeams: [
        { name: 'Ravens', players: [{ id: 'r-1', name: 'Raven Player', playerType: 'batsman' }] },
        { name: 'Falcons', players: [] },
      ],
      careerSchedule: [
        {
          id: 'previous',
          teamA: 'Ravens',
          teamB: 'Hawks',
          isComplete: true,
          result: {
            scorecard: {
              previousInnings: {
                title: 'Match report for Ravens',
                battingRows: [{ name: 'Raven Player', runs: 30 }],
              },
            },
          },
        },
        { id: 'unrelated', teamA: 'Hawks', teamB: 'Owls', isComplete: false },
        { id: 'current', teamA: 'Falcons', teamB: 'Ravens', isComplete: false, format: null },
      ],
      careerMatchIndex: 2,
    });

    run.flow.handleCareerStartNextMatch();

    expect(run.dispatch).toHaveBeenCalledWith({ type: 'setOwnTeamAction', payload: 'Ravens' });
    expect(run.dispatch).toHaveBeenCalledWith({ type: 'setOpponentTeamAction', payload: 'Falcons' });
    expect(run.dispatch).toHaveBeenCalledWith({ type: 'setCareerFormatAction', payload: 't20' });
    expect(run.dispatch).toHaveBeenCalledWith({ type: 'setMatchTypeKeyAction', payload: 't20' });
    expect(run.dispatch).toHaveBeenCalledWith({ type: 'setOwnPlayingXIAction', payload: ['r-1'] });
    expect(run.dispatch).toHaveBeenCalledWith({
      type: 'setOwnTeamRolesAction',
      payload: { captainId: 'r-1', viceCaptainId: 'r-1', wicketKeeperId: 'r-1' },
    });
    expect(run.dispatch).toHaveBeenCalledWith({ type: 'setOpponentPlayingXIAction', payload: [] });
  });
});
