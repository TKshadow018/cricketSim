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
  const type = getPlayerType(input);
  if (type === PLAYER_TYPES.WICKETKEEPER) {
    return 'wicketkeeper';
  }
  if (type === PLAYER_TYPES.PACE_ALLROUNDER) {
    return 'paceAllrounder';
  }
  if (type === PLAYER_TYPES.SPIN_ALLROUNDER) {
    return 'spinAllrounder';
  }
  if (type === PLAYER_TYPES.PACER) {
    return 'pacer';
  }
  if (type === PLAYER_TYPES.SPINER) {
    return 'spinner';
  }
  if (type === 'spinner') {
    return 'spinner';
  }
  if (type === 'bowler' || type === 'bowler pacer') {
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