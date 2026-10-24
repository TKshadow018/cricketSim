export const PLAYER_TYPES = {
  BATSMAN: 'batsman',
  BOWLER: 'bowler',
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

  if (battingTotal > 70 && paceBowling > 60) {
    return PLAYER_TYPES.PACE_ALLROUNDER;
  }
  if (battingTotal > 70 && spinBowling > 60) {
    return PLAYER_TYPES.SPIN_ALLROUNDER;
  }
  if (paceBatting > 70 || spinBatting > 70 || battingTotal > 120) {
    return PLAYER_TYPES.BATSMAN;
  }
  if (paceBowling > 70) {
    return PLAYER_TYPES.PACER;
  }
  if (spinBowling > 70) {
    return PLAYER_TYPES.SPINER;
  }

  return PLAYER_TYPES.BOWLER;
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
