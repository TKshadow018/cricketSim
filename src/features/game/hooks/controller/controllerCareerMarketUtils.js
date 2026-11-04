
export const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export const shuffleArray = (items = []) => {
  const copy = [...(items || [])];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
};

export const clampNumber = (value, min, max) => Math.min(max, Math.max(min, value));

export const formatOfferAmount = (amount) => `$${Number(amount || 0).toLocaleString('en-US')}`;

export const resolveSeasonPointsForTeam = (careerStandings = {}, teamName = '') => {
  if (!teamName || !careerStandings || typeof careerStandings !== 'object') {
    return 0;
  }

  const t20Standings = careerStandings.t20 && typeof careerStandings.t20 === 'object' ? careerStandings.t20 : careerStandings;
  return Number(t20Standings?.[teamName]?.points || 0);
};

export const buildCareerStatsLookup = (careerPlayerStats = {}) => {
  const byTeamAndPlayerId = new Map();
  const byTeamAndName = new Map();

  Object.values(careerPlayerStats || {}).forEach((entry) => {
    if (!entry?.team || !entry?.name) {
      return;
    }
    if (entry.playerId !== undefined && entry.playerId !== null) {
      byTeamAndPlayerId.set(`${entry.team}::${String(entry.playerId)}`, entry);
    }
    byTeamAndName.set(`${entry.team}::${entry.name}`, entry);
  });

  return { byTeamAndPlayerId, byTeamAndName };
};

export const resolveSeasonStatsForPlayer = ({ statsLookup, teamName, playerId, playerName }) => {
  if (!statsLookup || !teamName) {
    return null;
  }

  if (playerId !== undefined && playerId !== null) {
    const fromId = statsLookup.byTeamAndPlayerId.get(`${teamName}::${String(playerId)}`);
    if (fromId) {
      return fromId;
    }
  }

  return playerName ? statsLookup.byTeamAndName.get(`${teamName}::${playerName}`) || null : null;
};

export const resolvePlayerValueScore = ({ player = {}, seasonStats = null }) => {
  const battingAbility =
    Number(player.abilityToPlayPaceBall || 0) + Number(player.abilityToPlaySpinBall || 0) + Number(player.battingAggresion || 0);
  const bowlingAbility = Number(player.paceAbility || 0) + Number(player.spinAbility || 0);
  const profileTraits =
    Number(player.fitness ?? 100) * 0.32 +
    Number(player.form ?? 50) * 0.45 +
    Number(player.morale ?? 50) * 0.3 +
    Number(player.confidence ?? 50) * 0.28;
  const seasonRuns = Number(seasonStats?.runs || 0);
  const seasonWickets = Number(seasonStats?.wickets || 0);
  const seasonMatches = Number(seasonStats?.matches || 0);

  return battingAbility * 1.75 + bowlingAbility * 1.55 + profileTraits + seasonRuns * 0.65 + seasonWickets * 20 + seasonMatches * 6;
};

export const estimateCareerPlayerMarketValue = ({
  player = {},
  seasonStats = null,
  currentAge = 24,
  currentValue = 0,
  currentTeamPoints = 0,
}) => {
  const valueScore = resolvePlayerValueScore({ player, seasonStats });
  const previousValue = Number(currentValue || 0);
  const abilityValue = valueScore * 980;

  let ageMultiplier = 1;
  if (currentAge <= 22) {
    ageMultiplier = 1.23;
  } else if (currentAge <= 27) {
    ageMultiplier = 1.14;
  } else if (currentAge <= 31) {
    ageMultiplier = 1.04;
  } else if (currentAge <= 34) {
    ageMultiplier = 0.9;
  } else {
    ageMultiplier = 0.75;
  }

  const formMultiplier = 0.84 + clampNumber(Number(player.form ?? 50), 0, 100) / 200;
  const teamPerformanceBonus = clampNumber(Number(currentTeamPoints || 0), 0, 36) * 420;
  const blendedValue = previousValue > 0 ? previousValue * 0.52 + abilityValue * 0.48 : abilityValue;

  const estimated = (blendedValue + teamPerformanceBonus) * ageMultiplier * formMultiplier;
  return Math.max(90000, Math.round(estimated / 500) * 500);
};

