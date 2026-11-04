import React from 'react';
import { act, render } from '@testing-library/react';
import { matchStatusEnum } from '../../../../gameData/matchStatusEnum';
import * as commonUtils from '../../utils/controllerCommonUtils';
import * as simulatorUtils from '../../../../utils/simulatorUtils';
import { MODE_CAREER, MODE_TOURNAMENT } from '../../utils/controllerCommonUtils';
import { useTossAndSimulationHandlers } from './controllerTossAndSimulation';

jest.mock('../../../../utils/speechUtils', () => ({ speak: jest.fn() }));

const createAction = (type) => (payload) => ({ type, payload });
const readyInnings = (overrides = {}) => ({
  balls: 0,
  wickets: 0,
  needsOpeners: false,
  waitingForNextBatter: false,
  waitingForNextBowler: false,
  strikerIndex: 0,
  nonStrikerIndex: 1,
  currentBowlerIndex: 0,
  ...overrides,
});

const makeProps = (overrides = {}) => ({
  dispatch: jest.fn(),
  isCurrentMatchUserInvolved: true,
  stage: matchStatusEnum.ChooseGameMode,
  setAutoSimMode: jest.fn(),
  firstInnings: readyInnings(),
  secondInnings: readyInnings(),
  resolveStadiumConditionRef: { current: null },
  selectedStadium: 'Ground',
  ownTeam: 'Own Team',
  opponentTeam: 'Opponent Team',
  setMatchConditionAction: createAction('match-condition'),
  setTossCallAction: createAction('toss-call'),
  setTossWinnerAction: createAction('toss-winner'),
  setTossDecisionAction: createAction('toss-decision'),
  setFirstBattingSideAction: createAction('first-batting-side'),
  setStageAction: createAction('stage'),
  userTeamName: 'Own Team',
  gameMode: 'quick',
  firstBattingSide: 'own',
  openInningsRef: { current: jest.fn() },
  processDeliveryRef: { current: jest.fn() },
  maxBalls: 120,
  autoSimMode: null,
  venueStadiums: [
    { name: 'Ground', pitchType: 'dusty', outfieldType: 'wetWithDew' },
  ],
  matchCondition: { weather: 'cloudy', pitch: 'sporting', outfield: 'lushGreen' },
  firstInningsView: { isUserBatting: false, isUserBowling: false },
  secondInningsView: { isUserBatting: false, isUserBowling: false },
  ...overrides,
});

const renderHookHarness = (hookProps) => {
  const handlersRef = { current: null };
  const Harness = ({ props }) => {
    handlersRef.current = useTossAndSimulationHandlers(props);
    return null;
  };
  const rendered = render(React.createElement(Harness, { props: hookProps }));
  return {
    handlersRef,
    rerender: (props) => rendered.rerender(React.createElement(Harness, { props })),
  };
};

