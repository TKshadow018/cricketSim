import {
  battingActionList,
  bowlingActionList,
  canSelectBowler,
  getEligibleBowlerIndices,
  getMaxOversPerBowler,
  isInningsReadyForNextBall,
} from '../../../../utils/simulatorUtils';
import { battingAction, bowlingAction } from '../../../../gameData/actionType';
import { canUseSpecialBall, canUseSuperShot } from '../../utils/controllerOutcomeUtils';

export const buildInningsViewModel = ({
  isFirstInnings,
  inningState,
  getContext,
  matchType,
  maxBalls,
}) => {
  const { isUserBatting, isUserBowling, battingSide, bowlingSide } = getContext(isFirstInnings);
  const maxOversPerBowler = getMaxOversPerBowler(matchType.over);
  const striker =
    inningState.strikerIndex === null || inningState.strikerIndex === undefined
      ? null
      : battingSide[inningState.strikerIndex];
  const currentBowler =
    inningState.currentBowlerIndex === null || inningState.currentBowlerIndex === undefined
      ? null
      : bowlingSide[inningState.currentBowlerIndex];
  const canUseCurrentSuperShot = canUseSuperShot({
    striker,
    bowler: currentBowler,
    inningState,
    strikerIndex: inningState.strikerIndex,
  });
  const canUseCurrentSpecialBall = canUseSpecialBall({
    bowler: currentBowler,
    inningState,
  });
  const currentBowlerStat =
    currentBowler && Array.isArray(inningState.bowlingStats)
      ? inningState.bowlingStats[inningState.currentBowlerIndex] || {}
      : {};
  const currentBowlerBalls = Number(currentBowlerStat.balls) || 0;
  const oversRemainingBalls = Math.max(0, maxOversPerBowler * 6 - currentBowlerBalls);
  const currentOverNumber = Math.floor((Number(inningState.balls) || 0) / 6) + 1;
  const currentOverBall = (Number(inningState.balls) || 0) % 6;
  const strikerStat =
    inningState.strikerIndex === null || inningState.strikerIndex === undefined
      ? {}
      : inningState.battingStats?.[inningState.strikerIndex] || {};
  const nonStrikerStat =
    inningState.nonStrikerIndex === null || inningState.nonStrikerIndex === undefined
      ? {}
      : inningState.battingStats?.[inningState.nonStrikerIndex] || {};
  const specialDeliveriesRemaining = Math.max(
    0,
    3 + (Number(inningState.specialBallBonus) || 0) - (Number(inningState.specialBallUsedMatch) || 0)
  );
  const currentOverEvents = (Array.isArray(inningState.ballHistory) ? inningState.ballHistory : [])
    .filter((event) => event?.overNumber === currentOverNumber);
  const bowlingContext = {
    score: Number(inningState.score) || 0,
    wickets: Number(inningState.wickets) || 0,
    balls: Number(inningState.balls) || 0,
    currentOverNumber,
    currentOverBall,
    bowler: currentBowler,
    bowlerFigures: {
      overs: `${Math.floor(currentBowlerBalls / 6)}.${currentBowlerBalls % 6}`,
      runs: Number(currentBowlerStat.runsConceded) || 0,
      wickets: Number(currentBowlerStat.wickets) || 0,
      economy: currentBowlerBalls > 0
        ? (Number(currentBowlerStat.runsConceded || 0) / (currentBowlerBalls / 6)).toFixed(2)
        : '0.00',
      oversRemaining: `${Math.floor(oversRemainingBalls / 6)}.${oversRemainingBalls % 6}`,
      oversLimit: maxOversPerBowler,
    },
    striker: {
      player: striker,
      runs: Number(strikerStat.runs) || 0,
      balls: Number(strikerStat.balls) || 0,
    },
    nonStriker: {
      player: inningState.nonStrikerIndex === null || inningState.nonStrikerIndex === undefined
        ? null
        : battingSide[inningState.nonStrikerIndex] || null,
      runs: Number(nonStrikerStat.runs) || 0,
      balls: Number(nonStrikerStat.balls) || 0,
    },
    specialDelivery: {
      remaining: specialDeliveriesRemaining,
      usedThisOver: Number(inningState.specialBallUsedInOver) || 0,
      available: canUseCurrentSpecialBall,
    },
    currentOverEvents,
  };
  const battingContext = {
    ...bowlingContext,
    freeHitArmed: Boolean(inningState.freeHitArmed),
    superShotUsedInOver: Number(inningState.superShotUsedInOver) || 0,
  };

  const battingActionOptions = battingActionList.map((action) => {
    if (action.key === battingAction.freeHit) {
      const enabled = !!inningState.freeHitArmed;
      return {
        ...action,
        disabled: !enabled,
        reason: enabled ? '' : 'Available only after a no-ball',
      };
    }

    if (inningState.freeHitArmed) {
      return {
        ...action,
        disabled: action.key !== battingAction.freeHit,
        reason: 'Free hit required this ball',
      };
    }

    if (action.key === battingAction.superShot) {
      return {
        ...action,
        disabled: !canUseCurrentSuperShot,
        reason: canUseCurrentSuperShot ? '' : 'Needs ability > 70, max 1 per over, and available credits',
      };
    }

    return { ...action, disabled: false, reason: '' };
  });

  const bowlingActionOptions = bowlingActionList.map((action) => {
    if (action.key === bowlingAction.specialBowl) {
      return {
        ...action,
        disabled: !canUseCurrentSpecialBall,
        reason: canUseCurrentSpecialBall ? '' : 'Needs pace/spin > 70, max 1 per over, and available credits',
      };
    }

    return { ...action, disabled: false, reason: '' };
  });
  const eligibleBowlerSet = new Set(getEligibleBowlerIndices(bowlingSide));

  const openerCandidates = battingSide.map((player, index) => ({
    index,
    name: player.name,
    player,
  }));

  const nextBatterCandidates = battingSide.map((player, index) => {
    const isOut = inningState.outBatterIndices.includes(index);
    const isCurrent = index === inningState.strikerIndex || index === inningState.nonStrikerIndex;
    const disabled = isOut || isCurrent;

    return {
      index,
      name: player.name,
      player,
      disabled,
      reason: isOut ? 'Already out' : isCurrent ? 'Currently batting' : '',
    };
  });

  const bowlerCandidates = bowlingSide
    .map((player, index) => ({
      index,
      name: player.name,
      paceAbility: player?.paceAbility || 0,
      spinAbility: player?.spinAbility || 0,
      balls: inningState.bowlingStats[index]?.balls || 0,
      wasLastOver: inningState.lastOverBowlerIndex === index,
    }))
    .filter(({ index }) => eligibleBowlerSet.has(index))
    .map(({ index, name, balls, wasLastOver }) => {
      const hitOverLimit = balls >= maxOversPerBowler * 6;
      const disabled = wasLastOver || hitOverLimit;

      return {
        index,
        name,
        player: bowlingSide[index],
        disabled,
        reason: wasLastOver ? 'Bowled last over' : hitOverLimit ? `Over limit reached (${maxOversPerBowler})` : '',
      };
    })
    .filter((candidate) => canSelectBowler({ inningState, bowlerIndex: candidate.index, maxOversPerBowler }));

  const validOrderedIndices = (inningState.battingOrderIndices || []).filter(
    (index) => Number.isInteger(index) && index >= 0 && index < battingSide.length
  );
  const battingDisplayOrder = [
    ...validOrderedIndices,
    ...battingSide.map((_, index) => index).filter((index) => !validOrderedIndices.includes(index)),
  ];

  const battingRows = battingDisplayOrder
    .map((index) => {
      const player = battingSide[index];
      const stat = inningState.battingStats[index] || {
        runs: 0,
        balls: 0,
        isOut: false,
        outByBowler: '',
        outAtScore: '',
        outAtBall: '',
      };
      const strikeRate = stat.balls > 0 ? ((stat.runs / stat.balls) * 100).toFixed(2) : '0.00';
      const isCurrent = index === inningState.strikerIndex || index === inningState.nonStrikerIndex;

      return {
        name: player.name,
        playerType: player.playerType || '',
        isWicketKeeper: !!player.isWicketKeeper,
        paceAbility: player.paceAbility || 0,
        spinAbility: player.spinAbility || 0,
        abilityToPlayPaceBall: player.abilityToPlayPaceBall || 0,
        abilityToPlaySpinBall: player.abilityToPlaySpinBall || 0,
        runs: stat.runs,
        balls: stat.balls,
        strikeRate,
        dismissal: stat.isOut
          ? `b ${stat.outByBowler || 'Unknown'} @ ${stat.outAtScore || '-'} (${stat.outAtBall || '-'})`
          : stat.balls > 0 || isCurrent
            ? 'Not Out'
            : 'Yet to bat',
        isNotOut: !stat.isOut && (stat.balls > 0 || isCurrent),
      };
    })
    .filter(Boolean);

  const bowlingRows = bowlingSide
    .map((player, index) => {
      const stat = inningState.bowlingStats[index] || { balls: 0, runsConceded: 0, wickets: 0 };
      const overs = `${Math.floor(stat.balls / 6)}.${stat.balls % 6}`;
      const economy = stat.balls > 0 ? (stat.runsConceded / (stat.balls / 6)).toFixed(2) : '0.00';
      const avgPerWicket = stat.wickets > 0 ? (stat.runsConceded / stat.wickets).toFixed(2) : '-';

      return {
        name: player.name,
        playerType: player.playerType || '',
        isWicketKeeper: !!player.isWicketKeeper,
        paceAbility: player.paceAbility || 0,
        spinAbility: player.spinAbility || 0,
        abilityToPlayPaceBall: player.abilityToPlayPaceBall || 0,
        abilityToPlaySpinBall: player.abilityToPlaySpinBall || 0,
        overs,
        runsConceded: stat.runsConceded,
        economy,
        avgPerWicket,
        wickets: stat.wickets,
        isCurrent: index === inningState.currentBowlerIndex,
      };
    })
    .filter((row) => row.overs !== '0.0');

  return {
    isUserBatting,
    isUserBowling,
    openerCandidates,
    nextBatterCandidates,
    bowlerCandidates,
    battingActionOptions,
    bowlingActionOptions,
    battingContext,
    bowlingContext,
    battingRows,
    bowlingRows,
    strikerName: inningState.strikerIndex === null ? '' : battingSide[inningState.strikerIndex]?.name || '',
    nonStrikerName: inningState.nonStrikerIndex === null ? '' : battingSide[inningState.nonStrikerIndex]?.name || '',
    currentBowlerName: inningState.currentBowlerIndex === null ? '' : bowlingSide[inningState.currentBowlerIndex]?.name || '',
    strikerPlayer: striker,
    nonStrikerPlayer: inningState.nonStrikerIndex === null ? null : battingSide[inningState.nonStrikerIndex] || null,
    currentBowlerPlayer: currentBowler,
    canPlayNextBall: battingSide.length > 0 && bowlingSide.length > 0 && isInningsReadyForNextBall(inningState, maxBalls),
  };
};
