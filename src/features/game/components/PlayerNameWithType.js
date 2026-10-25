import React from 'react';
import { getPlayerType, PLAYER_TYPES } from '../../../gameData/playerTypes';

const PLAYER_TYPE_ICONS = {
  batsman: '/asset/img/icon/playerType/batsman.png',
  pacer: '/asset/img/icon/playerType/pacer.png',
  spinner: '/asset/img/icon/playerType/spinner.png',
  wicketkeeper: '/asset/img/icon/playerType/wicketkeeper.png',
  paceAllrounder: '/asset/img/icon/playerType/allrounder pace.png',
  spinAllrounder: '/asset/img/icon/playerType/allrounder spin.png',
};

export const resolvePlayerTypeKey = (input = {}) => {
  if (input && typeof input === 'object' && Object.keys(input).length === 0) {
    return 'batsman';
  }

  const type = String(getPlayerType(input) || '').trim().toLowerCase();
  if (type === PLAYER_TYPES.WICKETKEEPER || type.includes('wicketkeeper')) {
    return 'wicketkeeper';
  }
  if (type === PLAYER_TYPES.PACE_ALLROUNDER || type.includes('allrounder pace')) {
    return 'paceAllrounder';
  }
  if (type === PLAYER_TYPES.SPIN_ALLROUNDER || type.includes('allrounder spin')) {
    return 'spinAllrounder';
  }
  if (!input.playerType && type === PLAYER_TYPES.BOWLER) {
    const paceAbility = Number(input.paceAbility) || 0;
    const spinAbility = Number(input.spinAbility) || 0;
    const battingAbility =
      (Number(input.abilityToPlayPaceBall) || 0) +
      (Number(input.abilityToPlaySpinBall) || 0);

    if (battingAbility >= 100 && Math.max(paceAbility, spinAbility) >= 50) {
      return paceAbility >= spinAbility ? 'paceAllrounder' : 'spinAllrounder';
    }
    if (battingAbility >= 100) {
      return 'batsman';
    }
    if (paceAbility >= 50 || spinAbility >= 50) {
      return paceAbility >= spinAbility ? 'pacer' : 'spinner';
    }
    return 'batsman';
  }
  if (type === PLAYER_TYPES.PACER || type.includes('pacer')) {
    return 'pacer';
  }
  if (type === PLAYER_TYPES.SPINER || type.includes('spinner') || type.includes('spiner')) {
    return 'spinner';
  }
  if (type === 'bowler') {
    return 'pacer';
  }
  if (type === 'allrounder') {
    return 'paceAllrounder';
  }
  return 'batsman';
};

function PlayerNameWithType({
  player,
  name,
  className = '',
  textClassName = '',
  iconClassName = '',
}) {
  const displayName = String(name || player?.name || '-');
  const typeKey = resolvePlayerTypeKey(player || {});
  const iconSrc = PLAYER_TYPE_ICONS[typeKey];

  return (
    <span className={`sim-player-name-with-type ${className}`.trim()}>
      <img src={iconSrc} alt={typeKey} className={`sim-player-type-icon ${iconClassName}`.trim()} />
      <span className={`sim-player-name-text ${textClassName}`.trim()}>{displayName}</span>
    </span>
  );
}

export default PlayerNameWithType;