describe('stadium and toss controls', () => {
  afterEach(() => jest.restoreAllMocks());

  test('resolves valid and fallback stadium conditions and applies stadium selection', () => {
    const props = makeProps();
    const { handlersRef } = renderHookHarness(props);

    expect(props.resolveStadiumConditionRef.current('Ground', 'rainy')).toEqual({
      weather: 'rainy',
      pitch: 'dusty',
      outfield: 'wetWithDew',
    });
    expect(props.resolveStadiumConditionRef.current('Unknown', 'windy')).toEqual({
      weather: 'windy',
      pitch: 'sporting',
      outfield: 'lushGreen',
    });

    act(() => handlersRef.current.handleSetSelectedStadium('Ground'));
    expect(props.dispatch).toHaveBeenCalledWith({
      type: 'match-condition',
      payload: { weather: 'cloudy', pitch: 'dusty', outfield: 'wetWithDew' },
    });

    jest.spyOn(commonUtils, 'randomKey').mockReturnValue('');
    const noVenues = makeProps({ venueStadiums: null });
    const { handlersRef: noVenueHandlers } = renderHookHarness(noVenues);
    expect(noVenues.resolveStadiumConditionRef.current('Unknown')).toEqual({
      weather: 'sunny',
      pitch: 'sporting',
      outfield: 'lushGreen',
    });
  });

  test('records user wins and opponent wins with the correct toss decision and first batting side', () => {
    const won = makeProps();
    const { handlersRef: wonHandlers } = renderHookHarness(won);
    jest.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0);
    act(() => wonHandlers.current.handleTossCall('dollar'));

    expect(won.dispatch).toHaveBeenCalledWith({ type: 'toss-winner', payload: 'Own Team' });
    expect(won.dispatch).toHaveBeenCalledWith({ type: 'toss-decision', payload: 'bat' });
    expect(won.dispatch).toHaveBeenCalledWith({ type: 'first-batting-side', payload: 'own' });
    expect(won.dispatch).toHaveBeenCalledWith({ type: 'stage', payload: matchStatusEnum.TossResult });

    jest.restoreAllMocks();
    const lost = makeProps({ userTeamName: 'Own Team' });
    const { handlersRef: lostHandlers } = renderHookHarness(lost);
    jest.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0);
    act(() => lostHandlers.current.handleTossCall('crown'));

    expect(lost.dispatch).toHaveBeenCalledWith({ type: 'toss-winner', payload: 'Opponent Team' });
    expect(lost.dispatch).toHaveBeenCalledWith({ type: 'toss-decision', payload: 'bowl' });
    expect(lost.dispatch).toHaveBeenCalledWith({ type: 'first-batting-side', payload: 'own' });
    expect(lost.dispatch).toHaveBeenCalledWith({ type: 'stage', payload: matchStatusEnum.TossResult });

    jest.restoreAllMocks();
    const opponentUser = makeProps({ userTeamName: 'Opponent Team' });
    const { handlersRef: opponentHandlers } = renderHookHarness(opponentUser);
    jest.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.9);
    act(() => opponentHandlers.current.handleTossCall('crown'));
    expect(opponentUser.dispatch).toHaveBeenCalledWith({ type: 'toss-winner', payload: 'Opponent Team' });
    expect(opponentUser.dispatch).toHaveBeenCalledWith({ type: 'first-batting-side', payload: 'opponent' });

    jest.restoreAllMocks();
    const userWithFallbackName = makeProps({ userTeamName: '' });
    const { handlersRef: fallbackHandlers } = renderHookHarness(userWithFallbackName);
    jest.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.9);
    act(() => fallbackHandlers.current.handleTossCall('crown'));
    expect(userWithFallbackName.dispatch).toHaveBeenCalledWith({ type: 'toss-winner', payload: 'Own Team' });
    expect(userWithFallbackName.dispatch).toHaveBeenCalledWith({ type: 'first-batting-side', payload: 'own' });

    jest.restoreAllMocks();
    jest.spyOn(simulatorUtils, 'getOpponentDecision').mockReturnValue('bat');
    const opponentWinsBatting = makeProps({
      userTeamName: 'Opponent Team',
      isCurrentMatchUserInvolved: true,
    });
    const { handlersRef: opponentLossHandlers } = renderHookHarness(opponentWinsBatting);
    jest.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0);
    act(() => opponentLossHandlers.current.handleTossCall('crown'));
    expect(opponentWinsBatting.dispatch).toHaveBeenCalledWith({ type: 'first-batting-side', payload: 'own' });

    jest.restoreAllMocks();
    jest.spyOn(simulatorUtils, 'getOpponentDecision').mockReturnValue('bowl');
    const opponentUserLoses = makeProps({ userTeamName: 'Opponent Team' });
    const { handlersRef: opponentUserLosesHandlers } = renderHookHarness(opponentUserLoses);
    jest.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0);
    act(() => opponentUserLosesHandlers.current.handleTossCall('crown'));
    expect(opponentUserLoses.dispatch).toHaveBeenCalledWith({ type: 'first-batting-side', payload: 'opponent' });

    jest.restoreAllMocks();
    jest.spyOn(simulatorUtils, 'getOpponentDecision').mockReturnValue('bat');
    const unattendedLoss = makeProps({
      isCurrentMatchUserInvolved: false,
    });
    const { handlersRef: unattendedLossHandlers } = renderHookHarness(unattendedLoss);
    jest.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0);
    act(() => unattendedLossHandlers.current.handleTossCall('crown'));
    expect(unattendedLoss.dispatch).toHaveBeenCalledWith({ type: 'first-batting-side', payload: 'opponent' });
  });
});

