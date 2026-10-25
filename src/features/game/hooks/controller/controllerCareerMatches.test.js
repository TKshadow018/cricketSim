import { matchStatusEnum } from "../../../../gameData/matchStatusEnum";
import { domesticTeams, makeFlow, makePlayers, resetCareerFlowMocks } from "./controllerCareerTestSupport";

describe("career match progression and results", () => {
  beforeEach(resetCareerFlowMocks);
  afterEach(() => jest.restoreAllMocks());

test('simulates unattended fixtures, stops at user fixtures, and summarizes completed seasons', () => {
    const { simulateCareerFixture } = jest.requireMock('../../utils/controllerCareerScheduleUtils');
    const unattended = makeFlow({
      careerSchedule: [
        { id: 'sim-1', teamA: 'Ravens', teamB: 'Hawks', isComplete: false, isUserMatch: false },
        { id: 'sim-2', teamA: 'Hawks', teamB: 'Owls', isComplete: false, isUserMatch: false },
      ],
    });
    unattended.flow.handleCareerStartNextMatch();
    expect(simulateCareerFixture).toHaveBeenCalledTimes(2);
    expect(unattended.dispatch).toHaveBeenCalledWith({ type: 'setStageAction', payload: matchStatusEnum.CareerSeasonSummary });
    expect(unattended.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'setCareerOffersAction',
      payload: expect.any(Array),
    }));

    const userPending = makeFlow({
      careerSchedule: [
        { id: 'sim', teamA: 'Ravens', teamB: 'Hawks', isComplete: false, isUserMatch: false },
        { id: 'user', teamA: 'Falcons', teamB: 'Ravens', isComplete: false, isUserMatch: true },
      ],
    });
    userPending.flow.handleCareerStartNextMatch();
    expect(userPending.dispatch).toHaveBeenCalledWith({ type: 'setStageAction', payload: matchStatusEnum.TossTime });
    expect(userPending.dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'setCareerMatchIndexAction' }));

    const retired = makeFlow({ careerRetired: true });
    retired.flow.handleCareerStartNextMatch();
    expect(retired.dispatch).not.toHaveBeenCalled();
    const empty = makeFlow({ careerSchedule: [] });
    empty.flow.handleCareerStartNextMatch();
    expect(empty.dispatch).not.toHaveBeenCalled();

    const completed = makeFlow({
      careerSchedule: [{ id: 'done', teamA: 'Falcons', teamB: 'Ravens', isComplete: true }],
    });
    completed.flow.handleCareerStartNextMatch();
    expect(completed.dispatch).toHaveBeenCalledWith({ type: 'setStageAction', payload: matchStatusEnum.CareerSeasonSummary });
  });

test('skips previously completed fixtures between simulated and user matches', () => {
    const run = makeFlow({
      careerSchedule: [
        { id: 'sim', teamA: 'Ravens', teamB: 'Hawks', isComplete: false, isUserMatch: false },
        { id: 'already-done', teamA: 'Hawks', teamB: 'Owls', isComplete: true },
        { id: 'user', teamA: 'Falcons', teamB: 'Ravens', isComplete: false, isUserMatch: true },
      ],
    });

    run.flow.handleCareerStartNextMatch();

    expect(jest.requireMock('../../utils/controllerCareerScheduleUtils').simulateCareerFixture)
      .toHaveBeenCalledTimes(1);
    expect(run.dispatch).toHaveBeenCalledWith({ type: 'setStageAction', payload: matchStatusEnum.TossTime });
  });

test('commits career results, handles score ties, and suppresses duplicates and invalid stages', () => {
    const { flow, input, dispatch } = makeFlow({ stage: matchStatusEnum.MatchEnd });
    const invalid = makeFlow({ stage: matchStatusEnum.TossTime });
    expect(invalid.flow.commitCareerMatchResult()).toEqual({ didCommit: false, seasonComplete: false });
    const noFixture = makeFlow({ stage: matchStatusEnum.MatchEnd, careerSchedule: [] });
    expect(noFixture.flow.commitCareerMatchResult()).toEqual({ didCommit: false, seasonComplete: false });

    const result = flow.commitCareerMatchResult();
    expect(result).toEqual({ didCommit: true, seasonComplete: true });
    expect(input.careerResultCommitSignatureRef.current).toContain('fixture-1|120|4|120|110|8|120');
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'setCareerScheduleAction' }));

    expect(flow.commitCareerMatchResult()).toEqual({ didCommit: false, seasonComplete: false });
    const tie = makeFlow({
      stage: matchStatusEnum.MatchEnd,
      secondInnings: {
        score: 120,
        wickets: 10,
        balls: 120,
        battingStats: [],
        bowlingStats: [],
      },
    });
    expect(tie.flow.commitCareerMatchResult()).toEqual({ didCommit: true, seasonComplete: true });

    const opponentBatsFirst = makeFlow({
      stage: matchStatusEnum.MatchEnd,
      firstBattingSide: 'opponent',
      firstInningsTeamName: 'Ravens',
      secondInningsTeamName: 'Falcons',
    });
    expect(opponentBatsFirst.flow.commitCareerMatchResult()).toEqual({ didCommit: true, seasonComplete: true });
    expect(opponentBatsFirst.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'setCareerScheduleAction', payload: [expect.objectContaining({
        result: expect.objectContaining({ winner: 'Ravens', teamAScore: 110, teamBScore: 120 }),
      })] })
    );

    const nonFinal = makeFlow({
      stage: matchStatusEnum.MatchEnd,
      careerSchedule: [
        { id: 'fixture-1', teamA: 'Falcons', teamB: 'Ravens', isUserMatch: true, isComplete: false },
        { id: 'fixture-2', teamA: 'Hawks', teamB: 'Owls', isUserMatch: false, isComplete: false },
      ],
    });
    expect(nonFinal.flow.commitCareerMatchResult()).toEqual({ didCommit: true, seasonComplete: false });

    const fallbackFixture = makeFlow({
      stage: matchStatusEnum.MatchEnd,
      careerMatchIndex: -1,
      careerResultCommitSignatureRef: null,
      firstInnings: { score: 100, wickets: 5, balls: 120, battingStats: [], bowlingStats: [] },
      secondInnings: { score: 105, wickets: 4, balls: 110, battingStats: [], bowlingStats: [] },
    });
    expect(fallbackFixture.flow.commitCareerMatchResult()).toEqual({ didCommit: true, seasonComplete: true });
    expect(fallbackFixture.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'setCareerScheduleAction',
      payload: [expect.objectContaining({
        result: expect.objectContaining({ winner: 'Ravens', teamAScore: 100, teamBScore: 105 }),
      })],
    }));
  });

