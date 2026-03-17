import { battingAction, bowlingAction } from '../../../../gameData/actionType';
import { outVoice } from '../../../../gameData/outVoice';
import { runVoice } from '../../../../gameData/runVoice';
import { matchStatusEnum } from '../../../../gameData/matchStatusEnum';
import {
  ballByBallCommentry,
  announceTarget,
} from '../../../../utils/speechUtils';
import {
  formatBallProgress,
  getMaxOversPerBowler,
  getNextBatterIndex,
  isEligibleBowler,
  randomFrom,
  replaceName,
} from '../../../../utils/simulatorUtils';
import { canUseSpecialBall, canUseSuperShot, resolveOutcome } from '../../utils/controllerOutcomeUtils';
import { getBestEligibleBowlerIndex, selectComputerBowler } from '../../utils/controllerInningsSetupUtils';

export const processDelivery = ({
  isFirstInnings,
  firstInnings,
  secondInnings,
  getContext,
  matchType,
  maxBalls,
  battingIntent,
  bowlingIntent,
  ownSanitizedRoles,
  opponentSanitizedRoles,
  ownTeam,
  opponentTeam,
  matchCondition,
  matchTypeKey,
  locationCountry,
  dispatch,
  setBattingIntentAction,
  setBowlingIntentAction,
  setFirstInnings,
  setSecondInnings,
  firstInningsScore,
  setStageAction,
}) => {
  const inningState = isFirstInnings ? firstInnings : secondInnings;
  const { isOwnBatting, isUserBatting, isUserBowling, battingSide, bowlingSide } = getContext(isFirstInnings);

  if (!battingSide.length || !bowlingSide.length) {
    return;
  }

  if (
    inningState.needsOpeners ||
    inningState.waitingForNextBatter ||
    inningState.waitingForNextBowler ||
    inningState.strikerIndex === null ||
    inningState.nonStrikerIndex === null
  ) {
    return;
  }

  if (inningState.balls >= maxBalls || inningState.wickets >= 10) {
    dispatch(setStageAction(isFirstInnings ? matchStatusEnum.TeamTwoBat : matchStatusEnum.MatchEnd));
    return;
  }

  const striker = battingSide[inningState.strikerIndex];
  const partner = battingSide[inningState.nonStrikerIndex];
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

  const maxOversPerBowler = getMaxOversPerBowler(matchType.over);
  const maxLegalBallsPerBowler = maxOversPerBowler * 6;

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
        if (isFirstInnings) {
          setFirstInnings(nextInnings);
        } else {
          setSecondInnings(nextInnings);
        }
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

  if (currentBowlerIndex === null || currentBowlerIndex === undefined) {
    return;
  }

  const bowler =
    bowlingSide[currentBowlerIndex] ||
    (fallbackBowlerIndex === null || fallbackBowlerIndex === undefined ? null : bowlingSide[fallbackBowlerIndex]);

  if (!bowler) {
    return;
  }

  const deliveryIsPaceBowler = (bowler?.paceAbility || 0) >= (bowler?.spinAbility || 0);
  const deliveryMaxSuperShot = Math.max(
    0,
    Math.floor(
      (((deliveryIsPaceBowler ? striker?.abilityToPlayPaceBall : striker?.abilityToPlaySpinBall) || 0) - 70) / 3
    )
  );
  const unlockedKey = deliveryIsPaceBowler ? 'superShotPaceUnlocked' : 'superShotSpinUnlocked';
  const usedKey = deliveryIsPaceBowler ? 'superShotPaceUsed' : 'superShotSpinUsed';
  const progressKey = deliveryIsPaceBowler ? 'superShotPaceProgress' : 'superShotSpinProgress';

  const wasFreeHit = isUserBatting && inningState.freeHitArmed;
  const usedSuperShot = isUserBatting && battingIntent === battingAction.superShot;
  const usedSpecialBall = isUserBowling && bowlingIntent === bowlingAction.specialBowl;
  const battingRoles = isOwnBatting ? ownSanitizedRoles : opponentSanitizedRoles;
  const bowlingRoles = isOwnBatting ? opponentSanitizedRoles : ownSanitizedRoles;
  const bowlingTeamName = isOwnBatting ? opponentTeam : ownTeam;
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
    bowlingIntent,
    locationCountry,
  });
  const nextBalls = inningState.balls + (outcome.isLegalDelivery ? 1 : 0);
  const ballTag = formatBallProgress(nextBalls);

  let nextScore = inningState.score + (outcome.extraRuns || 0);
  let nextWickets = inningState.wickets;
  let nextStrikerIndex = inningState.strikerIndex;
  let nextNonStrikerIndex = inningState.nonStrikerIndex;
  let nextBatterIndex = inningState.nextBatterIndex;
  let nextBattingOrderIndices = [...(inningState.battingOrderIndices || [])];
  let nextOutBatterIndices = [...inningState.outBatterIndices];
  let nextWaitingForNextBatter = inningState.waitingForNextBatter;
  let nextCurrentBowlerIndex = currentBowlerIndex;
  let nextWaitingForNextBowler = false;
  let nextNoBalls = inningState.noBalls || 0;
  let nextWides = inningState.wides || 0;
  let nextFreeHitArmed = inningState.freeHitArmed || false;
  let nextSuperShotUsedInOver = inningState.superShotUsedInOver || 0;
  let nextSuperShotUsedMatch = inningState.superShotUsedMatch || 0;
  let nextSuperShotBonus = inningState.superShotBonus || 0;
  let nextSpecialBallUsedInOver = inningState.specialBallUsedInOver || 0;
  let nextSpecialBallUsedMatch = inningState.specialBallUsedMatch || 0;
  let nextSpecialBallBonus = inningState.specialBallBonus || 0;
  let nextCompletedOverBowlerIndices = [...(inningState.completedOverBowlerIndices || [])];
  const nextBattingStats = [...inningState.battingStats];
  const nextBowlingStats = [...inningState.bowlingStats];
  let eventLine = '';
  let deliveryCommentary = '';

  const strikerStats = nextBattingStats[inningState.strikerIndex] || {
    runs: 0,
    balls: 0,
    isOut: false,
    outByBowler: '',
    outAtScore: '',
    outAtBall: '',
    superShotPaceUnlocked: 0,
    superShotSpinUnlocked: 0,
    superShotPaceUsed: 0,
    superShotSpinUsed: 0,
    superShotPaceProgress: 0,
    superShotSpinProgress: 0,
  };
  if (outcome.isLegalDelivery) {
    nextBattingStats[inningState.strikerIndex] = {
      ...strikerStats,
      balls: (strikerStats.balls || 0) + 1,
    };
  }

  const bowlerStats = nextBowlingStats[currentBowlerIndex] || { balls: 0, runsConceded: 0, wickets: 0 };
  nextBowlingStats[currentBowlerIndex] = {
    ...bowlerStats,
    balls: (bowlerStats.balls || 0) + (outcome.isLegalDelivery ? 1 : 0),
    runsConceded: (bowlerStats.runsConceded || 0) + (outcome.extraRuns || 0),
  };

  if (outcome.token === 'wide') {
    nextWides += 1;
    eventLine = `${striker?.name || 'Batsman'} leaves it. Wide ball signaled.`;
    deliveryCommentary = `${ballTag} ${eventLine}`;
    if (usedSpecialBall) {
      nextSpecialBallUsedInOver += 1;
      nextSpecialBallUsedMatch += 1;
    }
  } else if (outcome.token === 'nb') {
    nextNoBalls += 1;
    nextFreeHitArmed = true;
    eventLine = `${bowler?.name || 'Bowler'} oversteps. No ball and free hit next.`;
    deliveryCommentary = `${ballTag} ${eventLine}`;
    if (usedSpecialBall) {
      nextSpecialBallUsedInOver += 1;
      nextSpecialBallUsedMatch += 1;
    }
  } else if (outcome.isWicket) {
    const outType = Math.floor(Math.random() * outVoice.length);
    eventLine =
      ballByBallCommentry(striker?.name, outType, false, partner?.name) ||
      replaceName(randomFrom(outVoice[outType]), striker?.name, partner?.name);
    deliveryCommentary = `${ballTag} ${eventLine}`;
    nextWickets += 1;
    nextOutBatterIndices = [...nextOutBatterIndices, inningState.strikerIndex];

    nextBattingStats[inningState.strikerIndex] = {
      ...nextBattingStats[inningState.strikerIndex],
      isOut: true,
      outByBowler: bowler?.name || 'Unknown',
      outAtScore: `${nextScore}/${nextWickets}`,
      outAtBall: formatBallProgress(nextBalls),
    };
    nextBowlingStats[currentBowlerIndex] = {
      ...nextBowlingStats[currentBowlerIndex],
      wickets: (nextBowlingStats[currentBowlerIndex]?.wickets || 0) + 1,
    };

    if (usedSuperShot) {
      nextSuperShotUsedInOver += 1;
      nextSuperShotUsedMatch += 1;
      nextBattingStats[inningState.strikerIndex] = {
        ...nextBattingStats[inningState.strikerIndex],
        [usedKey]: (nextBattingStats[inningState.strikerIndex]?.[usedKey] || 0) + 1,
      };
    }

    if (usedSpecialBall) {
      nextSpecialBallUsedInOver += 1;
      nextSpecialBallUsedMatch += 1;
    }

    if (isUserBowling) {
      nextSpecialBallBonus += 1;
    }

    const replacementIndex = getNextBatterIndex(battingSide, nextOutBatterIndices, [nextNonStrikerIndex]);

    if (replacementIndex !== -1 && nextWickets < 10) {
      if (isUserBatting) {
        nextStrikerIndex = null;
        nextWaitingForNextBatter = true;
        eventLine = `${eventLine} Choose the next batsman.`;
        nextBatterIndex = getNextBatterIndex(battingSide, nextOutBatterIndices, [nextNonStrikerIndex]);
      } else {
        nextStrikerIndex = replacementIndex;
        if (!nextBattingOrderIndices.includes(replacementIndex)) {
          nextBattingOrderIndices = [...nextBattingOrderIndices, replacementIndex];
        }
        nextBatterIndex = getNextBatterIndex(battingSide, nextOutBatterIndices, [nextNonStrikerIndex, replacementIndex]);
      }
    } else {
      nextWickets = 10;
      nextStrikerIndex = null;
    }
  } else {
    nextScore += outcome.runs;
    eventLine =
      ballByBallCommentry(striker?.name, outcome.runs, true, partner?.name) ||
      replaceName(randomFrom(runVoice[outcome.runs]), striker?.name, partner?.name);
    deliveryCommentary = `${ballTag} ${eventLine}`;

    nextBattingStats[inningState.strikerIndex] = {
      ...nextBattingStats[inningState.strikerIndex],
      runs: (nextBattingStats[inningState.strikerIndex]?.runs || 0) + outcome.runs,
    };
    nextBowlingStats[currentBowlerIndex] = {
      ...nextBowlingStats[currentBowlerIndex],
      runsConceded: (nextBowlingStats[currentBowlerIndex]?.runsConceded || 0) + outcome.runs,
    };

    if (usedSuperShot) {
      nextSuperShotUsedInOver += 1;
      nextSuperShotUsedMatch += 1;
      nextBattingStats[inningState.strikerIndex] = {
        ...nextBattingStats[inningState.strikerIndex],
        [usedKey]: (nextBattingStats[inningState.strikerIndex]?.[usedKey] || 0) + 1,
      };
    }

    if (outcome.runs > 0) {
      const currentUnlocked = nextBattingStats[inningState.strikerIndex]?.[unlockedKey] || 0;
      const currentProgress = nextBattingStats[inningState.strikerIndex]?.[progressKey] || 0;
      const earnedProgress = currentProgress + outcome.runs;
      const unlockByRuns = Math.floor(earnedProgress / 5);
      const unlockedAfterRuns = Math.min(deliveryMaxSuperShot, currentUnlocked + unlockByRuns);

      nextBattingStats[inningState.strikerIndex] = {
        ...nextBattingStats[inningState.strikerIndex],
        [unlockedKey]: unlockedAfterRuns,
        [progressKey]: unlockedAfterRuns >= deliveryMaxSuperShot ? 0 : earnedProgress % 5,
      };
    }

    if (usedSpecialBall) {
      nextSpecialBallUsedInOver += 1;
      nextSpecialBallUsedMatch += 1;
    }

    if (outcome.runs % 2 === 1) {
      const temp = nextStrikerIndex;
      nextStrikerIndex = nextNonStrikerIndex;
      nextNonStrikerIndex = temp;
    }
  }

  if (wasFreeHit && outcome.token !== 'nb') {
    nextFreeHitArmed = false;
  }

  if (outcome.isLegalDelivery && nextBalls % 6 === 0 && !nextWaitingForNextBatter) {
    nextCompletedOverBowlerIndices = [...nextCompletedOverBowlerIndices, currentBowlerIndex];
    const temp = nextStrikerIndex;
    nextStrikerIndex = nextNonStrikerIndex;
    nextNonStrikerIndex = temp;
    nextSuperShotUsedInOver = 0;
    nextSpecialBallUsedInOver = 0;

    if (isUserBowling) {
      const hasEligibleBowler = bowlingSide.some(isEligibleBowler);
      if (hasEligibleBowler) {
        nextWaitingForNextBowler = true;
        nextCurrentBowlerIndex = null;
        eventLine = `${eventLine} Over complete. Choose next bowler.`;
      } else {
        nextWaitingForNextBowler = false;
        nextCurrentBowlerIndex = getBestEligibleBowlerIndex(bowlingSide, currentBowlerIndex);
      }
    } else {
      nextCurrentBowlerIndex = selectComputerBowler({
        inningState: {
          ...inningState,
          balls: nextBalls,
          bowlingStats: nextBowlingStats,
          completedOverBowlerIndices: nextCompletedOverBowlerIndices,
        },
        bowlingSide,
        previousBowlerIndex: currentBowlerIndex,
        overs: matchType.over,
      });
    }
  }

  const nextState = {
    ...inningState,
    score: nextScore,
    wickets: nextWickets,
    balls: nextBalls,
    wides: nextWides,
    noBalls: nextNoBalls,
    strikerIndex: nextStrikerIndex,
    nonStrikerIndex: nextNonStrikerIndex,
    nextBatterIndex,
    battingOrderIndices: nextBattingOrderIndices,
    outBatterIndices: nextOutBatterIndices,
    waitingForNextBatter: nextWaitingForNextBatter,
    currentBowlerIndex: nextCurrentBowlerIndex,
    lastOverBowlerIndex: nextBalls % 6 === 0 && !nextWaitingForNextBatter ? currentBowlerIndex : inningState.lastOverBowlerIndex,
    waitingForNextBowler: nextWaitingForNextBowler,
    battingStats: nextBattingStats,
    bowlingStats: nextBowlingStats,
    freeHitArmed: nextFreeHitArmed,
    superShotUsedInOver: nextSuperShotUsedInOver,
    superShotUsedMatch: nextSuperShotUsedMatch,
    superShotBonus: nextSuperShotBonus,
    specialBallUsedInOver: nextSpecialBallUsedInOver,
    specialBallUsedMatch: nextSpecialBallUsedMatch,
    specialBallBonus: nextSpecialBallBonus,
    completedOverBowlerIndices: nextCompletedOverBowlerIndices,
    lastEvent: eventLine,
    commentary: [deliveryCommentary, ...inningState.commentary].filter(Boolean).slice(0, 10),
  };

  if (isUserBatting && nextState.freeHitArmed && battingIntent !== battingAction.freeHit) {
    dispatch(setBattingIntentAction(battingAction.freeHit));
  }

  if (isUserBatting && !nextState.freeHitArmed && battingIntent === battingAction.freeHit) {
    dispatch(setBattingIntentAction(battingAction.normal));
  }

  if (isUserBatting && battingIntent === battingAction.superShot) {
    const nextCanUseSuperShot = canUseSuperShot({
      striker: battingSide[nextState.strikerIndex],
      bowler: bowlingSide[nextState.currentBowlerIndex ?? currentBowlerIndex],
      inningState: nextState,
      strikerIndex: nextState.strikerIndex,
    });

    if (!nextCanUseSuperShot) {
      dispatch(setBattingIntentAction(battingAction.normal));
    }
  }

  if (isUserBowling && bowlingIntent === bowlingAction.specialBowl) {
    const nextCanUseSpecialBall = canUseSpecialBall({
      bowler: bowlingSide[nextState.currentBowlerIndex ?? currentBowlerIndex],
      inningState: nextState,
    });

    if (!nextCanUseSpecialBall) {
      dispatch(setBowlingIntentAction(bowlingAction.normal));
    }
  }

  if (isFirstInnings) {
    setFirstInnings(nextState);
    if (nextBalls >= maxBalls || nextWickets >= 10) {
      announceTarget(isOwnBatting ? opponentTeam : ownTeam, nextScore);
      dispatch(setStageAction(matchStatusEnum.TeamTwoBat));
    }
    return;
  }

  setSecondInnings(nextState);
  if (nextScore > firstInningsScore || nextBalls >= maxBalls || nextWickets >= 10) {
    dispatch(setStageAction(matchStatusEnum.MatchEnd));
  }
};
