import { outVoice } from '../../../../gameData/outVoice';
import { runVoice } from '../../../../gameData/runVoice';
import { ballByBallCommentry } from '../../../../utils/speechUtils';
import { formatBallProgress, getNextBatterIndex, randomFrom, replaceName } from '../../../../utils/simulatorUtils';

const dismissalVoiceIndex = {
  caught: 0,
  runOut: 1,
  lbw: 2,
  bowled: 3,
  stumped: 4,
  caughtAndBowled: 5,
  hitWicket: 6,
};

const emptyBattingStats = () => ({
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
});

export const scoreDelivery = ({
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
  random = Math.random,
  maxWickets = 10,
  silent = false,
  allowFreeHit = true,
}) => {
  const strikerIndex = inningState.strikerIndex;
  const nonStrikerIndex = inningState.nonStrikerIndex;
  const striker = battingSide[strikerIndex];
  const partner = battingSide[nonStrikerIndex];
  const batRuns = Number(outcome.runs) || 0;
  const extraRuns = Number(outcome.extraRuns) || 0;
  const extras = outcome.extras || {};
  const isWide = outcome.token === 'wide';
  const isNoBall = outcome.token === 'nb';
  const completedRuns = outcome.completedRuns ?? (
    isWide ? Math.max(0, extraRuns - 1) : batRuns + (Number(extras.bye) || 0) + (Number(extras.legBye) || 0)
  );
  const nextBalls = inningState.balls + (outcome.isLegalDelivery ? 1 : 0);
  const nextScore = inningState.score + batRuns + extraRuns;
  const ballTag = formatBallProgress(nextBalls);
  const battingStats = [...inningState.battingStats];
  const bowlingStats = [...inningState.bowlingStats];
  const strikerStats = battingStats[strikerIndex] || emptyBattingStats();
  const bowlerStats = bowlingStats[currentBowlerIndex] || { balls: 0, runsConceded: 0, wickets: 0 };
  const nonBowlerExtras = (Number(extras.bye) || 0) + (Number(extras.legBye) || 0);

  battingStats[strikerIndex] = {
    ...strikerStats,
    runs: (strikerStats.runs || 0) + batRuns,
    balls: (strikerStats.balls || 0) + (isWide ? 0 : 1),
  };
  bowlingStats[currentBowlerIndex] = {
    ...bowlerStats,
    balls: (bowlerStats.balls || 0) + (outcome.isLegalDelivery ? 1 : 0),
    runsConceded: (bowlerStats.runsConceded || 0) + batRuns + extraRuns - nonBowlerExtras,
  };

  let nextStrikerIndex = strikerIndex;
  let nextNonStrikerIndex = nonStrikerIndex;
  let nextBatterIndex = inningState.nextBatterIndex;
  let battingOrderIndices = [...(inningState.battingOrderIndices || [])];
  let outBatterIndices = [...inningState.outBatterIndices];
  let waitingForNextBatter = false;
  let wickets = inningState.wickets;
  let specialBallBonus = inningState.specialBallBonus || 0;
  let eventLine;
  let dismissal = null;
  const usedShot = usedSuperShot && !isWide && (!isNoBall || batRuns > 0);
  const usedKey = deliveryIsPaceBowler ? 'superShotPaceUsed' : 'superShotSpinUsed';
  const unlockedKey = deliveryIsPaceBowler ? 'superShotPaceUnlocked' : 'superShotSpinUnlocked';
  const progressKey = deliveryIsPaceBowler ? 'superShotPaceProgress' : 'superShotSpinProgress';

  if (usedShot) {
    battingStats[strikerIndex] = {
      ...battingStats[strikerIndex],
      [usedKey]: (battingStats[strikerIndex][usedKey] || 0) + 1,
    };
  }
  if (batRuns > 0) {
    const stats = battingStats[strikerIndex];
    const earnedProgress = (stats[progressKey] || 0) + batRuns;
    const unlockedAfterRuns = Math.min(deliveryMaxSuperShot, (stats[unlockedKey] || 0) + Math.floor(earnedProgress / 5));
    battingStats[strikerIndex] = {
      ...stats,
      [unlockedKey]: unlockedAfterRuns,
      [progressKey]: unlockedAfterRuns >= deliveryMaxSuperShot ? 0 : earnedProgress % 5,
    };
  }

  if (outcome.isWicket) {
    dismissal = outcome.dismissal || { type: 'caught', batterIndex: strikerIndex };
    const dismissedIndex = dismissal.batterIndex ?? strikerIndex;
    if (!(dismissal.type in dismissalVoiceIndex) || ![strikerIndex, nonStrikerIndex].includes(dismissedIndex)) {
      throw new Error('Invalid dismissal in delivery outcome');
    }
    if ((isNoBall || (allowFreeHit && inningState.freeHitArmed)) && dismissal.type !== 'runOut') {
      throw new Error('This dismissal is not permitted on a no-ball or free hit');
    }
    if (isWide && !['runOut', 'stumped', 'hitWicket'].includes(dismissal.type)) {
      throw new Error('This dismissal is not permitted on a wide.');
    }
    const dismissed = battingSide[dismissedIndex];
    const creditedToBowler = dismissal.type !== 'runOut';
    const outType = dismissalVoiceIndex[dismissal.type];
    eventLine = dismissal.type === 'runOut'
      ? `${dismissed?.name || 'Batter'} is run out${dismissal.fielderName ? ` by ${dismissal.fielderName}` : ''}.`
      : ballByBallCommentry(dismissed?.name, outType, false, partner?.name, random, !silent) ||
        replaceName(randomFrom(outVoice[outType], random), dismissed?.name, partner?.name);
    if (isNoBall) eventLine = `No ball. ${eventLine}`;
    if (isWide) eventLine = `Wide ball. ${eventLine}`;
    if (batRuns) eventLine = `${eventLine} ${batRuns} run${batRuns === 1 ? '' : 's'} off the bat.`;
    wickets += 1;
    outBatterIndices.push(dismissedIndex);
    battingStats[dismissedIndex] = {
      ...(battingStats[dismissedIndex] || emptyBattingStats()),
      isOut: true,
      dismissal,
      outByBowler: creditedToBowler ? bowler?.name || 'Unknown' : '',
      outAtScore: `${nextScore}/${wickets}`,
      outAtBall: ballTag,
    };
    if (creditedToBowler) {
      bowlingStats[currentBowlerIndex] = {
        ...bowlingStats[currentBowlerIndex],
        wickets: (bowlingStats[currentBowlerIndex].wickets || 0) + 1,
      };
    }
    if (isUserBowling) specialBallBonus += 1;

    if (dismissedIndex === strikerIndex) nextStrikerIndex = null;
    else nextNonStrikerIndex = null;
    const remaining = dismissedIndex === strikerIndex ? nonStrikerIndex : strikerIndex;
    const replacementIndex = getNextBatterIndex(battingSide, outBatterIndices, [remaining]);
    if (replacementIndex !== -1 && wickets < maxWickets) {
      if (isUserBatting) {
        waitingForNextBatter = true;
        nextBatterIndex = replacementIndex;
        eventLine = `${eventLine} Choose the next batsman.`;
      } else {
        if (dismissedIndex === strikerIndex) nextStrikerIndex = replacementIndex;
        else nextNonStrikerIndex = replacementIndex;
        if (!battingOrderIndices.includes(replacementIndex)) battingOrderIndices.push(replacementIndex);
        nextBatterIndex = getNextBatterIndex(battingSide, outBatterIndices, [remaining, replacementIndex]);
      }
    } else if (replacementIndex === -1) {
      wickets = maxWickets;
    }
  } else if (isWide) {
    eventLine = `${striker?.name || 'Batsman'} leaves it. Wide ball signaled.`;
  } else if (isNoBall) {
    eventLine = allowFreeHit
      ? `${bowler?.name || 'Bowler'} oversteps. No ball and free hit next.`
      : `${bowler?.name || 'Bowler'} oversteps. No ball signaled.`;
    if (batRuns) eventLine = `${eventLine} ${batRuns} run${batRuns === 1 ? '' : 's'} off the bat.`;
  } else if (nonBowlerExtras > 0) {
    eventLine = `${nonBowlerExtras} ${extras.legBye ? 'leg-bye' : 'bye'}${nonBowlerExtras === 1 ? '' : 's'}.`;
  } else {
    eventLine = ballByBallCommentry(striker?.name, batRuns, true, partner?.name, random, !silent) ||
      replaceName(randomFrom(runVoice[batRuns === 6 ? 5 : batRuns], random), striker?.name, partner?.name);
  }

  if (completedRuns % 2 === 1) {
    [nextStrikerIndex, nextNonStrikerIndex] = [nextNonStrikerIndex, nextStrikerIndex];
  }
  const freeHitArmed = allowFreeHit && (isNoBall || (inningState.freeHitArmed && !outcome.isLegalDelivery));

  return {
    ...inningState,
    score: nextScore,
    wickets,
    balls: nextBalls,
    wides: (inningState.wides || 0) + (isWide ? extraRuns : 0),
    noBalls: (inningState.noBalls || 0) + (isNoBall ? (Number(extras.noBall) || 1) : 0),
    byes: (inningState.byes || 0) + (Number(extras.bye) || 0),
    legByes: (inningState.legByes || 0) + (Number(extras.legBye) || 0),
    strikerIndex: nextStrikerIndex,
    nonStrikerIndex: nextNonStrikerIndex,
    nextBatterIndex,
    battingOrderIndices,
    outBatterIndices,
    waitingForNextBatter,
    currentBowlerIndex,
    waitingForNextBowler: false,
    battingStats,
    bowlingStats,
    freeHitArmed,
    superShotUsedInOver: (inningState.superShotUsedInOver || 0) + (usedShot ? 1 : 0),
    superShotUsedMatch: (inningState.superShotUsedMatch || 0) + (usedShot ? 1 : 0),
    specialBallUsedInOver: (inningState.specialBallUsedInOver || 0) + (usedSpecialBall ? 1 : 0),
    specialBallUsedMatch: (inningState.specialBallUsedMatch || 0) + (usedSpecialBall ? 1 : 0),
    specialBallBonus,
    lastEvent: eventLine,
    commentary: [`${ballTag} ${eventLine}`, ...(inningState.commentary || [])].filter(Boolean).slice(0, 10),
    deliveryDismissal: dismissal,
  };
};
