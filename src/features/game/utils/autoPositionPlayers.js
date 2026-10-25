const isValidPreference = (preference) =>
  Number.isInteger(preference) && preference >= 1 && preference <= 1000;

const buildFallbackPreference = (player) => {
  const playerType = String(player?.playerType || '').toLowerCase();
  const battingSkill = Math.max(
    Number(player?.abilityToPlayPaceBall) || 0,
    Number(player?.abilityToPlaySpinBall) || 0
  );
  const bowlingSkill = Math.max(Number(player?.paceAbility) || 0, Number(player?.spinAbility) || 0);
  const isBowler =
    playerType.includes('bowler') ||
    playerType.includes('pacer') ||
    playerType.includes('spinner') ||
    playerType.includes('spiner') ||
    (bowlingSkill >= 50 && battingSkill < 60);
  const preferredPosition = player?.isWicketKeeper
    ? 5
    : isBowler
      ? 9
      : playerType.includes('allrounder') || bowlingSkill >= 30
        ? 6
        : Number(player?.battingAggresion) >= 80 && battingSkill >= 75
          ? 2
          : 4;

  const battingStrength =
    (battingSkill - 70) * 0.7 + (Number(player?.battingAggresion || 0) - 70) * 0.3;

  return Math.max(
    1,
    Math.min(1000, Math.round(970 - (preferredPosition - 1) * 75 + battingStrength))
  );
};

export const autoPositionPlayers = (players, random = Math.random) => {
  if (!Array.isArray(players) || players.length !== 11) {
    throw new RangeError('Auto positioning requires exactly 11 selected players.');
  }

  if (typeof random !== 'function') {
    throw new TypeError('The random chooser must be a function.');
  }

  const candidates = players.map((player) => {
    if (player?.battingOrderPreference == null) {
      return {
        player,
        preference: buildFallbackPreference(player),
      };
    }

    if (!isValidPreference(player.battingOrderPreference)) {
    throw new Error(`Invalid battingOrderPreference for ${player?.name || 'selected player'}.`);
    }

    return {
    player,
    preference: player.battingOrderPreference,
    };
  });
  const remainingCandidates = [...candidates].sort(
    (left, right) => right.preference - left.preference
  );
  const positionedPlayers = [];
  while (remainingCandidates.length > 0) {
    const highestPreference = remainingCandidates[0].preference;
    const tiedCandidates = remainingCandidates.filter(
    ({ preference }) => preference === highestPreference
    );

    while (tiedCandidates.length > 0) {
    const randomValue = random();
    if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue >= 1) {
      throw new RangeError('The random chooser must return a number between 0 and 1.');
    }

    const selectedIndex = Math.floor(randomValue * tiedCandidates.length);
    const [selectedCandidate] = tiedCandidates.splice(selectedIndex, 1);
    positionedPlayers.push(selectedCandidate.player);
    remainingCandidates.splice(remainingCandidates.indexOf(selectedCandidate), 1);
    }
  }

  return positionedPlayers;
};