test('commits sparse reversed fixtures with missing player identities and no MOM award', () => {
    const momUtils = jest.requireMock('../../utils/controllerMomUtils');
    momUtils.buildMomRecommendations.mockReturnValueOnce([]);
    const run = makeFlow({
      stage: matchStatusEnum.MatchEnd,
      careerMatchIndex: -1,
      careerSchedule: [{
        id: 'reversed',
        teamA: 'Ravens',
        teamB: 'Falcons',
        isUserMatch: true,
        isComplete: false,
      }],
      firstInningsTeamName: 'Unexpected A',
      secondInningsTeamName: 'Unexpected B',
      ownPlayers: [{}],
      opponentPlayers: [{}],
      careerResultCommitSignatureRef: null,
      firstInnings: {
        score: 100,
        wickets: 4,
        balls: 90,
        battingStats: [{ balls: 12, run: 20 }],
        bowlingStats: [{ balls: 6 }],
      },
      secondInnings: {
        score: 90,
        wickets: 5,
        balls: 100,
        battingStats: [{ balls: 10, run: 15 }],
        bowlingStats: [{ balls: 12 }],
      },
    });

    expect(run.flow.commitCareerMatchResult()).toEqual({ didCommit: true, seasonComplete: true });
    expect(momUtils.buildMomRecommendations.mock.calls.at(-1)[0].ownSanitizedRoles).toEqual({
      captainId: null,
      viceCaptainId: null,
      wicketKeeperId: null,
    });
    expect(run.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'setCareerScheduleAction',
      payload: [expect.objectContaining({
        result: expect.objectContaining({ momAward: null }),
      })],
    }));
  });

test('advances a career match to the next schedule or season summary', () => {
    const nextFixture = makeFlow({
      stage: matchStatusEnum.MatchEnd,
      careerSchedule: [
        { id: 'fixture-1', teamA: 'Falcons', teamB: 'Ravens', isUserMatch: true, isComplete: false },
        { id: 'fixture-2', teamA: 'Hawks', teamB: 'Owls', isUserMatch: false, isComplete: false },
      ],
    });
    nextFixture.flow.handleCareerMatchPrimaryAction();
    expect(nextFixture.dispatch).toHaveBeenCalledWith({
      type: 'setStageAction',
      payload: matchStatusEnum.CareerSeasonSchedule,
    });

    const finished = makeFlow({ stage: matchStatusEnum.MatchEnd });
    finished.flow.handleCareerMatchPrimaryAction();
    expect(finished.dispatch).toHaveBeenCalledWith({ type: 'setCareerOffersAction', payload: expect.any(Array) });
    expect(finished.dispatch).toHaveBeenCalledWith({
      type: 'setStageAction',
      payload: matchStatusEnum.CareerSeasonSummary,
    });

    const wrongMode = makeFlow({ gameMode: 'quick' });
    wrongMode.flow.handleCareerMatchPrimaryAction();
    expect(wrongMode.dispatch).not.toHaveBeenCalled();

    [18, 22, 23, 27, 28, 31, 32, 34, 35].forEach((age) => {
      const ageFlow = makeFlow({
        stage: matchStatusEnum.MatchEnd,
        careerPlayerProfile: {
          name: 'Career Player',
          playerId: 'Falcons-1',
          age,
          currentValue: 0,
        },
      });
      ageFlow.flow.handleCareerMatchPrimaryAction();
      expect(ageFlow.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'setCareerOffersAction', payload: expect.any(Array) })
      );
    });

    const oneTeam = makeFlow({
      stage: matchStatusEnum.MatchEnd,
      careerDomesticTeams: [{ name: 'Falcons', country: 'Country A', players: makePlayers('Falcons') }],
    });
    oneTeam.flow.handleCareerMatchPrimaryAction();
    expect(oneTeam.dispatch).toHaveBeenCalledWith({ type: 'setCareerOffersAction', payload: [] });
  });
});
