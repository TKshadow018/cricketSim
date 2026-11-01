import { battingAction, bowlingAction } from '../../../../gameData/actionType';
import { matchStatusEnum } from '../../../../gameData/matchStatusEnum';
import { announceTarget } from '../../../../utils/speechUtils';
import { getEligibleBowlerIndices, getMaxOversPerBowler } from '../../../../utils/simulatorUtils';
import { canUseSpecialBall, resolveOutcome } from '../../utils/controllerOutcomeUtils';
import { getBestEligibleBowlerIndex, selectComputerBowler } from '../../utils/controllerInningsSetupUtils';
import { buildNextBallHistory } from '../../utils/bowlingBallEventUtils';
import { getBattingTacticsResetPatch } from '../../utils/battingTactics';
import { DEFAULT_BOWLING_TACTICS } from '../../utils/bowlingTactics';
import { selectOpponentFieldForDelivery } from '../../utils/opponentField';
import { syncDeliveryIntentState } from './controllerDeliveryIntentUtils';
import { scoreDelivery } from './controllerDeliveryScoring';

export const processDelivery = ({
  isFirstInnings,
  firstInnings,
  secondInnings,
  getContext,
  matchType,
  maxBalls,
  battingIntent,
  battingTactics,
  bowlingIntent,
  bowlingTactics,
  ownSanitizedRoles,
  opponentSanitizedRoles,
  ownTeam,
  opponentTeam,
  matchCondition,
  matchTypeKey,
  locationCountry,
  dispatch,
  setBattingIntentAction,
  setBattingTacticsAction,
  setBowlingIntentAction,
  setBowlingTacticsAction,
  setFirstInnings,
  setSecondInnings,
  firstInningsScore,
  setStageAction,
}) => {
  const inningState = isFirstInnings ? firstInnings : secondInnings;
  const { isOwnBatting, isUserBatting, isUserBowling, battingSide, bowlingSide } = getContext(
    isFirstInnings,
    undefined,
    inningState
  );
  if (!battingSide.length || !bowlingSide.length) return;
  if (
    inningState.needsOpeners ||
    inningState.waitingForNextBatter ||
    inningState.waitingForNextBowler ||
    inningState.strikerIndex === null ||
    inningState.nonStrikerIndex === null
  ) return;
  if (inningState.balls >= maxBalls || inningState.wickets >= 10) {
    dispatch(setStageAction(isFirstInnings ? matchStatusEnum.TeamTwoBat : matchStatusEnum.MatchEnd));
    return;
  }

  const striker = battingSide[inningState.strikerIndex];
  const fallbackBowlerIndex = getBestEligibleBowlerIndex(bowlingSide, inningState.lastOverBowlerIndex);
  const hasAssignedBowler = inningState.currentBowlerIndex !== null && inningState.currentBowlerIndex !== undefined;
  let currentBowlerIndex = hasAssignedBowler
    ? inningState.currentBowlerIndex
    : isUserBowling
      ? null
      : selectComputerBowler({
          inningState,
          bowlingSide,
          previousBowlerIndex: inningState.lastOverBowlerIndex,
          overs: matchType.over,
        });
  const maxLegalBallsPerBowler = getMaxOversPerBowler(matchType.over) * 6;

  if (currentBowlerIndex !== null && currentBowlerIndex !== undefined) {
    const assignedBalls = inningState.bowlingStats[currentBowlerIndex]?.balls || 0;
    if (assignedBalls >= maxLegalBallsPerBowler) {
      if (isUserBowling) {
        const nextInnings = {
          ...inningState,
          waitingForNextBowler: true,
          currentBowlerIndex: null,
          lastEvent: 'Selected bowler reached over limit. Choose another bowler.',
        };
        if (isFirstInnings) setFirstInnings(nextInnings);
        else setSecondInnings(nextInnings);
        return;
      }
      currentBowlerIndex = selectComputerBowler({
        inningState,
        bowlingSide,
        previousBowlerIndex: currentBowlerIndex,
        overs: matchType.over,
      });
    }
  }
  if (currentBowlerIndex === null || currentBowlerIndex === undefined) return;

  const bowler = bowlingSide[currentBowlerIndex] ||
    (fallbackBowlerIndex === null || fallbackBowlerIndex === undefined ? null : bowlingSide[fallbackBowlerIndex]);
  if (!bowler) return;

  const hasUserBowlingTactics = Boolean(isUserBowling && bowlingTactics && typeof bowlingTactics === 'object');
  const hasArmedSpecial = hasUserBowlingTactics && Boolean(bowlingTactics.specialDeliveryArmed);
  const usedSpecialBall = isUserBowling && (
    hasUserBowlingTactics
      ? hasArmedSpecial && canUseSpecialBall({ bowler, inningState })
      : bowlingIntent === bowlingAction.specialBowl
  );
  const deliveryBowlingTactics = hasUserBowlingTactics
    ? { ...bowlingTactics, specialDeliveryArmed: usedSpecialBall }
    : undefined;
  const deliveryIsPaceBowler = (bowler?.paceAbility || 0) >= (bowler?.spinAbility || 0);
  const deliveryMaxSuperShot = Math.max(
    0,
    Math.floor((((deliveryIsPaceBowler ? striker?.abilityToPlayPaceBall : striker?.abilityToPlaySpinBall) || 0) - 70) / 3)
  );
  const wasFreeHit = Boolean(inningState.freeHitArmed);
  const usedSuperShot = isUserBatting && battingIntent === battingAction.superShot;
  const battingRoles = isOwnBatting ? ownSanitizedRoles : opponentSanitizedRoles;
  const bowlingRoles = isOwnBatting ? opponentSanitizedRoles : ownSanitizedRoles;
  const bowlingTeamName = isOwnBatting ? opponentTeam : ownTeam;
  const opponentFieldPreset = isUserBatting
    ? selectOpponentFieldForDelivery({ isFirstInnings, inningState, matchType, matchTypeKey, firstInningsScore })
    : undefined;
  const outcome = resolveOutcome({
    striker,
    bowler,
    inningState,
    isUserBatting,
    isUserBowling,
    battingRoles,
    bowlingRoles,
    bowlingTeamName,
    matchCondition,
    matchType,
    matchTypeKey,
    battingIntent,
    battingTactics,
    battingSide,
    bowlingSide,
    bowlingIntent,
    bowlingTactics: deliveryBowlingTactics,
    opponentFieldPreset,
    locationCountry,
  });
  const { deliveryDismissal, ...nextState } = scoreDelivery({
    inningState,
    outcome,
    battingSide,
    bowler,
    currentBowlerIndex,
    isUserBatting,
    isUserBowling,
    usedSuperShot,
    usedSpecialBall,
    deliveryIsPaceBowler,
    deliveryMaxSuperShot,
  });

  if (outcome.isLegalDelivery && nextState.balls % 6 === 0) {
    nextState.completedOverBowlerIndices = [...(inningState.completedOverBowlerIndices || []), currentBowlerIndex];
    [nextState.strikerIndex, nextState.nonStrikerIndex] = [nextState.nonStrikerIndex, nextState.strikerIndex];
    nextState.superShotUsedInOver = 0;
    nextState.specialBallUsedInOver = 0;
    nextState.lastOverBowlerIndex = currentBowlerIndex;
    if (isUserBowling) {
      if (getEligibleBowlerIndices(bowlingSide).length > 0) {
        nextState.waitingForNextBowler = true;
        nextState.currentBowlerIndex = null;
        nextState.lastEvent = `${nextState.lastEvent} Over complete. Choose next bowler.`;
      } else {
        nextState.currentBowlerIndex = getBestEligibleBowlerIndex(bowlingSide, currentBowlerIndex);
      }
    } else {
      nextState.currentBowlerIndex = selectComputerBowler({
        inningState: nextState,
        bowlingSide,
        previousBowlerIndex: currentBowlerIndex,
        overs: matchType.over,
      });
    }
  }
  nextState.ballHistory = buildNextBallHistory({
    inningState,
    outcome: deliveryDismissal ? { ...outcome, dismissal: deliveryDismissal } : outcome,
    striker,
    bowler,
    battingTactics,
    bowlingTactics: deliveryBowlingTactics,
    opponentFieldPreset,
    isUserBatting,
    isUserBowling,
    specialShot: usedSuperShot,
  });
  const previousEvents = Array.isArray(inningState.deliveryEvents)
    ? inningState.deliveryEvents
    : Array.isArray(inningState.ballHistory) ? inningState.ballHistory : [];
  nextState.deliveryEvents = [...previousEvents, nextState.ballHistory[nextState.ballHistory.length - 1]];

  const bowlerIndexForIntent = nextState.currentBowlerIndex === null || nextState.currentBowlerIndex === undefined
    ? currentBowlerIndex
    : nextState.currentBowlerIndex;
  const inningsEnded = nextState.balls >= maxBalls || nextState.wickets >= 10;
  const battingTacticsResetPatch = getBattingTacticsResetPatch(battingTactics, {
    wasFreeHit,
    freeHitArmed: nextState.freeHitArmed,
    newBatterAtStrike: nextState.waitingForNextBatter || nextState.strikerIndex === null,
    resetAll: isFirstInnings && inningsEnded,
  });
  syncDeliveryIntentState({
    dispatch,
    isUserBatting,
    isUserBowling,
    isFirstInnings,
    inningsEnded,
    nextState,
    battingIntent,
    bowlingIntent,
    battingSide,
    bowlingSide,
    bowlerIndexForIntent,
    hasUserBowlingTactics,
    hasArmedSpecial,
    setBattingIntentAction,
    setBowlingIntentAction,
    setBowlingTacticsAction,
  });
  if (battingTacticsResetPatch && typeof setBattingTacticsAction === 'function') {
    dispatch(setBattingTacticsAction(battingTacticsResetPatch));
  }
  if (isFirstInnings) {
    setFirstInnings(nextState);
    if (inningsEnded) {
      dispatch(setBowlingTacticsAction(DEFAULT_BOWLING_TACTICS));
      announceTarget(isOwnBatting ? opponentTeam : ownTeam, nextState.score);
      dispatch(setStageAction(matchStatusEnum.TeamTwoBat));
    }
    return;
  }
  setSecondInnings(nextState);
  if (nextState.score > firstInningsScore || inningsEnded) {
    dispatch(setStageAction(matchStatusEnum.MatchEnd));
  }
};
