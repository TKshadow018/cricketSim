import { ensurePlayerMeta } from "./controllerCommonUtils";

import { INJURY_CHANCE_PER_PLAYER, clampMetric, applyAbilityDeltaToPlayer } from "./careerPlayerProgressionUtils";

import { buildPlayerKey, parseOversToBalls } from "./careerMatchStatsUtils";

import { randomInt } from "./careerPlayerDataUtils";

export const applyDomesticMatchPlayerUpdates = ({
  domesticTeams = [],
  teamAName = '',
  teamBName = '',
  teamAXIIds = [],
  teamBXIIds = [],
  momShortlist = [],
  matchContributionsByTeam = {},
  injuryChance = INJURY_CHANCE_PER_PLAYER,
}) => {
  const shortlistedKeys = new Set(
    (momShortlist || []).map((entry) => `${entry.team}::${entry.playerId ?? ''}::${entry.name || ''}`)
  );
  const shortlistRankById = new Map();
  const shortlistRankByName = new Map();
  (momShortlist || []).forEach((entry, index) => {
    if (entry?.team && entry?.playerId !== undefined && entry?.playerId !== null) {
      shortlistRankById.set(`${entry.team}::${String(entry.playerId)}`, index);
    }
    if (entry?.team && entry?.name) {
      shortlistRankByName.set(`${entry.team}::${entry.name}`, index);
    }
  });
  const shortlistTopHalfSize = Math.ceil(Math.max(1, (momShortlist || []).length / 2));
  const winner = momShortlist[0] || null;
  const winnerKey = winner ? `${winner.team}::${winner.playerId ?? ''}::${winner.name || ''}` : '';
  const selectedByTeam = {
    [teamAName]: new Set(teamAXIIds.map((id) => String(id))),
    [teamBName]: new Set(teamBXIIds.map((id) => String(id))),
  };

  return (domesticTeams || []).map((team) => {
    const recoveredPlayers = (team.players || []).map((player) => {
      const normalized = ensurePlayerMeta(player);
      return {
        ...normalized,
        fitness: clampMetric(normalized.fitness + 5),
      };
    });

    if (team.name !== teamAName && team.name !== teamBName) {
      return {
        ...team,
        players: recoveredPlayers,
      };
    }

    const selectedIds = selectedByTeam[team.name] || new Set();
    return {
      ...team,
      players: recoveredPlayers.map((player) => {
        const playerKey = buildPlayerKey(team.name, player);
        const playerContribution = matchContributionsByTeam?.[team.name]?.[String(player.id)] || matchContributionsByTeam?.[team.name]?.[player.name] || {};
        const didBat = !!playerContribution.didBat;
        const didBowl = !!playerContribution.didBowl;
        const madeImpact = didBat || didBowl;
        const shortlistRank = shortlistRankById.has(`${team.name}::${String(player.id)}`)
          ? shortlistRankById.get(`${team.name}::${String(player.id)}`)
          : shortlistRankByName.get(`${team.name}::${player.name}`);
        const isShortlisted = shortlistRank !== undefined || shortlistedKeys.has(playerKey);
        const isTopHalf = isShortlisted && Number(shortlistRank) < shortlistTopHalfSize;
        const isBottomHalf = isShortlisted && !isTopHalf;
        const participated = selectedIds.has(String(player.id));
        let nextFitness = player.fitness;
        let nextMorale = player.morale;
        let nextForm = Number(player.form ?? 50);
        let nextConfidence = Number(player.confidence ?? 50);

        if (participated) {
          nextFitness = clampMetric(nextFitness - randomInt(10, 30));
          nextMorale += 1;
          nextConfidence += 1;
          if (madeImpact) {
            nextForm += 1;
          }
        } else {
          nextMorale -= 2;
          nextForm -= 1;
          nextConfidence -= 1;
        }

        if (isShortlisted) {
          nextMorale += 5;
          nextConfidence += 1;
          nextForm += 1;
        }

        if (winnerKey === playerKey) {
          nextMorale += 5;
          nextConfidence += 2;
          nextForm += 2;
        }

        if (isBottomHalf) {
          nextForm -= 2;
        }

        let matchAbilityDelta = 0;
        if (madeImpact) {
          if (winnerKey === playerKey) {
            matchAbilityDelta += 3;
          }
          if (isShortlisted) {
            matchAbilityDelta += 2;
            matchAbilityDelta += isTopHalf ? 1 : -1;
          }
        }

        const injuryAbilityDelta = Math.random() < injuryChance ? -randomInt(10, 25) : 0;
        if (injuryAbilityDelta < 0) {
          nextForm -= 5;
          nextConfidence -= 5;
        }

        const progressedPlayer = applyAbilityDeltaToPlayer(player, matchAbilityDelta + injuryAbilityDelta);

        return {
          ...progressedPlayer,
          fitness: clampMetric(nextFitness),
          morale: clampMetric(nextMorale),
          form: clampMetric(nextForm),
          confidence: clampMetric(nextConfidence),
        };
      }),
    };
  });
};

