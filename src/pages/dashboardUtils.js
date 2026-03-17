import { matchTypeList } from '../gameData/matchTypeList';
import { getPlayersForNations } from '../gameData/playerListForNation';
import { outfieldType, pitchType } from '../gameData/matchCondition';
import { battingAction, bowlingAction } from '../gameData/actionType';
import { matchStatusEnum } from '../gameData/matchStatusEnum';

const baseMatchWeights = {
  micro: { 0: 10, 1: 20, 2: 20, 3: 3, 4: 20, 6: 15, wide: 1, nb: 1, W: 10 },
  mini: { 0: 15, 1: 25, 2: 15, 3: 4, 4: 17, 6: 12, wide: 1, nb: 1, W: 10 },
  t10: { 0: 20, 1: 25, 2: 15, 3: 5, 4: 15, 6: 10, wide: 1, nb: 1, W: 8 },
  t20: { 0: 25, 1: 25, 2: 15, 3: 5, 4: 12, 6: 8, wide: 1, nb: 1, W: 7 },
  ODI: { 0: 50, 1: 22, 2: 10, 3: 3, 4: 7, 6: 3, wide: 1, nb: 1, W: 3 },
  test: { 0: 65, 1: 17, 2: 8, 3: 1, 4: 5, 6: 1, wide: 1, nb: 1, W: 1 },
};

