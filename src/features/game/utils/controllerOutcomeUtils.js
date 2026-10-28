import { battingAction, bowlingAction } from '../../../gameData/actionType';
import { outfieldType, pitchType } from '../../../gameData/matchCondition';
import { getBattingTacticShift } from './battingTactics';
import { getBowlingTacticShift } from './bowlingTactics';

const baseMatchWeights = {
  micro: { 0: 10, 1: 20, 2: 20, 3: 3, 4: 20, 6: 15, wide: 1, nb: 1, W: 10 },
  mini: { 0: 15, 1: 25, 2: 15, 3: 4, 4: 17, 6: 12, wide: 1, nb: 1, W: 10 },
  t10: { 0: 20, 1: 25, 2: 15, 3: 5, 4: 15, 6: 10, wide: 1, nb: 1, W: 8 },
  t20: { 0: 25, 1: 25, 2: 15, 3: 5, 4: 12, 6: 8, wide: 1, nb: 1, W: 7 },
  ODI: { 0: 50, 1: 22, 2: 10, 3: 3, 4: 7, 6: 3, wide: 1, nb: 1, W: 3 },
  test: { 0: 65, 1: 17, 2: 8, 3: 1, 4: 5, 6: 1, wide: 1, nb: 1, W: 1 },
};

const abilityShiftByDiff = (difference) => {
  if (difference > 50) {
    return { 0: -10, 1: 4, 2: 2, 3: 1, 4: 4, 6: 2, wide: 0, nb: 0, W: -3 };
  }
  if (difference > 20) {
    return { 0: -7, 1: 4, 2: 1, 3: 1, 4: 2, 6: 1, wide: 0, nb: 0, W: -2 };
  }
  if (difference > 5) {
    return { 0: -4, 1: 2, 2: 1, 3: 0, 4: 2, 6: 0, wide: 0, nb: 0, W: -1 };
  }
  if (difference < -50) {
    return { 0: 20, 1: -12, 2: -5, 3: -2, 4: -4, 6: -2, wide: 0, nb: 0, W: 5 };
  }
  if (difference < -20) {
    return { 0: 7, 1: -4, 2: -1, 3: -1, 4: -2, 6: -1, wide: 0, nb: 0, W: 2 };
  }
  if (difference < -5) {
    return { 0: 5, 1: -2, 2: -1, 3: 0, 4: -2, 6: -1, wide: 0, nb: 0, W: 1 };
  }
  return null;
};

const battingIntentShift = {
  [battingAction.defence]: { 0: 15, 1: -4, 2: -2, 3: -1, 4: -4, 6: -2, wide: 0, nb: 0, W: -2 },
  [battingAction.hitBig]: { 0: -10, 1: 4, 2: 1, 3: 1, 4: 2, 6: 1, wide: 0, nb: 0, W: 1 },
  [battingAction.superShot]: { 0: -15, 1: 5, 2: 3, 3: 0, 4: 3, 6: 2, wide: 0, nb: 0, W: 2 },
};

const bowlingIntentShift = {
  [bowlingAction.saveRun]: { 0: 20, 1: -8, 2: -3, 3: -1, 4: -4, 6: -2, wide: 0, nb: 0, W: -2 },
  [bowlingAction.tryForWicket]: { 0: -15, 1: 4, 2: 2, 3: 1, 4: 4, 6: 1, wide: 0, nb: 0, W: 3 },
  [bowlingAction.specialBowl]: { 0: -4, 1: -5, 2: -2, 3: -1, 4: 2, 6: 1, wide: 1, nb: 1, W: 7 },
};

const normalizeOverflowingWeights = (weights, outcomes) => {
  const total = outcomes.reduce((sum, outcome) => sum + weights[outcome], 0);
  if (total <= 0) {
    return Object.fromEntries(outcomes.map((outcome) => [outcome, outcome === '0' ? 100 : 0]));
  }

  const scaled = outcomes.map((outcome, index) => {
    const exact = weights[outcome] * 100 / total;
    const value = Math.floor(exact);
    return { outcome, index, value, remainder: exact - value };
  });
  let slotsRemaining = 100 - scaled.reduce((sum, entry) => sum + entry.value, 0);

  scaled
    .slice()
    .sort((left, right) => right.remainder - left.remainder || left.index - right.index)
    .slice(0, slotsRemaining)
    .forEach(({ outcome }) => {
      scaled.find((entry) => entry.outcome === outcome).value += 1;
    });

  return Object.fromEntries(scaled.map(({ outcome, value }) => [outcome, value]));
};

