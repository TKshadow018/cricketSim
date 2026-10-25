import { matchStatusEnum } from "../../../../gameData/matchStatusEnum";
import { domesticTeams, makeFlow, makePlayers, resetCareerFlowMocks } from "./controllerCareerTestSupport";

describe("career season reports and history", () => {
  beforeEach(resetCareerFlowMocks);
  afterEach(() => jest.restoreAllMocks());

test('handles offseason transfer exits for small, unnamed, and empty team sets', () => {
    const smallRosters = makeFlow({
      careerDomesticTeams: [
        { name: 'Falcons', country: 'Country A', players: makePlayers('Falcons').slice(0, 5) },
        { name: 'Ravens', country: 'Country A', players: makePlayers('Ravens').slice(0, 5) },
      ],
    });
    smallRosters.flow.handleStartNextCareerSeason();
    expect(smallRosters.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'setCareerDomesticTeamsAction',
      payload: expect.arrayContaining([
        expect.objectContaining({ name: 'Falcons' }),
        expect.objectContaining({ name: 'Ravens' }),
      ]),
    }));

    const unnamedTeam = makeFlow({
      careerDomesticTeams: [
        { name: 'Falcons', country: 'Country A', players: [] },
        { country: 'Country B', players: null },
      ],
    });
    unnamedTeam.flow.handleStartNextCareerSeason();
    expect(unnamedTeam.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'setCareerDomesticTeamsAction',
      payload: expect.any(Array),
    }));

    const emptyTeams = makeFlow({ careerDomesticTeams: [] });
    emptyTeams.flow.handleStartNextCareerSeason();
    expect(emptyTeams.dispatch).toHaveBeenCalledWith({ type: 'setCareerDomesticTeamsAction', payload: [] });

    const noCareerTeam = makeFlow({
      careerTeam: '',
      careerDomesticTeams: [
        { name: 'Falcons', country: 'Country A', players: [{}] },
        { name: 'Ravens', country: 'Country A', players: [] },
      ],
    });
    jest.requireMock('../../utils/controllerCareerScheduleUtils')
      .assignGlobalPoolPlayersToDomesticTeams.mockReturnValueOnce({ globalPlayerPool: null });
    noCareerTeam.flow.handleStartNextCareerSeason();
    expect(noCareerTeam.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'setCareerDomesticTeamsAction',
      payload: expect.any(Array),
    }));
    expect(noCareerTeam.dispatch).toHaveBeenCalledWith({
      type: 'setCareerGlobalPlayerPoolAction',
      payload: [{ id: 'pool-1', name: 'Pool Player' }],
    });
  });

test('records an empty-season report and handles progression with missing statistics', () => {
    const emptySeason = makeFlow({
      careerPlayerProfile: { name: 'Career Player', playerId: 'career-1', age: 31, currentValue: 0 },
      careerDomesticTeams: [
        { name: 'Falcons', country: 'Country A', players: [] },
        { name: 'Ravens', country: 'Country A', players: [] },
      ],
      careerOffers: [],
      careerPlayerStats: { invalid: { playerId: 'unassigned' }, unnamed: { team: 'Falcons' } },
      careerStandings: null,
      careerSchedule: [],
    });
    emptySeason.flow.handleStartNextCareerSeason();

    const historyAction = emptySeason.dispatch.mock.calls
      .map(([action]) => action)
      .find((action) => action.type === 'setCareerSeasonHistoryAction');
    expect(historyAction.payload[0].seasonReport).toMatchObject({
      currentAge: 31,
      awards: [
        { id: 'best-batsman', winner: null, summary: 'No winner' },
        { id: 'best-bowler', winner: null, summary: 'No winner' },
        { id: 'young-player', winner: null, summary: 'No eligible under-23 player' },
        { id: 'player-of-year', winner: null, summary: 'No winner' },
        { id: 'most-mom', winner: null, summary: 'No MOM awards recorded' },
      ],
      abilityChangePreview: [],
    });
    expect(emptySeason.dispatch).toHaveBeenCalledWith({ type: 'setCareerTeamAction', payload: 'Falcons' });
    expect(emptySeason.dispatch).toHaveBeenCalledWith({ type: 'setCareerOffersAction', payload: [] });
  });