const mergeSimulatedPlayerContribution = ({
  updatedStats,
  teamName,
  player,
  seasonNumber,
  format,
  battingRow,
  bowlingRow,
  playerIndex,
}) => {
  const playerId = player?.id ?? `${teamName || 'team'}-sim-${playerIndex + 1}`;
  const playerName = player?.name || `Player ${playerIndex + 1}`;
  const key = `${teamName}::${playerId}::${playerName}`;
  const previous = updatedStats[key] || {
    key,
    playerId,
    team: teamName,
    name: playerName,
    playerType: player?.playerType || '',
    isWicketKeeper: !!player?.isWicketKeeper,
    paceAbility: player?.paceAbility || 0,
    spinAbility: player?.spinAbility || 0,
    abilityToPlayPaceBall: player?.abilityToPlayPaceBall || 0,
    abilityToPlaySpinBall: player?.abilityToPlaySpinBall || 0,
    fitness: player?.fitness ?? 100,
    morale: player?.morale ?? 50,
    battingOrderCoeff: player?.battingOrderCoeff ?? 0,
    runs: 0,
    outs: 0,
    wickets: 0,
    balls: 0,
    ballsBowled: 0,
    runsConceded: 0,
    matches: 0,
    season: seasonNumber,
  };

  const contribution = {
    runs: Number(battingRow?.runs || 0),
    balls: Number(battingRow?.balls || 0),
    outs:
      battingRow &&
      battingRow.dismissal !== 'Not Out' &&
      battingRow.dismissal !== 'Yet to bat' &&
      Number(battingRow?.balls || 0) > 0
        ? 1
        : 0,
    wickets: Number(bowlingRow?.wickets || 0),
    ballsBowled: parseOversToBalls(bowlingRow?.overs || '0.0'),
    runsConceded: Number(bowlingRow?.runsConceded || 0),
  };
  updatedStats[key] = {
    ...previous,
    team: teamName,
    season: seasonNumber,
    playerId,
    playerType: previous.playerType || player?.playerType || '',
    isWicketKeeper: previous.isWicketKeeper || !!player?.isWicketKeeper,
    paceAbility: previous.paceAbility || player?.paceAbility || 0,
    spinAbility: previous.spinAbility || player?.spinAbility || 0,
    abilityToPlayPaceBall: previous.abilityToPlayPaceBall || player?.abilityToPlayPaceBall || 0,
    abilityToPlaySpinBall: previous.abilityToPlaySpinBall || player?.abilityToPlaySpinBall || 0,
    fitness: previous.fitness ?? player?.fitness ?? 100,
    morale: previous.morale ?? player?.morale ?? 50,
    battingOrderCoeff: previous.battingOrderCoeff || player?.battingOrderCoeff || 0,
    runs: previous.runs + contribution.runs,
    outs: previous.outs + contribution.outs,
    wickets: previous.wickets + contribution.wickets,
    balls: previous.balls + contribution.balls,
    ballsBowled: previous.ballsBowled + contribution.ballsBowled,
    runsConceded: previous.runsConceded + contribution.runsConceded,
    matches: previous.matches + 1,
    formatStats: {
      ...(previous.formatStats || {}),
      [format]: {
        runs: Number(previous.formatStats?.[format]?.runs || 0) + contribution.runs,
        outs: Number(previous.formatStats?.[format]?.outs || 0) + contribution.outs,
        wickets: Number(previous.formatStats?.[format]?.wickets || 0) + contribution.wickets,
        balls: Number(previous.formatStats?.[format]?.balls || 0) + contribution.balls,
        ballsBowled: Number(previous.formatStats?.[format]?.ballsBowled || 0) + contribution.ballsBowled,
        runsConceded: Number(previous.formatStats?.[format]?.runsConceded || 0) + contribution.runsConceded,
        matches: Number(previous.formatStats?.[format]?.matches || 0) + 1,
      },
    },
  };
};

