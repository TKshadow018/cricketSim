import { useEffect } from 'react';
import { matchStatusEnum } from '../../../../gameData/matchStatusEnum';
import { weather, pitchType, outfieldType } from '../../../../gameData/matchCondition';
import { randomKey, MODE_TOURNAMENT, MODE_CAREER } from '../../utils/controllerCommonUtils';
import { getOpponentDecision, isInningsReadyForNextBall } from '../../../../utils/simulatorUtils';
import { speak } from '../../../../utils/speechUtils';
import { beginMatchRandom } from '../../utils/matchRandom';

export const useTossAndSimulationHandlers = ({
  dispatch,
  game,
  setMatchRandomAction,
  isCurrentMatchUserInvolved,
  stage,
  matchStatusEnumLocal = matchStatusEnum,
  setAutoSimMode,
  firstInnings,
  secondInnings,
  resolveStadiumConditionRef,
  selectedStadium,
  ownTeam,
  opponentTeam,
  setMatchConditionAction,
  setTossCallAction,
  setTossWinnerAction,
  setTossDecisionAction,
  setFirstBattingSideAction,
  setStageAction,
  userTeamName,
  gameMode,
  firstBattingSide,
  openInningsRef,
  processDeliveryRef,
  maxBalls,
  autoSimMode,
  venueStadiums,
  matchCondition,
  firstInningsView,
  secondInningsView,
}) => {
  const handleOpponentWonFlow = (decision, winner) => {
    if (!isCurrentMatchUserInvolved) {
      speak(`${winner} won toss and chose to ${decision} first.`);
      return;
    }

    const remaining = decision === 'bat' ? 'bowl' : 'bat';
    speak(`${winner} chose to ${decision} first. You must ${remaining} first.`);
  };

  const resolveStadiumCondition = (stadiumName, weatherKey = randomKey(weather)) => {
    const selected = (venueStadiums || []).find((stadiumItem) => stadiumItem?.name === stadiumName);
    const pitch = pitchType[selected?.pitchType] ? selected.pitchType : 'sporting';
    const outfield = outfieldType[selected?.outfieldType] ? selected.outfieldType : 'lushGreen';

    return {
      weather: weatherKey || randomKey(weather) || 'sunny',
      pitch,
      outfield,
    };
  };
  resolveStadiumConditionRef.current = resolveStadiumCondition;

  const handleSetSelectedStadium = (value) => {
    dispatch(setMatchConditionAction(resolveStadiumCondition(value, matchCondition.weather)));
  };

  const handleTossCall = (call) => {
    const generator = game ? beginMatchRandom(game.matchRandom) : null;
    const weatherKeys = Object.keys(weather);
    const weatherKey = generator ? weatherKeys[Math.floor(generator.next() * weatherKeys.length)] : randomKey(weather);
    const nextCondition = resolveStadiumConditionRef.current(selectedStadium, weatherKey);
    dispatch(setMatchConditionAction(nextCondition));
    dispatch(setTossCallAction(call));

    const tossFace = (generator ? generator.next() : Math.random()) > 0.5 ? 'crown' : 'dollar';
    const userWins = tossFace === call;
    const userSideTeam = userTeamName || ownTeam;
    const opponentSideTeam = userSideTeam === ownTeam ? opponentTeam : ownTeam;
    const winner = userWins ? userSideTeam : opponentSideTeam;

    dispatch(setTossWinnerAction(winner));

    if (userWins) {
      dispatch(setTossDecisionAction('bat'));
      const firstSide = userSideTeam === ownTeam ? 'own' : 'opponent';
      dispatch(setFirstBattingSideAction(firstSide));
      speak(`Toss result is ${tossFace}. You won the toss. Choose bat or bowl.`);
    } else {
      const decision = getOpponentDecision(nextCondition);
      dispatch(setTossDecisionAction(decision));
      const firstSide =
        decision === 'bat'
          ? opponentSideTeam === ownTeam
            ? 'own'
            : 'opponent'
          : userSideTeam === ownTeam
            ? 'own'
            : 'opponent';
      dispatch(setFirstBattingSideAction(firstSide));
      handleOpponentWonFlow(decision, winner);
    }

    if (generator) dispatch(setMatchRandomAction(generator.snapshot()));
    dispatch(setStageAction(matchStatusEnumLocal.TossResult));
  };

  const simulateCurrentOver = () => {
    if (isCurrentMatchUserInvolved || stage === matchStatusEnumLocal.MatchEnd) {
      return;
    }

    const startBalls = stage === matchStatusEnumLocal.TeamOneBat ? firstInnings.balls : secondInnings.balls;
    setAutoSimMode({ type: 'over', inningsStage: stage, startBalls });
  };

  const simulateFullMatch = () => {
    if (isCurrentMatchUserInvolved || stage === matchStatusEnumLocal.MatchEnd) {
      return;
    }

    const startBalls = stage === matchStatusEnumLocal.TeamOneBat ? firstInnings.balls : secondInnings.balls;
    setAutoSimMode({ type: 'match', inningsStage: stage, startBalls });
  };

  useEffect(() => {
    if (!autoSimMode) {
      return;
    }

    if (stage === matchStatusEnumLocal.MatchEnd) {
      setAutoSimMode(null);
      return;
    }

    if (stage !== matchStatusEnumLocal.TeamOneBat && stage !== matchStatusEnumLocal.TeamTwoBat) {
      return;
    }

    const isFirstInnings = stage === matchStatusEnumLocal.TeamOneBat;
    const inningsState = isFirstInnings ? firstInnings : secondInnings;
    const canPlay = isInningsReadyForNextBall(inningsState, maxBalls);

    if (autoSimMode.type === 'over' && autoSimMode.inningsStage !== stage) {
      setAutoSimMode(null);
      return;
    }

    if (autoSimMode.type === 'over' && inningsState.balls > autoSimMode.startBalls && inningsState.balls % 6 === 0) {
      setAutoSimMode(null);
      return;
    }

    if (!canPlay) {
      setAutoSimMode(null);
      return;
    }

    const timer = setTimeout(() => {
      processDeliveryRef.current?.(isFirstInnings);
    }, 0);

    return () => clearTimeout(timer);
  }, [
    autoSimMode,
    stage,
    matchStatusEnumLocal.MatchEnd,
    matchStatusEnumLocal.TeamOneBat,
    matchStatusEnumLocal.TeamTwoBat,
    firstInnings,
    secondInnings,
    maxBalls,
    setAutoSimMode,
    processDeliveryRef,
  ]);

  useEffect(() => {
    if (gameMode !== MODE_TOURNAMENT || isCurrentMatchUserInvolved || stage !== matchStatusEnumLocal.TossTime) {
      return;
    }

    const generator = game ? beginMatchRandom(game.matchRandom) : null;
    const weatherKeys = Object.keys(weather);
    const weatherKey = generator ? weatherKeys[Math.floor(generator.next() * weatherKeys.length)] : randomKey(weather);
    const nextCondition = resolveStadiumConditionRef.current(selectedStadium, weatherKey);
    const winner = (generator ? generator.next() : Math.random()) > 0.5 ? ownTeam : opponentTeam;
    const decision = getOpponentDecision(nextCondition);
    const firstSide =
      decision === 'bat'
        ? winner === ownTeam
          ? 'own'
          : 'opponent'
        : winner === ownTeam
          ? 'opponent'
          : 'own';

    dispatch(setMatchConditionAction(nextCondition));
    dispatch(setTossCallAction('auto'));
    dispatch(setTossWinnerAction(winner));
    dispatch(setTossDecisionAction(decision));
    dispatch(setFirstBattingSideAction(firstSide));
    if (generator) dispatch(setMatchRandomAction(generator.snapshot()));
    dispatch(setStageAction(matchStatusEnumLocal.TossResult));
  }, [
    gameMode,
    isCurrentMatchUserInvolved,
    stage,
    matchStatusEnumLocal.TossTime,
    matchStatusEnumLocal.TossResult,
    selectedStadium,
    ownTeam,
    opponentTeam,
    dispatch,
    resolveStadiumConditionRef,
    setMatchConditionAction,
    setTossCallAction,
    setTossWinnerAction,
    setTossDecisionAction,
    setFirstBattingSideAction,
    setStageAction,
    game,
    setMatchRandomAction,
  ]);

  useEffect(() => {
    if (gameMode !== MODE_CAREER || stage !== matchStatusEnumLocal.TossTime) {
      return;
    }

    const generator = game ? beginMatchRandom(game.matchRandom) : null;
    const weatherKeys = Object.keys(weather);
    const weatherKey = generator ? weatherKeys[Math.floor(generator.next() * weatherKeys.length)] : randomKey(weather);
    const nextCondition = resolveStadiumConditionRef.current(selectedStadium, weatherKey);
    const winner = (generator ? generator.next() : Math.random()) > 0.5 ? ownTeam : opponentTeam;
    const decision = getOpponentDecision(nextCondition);
    const firstSide =
      decision === 'bat'
        ? winner === ownTeam
          ? 'own'
          : 'opponent'
        : winner === ownTeam
          ? 'opponent'
          : 'own';

    dispatch(setMatchConditionAction(nextCondition));
    dispatch(setTossCallAction('auto'));
    dispatch(setTossWinnerAction(winner));
    dispatch(setTossDecisionAction(decision));
    dispatch(setFirstBattingSideAction(firstSide));
    if (generator) dispatch(setMatchRandomAction(generator.snapshot()));
    dispatch(setStageAction(matchStatusEnumLocal.TossResult));
  }, [
    gameMode,
    stage,
    matchStatusEnumLocal.TossTime,
    matchStatusEnumLocal.TossResult,
    selectedStadium,
    ownTeam,
    opponentTeam,
    dispatch,
    resolveStadiumConditionRef,
    setMatchConditionAction,
    setTossCallAction,
    setTossWinnerAction,
    setTossDecisionAction,
    setFirstBattingSideAction,
    setStageAction,
    game,
    setMatchRandomAction,
  ]);

  useEffect(() => {
    if (gameMode !== MODE_TOURNAMENT || isCurrentMatchUserInvolved || stage !== matchStatusEnumLocal.TossResult) {
      return;
    }

    openInningsRef.current?.(firstBattingSide);
  }, [
    gameMode,
    isCurrentMatchUserInvolved,
    stage,
    matchStatusEnumLocal.TossResult,
    firstBattingSide,
    openInningsRef,
  ]);

  useEffect(() => {
    if (gameMode !== MODE_CAREER || stage !== matchStatusEnumLocal.TossResult) {
      return;
    }

    openInningsRef.current?.(firstBattingSide);
  }, [gameMode, stage, matchStatusEnumLocal.TossResult, firstBattingSide, openInningsRef]);

  useEffect(() => {
    if (gameMode !== MODE_CAREER || autoSimMode) {
      return;
    }

    if (stage !== matchStatusEnumLocal.TeamOneBat && stage !== matchStatusEnumLocal.TeamTwoBat) {
      return;
    }

    const isFirstInnings = stage === matchStatusEnumLocal.TeamOneBat;
    const inningsState = isFirstInnings ? firstInnings : secondInnings;
    const activeView = isFirstInnings ? firstInningsView : secondInningsView;

    if (!inningsState || !activeView) {
      return;
    }

    if (activeView.isUserBatting || activeView.isUserBowling) {
      return;
    }

    if (!isInningsReadyForNextBall(inningsState, maxBalls)) {
      return;
    }

    const timer = setTimeout(() => {
      processDeliveryRef.current?.(isFirstInnings);
    }, 0);

    return () => clearTimeout(timer);
  }, [
    gameMode,
    autoSimMode,
    stage,
    firstInnings,
    secondInnings,
    firstInningsView,
    secondInningsView,
    maxBalls,
    processDeliveryRef,
    matchStatusEnumLocal,
  ]);

  return {
    handleSetSelectedStadium,
    handleTossCall,
    simulateCurrentOver,
    simulateFullMatch,
  };
};