const abilityShiftByDiff = (difference) => {
  if (difference > 50) return { 0: -10, 1: 4, 2: 2, 3: 1, 4: 4, 6: 2, wide: 0, nb: 0, W: -3 };
  if (difference > 20) return { 0: -7, 1: 4, 2: 1, 3: 1, 4: 2, 6: 1, wide: 0, nb: 0, W: -2 };
  if (difference > 5) return { 0: -4, 1: 2, 2: 1, 3: 0, 4: 2, 6: 0, wide: 0, nb: 0, W: -1 };
  if (difference < -50) return { 0: 20, 1: -12, 2: -5, 3: -2, 4: -4, 6: -2, wide: 0, nb: 0, W: 5 };
  if (difference < -20) return { 0: 7, 1: -4, 2: -1, 3: -1, 4: -2, 6: -1, wide: 0, nb: 0, W: 2 };
  if (difference < -5) return { 0: 5, 1: -2, 2: -1, 3: 0, 4: -2, 6: -1, wide: 0, nb: 0, W: 1 };
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

const battingLabels = {
  [battingAction.defence]: 'Defend',
  [battingAction.hitBig]: 'Hit Big',
  [battingAction.normal]: 'Normal',
  [battingAction.superShot]: 'Super Shot',
  [battingAction.freeHit]: 'Free Hit',
};

const bowlingLabels = {
  [bowlingAction.normal]: 'Normal',
  [bowlingAction.tryForWicket]: 'Wicket Ball',
  [bowlingAction.saveRun]: 'Save Run',
  [bowlingAction.specialBowl]: 'Special Ball',
};

const outcomeOrder = ['0', '1', '2', '3', '4', '6', 'wide', 'nb', 'W'];

export const normalizeSelectedXIPlayers = (allPlayers, selectedIds) => {
  const validIds = new Set((allPlayers || []).map((player) => player.id));
  const normalizedIds = Array.from(new Set((selectedIds || []).filter((id) => validIds.has(id)))).slice(0, 11);
  return normalizedIds
    .map((id) => (allPlayers || []).find((player) => player.id === id))
    .filter(Boolean);
};

const classifyPlayer = (player) => {
  const pace = player?.paceAbility || 0;
  const spin = player?.spinAbility || 0;
  const batCombined = (player?.abilityToPlayPaceBall || 0) + (player?.abilityToPlaySpinBall || 0);

  if (player?.isWicketKeeper) {
    return 'wicketkeeper';
  }

  if (pace > 50 && pace > spin && batCombined < 100) {
    return 'pacer';
  }

  if (spin > 50 && pace < spin && batCombined < 100) {
    return 'spinner';
  }

  if (batCombined > 100 && spin < 50 && pace < 50) {
    return 'batsman';
  }

  if (batCombined > 100 && (pace > 50 || spin > 50)) {
    return 'allrounder';
  }

  return 'none';
};

export const buildComposition = (selectedPlayers) => {
  const counts = {
    batsman: 0,
    allrounder: 0,
    pacer: 0,
    spinner: 0,
    wicketkeeper: 0,
    none: 0,
  };

  (selectedPlayers || []).forEach((player) => {
    const category = classifyPlayer(player);
    if (category in counts) {
      counts[category] += 1;
    }
  });

  return counts;
};

export const buildAdminMatrix = (gameState) => {
  const matchType = matchTypeList[gameState.matchTypeKey] || matchTypeList.t20;
  const { ownPlayers: fullOwnPlayers, opponentPlayers: fullOpponentPlayers } = getPlayersForNations(
    gameState.ownTeam,
    gameState.opponentTeam
  );

  const normalizePlayingXI = (allPlayers, selectedIds) => {
    const validIds = new Set(allPlayers.map((player) => player.id));
    const normalizedIds = Array.from(new Set((selectedIds || []).filter((id) => validIds.has(id)))).slice(0, 11);
    const finalIds = normalizedIds.length === 11 ? normalizedIds : allPlayers.slice(0, 11).map((player) => player.id);
    const byId = new Map(allPlayers.map((player) => [player.id, player]));
    return finalIds.map((id) => byId.get(id)).filter(Boolean);
  };

  const ownPlayers = normalizePlayingXI(
    [...fullOwnPlayers, ...((gameState.ownCustomPlayers || []))],
    gameState.ownPlayingXI
  );
  const opponentPlayers = normalizePlayingXI(
    [...fullOpponentPlayers, ...((gameState.opponentCustomPlayers || []))],
    gameState.opponentPlayingXI
  );
  const isFirst = gameState.stage !== matchStatusEnum.TeamTwoBat;
  const innings = isFirst ? gameState.firstInnings : gameState.secondInnings;
  const isOwnBatting = isFirst ? gameState.firstBattingSide === 'own' : gameState.firstBattingSide !== 'own';
  const battingSide = isOwnBatting ? ownPlayers : opponentPlayers;
  const bowlingSide = isOwnBatting ? opponentPlayers : ownPlayers;
  const striker = battingSide[innings?.strikerIndex ?? -1];
  const bowler = bowlingSide[innings?.currentBowlerIndex ?? -1];
  const battingRoles = isOwnBatting ? gameState.ownTeamRoles : gameState.opponentTeamRoles;
  const bowlingRoles = isOwnBatting ? gameState.opponentTeamRoles : gameState.ownTeamRoles;
  const bowlingTeamName = isOwnBatting ? gameState.opponentTeam : gameState.ownTeam;

  const isPaceBowler = (bowler?.paceAbility || 0) >= (bowler?.spinAbility || 0);
  const pitchProfile = pitchType[gameState.matchCondition?.pitch] || pitchType.sporting;
  const outfieldProfile = outfieldType[gameState.matchCondition?.outfield] || outfieldType.lushGreen;
  const weatherKey = gameState.matchCondition?.weather;

  const applyDelta = (weights, delta) => {
    if (!delta) return;
    Object.entries(delta).forEach(([key, value]) => {
      weights[key] = (weights[key] || 0) + value;
    });
  };

  const toPercentAdjusted = (value, percent) => value + value * percent;

  const activeMatchTypeKey = (() => {
    const isTestLike = ['test', 'practiceTestMicro', 'practiceTestMini'].includes(gameState.matchTypeKey);
    if (isTestLike) return 'test';
    const order = ['micro', 'mini', 't10', 't20', 'ODI'];
    const currentIndex = Math.max(0, order.indexOf(gameState.matchTypeKey));
    const remainingOvers = Math.max(0, matchType.over - Math.floor((innings?.balls || 0) / 6));
    if (remainingOvers < matchType.over * 0.15 && currentIndex > 0) {
      return order[currentIndex - 1];
    }
    return order[currentIndex] || 't20';
  })();

  const weights = { ...(baseMatchWeights[activeMatchTypeKey] || baseMatchWeights.t20) };

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

  const abilityForPaceBase = (striker?.abilityToPlayPaceBall || 50) + (pitchProfile.goodForBatting || 0);
  const abilityForSpinBase = (striker?.abilityToPlaySpinBall || 50) + (pitchProfile.goodForBatting || 0);
  const bowlerPaceBase = (bowler?.paceAbility || 40) + (pitchProfile.goodForPaceBowling || 0);
  const bowlerSpinBase = (bowler?.spinAbility || 35) + (pitchProfile.goodForSpinBowling || 0);

  let battingPaceAbility = abilityForPaceBase;
  let battingSpinAbility = abilityForSpinBase;
  let bowlingPaceAbility = bowlerPaceBase;
  let bowlingSpinAbility = bowlerSpinBase;

  if (bowlingTeamName && bowlingTeamName === gameState.locationCountry) {
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

  const battingAbility = striker ? (isPaceBowler ? battingPaceAbility : battingSpinAbility) : 0;
  const bowlingAbility = bowler ? (isPaceBowler ? bowlingPaceAbility : bowlingSpinAbility) : 0;
  const abilityDifference = battingAbility - bowlingAbility;

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

  if (striker && bowler) {
    applyDelta(weights, abilityShiftByDiff(abilityDifference));
  }

  const isUserBatting = isOwnBatting;
  const isUserBowling = !isOwnBatting;
  const appliedBattingIntent = isUserBatting && innings?.freeHitArmed ? battingAction.freeHit : gameState.battingIntent;

  if (isUserBatting) applyDelta(weights, battingIntentShift[appliedBattingIntent]);
  if (isUserBowling) applyDelta(weights, bowlingIntentShift[gameState.bowlingIntent]);

  const normalized = {};
  outcomeOrder.forEach((outcome) => {
    normalized[outcome] = Math.max(0, Math.round(weights[outcome] || 0));
  });

  if (appliedBattingIntent === battingAction.freeHit) {
    normalized.W = 0;
  }

  const nonDotTotal = outcomeOrder
    .filter((item) => item !== '0')
    .reduce((sum, item) => sum + normalized[item], 0);
  normalized['0'] = Math.max(0, 100 - nonDotTotal);

  return {
    isOwnBatting,
    strikerName: striker?.name || '-',
    bowlerName: bowler?.name || '-',
    battingAbility: Math.round(battingAbility),
    bowlingAbility: Math.round(bowlingAbility),
    abilityDifference: Math.round(abilityDifference),
    bowlingType: isPaceBowler ? 'Pace' : 'Spin',
    battingIntentLabel: battingLabels[appliedBattingIntent] || 'Normal',
    bowlingIntentLabel: bowlingLabels[gameState.bowlingIntent] || 'Normal',
    factors: {
      weather: gameState.matchCondition?.weather || '-',
      pitch: gameState.matchCondition?.pitch || '-',
      outfield: gameState.matchCondition?.outfield || '-',
      battingSupport: pitchProfile.goodForBatting,
      paceSupport: pitchProfile.goodForPaceBowling,
      spinSupport: pitchProfile.goodForSpinBowling,
      boundaryScoring: outfieldProfile.boundaryScoring,
      phase: Math.max(0, matchType.over - Math.floor((innings?.balls || 0) / 6)) < matchType.over * 0.15
        ? 'Death Phase'
        : 'Normal Phase',
      oversLeft: Math.max(0, matchType.over - Math.floor((innings?.balls || 0) / 6)),
    },
    rows: outcomeOrder.map((key) => ({ key, value: normalized[key] || 0 })),
  };
};