import React from 'react';

const PLAYER_TYPE_ICONS = {
  batsman: '/asset/img/icon/playerType/batsman.png',
  pacer: '/asset/img/icon/playerType/pacer.png',
  spinner: '/asset/img/icon/playerType/spinner.png',
  wicketkeeper: '/asset/img/icon/playerType/wicketkeeper.png',
  paceAllrounder: '/asset/img/icon/playerType/allrounder pace.png',
  spinAllrounder: '/asset/img/icon/playerType/allrounder spin.png',
};

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const inferTypeFromText = (playerTypeText) => {
  const normalized = normalizeText(playerTypeText);
  if (!normalized) {
    return '';
  }

  if (normalized.includes('wicketkeeper')) {
    return 'wicketkeeper';
  }
  if (normalized.includes('pace allrounder')) {
    return 'paceAllrounder';
  }
  if (normalized.includes('spin allrounder')) {
    return 'spinAllrounder';
  }
  if (normalized.includes('pacer') || normalized.includes('bowler pacer')) {
    return 'pacer';
  }
  if (normalized.includes('spinner') || normalized.includes('spiner') || normalized.includes('bowler spinner')) {
    return 'spinner';
  }
  if (normalized.includes('allrounder')) {
    return normalized.includes('spin') ? 'spinAllrounder' : 'paceAllrounder';
  }
  if (normalized.includes('batsman') || normalized.includes('bowler')) {
    return normalized.includes('bowler') ? 'pacer' : 'batsman';
  }

  return '';
};

export const resolvePlayerTypeKey = (input = {}) => {
  const {
    playerType,
    isWicketKeeper,
    paceAbility = 0,
    spinAbility = 0,
    abilityToPlayPaceBall = 0,
    abilityToPlaySpinBall = 0,
  } = input;

  if (isWicketKeeper) {
    return 'wicketkeeper';
  }

  const fromText = inferTypeFromText(playerType);
  if (fromText) {
    return fromText;
  }

  const battingTotal = Number(abilityToPlayPaceBall || 0) + Number(abilityToPlaySpinBall || 0);
  const pace = Number(paceAbility || 0);
  const spin = Number(spinAbility || 0);

  if (battingTotal >= 120 && (pace >= 55 || spin >= 55)) {
    return pace >= spin ? 'paceAllrounder' : 'spinAllrounder';
  }
  if (pace >= 55 && pace >= spin) {
    return 'pacer';
  }
  if (spin >= 55 && spin > pace) {
    return 'spinner';
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
  const iconSrc = PLAYER_TYPE_ICONS[typeKey] || PLAYER_TYPE_ICONS.batsman;

  return (
    <span className={`sim-player-name-with-type ${className}`.trim()}>
      <img src={iconSrc} alt={typeKey} className={`sim-player-type-icon ${iconClassName}`.trim()} />
      <span className={`sim-player-name-text ${textClassName}`.trim()}>{displayName}</span>
    </span>
  );
}

export default PlayerNameWithType;