test('builds populated season awards, MOM counts, and ability-change previews', () => {
    jest.requireMock('../../utils/controllerCareerScheduleUtils')
      .applyEndOfSeasonPlayerAbilityUpdates.mockImplementation(({ domesticTeams: teams = [] }) =>
        teams.map((team) => ({
          ...team,
          players: team.players.map((player) => ({
            ...player,
            abilityToPlayPaceBall: player.abilityToPlayPaceBall + 1,
          })).concat({ id: 'new-player', name: 'Newly Added Player', abilityToPlayPaceBall: 30 }),
        }))
      );
    const populatedSeason = makeFlow({
      careerPlayerProfile: { name: 'Career Player', playerId: 'career-1', age: 22, currentValue: 150000 },
      careerDomesticTeams: [
        {
          name: 'Falcons',
          country: 'Country A',
          players: [
            { id: 'career-1', name: 'Career Player', age: 22, abilityToPlayPaceBall: 50 },
            { id: 'other-1', name: 'Other Player', age: 25, abilityToPlayPaceBall: 40 },
          ],
        },
        { name: 'Ravens', country: 'Country A', players: [] },
      ],
      careerOffers: [{ team: 'Ravens', amount: 200000 }],
      careerPlayerStats: {
        star: {
          playerId: 'career-1',
          team: 'Falcons',
          name: 'Career Player',
          runs: 120,
          wickets: 2,
          outs: 0,
          balls: 0,
          runsConceded: 10,
          ballsBowled: 0,
          matches: 3,
        },
        batter: {
          team: 'Falcons',
          name: 'Other Player',
          runs: 120,
          wickets: 0,
          outs: 4,
          balls: 40,
          runsConceded: 0,
          ballsBowled: 0,
          matches: 4,
        },
        invalid: { team: 'Falcons' },
      },
      careerSchedule: [
        {
          isComplete: true,
          result: { momAward: { playerId: 'career-1', team: 'Falcons', name: 'Career Player' } },
        },
        {
          isComplete: true,
          result: { momShortlist: [{ team: 'Falcons', name: 'Other Player' }] },
        },
        { isComplete: false, result: { momAward: { team: 'Falcons', name: 'Ignored' } } },
      ],
    });

    populatedSeason.flow.handleStartNextCareerSeason({ selectedTeam: 'Ravens' });
    const history = populatedSeason.dispatch.mock.calls
      .map(([action]) => action)
      .find((action) => action.type === 'setCareerSeasonHistoryAction').payload[0];
    expect(history.offseasonDecision).toMatchObject({
      selectedTeam: 'Ravens',
      acceptedOffer: { team: 'Ravens', amount: 200000 },
    });
    expect(history.seasonReport.abilityChangePreview).toHaveLength(2);
    expect(history.seasonReport.abilityChangePreview.some(({ player }) => player.id === 'new-player')).toBe(false);
    expect(history.seasonReport.awards.map(({ id, winner }) => [id, winner?.name])).toEqual([
      ['best-batsman', 'Career Player'],
      ['best-bowler', 'Career Player'],
      ['young-player', 'Career Player'],
      ['player-of-year', 'Career Player'],
      ['most-mom', 'Career Player'],
    ]);
    expect(history.seasonReport.awards[4].summary).toBe('1 awards');
  });

test('exposes retirement, end, history, and return-to-schedule controls', () => {
    const { flow, input, dispatch } = makeFlow();
    flow.handleRetireCareer();
    flow.handleEndCareer();
    flow.handleViewCareerHistory();
    expect(input.setAutoSimMode).toHaveBeenCalledWith(null);
    expect(input.careerResultCommitSignatureRef.current).toBe('');
    expect(dispatch).toHaveBeenCalledWith({ type: 'setCareerRetiredAction', payload: true });
    expect(dispatch).toHaveBeenCalledWith({ type: 'resetMatchRuntimeAction', payload: undefined });
    expect(dispatch).toHaveBeenCalledWith({ type: 'setStageAction', payload: matchStatusEnum.CareerHistory });

    const back = makeFlow({
      careerSchedule: [
        { id: 'done', isComplete: true },
        { id: 'next', isComplete: false },
      ],
    });
    back.flow.handleBackToCareerSchedule();
    expect(back.dispatch).toHaveBeenCalledWith({ type: 'setCareerMatchIndexAction', payload: 1 });
    const retiredBack = makeFlow({ careerRetired: true });
    retiredBack.flow.handleBackToCareerSchedule();
    expect(retiredBack.dispatch).toHaveBeenCalledWith({ type: 'setStageAction', payload: matchStatusEnum.CareerHistory });
  });
});
