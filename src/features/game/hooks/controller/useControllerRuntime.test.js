import { useControllerRuntime } from './useControllerRuntime';

jest.mock('./useControllerStats', () => ({ useControllerStats: jest.fn() }));
jest.mock('./useControllerHandlersBundle', () => ({ useControllerHandlersBundle: jest.fn() }));
jest.mock('../../utils/controllerCommonUtils', () => ({ buildScorecard: jest.fn() }));
jest.mock('../../../../utils/simulatorUtils', () => ({
  oversDisplay: jest.fn(),
  stageOrder: ['TossTime', 'MatchEnd'],
  matchVisual: { TossTime: 'toss' },
}));

describe('useControllerRuntime', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('composes handlers, validates user intents, and builds both scorecards', () => {
    const stats = {
      momRecommendations: [{ name: 'Alice' }],
      seriesStanding: { ownWins: 1, opponentWins: 0 },
      seriesTopRunScorers: [],
      seriesTopWicketTakers: [],
      seriesProgressLabel: 'Match 1 of 3',
      tournamentResults: [],
      tournamentTopRunScorers: [],
      tournamentTopWicketTakers: [],
      tournamentProgressLabel: 'Final',
      careerTopRunScorers: [],
      careerTopWicketTakers: [],
      careerProgressLabel: 'Match 1 of 8',
      announceManOfTheMatch: jest.fn(),
    };
    const teamHandlers = { moveOwnPlayerToXI: jest.fn() };
    const competitionHandlers = {
      prepareTournamentMatch: jest.fn(),
      handleMatchPrimaryAction: jest.fn(),
      handlePlayFreshMatch: jest.fn(),
    };
    const tossAndSimulationHandlers = { handleTossCall: jest.fn() };
    const persistenceHandlers = { handleSaveGame: jest.fn() };
    const careerHandlers = { beginCareer: jest.fn() };
    const useStats = jest.requireMock('./useControllerStats').useControllerStats;
    const useHandlers = jest.requireMock('./useControllerHandlersBundle').useControllerHandlersBundle;
    const buildScorecard = jest.requireMock('../../utils/controllerCommonUtils').buildScorecard;
    const oversDisplay = jest.requireMock('../../../../utils/simulatorUtils').oversDisplay;
    useStats.mockReturnValue(stats);
    useHandlers.mockImplementation(({ setPrepareTournamentMatch }) => {
      setPrepareTournamentMatch(competitionHandlers.prepareTournamentMatch);
      return { teamHandlers, competitionHandlers, tossAndSimulationHandlers, persistenceHandlers, careerHandlers };
    });
    buildScorecard.mockImplementation((title) => ({ title }));
    oversDisplay.mockImplementation((balls) => `${balls} balls`);
    let bundleArgs;
    useHandlers.mockImplementation((args) => {
      bundleArgs = args;
      args.setPrepareTournamentMatch(competitionHandlers.prepareTournamentMatch);
      return { teamHandlers, competitionHandlers, tossAndSimulationHandlers, persistenceHandlers, careerHandlers };
    });

    const dispatch = jest.fn();
    const refs = {
      openInningsRef: { current: jest.fn() },
      processDeliveryRef: { current: jest.fn() },
      resolveStadiumConditionRef: { current: jest.fn() },
      careerResultCommitSignatureRef: { current: '' },
    };
    const base = {
      prepareTournamentMatch: jest.fn(),
      isCurrentMatchUserInvolved: true,
      firstInningsView: {
        isUserBatting: true,
        isUserBowling: true,
        battingActionOptions: [{ key: 'attack' }, { key: 'blocked', disabled: true }],
        bowlingActionOptions: [{ key: 'spin' }, { key: 'blocked', disabled: true }],
      },
      secondInningsView: {
        isUserBatting: false,
        isUserBowling: false,
        battingActionOptions: [{ key: 'defend' }],
        bowlingActionOptions: [{ key: 'pace' }],
      },
      firstInningsTeamName: 'Falcons',
      secondInningsTeamName: 'Ravens',
      firstInnings: { balls: 12, score: 20 },
      secondInnings: { balls: 8, score: 10 },
    };
    const actions = {
      setBattingIntentAction: jest.fn((value) => ({ type: 'bat', payload: value })),
      setBowlingIntentAction: jest.fn((value) => ({ type: 'bowl', payload: value })),
    };

    const runtime = useControllerRuntime({ dispatch, base, refs, actions });

    expect(runtime.matchPrimaryAction).toBe(competitionHandlers.handleMatchPrimaryAction);
    expect(runtime.resetMatch).toBe(competitionHandlers.handlePlayFreshMatch);
    expect(runtime.announceManOfTheMatch).toBe(stats.announceManOfTheMatch);
    expect(runtime.moveOwnPlayerToXI).toBe(teamHandlers.moveOwnPlayerToXI);
    expect(runtime.handleTossCall).toBe(tossAndSimulationHandlers.handleTossCall);
    expect(runtime.handleSaveGame).toBe(persistenceHandlers.handleSaveGame);
    expect(runtime.beginCareer).toBe(careerHandlers.beginCareer);

    runtime.setBattingIntent('missing');
    runtime.setBattingIntent('blocked');
    runtime.setBattingIntent('attack');
    runtime.setBowlingIntent('missing');
    runtime.setBowlingIntent('blocked');
    runtime.setBowlingIntent('spin');
    expect(dispatch.mock.calls.map(([action]) => action)).toEqual([
      { type: 'bat', payload: 'attack' },
      { type: 'bowl', payload: 'spin' },
    ]);

    base.firstInningsView.isUserBatting = false;
    base.secondInningsView.battingActionOptions = [{ key: 'defend' }];
    base.firstInningsView.isUserBowling = false;
    base.secondInningsView.isUserBowling = true;
    base.firstInningsView.bowlingActionOptions = [{ key: 'pace' }];
    runtime.setBattingIntent('defend');
    runtime.setBowlingIntent('pace');
    base.isCurrentMatchUserInvolved = false;
    runtime.setBattingIntent('defend');
    runtime.setBowlingIntent('pace');
    expect(dispatch.mock.calls.map(([action]) => action.payload)).toEqual(['attack', 'spin', 'defend', 'pace']);

    expect(runtime.buildTeamOneScorecard()).toEqual({
      currentInnings: { title: 'Falcons Innings' },
      previousInnings: null,
    });
    expect(runtime.buildTeamTwoScorecard()).toEqual({
      currentInnings: { title: 'Ravens Innings' },
      previousInnings: { title: 'Falcons Innings' },
    });
    expect(buildScorecard).toHaveBeenNthCalledWith(1, 'Falcons Innings', base.firstInnings, base.firstInningsView, '12 balls');
    expect(buildScorecard).toHaveBeenCalledTimes(3);
    expect(oversDisplay).toHaveBeenCalledWith(12);
    expect(oversDisplay).toHaveBeenCalledWith(8);
    expect(runtime.stageOrder).toEqual(['TossTime', 'MatchEnd']);
    expect(runtime.matchVisual).toEqual({ TossTime: 'toss' });

    bundleArgs.teamArgs.openInnings('own');
    expect(refs.openInningsRef.current).toHaveBeenCalledWith('own');
    refs.openInningsRef.current = null;
    bundleArgs.teamArgs.openInnings('opponent');
    const missingRefRuntime = useControllerRuntime({ dispatch, base, refs: {}, actions });
    bundleArgs.teamArgs.openInnings('own');
    expect(missingRefRuntime).toBeDefined();
  });
});