export const buildCareerTransferOffers = ({
  careerTeam,
  careerDomesticTeams,
  careerPlayerProfile,
  careerPlayerStats,
  currentAge,
  careerStandings,
}) => {
  if (!careerTeam || !Array.isArray(careerDomesticTeams) || careerDomesticTeams.length < 2) {
    return [];
  }

  const player = careerPlayerProfile || {};
  const statsLookup = buildCareerStatsLookup(careerPlayerStats);
  const currentSeasonStats = resolveSeasonStatsForPlayer({
    statsLookup,
    teamName: careerTeam,
    playerId: player.playerId,
    playerName: player.name,
  });
  const baseValuation = estimateCareerPlayerMarketValue({
    player,
    seasonStats: currentSeasonStats,
    currentAge,
    currentValue: player.currentValue,
    currentTeamPoints: resolveSeasonPointsForTeam(careerStandings, careerTeam),
  });

  const ownTeamData = careerDomesticTeams.find((team) => team.name === careerTeam);
  const stayOfferAmount = Math.max(85000, Math.round(baseValuation * (0.95 + Math.random() * 0.08)));
  const stayOffer = {
    team: careerTeam,
    location: ownTeamData?.location || '',
    country: ownTeamData?.country || '',
    amount: stayOfferAmount,
    amountLabel: formatOfferAmount(stayOfferAmount),
    valuation: baseValuation,
    valuationLabel: formatOfferAmount(baseValuation),
    isCurrentTeam: true,
    offerType: 'stay',
  };

  const targetTeams = shuffleArray(careerDomesticTeams.filter((team) => team?.name && team.name !== careerTeam)).slice(
    0,
    Math.min(3, Math.max(1, careerDomesticTeams.length - 1))
  );

  const transferOffers = targetTeams.map((team, index) => {
    const teamPoints = resolveSeasonPointsForTeam(careerStandings, team.name);
    const marketInterest = 0.98 + index * 0.04 + Math.random() * 0.12;
    const teamStrengthBump = 1 + clampNumber(teamPoints, 0, 40) / 500;
    const amount = Math.max(95000, Math.round((baseValuation * marketInterest * teamStrengthBump) / 500) * 500);

    return {
      team: team.name,
      location: team.location || '',
      country: team.country || '',
      amount,
      amountLabel: formatOfferAmount(amount),
      valuation: baseValuation,
      valuationLabel: formatOfferAmount(baseValuation),
      isCurrentTeam: false,
      offerType: 'transfer',
    };
  });

  return [stayOffer, ...transferOffers].sort(
    (left, right) =>
      Number(Boolean(right.isCurrentTeam)) - Number(Boolean(left.isCurrentTeam)) || right.amount - left.amount || left.team.localeCompare(right.team)
  );
};

export const buildRandomDerangement = (size) => {
  const base = Array.from({ length: size }, (_, index) => index);
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const candidate = shuffleArray(base);
    if (candidate.every((value, index) => value !== index)) {
      return candidate;
    }
  }

  // Fallback to a simple rotation if random attempts fail.
  return base.map((_, index) => (index + 1) % size);
};