export const mergeSimulatedTeamStatsFromScorecard = ({
  updatedStats,
  teamName,
  teamPlayers,
  battingCard,
  opponentBattingCard,
  seasonNumber,
  format,
}) => {
  const players = Array.isArray(teamPlayers) ? teamPlayers.slice(0, 11) : [];
  if (!players.length) {
    return;
  }

  const battingRowsByName = new Map(
    ((battingCard?.battingRows || [])).map((row) => [row?.name, row])
  );
  const bowlingRowsByName = new Map(
    ((opponentBattingCard?.bowlingRows || [])).map((row) => [row?.name, row])
  );

  players.forEach((player, index) => {
    mergeSimulatedPlayerContribution({
      updatedStats,
      teamName,
      player,
      seasonNumber,
      format,
      battingRow: battingRowsByName.get(player?.name),
      bowlingRow: bowlingRowsByName.get(player?.name),
      playerIndex: index,
    });
  });
};

const findTeamInningsCard = (scorecard, teamName) => {
  if (!teamName || !scorecard) {
    return null;
  }

  const cards = [scorecard.previousInnings, scorecard.currentInnings].filter(Boolean);
  return (
    cards.find((card) => String(card?.title || '').toLowerCase().startsWith(String(teamName).toLowerCase())) ||
    cards.find((card) => String(card?.title || '').toLowerCase().includes(String(teamName).toLowerCase())) ||
    null
  );
};

export const buildLastMatchContext = (fixture, teamName) => {
  const card = findTeamInningsCard(fixture?.result?.scorecard, teamName);
  const battingRows = Array.isArray(card?.battingRows) ? card.battingRows : [];
  const bowlingRows = Array.isArray(card?.bowlingRows) ? card.bowlingRows : [];

  const previousXIIds = battingRows
    .map((row) => row?.playerId)
    .filter((id) => id !== undefined && id !== null)
    .map((id) => String(id));

  const lastMatchPerformanceById = {};
  const lastMatchPerformanceByName = {};

  battingRows.forEach((row) => {
    const payload = {
      runs: Number(row?.runs || 0),
      wickets: 0,
    };
    if (row?.playerId !== undefined && row?.playerId !== null) {
      lastMatchPerformanceById[String(row.playerId)] = payload;
    }
    if (row?.name) {
      lastMatchPerformanceByName[String(row.name)] = payload;
    }
  });

  bowlingRows.forEach((row) => {
    const addWickets = Number(row?.wickets || 0);
    if (row?.playerId !== undefined && row?.playerId !== null) {
      const idKey = String(row.playerId);
      lastMatchPerformanceById[idKey] = {
        runs: Number(lastMatchPerformanceById[idKey]?.runs || 0),
        wickets: Number(lastMatchPerformanceById[idKey]?.wickets || 0) + addWickets,
      };
    }
    if (row?.name) {
      const nameKey = String(row.name);
      lastMatchPerformanceByName[nameKey] = {
        runs: Number(lastMatchPerformanceByName[nameKey]?.runs || 0),
        wickets: Number(lastMatchPerformanceByName[nameKey]?.wickets || 0) + addWickets,
      };
    }
  });

  return {
    previousXIIds,
    lastMatchPerformanceById,
    lastMatchPerformanceByName,
  };
};
