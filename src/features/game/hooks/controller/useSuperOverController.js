import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { matchStatusEnum } from '../../../../gameData/matchStatusEnum';
import {
  setBattingIntent,
  setBattingTactics,
  setBowlingIntent,
  setBowlingTactics,
  setTournamentTiebreak,
} from '../../gameSlice';
import { advanceSuperOver } from '../../utils/superOver';
import { buildInningsViewModel } from './controllerInningsViewModel';
import { handleSelectBowler, handleSelectNextBatter, handleSelectOpener } from './controllerInningsCore';
import { processDelivery } from './controllerDeliveryEngine';

const superOverType = { over: 1, maxWickets: 2, isSuperOver: true };

export const useSuperOverController = ({ game, ownPlayers, opponentPlayers }) => {
  const dispatch = useDispatch();
  const state = game.tournamentTiebreak;
  const [autoSimulating, setAutoSimulating] = useState(false);
  const [error, setError] = useState('');
  const deliverRef = useRef(null);
  const isFirstInnings = state.phase === 'first';
  const innings = isFirstInnings ? state.firstInnings : state.secondInnings;
  const userTeamName = game.tournamentUserTeam;
  const userInvolved = [game.ownTeam, game.opponentTeam].includes(userTeamName);
  const context = {
    ownPlayers,
    opponentPlayers,
    ownTeam: game.ownTeam,
    opponentTeam: game.opponentTeam,
    userTeamName,
  };
  const getContext = (first) => {
    const side = first ? state.firstSide : state.firstSide === 'own' ? 'opponent' : 'own';
    const isOwnBatting = side === 'own';
    const battingTeam = isOwnBatting ? game.ownTeam : game.opponentTeam;
    const bowlingTeam = isOwnBatting ? game.opponentTeam : game.ownTeam;
    return {
      isOwnBatting,
      isUserBatting: battingTeam === userTeamName,
      isUserBowling: bowlingTeam === userTeamName,
      battingSide: isOwnBatting ? ownPlayers : opponentPlayers,
      bowlingSide: isOwnBatting ? opponentPlayers : ownPlayers,
    };
  };
  const updateState = (first, updater) => {
    const key = first ? 'firstInnings' : 'secondInnings';
    const previous = state[key];
    dispatch(setTournamentTiebreak({ [key]: typeof updater === 'function' ? updater(previous) : updater }));
  };
  const buildView = (first) => buildInningsViewModel({
    isFirstInnings: first,
    inningState: first ? state.firstInnings : state.secondInnings,
    getContext,
    matchType: superOverType,
    maxBalls: 6,
    ruleset: game.ruleset,
  });
  const view = buildView(isFirstInnings);
  const deliver = () => processDelivery({
    isFirstInnings,
    firstInnings: state.firstInnings,
    secondInnings: state.secondInnings,
    getContext,
    matchType: superOverType,
    maxBalls: 6,
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
    dispatch,
    setBattingIntentAction: setBattingIntent,
    setBattingTacticsAction: setBattingTactics,
    setBowlingIntentAction: setBowlingIntent,
    setBowlingTacticsAction: setBowlingTactics,
    setFirstInnings: (next) => updateState(true, next),
    setSecondInnings: (next) => updateState(false, next),
    firstInningsScore: state.firstInnings.score,
    setStageAction: (stage) => setTournamentTiebreak({
      phase: stage === matchStatusEnum.TeamTwoBat ? 'second' : 'complete',
    }),
  });
  deliverRef.current = deliver;

  useEffect(() => {
    if (!userInvolved && ['first', 'second'].includes(state.phase)) setAutoSimulating(true);
  }, [userInvolved, state.phase, state.round]);

  useEffect(() => {
    if (!autoSimulating) return undefined;
    if (!['first', 'second'].includes(state.phase) || !view.canPlayNextBall) {
      setAutoSimulating(false);
      return undefined;
    }
    const timer = setTimeout(() => deliverRef.current(), 0);
    return () => clearTimeout(timer);
  }, [autoSimulating, state, view.canPlayNextBall]);

  useEffect(() => {
    if (userInvolved || state.phase !== 'complete') return;
    try {
      dispatch(setTournamentTiebreak(advanceSuperOver({
        state,
        ownPlayers,
        opponentPlayers,
        ownTeam: game.ownTeam,
        opponentTeam: game.opponentTeam,
        userTeamName,
      })));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not continue the Super Over.');
    }
  }, [userInvolved, state, ownPlayers, opponentPlayers, game.ownTeam, game.opponentTeam, userTeamName, dispatch]);

  const advance = () => {
    setError('');
    try {
      dispatch(setTournamentTiebreak(advanceSuperOver({ state, ...context })));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not continue the Super Over.');
    }
  };
  const selectOpener = (index) => {
    if (innings.outBatterIndices.includes(index)) {
      setError('That batter was dismissed in an earlier Super Over.');
      return;
    }
    handleSelectOpener({ isFirstInnings, selectedIndex: index, getContext, updateState });
  };
  return {
    state,
    innings,
    view,
    isFirstInnings,
    getContext,
    buildView,
    deliver,
    selectOpener,
    selectNextBatter: (batterIndex) => handleSelectNextBatter({ isFirstInnings, batterIndex, getContext, updateState }),
    selectBowler: (bowlerIndex) => handleSelectBowler({ isFirstInnings, bowlerIndex, getContext, matchType: superOverType, updateState }),
    setBattingIntent: (value) => dispatch(setBattingIntent(value)),
    setBattingTactics: (value) => dispatch(setBattingTactics(value)),
    setBowlingIntent: (value) => dispatch(setBowlingIntent(value)),
    setBowlingTactics: (value) => dispatch(setBowlingTactics(value)),
    advance,
    autoSimulating,
    startAutoSimulation: () => setAutoSimulating(true),
    error,
  };
};