export const applyOffseasonTransferMarket = ({ domesticTeams = [], careerPlayerProfile, careerPlayerStats }) => {
  if (!Array.isArray(domesticTeams) || domesticTeams.length < 2) {
    return { teams: domesticTeams, transferCount: 0, moves: [] };
  }

  const teams = (domesticTeams || []).map((team) => ({
    ...team,
    players: Array.isArray(team?.players) ? [...team.players] : [],
  }));
  const teamNames = teams.map((team) => team.name).filter(Boolean);
  if (teamNames.length < 2) {
    return { teams: domesticTeams, transferCount: 0, moves: [] };
  }

  const statsLookup = buildCareerStatsLookup(careerPlayerStats);
  const userPlayerId = careerPlayerProfile?.playerId !== undefined && careerPlayerProfile?.playerId !== null
    ? String(careerPlayerProfile.playerId)
    : null;

  const outboundCandidatesByTeam = {};
  const transferableCapacity = [];

  teams.forEach((team) => {
    const players = Array.isArray(team.players) ? team.players : [];
    const rankedPlayers = [...players]
      .map((player) => ({
        player,
        rank: resolvePlayerValueScore({
          player,
          seasonStats: resolveSeasonStatsForPlayer({
            statsLookup,
            teamName: team.name,
            playerId: player.id,
            playerName: player.name,
          }),
        }),
      }))
      .sort((left, right) => right.rank - left.rank || String(left.player.name || '').localeCompare(String(right.player.name || '')));

    const protectedIds = new Set(
      rankedPlayers
        .slice(0, 5)
        .map((entry) => entry.player?.id)
        .filter((id) => id !== undefined && id !== null)
        .map((id) => String(id))
    );
    if (userPlayerId) {
      protectedIds.add(userPlayerId);
    }

    const candidates = players.filter((player) => {
      const playerId = player?.id !== undefined && player?.id !== null ? String(player.id) : '';
      return !protectedIds.has(playerId);
    });

    outboundCandidatesByTeam[team.name] = shuffleArray(candidates);
    transferableCapacity.push(candidates.length);
  });

  const transferCount = Math.min(5, ...transferableCapacity);
  if (!Number.isFinite(transferCount) || transferCount <= 0) {
    return { teams, transferCount: 0, moves: [] };
  }

  const outgoingByTeam = {};
  const remainingByTeam = {};
  const incomingByTeam = teamNames.reduce((acc, teamName) => {
    acc[teamName] = [];
    return acc;
  }, {});

  teamNames.forEach((teamName) => {
    const selected = (outboundCandidatesByTeam[teamName] || []).slice(0, transferCount);
    const selectedIdSet = new Set(
      selected
        .map((player) => player?.id)
        .filter((id) => id !== undefined && id !== null)
        .map((id) => String(id))
    );
    outgoingByTeam[teamName] = selected;
    const sourcePlayers = teams.find((team) => team.name === teamName)?.players || [];
    remainingByTeam[teamName] = sourcePlayers.filter((player) => !selectedIdSet.has(String(player.id)));
  });

  const moves = [];
  for (let round = 0; round < transferCount; round += 1) {
    const destinationIndexes = buildRandomDerangement(teamNames.length);

    teamNames.forEach((sourceTeam, sourceIndex) => {
      const destinationTeam = teamNames[destinationIndexes[sourceIndex]];
      const player = outgoingByTeam[sourceTeam]?.[round];

      incomingByTeam[destinationTeam].push(player);
      moves.push({
        playerId: player.id,
        playerName: player.name,
        fromTeam: sourceTeam,
        toTeam: destinationTeam,
      });
    });
  }

  const updatedTeams = teams.map((team) => ({
    ...team,
    players: [...(remainingByTeam[team.name] || []), ...(incomingByTeam[team.name] || [])],
  }));

  return {
    teams: updatedTeams,
    transferCount,
    moves,
  };
};

export const relocateCareerPlayerToTeam = ({ domesticTeams = [], currentCareerTeam, nextCareerTeam, careerPlayerProfile }) => {
  if (!Array.isArray(domesticTeams) || !domesticTeams.length) {
    return { teams: domesticTeams, nextCareerTeam: currentCareerTeam };
  }

  const targetTeamName =
    domesticTeams.some((team) => team.name === nextCareerTeam) && nextCareerTeam ? nextCareerTeam : currentCareerTeam;
  if (!targetTeamName) {
    return { teams: domesticTeams, nextCareerTeam: currentCareerTeam };
  }

  const playerId = careerPlayerProfile?.playerId !== undefined && careerPlayerProfile?.playerId !== null
    ? String(careerPlayerProfile.playerId)
    : null;
  const playerName = String(careerPlayerProfile?.name || '');
  let capturedPlayer = null;

  const removedFromTeams = (domesticTeams || []).map((team) => {
    const nextPlayers = (team.players || []).filter((player) => {
      const sameId = playerId && String(player?.id) === playerId;
      const sameName = playerName && String(player?.name || '') === playerName;
      const isCareerPlayer = sameId || sameName;

      if (isCareerPlayer && !capturedPlayer) {
        capturedPlayer = player;
      }

      return !isCareerPlayer;
    });

    return {
      ...team,
      players: nextPlayers,
    };
  });

  const playerToMove = capturedPlayer || {
    ...careerPlayerProfile,
    id: careerPlayerProfile?.playerId,
    name: careerPlayerProfile?.name,
  };

  const updatedTeams = removedFromTeams.map((team) => {
    if (team.name !== targetTeamName) {
      return team;
    }

    return {
      ...team,
      players: [playerToMove, ...(team.players || [])],
    };
  });

  return {
    teams: updatedTeams,
    nextCareerTeam: targetTeamName,
  };
};
