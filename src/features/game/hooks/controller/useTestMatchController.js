import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { matchStatusEnum } from '../../../../gameData/matchStatusEnum';
import {
  setBattingIntent,
  setBattingTactics,
  setBowlingIntent,
  setBowlingTactics,
  setFirstInnings,
  setSecondInnings,
  setStage,
  setTestMatch,
} from '../../gameSlice';
import { aggregateTestMatch, chooseFollowOn, finishTestInnings, formatTestResult, shouldDeclareTestInnings } from '../../utils/testMatch';
import { buildInningsViewModel } from './controllerInningsViewModel';
import { getInningsContext, handleSelectBowler, handleSelectNextBatter, handleSelectOpener } from './controllerInningsCore';
import { processDelivery } from './controllerDeliveryEngine';

export const useTestMatchController = ({ game, ownPlayers, opponentPlayers }) => {
  const dispatch = useDispatch();
  const state = game.testMatch;
  const innings = state.currentInnings;
  const [autoSimulating, setAutoSimulating] = useState(false);
  const deliverRef = useRef(null);
  const userTeamName = game.gameMode === 'tournament'
    ? game.tournamentUserTeam
    : game.gameMode === 'career' ? game.careerTeam : game.ownTeam;
  const context = {
    ownPlayers,
    opponentPlayers,
    ownTeam: game.ownTeam,
    opponentTeam: game.opponentTeam,
    userTeamName,
    teamControlName: game.gameMode === 'career' ? '' : userTeamName,
  };
  const completedBalls = state.innings.reduce((sum, entry) => sum + entry.innings.balls, 0);
  const maxBalls = state.totalBalls - completedBalls;
  const matchType = { over: state.oversPerDay, unlimitedBowling: true, matchBallsRemaining: maxBalls };
  const getContext = () => getInningsContext({
    isFirstInnings: true,
    firstSide: state.currentSide,
    ownPlayers,
    opponentPlayers,
    ownTeam: game.ownTeam,
    opponentTeam: game.opponentTeam,
    userTeamName,
    isCurrentMatchUserInvolved: [game.ownTeam, game.opponentTeam].includes(userTeamName),
    gameMode: game.gameMode,
    careerPlayerProfile: game.careerPlayerProfile,
    inningState: innings,
  });
  const view = buildInningsViewModel({
    isFirstInnings: true,
    inningState: innings,
    getContext,
    matchType,
    maxBalls,
    ruleset: game.ruleset,
  });
  const commitState = (next) => {
    let updated = next;
    if (updated.phase === 'followOnChoice') {
      const leader = updated.firstSide === 'own' ? game.ownTeam : game.opponentTeam;
      if (leader !== userTeamName) updated = chooseFollowOn({ state: updated, enforce: true, ...context });
    }
    dispatch(setTestMatch(updated));
    if (updated.phase === 'result') {
      const aggregate = aggregateTestMatch(updated);
      dispatch(setFirstInnings(aggregate.firstInnings));
      dispatch(setSecondInnings(aggregate.secondInnings));
      dispatch(setStage(matchStatusEnum.MatchEnd));
    }
  };
  const updateState = (_, updater) => {
    const nextInnings = typeof updater === 'function' ? updater(innings) : updater;
    dispatch(setTestMatch({ ...state, currentInnings: nextInnings }));
  };
  const updateAfterDelivery = (nextInnings) => {
    const updated = { ...state, currentInnings: nextInnings };
    let reason = state.target !== null && state.target !== undefined && nextInnings.score >= state.target
      ? 'targetReached'
      : nextInnings.wickets >= 10
        ? 'allOut'
        : completedBalls + nextInnings.balls >= state.totalBalls ? 'time' : null;
    const battingTeam = state.currentSide === 'own' ? game.ownTeam : game.opponentTeam;
    if (!reason && battingTeam !== userTeamName && shouldDeclareTestInnings(updated)) reason = 'declared';
    commitState(reason ? finishTestInnings({ state: updated, reason, ...context }) : updated);
  };
  const deliver = () => processDelivery({
    isFirstInnings: true,
    firstInnings: innings,
    secondInnings: innings,
    getContext,
    matchType,
    maxBalls,
    battingIntent: game.battingIntent,
    battingTactics: game.battingTactics,
    bowlingIntent: game.bowlingIntent,
    bowlingTactics: game.bowlingTactics,
    ownSanitizedRoles: game.ownTeamRoles,
    opponentSanitizedRoles: game.opponentTeamRoles,
    ownTeam: game.ownTeam,
    opponentTeam: game.opponentTeam,
    matchCondition: game.matchCondition,
    matchTypeKey: game.matchTypeKey,
    locationCountry: game.locationCountry,
    ruleset: game.ruleset,
    targetScore: state.target,
    suppressInningsTransition: true,
    dispatch,
    setBattingIntentAction: setBattingIntent,
    setBattingTacticsAction: setBattingTactics,
    setBowlingIntentAction: setBowlingIntent,
    setBowlingTacticsAction: setBowlingTactics,
    setFirstInnings: updateAfterDelivery,
    setSecondInnings: updateAfterDelivery,
    setStageAction: setStage,
  });
  deliverRef.current = deliver;
  useEffect(() => {
    if (!autoSimulating) return undefined;
    if (state.phase !== 'batting' || !view.canPlayNextBall) {
      setAutoSimulating(false);
      return undefined;
    }
    const timer = setTimeout(() => deliverRef.current(), 0);
    return () => clearTimeout(timer);
  }, [autoSimulating, state, view.canPlayNextBall]);

  return {
    state,
    innings,
    view,
    userTeamName,
    completedBalls,
    resultSummary: state.result ? formatTestResult(state, context) : '',
    deliver,
    selectOpener: (selectedIndex) => handleSelectOpener({ isFirstInnings: true, selectedIndex, getContext, updateState }),
    selectNextBatter: (batterIndex) => handleSelectNextBatter({ isFirstInnings: true, batterIndex, getContext, updateState }),
    selectBowler: (bowlerIndex) => handleSelectBowler({ isFirstInnings: true, bowlerIndex, getContext, matchType, updateState }),
    setBattingIntent: (value) => dispatch(setBattingIntent(value)),
    setBattingTactics: (value) => dispatch(setBattingTactics(value)),
    setBowlingIntent: (value) => dispatch(setBowlingIntent(value)),
    setBowlingTactics: (value) => dispatch(setBowlingTactics(value)),
    declare: () => commitState(finishTestInnings({ state, reason: 'declared', ...context })),
    followOn: (enforce) => commitState(chooseFollowOn({ state, enforce, ...context })),
    autoSimulating,
    startAutoSimulation: () => setAutoSimulating(true),
  };
};
