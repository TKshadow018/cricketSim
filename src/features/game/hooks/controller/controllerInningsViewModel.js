import {
  battingActionList,
  bowlingActionList,
  canSelectBowler,
  getMaxOversPerBowler,
  isEligibleBowler,
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
        reason: action.key !== battingAction.freeHit ? 'Free hit required this ball' : '',
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

  const openerCandidates = battingSide.map((player, index) => ({ index, name: player.name }));

  const nextBatterCandidates = battingSide.map((player, index) => {
    const isOut = inningState.outBatterIndices.includes(index);
    const isCurrent = index === inningState.strikerIndex || index === inningState.nonStrikerIndex;
    const disabled = isOut || isCurrent;

    return {
      index,
      name: player.name,
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
    .filter((player) => isEligibleBowler(player))
    .map(({ index, name, balls, wasLastOver }) => {
      const hitOverLimit = balls >= maxOversPerBowler * 6;
      const disabled = wasLastOver || hitOverLimit;

      return {
        index,
        name,
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
      if (!player) {
        return null;
      }
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
    battingRows,
    bowlingRows,
    strikerName: inningState.strikerIndex === null ? '' : battingSide[inningState.strikerIndex]?.name || '',
    nonStrikerName: inningState.nonStrikerIndex === null ? '' : battingSide[inningState.nonStrikerIndex]?.name || '',
    currentBowlerName: inningState.currentBowlerIndex === null ? '' : bowlingSide[inningState.currentBowlerIndex]?.name || '',
    canPlayNextBall: battingSide.length > 0 && bowlingSide.length > 0 && isInningsReadyForNextBall(inningState, maxBalls),
  };
};