describe('automatic match simulation controls', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('starts over or full-match simulation only for non-user fixtures', () => {
    const props = makeProps({
      isCurrentMatchUserInvolved: false,
      stage: matchStatusEnum.TeamOneBat,
      firstInnings: readyInnings({ balls: 12 }),
      secondInnings: readyInnings({ balls: 18 }),
    });
    const { handlersRef } = renderHookHarness(props);

    act(() => handlersRef.current.simulateCurrentOver());
    expect(props.setAutoSimMode).toHaveBeenCalledWith({
      type: 'over',
      inningsStage: matchStatusEnum.TeamOneBat,
      startBalls: 12,
    });
    act(() => handlersRef.current.simulateFullMatch());
    expect(props.setAutoSimMode).toHaveBeenLastCalledWith({
      type: 'match',
      inningsStage: matchStatusEnum.TeamOneBat,
      startBalls: 12,
    });

    props.setAutoSimMode.mockClear();
    const userMatch = makeProps({ isCurrentMatchUserInvolved: true });
    const { handlersRef: userHandlers } = renderHookHarness(userMatch);
    act(() => userHandlers.current.simulateCurrentOver());
    act(() => userHandlers.current.simulateFullMatch());
    expect(userMatch.setAutoSimMode).not.toHaveBeenCalled();

    const completed = makeProps({ stage: matchStatusEnum.MatchEnd, isCurrentMatchUserInvolved: false });
    const { handlersRef: completedHandlers } = renderHookHarness(completed);
    act(() => completedHandlers.current.simulateCurrentOver());
    act(() => completedHandlers.current.simulateFullMatch());
    expect(completed.setAutoSimMode).not.toHaveBeenCalled();

    const secondInnings = makeProps({
      isCurrentMatchUserInvolved: false,
      stage: matchStatusEnum.TeamTwoBat,
      secondInnings: readyInnings({ balls: 24 }),
    });
    const { handlersRef: secondInningsHandlers } = renderHookHarness(secondInnings);
    act(() => secondInningsHandlers.current.simulateCurrentOver());
    act(() => secondInningsHandlers.current.simulateFullMatch());
    expect(secondInnings.setAutoSimMode).toHaveBeenNthCalledWith(1, {
      type: 'over',
      inningsStage: matchStatusEnum.TeamTwoBat,
      startBalls: 24,
    });
    expect(secondInnings.setAutoSimMode).toHaveBeenNthCalledWith(2, {
      type: 'match',
      inningsStage: matchStatusEnum.TeamTwoBat,
      startBalls: 24,
    });
  });

  test('clears stopped simulation modes and advances one legal delivery asynchronously', () => {
    jest.useFakeTimers();
    const processDelivery = jest.fn();
    const setAutoSimMode = jest.fn();
    const props = makeProps({
      isCurrentMatchUserInvolved: false,
      stage: matchStatusEnum.TeamOneBat,
      autoSimMode: { type: 'over', inningsStage: matchStatusEnum.TeamOneBat, startBalls: 0 },
      processDeliveryRef: { current: processDelivery },
      setAutoSimMode,
    });
    renderHookHarness(props);
    act(() => jest.runOnlyPendingTimers());
    expect(processDelivery).toHaveBeenCalledWith(true);
    expect(setAutoSimMode).not.toHaveBeenCalled();

    const cases = [
      { stage: matchStatusEnum.MatchEnd, innings: readyInnings(), mode: { type: 'match', inningsStage: 11, startBalls: 0 } },
      { stage: matchStatusEnum.TossTime, innings: readyInnings(), mode: { type: 'match', inningsStage: 11, startBalls: 0 } },
      { stage: matchStatusEnum.TeamOneBat, innings: readyInnings({ balls: 6 }), mode: { type: 'over', inningsStage: 11, startBalls: 0 } },
      { stage: matchStatusEnum.TeamOneBat, innings: readyInnings({ balls: 6 }), mode: { type: 'over', inningsStage: matchStatusEnum.TeamOneBat, startBalls: 0 } },
      { stage: matchStatusEnum.TeamTwoBat, innings: readyInnings(), mode: { type: 'over', inningsStage: 11, startBalls: 0 } },
      { stage: matchStatusEnum.TeamOneBat, innings: readyInnings({ waitingForNextBatter: true }), mode: { type: 'match', inningsStage: 11, startBalls: 0 } },
    ];
    cases.forEach(({ stage, innings, mode }) => {
      const stop = makeProps({
        isCurrentMatchUserInvolved: false,
        stage,
        firstInnings: innings,
        secondInnings: innings,
        autoSimMode: mode,
        setAutoSimMode,
      });
      renderHookHarness(stop);
    });
    expect(setAutoSimMode).toHaveBeenCalledTimes(5);
    expect(setAutoSimMode).toHaveBeenNthCalledWith(1, null);
    expect(setAutoSimMode).toHaveBeenNthCalledWith(2, null);
    expect(setAutoSimMode).toHaveBeenNthCalledWith(3, null);
    expect(setAutoSimMode).toHaveBeenNthCalledWith(4, null);
    expect(setAutoSimMode).toHaveBeenNthCalledWith(5, null);
  });

  test('automatically tosses tournament and career fixtures and opens their innings', () => {
    const tournament = makeProps({
      isCurrentMatchUserInvolved: false,
      gameMode: MODE_TOURNAMENT,
      stage: matchStatusEnum.TossTime,
    });
    jest.spyOn(Math, 'random').mockReturnValue(0);
    renderHookHarness(tournament);
    expect(tournament.dispatch).toHaveBeenCalledWith({ type: 'toss-call', payload: 'auto' });
    expect(tournament.dispatch).toHaveBeenCalledWith({ type: 'stage', payload: matchStatusEnum.TossResult });
    expect(tournament.dispatch).toHaveBeenCalledWith({ type: 'first-batting-side', payload: 'own' });

    const careerOpen = jest.fn();
    const career = makeProps({
      gameMode: MODE_CAREER,
      stage: matchStatusEnum.TossResult,
      firstBattingSide: 'own',
      openInningsRef: { current: careerOpen },
    });
    renderHookHarness(career);
    expect(careerOpen).toHaveBeenCalledWith('own');

    const careerToss = makeProps({
      gameMode: MODE_CAREER,
      stage: matchStatusEnum.TossTime,
      isCurrentMatchUserInvolved: false,
    });
    renderHookHarness(careerToss);
    expect(careerToss.dispatch).toHaveBeenCalledWith({ type: 'toss-call', payload: 'auto' });
  });

  test('resolves every automated toss winner and decision combination and opens tournament toss results', () => {
    const combinations = [
      { winnerRandom: 0, decision: 'bat', firstSide: 'opponent' },
      { winnerRandom: 0, decision: 'bowl', firstSide: 'own' },
      { winnerRandom: 0.9, decision: 'bat', firstSide: 'own' },
      { winnerRandom: 0.9, decision: 'bowl', firstSide: 'opponent' },
    ];

    [MODE_TOURNAMENT, MODE_CAREER].forEach((gameMode) => {
      combinations.forEach(({ winnerRandom, decision, firstSide }) => {
        jest.spyOn(simulatorUtils, 'getOpponentDecision').mockReturnValue(decision);
        jest.spyOn(Math, 'random').mockReturnValue(winnerRandom);
        const props = makeProps({
          gameMode,
          isCurrentMatchUserInvolved: false,
          stage: matchStatusEnum.TossTime,
        });
        renderHookHarness(props);
        expect(props.dispatch).toHaveBeenCalledWith({
          type: 'first-batting-side',
          payload: firstSide,
        });
        jest.restoreAllMocks();
      });
    });

    const openInnings = jest.fn();
    const tournamentResult = makeProps({
      gameMode: MODE_TOURNAMENT,
      isCurrentMatchUserInvolved: false,
      stage: matchStatusEnum.TossResult,
      openInningsRef: { current: openInnings },
    });
    renderHookHarness(tournamentResult);
    expect(openInnings).toHaveBeenCalledWith('own');

    const involvedTournament = makeProps({
      gameMode: MODE_TOURNAMENT,
      isCurrentMatchUserInvolved: true,
      stage: matchStatusEnum.TossTime,
    });
    renderHookHarness(involvedTournament);
    expect(involvedTournament.dispatch).not.toHaveBeenCalled();
  });

  test('simulates an unattended career innings and skips user-controlled, unready, or incomplete state', () => {
    jest.useFakeTimers();
    const processDelivery = jest.fn();
    const careerProps = makeProps({
      gameMode: MODE_CAREER,
      stage: matchStatusEnum.TeamTwoBat,
      autoSimMode: null,
      processDeliveryRef: { current: processDelivery },
    });
    renderHookHarness(careerProps);
    act(() => jest.runOnlyPendingTimers());
    expect(processDelivery).toHaveBeenCalledWith(false);

    const skipCases = [
      { firstInnings: null, firstInningsView: null },
      { firstInningsView: { isUserBatting: true, isUserBowling: false } },
      { firstInningsView: { isUserBatting: false, isUserBowling: true } },
      { firstInnings: readyInnings({ strikerIndex: null }) },
      { autoSimMode: { type: 'over' } },
    ];
    skipCases.forEach((overrides) => {
      const skip = makeProps({
        gameMode: MODE_CAREER,
        stage: matchStatusEnum.TeamOneBat,
        ...overrides,
        processDeliveryRef: { current: processDelivery },
      });
      renderHookHarness(skip);
    });
    act(() => jest.runOnlyPendingTimers());
    expect(processDelivery).toHaveBeenCalledTimes(1);
  });
});
