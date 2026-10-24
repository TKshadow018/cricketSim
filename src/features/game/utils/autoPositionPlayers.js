const isValidPreference = (preference) =>
  Array.isArray(preference) &&
  preference.length === 11 &&
  new Set(preference).size === 11 &&
  preference.every((position) => Number.isInteger(position) && position >= 1 && position <= 11);

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

  return Array.from({ length: 11 }, (_, index) => index + 1).sort(
    (left, right) =>
      Math.abs(left - preferredPosition) - Math.abs(right - preferredPosition) || left - right
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
  const preferenceRanks = candidates.map(({ preference }) =>
    Array.from({ length: 11 }, (_, index) => preference.indexOf(index + 1) + 1)
  );
  const scoreCache = new Array(1 << 11);
  const compareScores = (left, right) =>
    left.maxRank - right.maxRank || left.totalRank - right.totalRank;
  const getBestScore = (positionIndex, assignedMask) => {
    if (positionIndex === 11) {
      return { maxRank: 0, totalRank: 0 };
    }

    if (scoreCache[assignedMask]) {
      return scoreCache[assignedMask];
    }

    let bestScore = null;
    for (let playerIndex = 0; playerIndex < candidates.length; playerIndex += 1) {
      const playerMask = 1 << playerIndex;
      if (assignedMask & playerMask) {
        continue;
      }

      const rank = preferenceRanks[playerIndex][positionIndex];
      const nextScore = getBestScore(positionIndex + 1, assignedMask | playerMask);
      const score = {
        maxRank: Math.max(rank, nextScore.maxRank),
        totalRank: rank + nextScore.totalRank,
      };

      if (!bestScore || compareScores(score, bestScore) < 0) {
        bestScore = score;
      }
    }

    scoreCache[assignedMask] = bestScore;
    return bestScore;
  };

  const positionedPlayers = [];
  let assignedMask = 0;
  for (let positionIndex = 0; positionIndex < 11; positionIndex += 1) {
    const bestScore = getBestScore(positionIndex, assignedMask);
    const optimalCandidates = [];
    for (let playerIndex = 0; playerIndex < candidates.length; playerIndex += 1) {
      const playerMask = 1 << playerIndex;
      if (assignedMask & playerMask) {
        continue;
      }

      const rank = preferenceRanks[playerIndex][positionIndex];
      const nextScore = getBestScore(positionIndex + 1, assignedMask | playerMask);
      const score = {
        maxRank: Math.max(rank, nextScore.maxRank),
        totalRank: rank + nextScore.totalRank,
      };
      if (compareScores(score, bestScore) === 0) {
        optimalCandidates.push(playerIndex);
      }
    }

    if (optimalCandidates.length === 0) {
      throw new Error(`No selected player can be assigned to batting position ${positionIndex + 1}.`);
    }

    const randomValue = random();
    if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue >= 1) {
      throw new RangeError('The random chooser must return a number between 0 and 1.');
    }

    const selectedIndex = Math.floor(randomValue * optimalCandidates.length);
    const playerIndex = optimalCandidates[selectedIndex];
    positionedPlayers.push(candidates[playerIndex].player);
    assignedMask |= 1 << playerIndex;
  }

  return positionedPlayers;
};
