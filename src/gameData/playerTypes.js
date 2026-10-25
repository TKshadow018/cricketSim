export const PLAYER_TYPES = {
  BATSMAN: 'batsman',
  WICKETKEEPER: 'wicketkeeper',
  PACE_ALLROUNDER: 'pace allrounder',
  SPIN_ALLROUNDER: 'spin allrounder',
  PACER: 'pacer',
  SPINER: 'spiner',
};

const metric = (value) => Number(value) || 0;

export const classifyPlayerType = (player = {}) => {
  if (player.isWicketKeeper) {
    return PLAYER_TYPES.WICKETKEEPER;
  }

  const paceBatting = metric(player.abilityToPlayPaceBall);
  const spinBatting = metric(player.abilityToPlaySpinBall);
  const battingTotal = paceBatting + spinBatting;
  const paceBowling = metric(player.paceAbility);
  const spinBowling = metric(player.spinAbility);

  const classifyAtThreshold = (threshold) => {
    if (battingTotal > threshold && paceBowling > threshold - 10) {
      return PLAYER_TYPES.PACE_ALLROUNDER;
    }
    if (battingTotal > threshold && spinBowling > threshold - 10) {
      return PLAYER_TYPES.SPIN_ALLROUNDER;
    }
    if (paceBatting > threshold || spinBatting > threshold || battingTotal > threshold + 50) {
      return PLAYER_TYPES.BATSMAN;
    }
    if (paceBowling > threshold) {
      return PLAYER_TYPES.PACER;
    }
    if (spinBowling > threshold) {
      return PLAYER_TYPES.SPINER;
    }

    return null;
  };

  let threshold = 70;
  let playerType = classifyAtThreshold(threshold);
  while (!playerType) {
    threshold -= 10;
    playerType = classifyAtThreshold(threshold);
  }

  return playerType;
};

export const getPlayerType = (player = {}) =>
  player.isWicketKeeper ? PLAYER_TYPES.WICKETKEEPER : player.playerType || classifyPlayerType(player);

export const isBowlingQuotaPlayer = (player = {}) =>
  [
    PLAYER_TYPES.PACE_ALLROUNDER,
    PLAYER_TYPES.SPIN_ALLROUNDER,
    PLAYER_TYPES.PACER,
    PLAYER_TYPES.SPINER,
  ].includes(getPlayerType(player));

export const countBowlingRolePlayers = (players = []) =>
  players.filter(isBowlingQuotaPlayer).length;