export const canUseSuperShot = ({ striker, bowler, inningState, strikerIndex }) => {
  if (!striker || !bowler) {
    return false;
  }

  const isPaceBowler = (bowler?.paceAbility || 0) >= (bowler?.spinAbility || 0);
  const relevantAbility = isPaceBowler ? striker?.abilityToPlayPaceBall || 0 : striker?.abilityToPlaySpinBall || 0;
  const maxShotsByAbility = Math.max(0, Math.floor((relevantAbility - 70) / 3));
  const strikerStat = inningState.battingStats?.[strikerIndex] || {};
  const unlocked = isPaceBowler ? strikerStat.superShotPaceUnlocked || 0 : strikerStat.superShotSpinUnlocked || 0;
  const used = isPaceBowler ? strikerStat.superShotPaceUsed || 0 : strikerStat.superShotSpinUsed || 0;

  const availableShots = Math.max(0, Math.min(unlocked, maxShotsByAbility) - used);
  return maxShotsByAbility > 0 && availableShots > 0 && (inningState.superShotUsedInOver || 0) < 1;
};

export const canUseSpecialBall = ({ bowler, inningState }) => {
  if (!bowler) {
    return false;
  }

  const hasAbility = (bowler?.paceAbility || 0) > 70 || (bowler?.spinAbility || 0) > 70;
  const availableBalls = 3 + (inningState.specialBallBonus || 0) - (inningState.specialBallUsedMatch || 0);
  return hasAbility && availableBalls > 0 && (inningState.specialBallUsedInOver || 0) < 1;
};

