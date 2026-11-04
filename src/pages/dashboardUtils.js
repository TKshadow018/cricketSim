import { matchTypeList } from '../gameData/matchTypeList';
import { getPlayersForNations } from '../gameData/playerListForNation';
import { outfieldType, pitchType } from '../gameData/matchCondition';
import { battingAction, bowlingAction } from '../gameData/actionType';
import { matchStatusEnum } from '../gameData/matchStatusEnum';
import { buildOutcomeAnalysis } from '../features/game/utils/controllerOutcomeUtils';

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

export const buildBattingOrderPreview = (selectedPlayers = []) =>
  [...(selectedPlayers || [])]
    .sort(
      (left, right) =>
        Number(right?.battingOrderCoeff || 0) - Number(left?.battingOrderCoeff || 0) ||
        ((Number(right?.abilityToPlayPaceBall || 0) + Number(right?.abilityToPlaySpinBall || 0)) -
          (Number(left?.abilityToPlayPaceBall || 0) + Number(left?.abilityToPlaySpinBall || 0))) ||
        String(left?.name || '').localeCompare(String(right?.name || ''))
    )
    .map((player, index) => ({
      rank: index + 1,
      player,
      coeff: Number(player?.battingOrderCoeff || 0),
    }));

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

  const toPercentAdjusted = (value, percent) => value + value * percent;

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

  const isUserBatting = isOwnBatting;
  const isUserBowling = !isOwnBatting;
  const appliedBattingIntent = isUserBatting && innings?.freeHitArmed ? battingAction.freeHit : gameState.battingIntent;
  const outcomeAnalysis = buildOutcomeAnalysis({
    striker,
    bowler,
    inningState: innings || {},
    battingSide,
    bowlingSide,
    isUserBatting,
    isUserBowling,
    battingRoles,
    bowlingRoles,
    bowlingTeamName,
    matchCondition: gameState.matchCondition || {},
    matchType,
    matchTypeKey: gameState.matchTypeKey,
    battingIntent: gameState.battingIntent,
    battingTactics: gameState.battingTactics,
    bowlingIntent: gameState.bowlingIntent,
    bowlingTactics: isUserBowling ? gameState.bowlingTactics : undefined,
    locationCountry: gameState.locationCountry,
  });
  const { weights } = outcomeAnalysis;

  return {
    isOwnBatting,
    strikerName: striker?.name || '-',
    bowlerName: bowler?.name || '-',
    strikerPlayer: striker || null,
    bowlerPlayer: bowler || null,
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
    rows: outcomeOrder.map((key) => ({
      key,
      value: weights[key] || 0,
      skillImpact: outcomeAnalysis.skillImpactDeltas[key] || 0,
    })),
    skillImpacts: outcomeAnalysis.appliedSkillImpacts,
    hasSkillImpacts: outcomeAnalysis.appliedSkillImpacts.length > 0,
  };
};