const calculateOutcomeDistribution = ({
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
  bowlingIntent,
  bowlingTactics,
  locationCountry,
}) => {
  const outcomes = ['0', '1', '2', '3', '4', '6', 'wide', 'nb', 'W'];
  const weatherKey = matchCondition.weather;
  const pitchProfile = pitchType[matchCondition.pitch] || pitchType.sporting;
  const outfieldProfile = outfieldType[matchCondition.outfield] || outfieldType.lushGreen;
  const isPaceBowler = (bowler?.paceAbility || 0) >= (bowler?.spinAbility || 0);
  const bowlingAbility = isPaceBowler ? bowler?.paceAbility || 0 : bowler.spinAbility;
  const appliedBattingIntent = isUserBatting && inningState.freeHitArmed ? battingAction.freeHit : battingIntent;
  const appliedBowlingIntent = bowlingIntent;

  const applyDelta = (weights, delta) => {
    if (!delta) {
      return;
    }

    Object.entries(delta).forEach(([key, value]) => {
      weights[key] += value;
    });
  };

  const toPercentAdjusted = (value, percent) => value + value * percent;
  const abilityForPaceBase = (striker?.abilityToPlayPaceBall || 50) + pitchProfile.goodForBatting;
  const abilityForSpinBase = (striker?.abilityToPlaySpinBall || 50) + pitchProfile.goodForBatting;
  const bowlerPaceBase = (bowler?.paceAbility || 40) + pitchProfile.goodForPaceBowling;
  const bowlerSpinBase = (bowler?.spinAbility || 35) + pitchProfile.goodForSpinBowling;

  let battingPaceAbility = abilityForPaceBase;
  let battingSpinAbility = abilityForSpinBase;
  let bowlingPaceAbility = bowlerPaceBase;
  let bowlingSpinAbility = bowlerSpinBase;

  if (bowlingTeamName && bowlingTeamName === locationCountry) {
    bowlingPaceAbility = toPercentAdjusted(bowlingPaceAbility, 0.05);
    bowlingSpinAbility = toPercentAdjusted(bowlingSpinAbility, 0.05);
  }

  if (weatherKey === 'rainy') {
    battingPaceAbility = toPercentAdjusted(battingPaceAbility, -0.05);
    battingSpinAbility = toPercentAdjusted(battingSpinAbility, -0.05);
    bowlingPaceAbility = toPercentAdjusted(bowlingPaceAbility, 0.05);
    bowlingSpinAbility = toPercentAdjusted(bowlingSpinAbility, 0.05);
  } else if (weatherKey === 'windy') {
    battingPaceAbility = toPercentAdjusted(battingPaceAbility, 0.1);
    battingSpinAbility = toPercentAdjusted(battingSpinAbility, 0.1);
    bowlingPaceAbility = toPercentAdjusted(bowlingPaceAbility, -0.05);
    bowlingSpinAbility = toPercentAdjusted(bowlingSpinAbility, -0.05);
  } else if (weatherKey === 'stormy') {
    battingPaceAbility = toPercentAdjusted(battingPaceAbility, -0.05);
    battingSpinAbility = toPercentAdjusted(battingSpinAbility, -0.05);
    bowlingPaceAbility = toPercentAdjusted(bowlingPaceAbility, 0.02);
    bowlingSpinAbility = toPercentAdjusted(bowlingSpinAbility, 0.02);
  }

  const activeMatchTypeKey = (() => {
    const isTestLike = ['test', 'practiceTestMicro', 'practiceTestMini'].includes(matchTypeKey);
    if (isTestLike) {
      return 'test';
    }

    const order = ['micro', 'mini', 't10', 't20', 'ODI'];
    const currentIndex = Math.max(0, order.indexOf(matchTypeKey));
    const remainingOvers = Math.max(0, matchType.over - Math.floor(inningState.balls / 6));
    if (remainingOvers < matchType.over * 0.15 && currentIndex > 0) {
      return order[currentIndex - 1];
    }

    return order[currentIndex];
  })();

  const weights = { ...baseMatchWeights[activeMatchTypeKey] };

  if (outfieldProfile.boundaryScoring < 4) {
    weights['6'] -= 1;
    weights['4'] -= 1;
    weights['0'] += 2;
  } else if (outfieldProfile.boundaryScoring >= 6 && outfieldProfile.boundaryScoring < 8) {
    weights['4'] += 1;
    weights['0'] -= 1;
  } else if (outfieldProfile.boundaryScoring >= 8) {
    weights['6'] += 1;
    weights['4'] += 2;
    weights['0'] -= 3;
  }

  const battingAbility = isPaceBowler ? battingPaceAbility : battingSpinAbility;
  const bowlingMatchAbility = isPaceBowler ? bowlingPaceAbility : bowlingSpinAbility;
  const abilityDifference = battingAbility - bowlingMatchAbility;
  applyDelta(weights, abilityShiftByDiff(abilityDifference));

  if (striker?.id && battingRoles?.captainId === striker.id) {
    applyDelta(weights, { 0: -3, 1: 3 });
  }
  if (striker?.id && battingRoles?.viceCaptainId === striker.id) {
    applyDelta(weights, { 0: -1, 1: 1 });
  }
  if (bowler?.id && bowlingRoles?.captainId === bowler.id) {
    applyDelta(weights, { 0: 3, 1: -3 });
  }
  if (bowler?.id && bowlingRoles?.viceCaptainId === bowler.id) {
    applyDelta(weights, { 0: 1, 1: -1 });
  }

  if (isUserBatting) {
    if (battingTactics && typeof battingTactics === 'object') {
      applyDelta(weights, getBattingTacticShift(battingTactics, bowlingTactics));
      if (appliedBattingIntent === battingAction.superShot) {
        applyDelta(weights, battingIntentShift[battingAction.superShot]);
      } else if (appliedBattingIntent !== battingAction.normal && appliedBattingIntent !== battingAction.freeHit) {
        applyDelta(weights, battingIntentShift[appliedBattingIntent]);
      }
    } else {
      applyDelta(weights, battingIntentShift[appliedBattingIntent]);
    }
  }
  if (isUserBowling) {
    if (bowlingTactics && typeof bowlingTactics === 'object') {
      applyDelta(weights, getBowlingTacticShift(bowlingTactics, bowler));
      if (bowlingTactics.specialDeliveryArmed) {
        applyDelta(weights, bowlingIntentShift[bowlingAction.specialBowl]);
      }
    } else {
      applyDelta(weights, bowlingIntentShift[appliedBowlingIntent]);
    }
  }

  const normalized = {};
  outcomes.forEach((outcome) => {
    normalized[outcome] = Math.max(0, Math.round(weights[outcome] || 0));
  });

  if (appliedBattingIntent === battingAction.freeHit) {
    normalized.W = 0;
  }

  const nonDotTotal = outcomes
    .filter((outcome) => outcome !== '0')
    .reduce((sum, outcome) => sum + normalized[outcome], 0);
  if (nonDotTotal <= 100) {
    normalized['0'] = 100 - nonDotTotal;
  } else {
    Object.assign(normalized, normalizeOverflowingWeights(normalized, outcomes));
  }

  return {
    outcomes,
    weights: normalized,
    battingAbility,
    bowlingAbility,
  };
};

export const buildOutcomeWeights = (input) => calculateOutcomeDistribution(input).weights;

export const resolveOutcome = (input) => {
  const { outcomes, weights, battingAbility, bowlingAbility } = calculateOutcomeDistribution(input);
  const outcomePossibilityArray = [];
  outcomes.forEach((token) => {
    for (let index = 0; index < weights[token]; index += 1) {
      outcomePossibilityArray.push(token);
    }
  });

  const selected = outcomePossibilityArray[Math.floor(Math.random() * 100)] || '0';
  if (selected === 'W') {
    return { token: selected, isWicket: true, runs: 0, isLegalDelivery: true, extraRuns: 0 };
  }
  if (selected === 'wide') {
    return { token: selected, isWicket: false, runs: 0, isLegalDelivery: false, extraRuns: 1 };
  }
  if (selected === 'nb') {
    return { token: selected, isWicket: false, runs: 0, isLegalDelivery: false, extraRuns: 1 };
  }

  return {
    token: selected,
    isWicket: false,
    runs: Number(selected),
    isLegalDelivery: true,
    extraRuns: 0,
    strikerAbilityAgainstBowling: battingAbility,
    bowlerAbility: bowlingAbility,
  };
};
