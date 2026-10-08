import { matchStatusEnum } from '../../../../gameData/matchStatusEnum';
import { buildRandomBattingOrderCoeff, ensurePlayerMeta, MODE_CAREER, selectAIPlayingXI } from '../../utils/controllerCommonUtils';
import { buildCareerMatchScorecard, buildTopRunScorers, buildTopWicketTakers, mergePlayerStatsForCurrentMatch } from '../../utils/controllerCareerUtils';
import { buildMomRecommendations } from '../../utils/controllerMomUtils';
import { buildSeasonProgressionNotes } from '../../utils/controllerCareerPlayerUtils';
import {
  applyEndOfSeasonPlayerAbilityUpdates,
  applyDomesticMatchPlayerUpdates,
  assignGlobalPoolPlayersToDomesticTeams,
  buildCareerSeasonSchedule,
  buildCareerStandings,
  resolveNextCareerMatch,
  runCareerAuction,
  simulateCareerFixture,
} from '../../utils/controllerCareerScheduleUtils';

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const shuffleArray = (items = []) => {
  const copy = [...(items || [])];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
};

const clampNumber = (value, min, max) => Math.min(max, Math.max(min, value));

const formatOfferAmount = (amount) => `$${Number(amount || 0).toLocaleString('en-US')}`;

const resolveSeasonPointsForTeam = (careerStandings = {}, teamName = '') => {
  if (!teamName || !careerStandings || typeof careerStandings !== 'object') {
    return 0;
  }

  const t20Standings = careerStandings.t20 && typeof careerStandings.t20 === 'object' ? careerStandings.t20 : careerStandings;
  return Number(t20Standings?.[teamName]?.points || 0);
};

const buildCareerStatsLookup = (careerPlayerStats = {}) => {
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

const resolveSeasonStatsForPlayer = ({ statsLookup, teamName, playerId, playerName }) => {
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

const resolvePlayerValueScore = ({ player = {}, seasonStats = null }) => {
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

const estimateCareerPlayerMarketValue = ({
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

const buildCareerTransferOffers = ({
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

const buildRandomDerangement = (size) => {
  if (size <= 1) {
    return Array.from({ length: size }, (_, index) => index);
  }

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

const applyOffseasonTransferMarket = ({ domesticTeams = [], careerPlayerProfile, careerPlayerStats }) => {
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
      if (!player || !destinationTeam) {
        return;
      }

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

const relocateCareerPlayerToTeam = ({ domesticTeams = [], currentCareerTeam, nextCareerTeam, careerPlayerProfile }) => {
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

const PLAYER_TYPES = {
  BATSMAN: 'batsman',
  BOWLER: 'bowler',
  WICKETKEEPER: 'wicketkeeper',
  PACE_ALLROUNDER: 'pace allrounder',
  SPIN_ALLROUNDER: 'spin allrounder',
  PACER: 'pacer',
  SPINER: 'spiner',
};

const normalizePlayerType = (value) => String(value || '').trim().toLowerCase();

const buildStatsByPlayerType = (playerType) => {
  const normalizedType = normalizePlayerType(playerType);

  if (normalizedType === PLAYER_TYPES.WICKETKEEPER) {
    return {
      abilityToPlayPaceBall: randomInt(35, 55),
      abilityToPlaySpinBall: randomInt(35, 55),
      battingAggresion: randomInt(40, 60),
      paceAbility: randomInt(8, 15),
      spinAbility: randomInt(8, 15),
      isWicketKeeper: true,
      playerType: PLAYER_TYPES.WICKETKEEPER,
    };
  }

  if (normalizedType === PLAYER_TYPES.PACE_ALLROUNDER) {
    return {
      abilityToPlayPaceBall: randomInt(30, 50),
      abilityToPlaySpinBall: randomInt(30, 50),
      battingAggresion: randomInt(40, 60),
      paceAbility: randomInt(30, 50),
      spinAbility: randomInt(8, 15),
      isWicketKeeper: false,
      playerType: PLAYER_TYPES.PACE_ALLROUNDER,
    };
  }

  if (normalizedType === PLAYER_TYPES.SPIN_ALLROUNDER) {
    return {
      abilityToPlayPaceBall: randomInt(30, 50),
      abilityToPlaySpinBall: randomInt(30, 50),
      battingAggresion: randomInt(40, 60),
      paceAbility: randomInt(8, 15),
      spinAbility: randomInt(30, 50),
      isWicketKeeper: false,
      playerType: PLAYER_TYPES.SPIN_ALLROUNDER,
    };
  }

  if (normalizedType === PLAYER_TYPES.PACER) {
    return {
      abilityToPlayPaceBall: randomInt(8, 15),
      abilityToPlaySpinBall: randomInt(8, 15),
      battingAggresion: randomInt(10, 60),
      paceAbility: randomInt(40, 60),
      spinAbility: randomInt(8, 15),
      isWicketKeeper: false,
      playerType: PLAYER_TYPES.PACER,
    };
  }

  if (normalizedType === PLAYER_TYPES.SPINER) {
    return {
      abilityToPlayPaceBall: randomInt(8, 15),
      abilityToPlaySpinBall: randomInt(8, 15),
      battingAggresion: randomInt(10, 60),
      paceAbility: randomInt(8, 15),
      spinAbility: randomInt(40, 60),
      isWicketKeeper: false,
      playerType: PLAYER_TYPES.SPINER,
    };
  }

  if (normalizedType === PLAYER_TYPES.BOWLER) {
    const pacePrimary = Math.random() >= 0.5;
    return {
      abilityToPlayPaceBall: randomInt(8, 15),
      abilityToPlaySpinBall: randomInt(8, 15),
      battingAggresion: randomInt(10, 60),
      paceAbility: pacePrimary ? randomInt(40, 60) : randomInt(8, 15),
      spinAbility: pacePrimary ? randomInt(8, 15) : randomInt(40, 60),
      isWicketKeeper: false,
      playerType: PLAYER_TYPES.BOWLER,
    };
  }

  return {
    abilityToPlayPaceBall: randomInt(40, 60),
    abilityToPlaySpinBall: randomInt(40, 60),
    battingAggresion: randomInt(50, 70),
    paceAbility: randomInt(8, 15),
    spinAbility: randomInt(8, 15),
    isWicketKeeper: false,
    playerType: PLAYER_TYPES.BATSMAN,
  };
};

const resolveMatchTypeKeyForFormat = (format) => {
  if (format === 'odi') return 'ODI';
  if (format === 'firstClass') return 'test';
  return 't20';
};

const buildCreatedCareerPlayer = (profile, domesticCountry) => {
  const assigned = buildStatsByPlayerType(profile?.playerType);
  return ensurePlayerMeta({
    id: `career-player-${Date.now()}`,
    name: profile.name,
    country: profile.nationality || domesticCountry,
    playerType: assigned.playerType,
    abilityToPlayPaceBall: assigned.abilityToPlayPaceBall,
    abilityToPlaySpinBall: assigned.abilityToPlaySpinBall,
    battingAggresion: assigned.battingAggresion,
    paceAbility: assigned.paceAbility,
    spinAbility: assigned.spinAbility,
    isWicketKeeper: assigned.isWicketKeeper,
    fitness: 100,
    morale: 50,
    battingOrderCoeff: buildRandomBattingOrderCoeff({
      playerType: assigned.playerType,
      isWicketKeeper: assigned.isWicketKeeper,
      abilityToPlayPaceBall: assigned.abilityToPlayPaceBall,
      abilityToPlaySpinBall: assigned.abilityToPlaySpinBall,
      paceAbility: assigned.paceAbility,
      spinAbility: assigned.spinAbility,
    }),
  });
};

const normalizeDomesticTeams = (domesticTeams = []) =>
  (domesticTeams || []).map((team, teamIndex) => {
    const players = (team.players || []).map((player, playerIndex) => ({
      ...ensurePlayerMeta(player),
      id: player.id ?? `${team.name || 'team'}-P${teamIndex + 1}-${playerIndex + 1}`,
    }));
    return {
      ...team,
      players,
    };
  });

const resolveCareerLeagueCountry = ({ teams = [], careerTeam = '', fallbackCountry = '' }) => {
  const matchingTeam = (teams || []).find((team) => team?.name === careerTeam);
  return matchingTeam?.country || fallbackCountry || '';
};

const filterDomesticTeamsForLeagueCountry = ({ teams = [], leagueCountry = '' }) => {
  if (!leagueCountry) {
    return Array.isArray(teams) ? teams : [];
  }

  return (teams || []).filter((team) => team?.country === leagueCountry);
};

const syncCareerPlayerProfile = ({ teams = [], careerTeam, careerPlayerProfile }) => {
  if (!careerPlayerProfile?.name) {
    return careerPlayerProfile;
  }

  const roster = (teams || []).find((team) => team.name === careerTeam)?.players || [];
  const updatedPlayer = careerPlayerProfile.playerId
    ? roster.find((player) => String(player.id) === String(careerPlayerProfile.playerId))
    : roster.find((player) => player.name === careerPlayerProfile.name);

  return updatedPlayer ? { ...careerPlayerProfile, ...updatedPlayer } : careerPlayerProfile;
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

const buildLastMatchContext = (fixture, teamName) => {
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

const getLatestCompletedFixtureForTeam = (schedule = [], teamName, beforeIndex = schedule.length) => {
  for (let index = Math.min(beforeIndex, schedule.length) - 1; index >= 0; index -= 1) {
    const fixture = schedule[index];
    if (!fixture?.isComplete) {
      continue;
    }

    if (fixture.teamA === teamName || fixture.teamB === teamName) {
      return fixture;
    }
  }

  return null;
};

const toLeagueSlug = (value = '') =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const buildAllCountryLeagueSchedules = ({
  allDomesticTeams = [],
  userLeagueCountry = '',
  seasonLength = 'standard',
  careerTeam,
}) => {
  const countries = [...new Set((allDomesticTeams || []).map((team) => team?.country).filter(Boolean))];
  const baseDate = new Date();
  baseDate.setHours(12, 0, 0, 0);
  const fixtures = [];

  countries.forEach((country, countryIndex) => {
    const countryTeams = filterDomesticTeamsForLeagueCountry({
      teams: allDomesticTeams,
      leagueCountry: country,
    });
    if (countryTeams.length < 2) {
      return;
    }

    const seedTeam = country === userLeagueCountry
      ? careerTeam
      : countryTeams[0]?.name || careerTeam;
    const leagueStartDate = new Date(baseDate);
    leagueStartDate.setDate(baseDate.getDate() + countryIndex);
    const countrySchedule = buildCareerSeasonSchedule(seedTeam, countryTeams, seasonLength, {
      seasonStartDate: leagueStartDate,
      leagueCountry: country,
    }).map((fixture, index) => ({
      ...fixture,
      id: `${toLeagueSlug(country) || 'country'}-${index + 1}-${fixture.id}`,
      leagueCountry: country,
      isUserMatch: country === userLeagueCountry ? fixture.isUserMatch : false,
      opponent: country === userLeagueCountry ? fixture.opponent : '',
      locationCountry: country,
    }));

    fixtures.push(...countrySchedule);
  });

  const compareByDate = (left, right) => {
    const leftTime = new Date(left?.scheduledDate || 0).getTime();
    const rightTime = new Date(right?.scheduledDate || 0).getTime();
    if (leftTime !== rightTime) {
      return leftTime - rightTime;
    }
    return Number(left?.globalMatchNumber || 0) - Number(right?.globalMatchNumber || 0);
  };

  return fixtures
    .sort(compareByDate)
    .map((fixture, index) => ({
      ...fixture,
      globalMatchNumber: index + 1,
    }));
};

const markContribution = (map, player, key) => {
  if (!player) {
    return;
  }

  if (player.id !== undefined && player.id !== null) {
    const idKey = String(player.id);
    map[idKey] = {
      ...(map[idKey] || {}),
      [key]: true,
    };
  }

  if (player.name) {
    const nameKey = String(player.name);
    map[nameKey] = {
      ...(map[nameKey] || {}),
      [key]: true,
    };
  }
};

const buildTeamContributionsFromInnings = ({ players = [], battingStats = [], bowlingStats = [] }) => {
  const map = {};

  (players || []).forEach((player, index) => {
    const batting = battingStats[index] || {};
    const bowling = bowlingStats[index] || {};
    if (Number(batting?.balls || 0) > 0) {
      markContribution(map, player, 'didBat');
    }
    if (Number(bowling?.balls || 0) > 0) {
      markContribution(map, player, 'didBowl');
    }
  });

  return map;
};

const buildSeasonPlayerAwardIndex = ({
  careerDomesticTeams,
  careerPlayerStats,
  careerPlayerProfile,
  currentAge,
}) => {
  const rosterByTeamAndId = new Map();
  const rosterByTeamAndName = new Map();

  (careerDomesticTeams || []).forEach((team) => {
    (team.players || []).forEach((player) => {
      if (player?.id !== undefined && player?.id !== null) {
        rosterByTeamAndId.set(`${team.name}::${String(player.id)}`, player);
      }
      if (player?.name) {
        rosterByTeamAndName.set(`${team.name}::${player.name}`, player);
      }
    });
  });

  return Object.values(careerPlayerStats || {})
    .filter((entry) => entry && entry.name && entry.team)
    .map((entry) => {
      const rosterPlayer =
        (entry.playerId !== undefined && entry.playerId !== null
          ? rosterByTeamAndId.get(`${entry.team}::${String(entry.playerId)}`)
          : null) ||
        rosterByTeamAndName.get(`${entry.team}::${entry.name}`) ||
        null;

      const battingAverage = Number(entry.outs || 0) > 0 ? Number(entry.runs || 0) / Number(entry.outs || 1) : Number(entry.runs || 0);
      const strikeRate = Number(entry.balls || 0) > 0 ? (Number(entry.runs || 0) * 100) / Number(entry.balls || 1) : 0;
      const bowlingAverage = Number(entry.wickets || 0) > 0 ? Number(entry.runsConceded || 0) / Number(entry.wickets || 1) : 999;
      const economy = Number(entry.ballsBowled || 0) > 0 ? (Number(entry.runsConceded || 0) * 6) / Number(entry.ballsBowled || 1) : 99;
      const resolvedAge =
        careerPlayerProfile?.playerId !== undefined &&
        careerPlayerProfile?.playerId !== null &&
        String(entry.playerId) === String(careerPlayerProfile.playerId)
          ? currentAge
          : Number(rosterPlayer?.age || 25);

      return {
        ...entry,
        battingAverage,
        strikeRate,
        bowlingAverage,
        economy,
        age: resolvedAge,
      };
    });
};

const buildMomAwardsMapFromSchedule = (careerSchedule = []) => {
  const counts = new Map();

  (careerSchedule || []).forEach((fixture) => {
    if (!fixture?.isComplete) {
      return;
    }

    const awarded = fixture.result?.momAward || fixture.result?.momShortlist?.[0] || null;
    if (!awarded?.team || !awarded?.name) {
      return;
    }

    const key = `${awarded.team}::${awarded.playerId ?? ''}::${awarded.name}`;
    counts.set(key, {
      key,
      team: awarded.team,
      playerId: awarded.playerId,
      name: awarded.name,
      count: Number(counts.get(key)?.count || 0) + 1,
    });
  });

  return counts;
};

const resolveSeasonAwards = (players = [], momAwardsMap = new Map()) => {
  const withMomCounts = players.map((entry) => {
    const momKey = `${entry.team}::${entry.playerId ?? ''}::${entry.name}`;
    const momAwards = Number(momAwardsMap.get(momKey)?.count || 0);
    const allRoundScore =
      Number(entry.runs || 0) * 1.25 +
      Number(entry.wickets || 0) * 28 +
      Number(entry.matches || 0) * 2 +
      momAwards * 22;

    return {
      ...entry,
      momAwards,
      allRoundScore,
    };
  });

  const bestBatsman = [...withMomCounts].sort(
    (left, right) =>
      Number(right.runs || 0) - Number(left.runs || 0) ||
      right.battingAverage - left.battingAverage ||
      right.strikeRate - left.strikeRate ||
      String(left.name || '').localeCompare(String(right.name || ''))
  )[0] || null;

  const bestBowler = [...withMomCounts].sort(
    (left, right) =>
      Number(right.wickets || 0) - Number(left.wickets || 0) ||
      left.bowlingAverage - right.bowlingAverage ||
      left.economy - right.economy ||
      String(left.name || '').localeCompare(String(right.name || ''))
  )[0] || null;

  const youngPlayer = [...withMomCounts]
    .filter((entry) => Number(entry.age || 99) < 23)
    .sort(
      (left, right) =>
        right.allRoundScore - left.allRoundScore ||
        Number(right.runs || 0) - Number(left.runs || 0) ||
        Number(right.wickets || 0) - Number(left.wickets || 0)
    )[0] || null;

  const playerOfYear = [...withMomCounts].sort(
    (left, right) =>
      right.allRoundScore - left.allRoundScore ||
      Number(right.runs || 0) - Number(left.runs || 0) ||
      Number(right.wickets || 0) - Number(left.wickets || 0)
  )[0] || null;

  const mostMom = [...withMomCounts].sort(
    (left, right) => right.momAwards - left.momAwards || right.allRoundScore - left.allRoundScore
  )[0] || null;

  return [
    {
      id: 'best-batsman',
      title: 'Best Batsman',
      winner: bestBatsman
        ? { name: bestBatsman.name, team: bestBatsman.team, playerId: bestBatsman.playerId }
        : null,
      summary: bestBatsman ? `${bestBatsman.runs} runs (avg ${bestBatsman.battingAverage.toFixed(2)})` : 'No winner',
    },
    {
      id: 'best-bowler',
      title: 'Best Bowler',
      winner: bestBowler
        ? { name: bestBowler.name, team: bestBowler.team, playerId: bestBowler.playerId }
        : null,
      summary: bestBowler ? `${bestBowler.wickets} wickets (avg ${bestBowler.bowlingAverage.toFixed(2)})` : 'No winner',
    },
    {
      id: 'young-player',
      title: 'Young Player of the Year (U23)',
      winner: youngPlayer
        ? { name: youngPlayer.name, team: youngPlayer.team, playerId: youngPlayer.playerId }
        : null,
      summary: youngPlayer
        ? `${youngPlayer.runs} runs, ${youngPlayer.wickets} wickets, age ${youngPlayer.age}`
        : 'No eligible under-23 player',
    },
    {
      id: 'player-of-year',
      title: 'Player of the Year',
      winner: playerOfYear
        ? { name: playerOfYear.name, team: playerOfYear.team, playerId: playerOfYear.playerId }
        : null,
      summary: playerOfYear ? `Impact score ${Math.round(playerOfYear.allRoundScore)}` : 'No winner',
    },
    {
      id: 'most-mom',
      title: 'Most Man of the Match Awards',
      winner: mostMom
        ? { name: mostMom.name, team: mostMom.team, playerId: mostMom.playerId }
        : null,
      summary: mostMom ? `${mostMom.momAwards} awards` : 'No MOM awards recorded',
    },
  ];
};

const buildEndOfSeasonReport = ({
  careerTeam,
  careerSeason,
  currentAge,
  careerDomesticTeams,
  careerPlayerStats,
  careerPlayerProfile,
  careerStandings,
  careerSchedule,
}) => {
  const previewTeams = applyEndOfSeasonPlayerAbilityUpdates({
    domesticTeams: careerDomesticTeams,
    careerPlayerStats,
    currentAge,
    careerTeam,
    careerPlayerProfile,
  });

  const currentByTeamAndId = new Map();
  (careerDomesticTeams || []).forEach((team) => {
    (team.players || []).forEach((player) => {
      currentByTeamAndId.set(`${team.name}::${player.id}`, player);
    });
  });

  const abilityChangePreview = [];
  previewTeams.forEach((team) => {
    (team.players || []).forEach((player) => {
      const previous = currentByTeamAndId.get(`${team.name}::${player.id}`);
      if (!previous) {
        return;
      }

      const before = {
        abilityToPlayPaceBall: Number(previous.abilityToPlayPaceBall || 0),
        abilityToPlaySpinBall: Number(previous.abilityToPlaySpinBall || 0),
        battingAggresion: Number(previous.battingAggresion || 0),
        paceAbility: Number(previous.paceAbility || 0),
        spinAbility: Number(previous.spinAbility || 0),
      };
      const after = {
        abilityToPlayPaceBall: Number(player.abilityToPlayPaceBall || 0),
        abilityToPlaySpinBall: Number(player.abilityToPlaySpinBall || 0),
        battingAggresion: Number(player.battingAggresion || 0),
        paceAbility: Number(player.paceAbility || 0),
        spinAbility: Number(player.spinAbility || 0),
      };
      const delta =
        (after.abilityToPlayPaceBall - before.abilityToPlayPaceBall) +
        (after.abilityToPlaySpinBall - before.abilityToPlaySpinBall) +
        (after.battingAggresion - before.battingAggresion) +
        (after.paceAbility - before.paceAbility) +
        (after.spinAbility - before.spinAbility);

      if (delta !== 0) {
        abilityChangePreview.push({
          team: team.name,
          player: previous,
          before,
          after,
          delta,
        });
      }
    });
  });

  abilityChangePreview.sort((left, right) => Math.abs(right.delta) - Math.abs(left.delta) || left.player.name.localeCompare(right.player.name));

  const careerPlayerStatsList = Object.values(careerPlayerStats || {}).filter((entry) => entry && entry.name);
  const awardsPlayerIndex = buildSeasonPlayerAwardIndex({
    careerDomesticTeams,
    careerPlayerStats,
    careerPlayerProfile,
    currentAge,
  });
  const momAwardsMap = buildMomAwardsMapFromSchedule(careerSchedule);

  return {
    season: careerSeason,
    currentAge,
    standings: careerStandings,
    schedule: careerSchedule,
    topRunScorers: buildTopRunScorers(careerPlayerStatsList),
    topWicketTakers: buildTopWicketTakers(careerPlayerStatsList),
    awards: resolveSeasonAwards(awardsPlayerIndex, momAwardsMap),
    progressionNotes: buildSeasonProgressionNotes(careerPlayerStats),
    abilityChangePreview,
  };
};

const prepareMatchXIAndRoles = (roster = [], lastFixture = null, teamName = '') => {
  const context = buildLastMatchContext(lastFixture, teamName);
  const selectedIds = selectAIPlayingXI({
    roster,
    previousXIIds: context.previousXIIds,
    lastMatchPerformanceById: context.lastMatchPerformanceById,
    lastMatchPerformanceByName: context.lastMatchPerformanceByName,
  });
  const byId = new Map((roster || []).map((player) => [String(player.id), player]));
  const xi = selectedIds.map((id) => byId.get(String(id))).filter(Boolean);
  const xiIds = xi.map((player) => player.id).filter((id) => id !== undefined && id !== null);
  const keeper = xi.find((player) => player?.isWicketKeeper) || xi[0] || null;
  const captain = xi[0] || null;
  const viceCaptain = xi[1] || xi[0] || null;

  return {
    xiIds,
    roles: {
      captainId: captain?.id ?? null,
      viceCaptainId: viceCaptain?.id ?? null,
      wicketKeeperId: keeper?.id ?? null,
    },
  };
};

export const createCareerFlowHandlers = ({
  dispatch,
  gameMode,
  stage,
  careerTeam,
  careerPlayerProfile,
  careerDomesticCountry,
  careerDomesticTeams,
  careerGlobalPlayerPool,
  careerOffers,
  careerRetired,
  careerSeason,
  careerSeasonLength,
  careerMatchIndex,
  careerSchedule,
  careerStandings,
  careerPlayerStats,
  careerSeasonHistory,
  firstBattingSide,
  firstInnings,
  secondInnings,
  firstInningsTeamName,
  secondInningsTeamName,
  resultSummary,
  ownPlayers,
  opponentPlayers,
  ownTeam,
  opponentTeam,
  careerResultCommitSignatureRef,
  setCareerTeamAction,
  setCareerPlayerProfileAction,
  setCareerDomesticCountryAction,
  setCareerDomesticTeamsAction,
  setCareerGlobalPlayerPoolAction,
  setCareerAuctionSummaryAction,
  setCareerOffersAction,
  setCareerRetiredAction,
  setCareerSeasonAction,
  setCareerSeasonLengthAction,
  setCareerFormatAction,
  setCareerMatchIndexAction,
  setCareerScheduleAction,
  setCareerStandingsAction,
  setCareerPlayerStatsAction,
  setCareerSeasonHistoryAction,
  setOwnTeamAction,
  setOpponentTeamAction,
  setLocationCountryAction,
  setSelectedStadiumAction,
  setMatchTypeKeyAction,
  setOwnCustomPlayersAction,
  setOpponentCustomPlayersAction,
  setOwnPlayingXIAction,
  setOpponentPlayingXIAction,
  setOwnTeamRolesAction,
  setOpponentTeamRolesAction,
  setTossWinnerAction,
  setTossDecisionAction,
  setTossCallAction,
  setFirstBattingSideAction,
  setStageAction,
  resetMatchForCareerAction,
  resetMatchRuntimeAction,
  setAutoSimMode,
}) => {
  const launchCareerFixture = (match, nextSchedule, nextStats, nextDomesticTeams = careerDomesticTeams) => {
    if (!match) return;
    const formatKey = resolveMatchTypeKeyForFormat(match.format);
    const domesticByName = (nextDomesticTeams || []).reduce((acc, team) => {
      if (team?.name) {
        acc[team.name] = team;
      }
      return acc;
    }, {});
    const userRoster = Array.isArray(domesticByName[careerTeam]?.players) ? domesticByName[careerTeam].players : [];
    const opponentName = match.teamA === careerTeam ? match.teamB : match.teamA;
    const opponentRoster = Array.isArray(domesticByName[opponentName]?.players) ? domesticByName[opponentName].players : [];
    const fixtureIndex = (nextSchedule || []).findIndex((fixture) => fixture.id === match.id);
    const ownLastFixture = getLatestCompletedFixtureForTeam(nextSchedule, careerTeam, fixtureIndex);
    const opponentLastFixture = getLatestCompletedFixtureForTeam(nextSchedule, opponentName, fixtureIndex);
    const { xiIds: ownXIIds, roles: ownRoles } = prepareMatchXIAndRoles(userRoster, ownLastFixture, careerTeam);
    const { xiIds: opponentXIIds, roles: opponentRoles } = prepareMatchXIAndRoles(
      opponentRoster,
      opponentLastFixture,
      opponentName
    );

    dispatch(setCareerScheduleAction(nextSchedule));
    dispatch(setCareerPlayerStatsAction(nextStats));
    dispatch(setCareerDomesticTeamsAction(nextDomesticTeams));
    dispatch(
      setCareerPlayerProfileAction(
        syncCareerPlayerProfile({
          teams: nextDomesticTeams,
          careerTeam,
          careerPlayerProfile,
        })
      )
    );
    dispatch(setCareerStandingsAction(buildCareerStandings(careerTeam, nextSchedule, nextDomesticTeams)));
    dispatch(setCareerMatchIndexAction(nextSchedule.findIndex((fixture) => fixture.id === match.id)));
    dispatch(resetMatchForCareerAction());
    dispatch(setCareerFormatAction(match.format || 't20'));
    dispatch(setMatchTypeKeyAction(formatKey));
    dispatch(setOwnTeamAction(careerTeam));
    dispatch(setOpponentTeamAction(opponentName));
    dispatch(setLocationCountryAction(careerDomesticCountry || ''));
    dispatch(setSelectedStadiumAction(''));
    dispatch(setTossWinnerAction(''));
    dispatch(setTossDecisionAction(''));
    dispatch(setTossCallAction(''));
    dispatch(setFirstBattingSideAction(''));
    dispatch(setOwnCustomPlayersAction(userRoster));
    dispatch(setOpponentCustomPlayersAction(opponentRoster));
    dispatch(setOwnPlayingXIAction(ownXIIds));
    dispatch(setOpponentPlayingXIAction(opponentXIIds));
    dispatch(setOwnTeamRolesAction(ownRoles));
    dispatch(setOpponentTeamRolesAction(opponentRoles));
    dispatch(setStageAction(matchStatusEnum.TossTime));
  };

  const beginCareer = ({ seasonLength, playerProfile, domesticCountry, domesticTeams, globalPlayerPool, offers, countryList = [] }) => {
    if (!playerProfile?.name || !domesticCountry || !Array.isArray(domesticTeams) || domesticTeams.length < 2) return;

    const normalizedTeams = normalizeDomesticTeams(domesticTeams);
    const createdPlayer = buildCreatedCareerPlayer(playerProfile, domesticCountry);
    const auctionResult = runCareerAuction({
      domesticTeams: normalizedTeams,
      globalPlayerPool,
      countryRows: countryList,
      leagueCountry: domesticCountry,
      careerPlayer: createdPlayer,
    });
    const resolvedCareerTeam = auctionResult.careerTeam || '';
    if (!resolvedCareerTeam) {
      return;
    }

    const updatedTeams = auctionResult.domesticTeams || normalizedTeams;
    const nextPlayerProfile = {
      ...playerProfile,
      playerId: createdPlayer.id,
      abilityToPlayPaceBall: createdPlayer.abilityToPlayPaceBall,
      abilityToPlaySpinBall: createdPlayer.abilityToPlaySpinBall,
      battingAggresion: createdPlayer.battingAggresion,
      paceAbility: createdPlayer.paceAbility,
      spinAbility: createdPlayer.spinAbility,
      isWicketKeeper: createdPlayer.isWicketKeeper,
      playerType: createdPlayer.playerType,
      fitness: createdPlayer.fitness,
      morale: createdPlayer.morale,
      battingOrderCoeff: createdPlayer.battingOrderCoeff,
      currentValue: estimateCareerPlayerMarketValue({
        player: createdPlayer,
        seasonStats: null,
        currentAge: Number(playerProfile?.age || 18),
        currentValue: 0,
      }),
    };

    const schedule = buildAllCountryLeagueSchedules({
      allDomesticTeams: updatedTeams,
      userLeagueCountry: domesticCountry,
      seasonLength: seasonLength || 'standard',
      careerTeam: resolvedCareerTeam,
    });
    const initialStandings = buildCareerStandings(resolvedCareerTeam, schedule, updatedTeams);
    const firstPendingFixtureIndex = schedule.findIndex((fixture) => !fixture.isComplete);

    dispatch(setCareerTeamAction(resolvedCareerTeam));
    dispatch(setCareerPlayerProfileAction(nextPlayerProfile));
    dispatch(setCareerDomesticCountryAction(domesticCountry));
    dispatch(setCareerDomesticTeamsAction(updatedTeams));
    dispatch(setCareerGlobalPlayerPoolAction(auctionResult.globalPlayerPool || []));
    dispatch(setCareerAuctionSummaryAction(auctionResult.auctionSummary || null));
    dispatch(setCareerOffersAction(Array.isArray(offers) ? offers : []));
    dispatch(setCareerRetiredAction(false));
    dispatch(setCareerSeasonAction(1));
    dispatch(setCareerSeasonLengthAction(seasonLength || 'standard'));
    dispatch(setCareerFormatAction('t20'));
    dispatch(setCareerMatchIndexAction(firstPendingFixtureIndex >= 0 ? firstPendingFixtureIndex : 0));
    dispatch(setCareerScheduleAction(schedule));
    dispatch(setCareerStandingsAction(initialStandings));
    dispatch(setCareerPlayerStatsAction({}));
    dispatch(setCareerSeasonHistoryAction([]));
    dispatch(setStageAction(matchStatusEnum.CareerAuction));
  };

  const handleCareerContinueAfterAuction = () => {
    if (!careerTeam || !careerPlayerProfile?.name || !Array.isArray(careerSchedule) || !careerSchedule.length) {
      return;
    }

    const nextMatch = resolveNextCareerMatch(careerSchedule);
    dispatch(setCareerMatchIndexAction(nextMatch ? careerSchedule.findIndex((match) => match.id === nextMatch.id) : 0));
    dispatch(setStageAction(matchStatusEnum.CareerSeasonSchedule));
  };

  const handleCareerStartNextMatch = () => {
    if (careerRetired) return;
    let schedule = [...(careerSchedule || [])];
    if (!schedule.length) return;

    let updatedStats = { ...(careerPlayerStats || {}) };
    let updatedDomesticTeams = careerDomesticTeams;

    let index = schedule.findIndex((match) => !match.isComplete);
    if (index < 0) {
      dispatch(setCareerScheduleAction(schedule));
      dispatch(setCareerPlayerStatsAction(updatedStats));
      dispatch(setCareerDomesticTeamsAction(updatedDomesticTeams));
      dispatch(setCareerStandingsAction(buildCareerStandings(careerTeam, schedule, updatedDomesticTeams)));
      dispatch(setStageAction(matchStatusEnum.CareerSeasonSummary));
      return;
    }

    while (index < schedule.length) {
      const match = schedule[index];
      if (match.isComplete) {
        index += 1;
        continue;
      }

      const isUserFixture = match.isUserMatch || match.teamA === careerTeam || match.teamB === careerTeam;
      if (isUserFixture) {
        launchCareerFixture(match, schedule, updatedStats, updatedDomesticTeams);
        break;
      }

      const previousFixturesByTeam = {
        [match.teamA]: getLatestCompletedFixtureForTeam(schedule, match.teamA, index),
        [match.teamB]: getLatestCompletedFixtureForTeam(schedule, match.teamB, index),
      };

      const { result, updatedStats: statsAfterMatch, updatedDomesticTeams: teamsAfterMatch } = simulateCareerFixture({
        match,
        careerTeam,
        careerPlayerProfile,
        domesticTeams: updatedDomesticTeams,
        existingStats: updatedStats,
        seasonNumber: careerSeason,
        previousFixturesByTeam,
      });
      updatedStats = statsAfterMatch;
      updatedDomesticTeams = teamsAfterMatch;
      schedule[index] = { ...match, isComplete: true, result };
      index += 1;
    }

    const currentPendingIndex = schedule.findIndex((match) => !match.isComplete);
    if (currentPendingIndex >= 0 && schedule[currentPendingIndex]?.isUserMatch) {
      return;
    }

    const nextPendingIndex = schedule.findIndex((match) => !match.isComplete);
    dispatch(setCareerScheduleAction(schedule));
    dispatch(setCareerPlayerStatsAction(updatedStats));
    dispatch(setCareerDomesticTeamsAction(updatedDomesticTeams));
    dispatch(
      setCareerPlayerProfileAction(
        syncCareerPlayerProfile({
          teams: updatedDomesticTeams,
          careerTeam,
          careerPlayerProfile,
        })
      )
    );
    dispatch(setCareerStandingsAction(buildCareerStandings(careerTeam, schedule, updatedDomesticTeams)));
    dispatch(setCareerMatchIndexAction(nextPendingIndex >= 0 ? nextPendingIndex : schedule.length));

    if (nextPendingIndex < 0) {
      const currentAge = (careerPlayerProfile?.age || 18) + Math.max((careerSeason || 1) - 1, 0);
      dispatch(
        setCareerOffersAction(
          buildCareerTransferOffers({
            careerTeam,
            careerDomesticTeams: updatedDomesticTeams,
            careerPlayerProfile,
            careerPlayerStats: updatedStats,
            currentAge,
            careerStandings: buildCareerStandings(careerTeam, schedule, updatedDomesticTeams),
          })
        )
      );
      dispatch(setStageAction(matchStatusEnum.CareerSeasonSummary));
    }
  };

  const commitCareerMatchResult = () => {
    if (gameMode !== MODE_CAREER || stage !== matchStatusEnum.MatchEnd) {
      return { didCommit: false, seasonComplete: false };
    }

    const currentFixtureFromIndex =
      Number.isInteger(careerMatchIndex) && careerMatchIndex >= 0
        ? (careerSchedule || [])[careerMatchIndex]
        : null;
    const hasCurrentTeams =
      !!firstInningsTeamName &&
      !!secondInningsTeamName &&
      [firstInningsTeamName, secondInningsTeamName].every((name) =>
        [currentFixtureFromIndex?.teamA, currentFixtureFromIndex?.teamB].includes(name)
      );

    const pendingUserMatch =
      currentFixtureFromIndex && !currentFixtureFromIndex.isComplete && (currentFixtureFromIndex.isUserMatch || hasCurrentTeams)
        ? currentFixtureFromIndex
        : (careerSchedule || []).find(
            (fixture) =>
              !fixture.isComplete &&
              (fixture.isUserMatch || fixture.teamA === careerTeam || fixture.teamB === careerTeam) &&
              [firstInningsTeamName, secondInningsTeamName].every((name) => [fixture.teamA, fixture.teamB].includes(name))
          ) ||
          (careerSchedule || []).find(
            (fixture) => !fixture.isComplete && (fixture.isUserMatch || fixture.teamA === careerTeam || fixture.teamB === careerTeam)
          );

    if (!pendingUserMatch) {
      return { didCommit: false, seasonComplete: false };
    }

    const signature = [
      pendingUserMatch.id,
      firstInnings.score,
      firstInnings.wickets,
      firstInnings.balls,
      secondInnings.score,
      secondInnings.wickets,
      secondInnings.balls,
      resultSummary,
    ].join('|');
    if (careerResultCommitSignatureRef?.current === signature) {
      const alreadyCompleted = (careerSchedule || []).every((fixture) => fixture.isComplete);
      return { didCommit: false, seasonComplete: alreadyCompleted };
    }

    if (careerResultCommitSignatureRef) {
      careerResultCommitSignatureRef.current = signature;
    }

    let winner = 'Tie';
    if (secondInnings.score > firstInnings.score) {
      winner = secondInningsTeamName;
    } else if (secondInnings.score < firstInnings.score) {
      winner = firstInningsTeamName;
    }

    const scorecard = buildCareerMatchScorecard({
      firstBattingSide,
      ownPlayers,
      opponentPlayers,
      ownTeam,
      opponentTeam,
      firstInnings,
      secondInnings,
      firstInningsTeamName,
      secondInningsTeamName,
    });

    const momShortlist = buildMomRecommendations({
      firstBattingSide,
      ownPlayers,
      opponentPlayers,
      firstInnings,
      secondInnings,
      ownTeam,
      opponentTeam,
      firstInningsTeamName,
      secondInningsTeamName,
      ownSanitizedRoles: {
        captainId: ownPlayers[0]?.id ?? null,
        viceCaptainId: ownPlayers[1]?.id ?? ownPlayers[0]?.id ?? null,
        wicketKeeperId: ownPlayers.find((player) => player.isWicketKeeper)?.id ?? ownPlayers[0]?.id ?? null,
      },
      opponentSanitizedRoles: {
        captainId: opponentPlayers[0]?.id ?? null,
        viceCaptainId: opponentPlayers[1]?.id ?? opponentPlayers[0]?.id ?? null,
        wicketKeeperId: opponentPlayers.find((player) => player.isWicketKeeper)?.id ?? opponentPlayers[0]?.id ?? null,
      },
    });

    const updatedSchedule = (careerSchedule || []).map((fixture) =>
      fixture.id === pendingUserMatch.id
        ? {
            ...fixture,
            isComplete: true,
            result: {
              winner,
              teamAScore: fixture.teamA === firstInningsTeamName ? firstInnings.score : secondInnings.score,
              teamBScore: fixture.teamB === firstInningsTeamName ? firstInnings.score : secondInnings.score,
              teamAWickets: fixture.teamA === firstInningsTeamName ? firstInnings.wickets : secondInnings.wickets,
              teamBWickets: fixture.teamB === firstInningsTeamName ? firstInnings.wickets : secondInnings.wickets,
              summary: resultSummary,
              scorecard,
              momShortlist,
              momAward: momShortlist?.[0] || null,
            },
          }
        : fixture
    );

    const mergedStats = mergePlayerStatsForCurrentMatch({
      existingStats: careerPlayerStats,
      firstBattingSide,
      ownPlayers,
      opponentPlayers,
      ownTeam,
      opponentTeam,
      firstInnings,
      secondInnings,
      matchFormat: pendingUserMatch.format || 't20',
    });
    const ownContributions = buildTeamContributionsFromInnings({
      players: ownPlayers,
      battingStats: firstBattingSide === 'own' ? firstInnings.battingStats : secondInnings.battingStats,
      bowlingStats: firstBattingSide === 'own' ? secondInnings.bowlingStats : firstInnings.bowlingStats,
    });
    const opponentContributions = buildTeamContributionsFromInnings({
      players: opponentPlayers,
      battingStats: firstBattingSide === 'own' ? secondInnings.battingStats : firstInnings.battingStats,
      bowlingStats: firstBattingSide === 'own' ? firstInnings.bowlingStats : secondInnings.bowlingStats,
    });
    const matchContributionsByTeam = {
      [pendingUserMatch.teamA]: pendingUserMatch.teamA === ownTeam ? ownContributions : opponentContributions,
      [pendingUserMatch.teamB]: pendingUserMatch.teamB === ownTeam ? ownContributions : opponentContributions,
    };
    const updatedDomesticTeams = applyDomesticMatchPlayerUpdates({
      domesticTeams: careerDomesticTeams,
      teamAName: pendingUserMatch.teamA,
      teamBName: pendingUserMatch.teamB,
      teamAXIIds: pendingUserMatch.teamA === ownTeam ? ownPlayers.map((player) => player.id) : opponentPlayers.map((player) => player.id),
      teamBXIIds: pendingUserMatch.teamB === ownTeam ? ownPlayers.map((player) => player.id) : opponentPlayers.map((player) => player.id),
      momShortlist,
      matchContributionsByTeam,
    });
    const nextPendingIndex = updatedSchedule.findIndex((fixture) => !fixture.isComplete);
    const seasonComplete = nextPendingIndex < 0;

    dispatch(setCareerScheduleAction(updatedSchedule));
    dispatch(setCareerPlayerStatsAction(mergedStats));
    dispatch(setCareerDomesticTeamsAction(updatedDomesticTeams));
    dispatch(
      setCareerPlayerProfileAction(
        syncCareerPlayerProfile({
          teams: updatedDomesticTeams,
          careerTeam,
          careerPlayerProfile,
        })
      )
    );
    dispatch(setCareerStandingsAction(buildCareerStandings(careerTeam, updatedSchedule, updatedDomesticTeams)));
    dispatch(setCareerMatchIndexAction(seasonComplete ? updatedSchedule.length : nextPendingIndex));

    return { didCommit: true, seasonComplete };
  };

  const handleCareerMatchPrimaryAction = () => {
    if (gameMode !== MODE_CAREER || stage !== matchStatusEnum.MatchEnd) return;
    const { seasonComplete } = commitCareerMatchResult();
    if (seasonComplete) {
      const currentAge = (careerPlayerProfile?.age || 18) + Math.max((careerSeason || 1) - 1, 0);
      dispatch(
        setCareerOffersAction(
          buildCareerTransferOffers({
            careerTeam,
            careerDomesticTeams,
            careerPlayerProfile,
            careerPlayerStats,
            currentAge,
            careerStandings,
          })
        )
      );
      dispatch(setStageAction(matchStatusEnum.CareerSeasonSummary));
      return;
    }
    dispatch(setStageAction(matchStatusEnum.CareerSeasonSchedule));
  };

  const handleStartNextCareerSeason = (options = {}) => {
    if (careerRetired) return;
    const currentAge = (careerPlayerProfile?.age || 18) + Math.max((careerSeason || 1) - 1, 0);
    if (currentAge >= 40) {
      dispatch(setCareerRetiredAction(true));
      dispatch(setStageAction(matchStatusEnum.CareerHistory));
      return;
    }

    const selectedTeamName = typeof options?.selectedTeam === 'string' && options.selectedTeam.trim()
      ? options.selectedTeam.trim()
      : careerTeam;
    const selectedOffer = (careerOffers || []).find((offer) => offer.team === selectedTeamName) || null;

    const seasonEntry = {
      season: careerSeason,
      careerTeam,
      standings: careerStandings,
      schedule: careerSchedule,
      playerAge: currentAge,
      seasonReport: buildEndOfSeasonReport({
        careerTeam,
        careerSeason,
        currentAge,
        careerDomesticTeams,
        careerPlayerStats,
        careerPlayerProfile,
        careerStandings,
        careerSchedule,
      }),
      offseasonDecision: {
        selectedTeam: selectedTeamName,
        acceptedOffer: selectedOffer,
      },
    };
    const updatedHistory = [...(careerSeasonHistory || []), seasonEntry];
    const progressedDomesticTeams = applyEndOfSeasonPlayerAbilityUpdates({
      domesticTeams: careerDomesticTeams,
      careerPlayerStats,
      currentAge,
      careerTeam,
      careerPlayerProfile,
    });
    const transferWindow = applyOffseasonTransferMarket({
      domesticTeams: progressedDomesticTeams,
      careerPlayerProfile,
      careerPlayerStats,
    });
    const movedCareerPlayer = relocateCareerPlayerToTeam({
      domesticTeams: transferWindow.teams,
      currentCareerTeam: careerTeam,
      nextCareerTeam: selectedTeamName,
      careerPlayerProfile,
    });
    const assignmentResult = assignGlobalPoolPlayersToDomesticTeams({
      domesticTeams: movedCareerPlayer.teams,
      globalPlayerPool: careerGlobalPlayerPool,
      countryRows: options?.countryList || [],
    });

    const nextCareerTeamName = movedCareerPlayer.nextCareerTeam || careerTeam;
    const nextLeagueCountry = resolveCareerLeagueCountry({
      teams: assignmentResult.domesticTeams || movedCareerPlayer.teams,
      careerTeam: nextCareerTeamName,
      fallbackCountry: careerDomesticCountry,
    });
    const nextValuation = estimateCareerPlayerMarketValue({
      player: careerPlayerProfile,
      seasonStats: resolveSeasonStatsForPlayer({
        statsLookup: buildCareerStatsLookup(careerPlayerStats),
        teamName: careerTeam,
        playerId: careerPlayerProfile?.playerId,
        playerName: careerPlayerProfile?.name,
      }),
      currentAge,
      currentValue: selectedOffer?.amount || careerPlayerProfile?.currentValue,
      currentTeamPoints: resolveSeasonPointsForTeam(careerStandings, careerTeam),
    });
    const teamsAfterAssignment = assignmentResult.domesticTeams || movedCareerPlayer.teams;
    const newSchedule = buildAllCountryLeagueSchedules({
      allDomesticTeams: teamsAfterAssignment,
      userLeagueCountry: nextLeagueCountry,
      seasonLength: careerSeasonLength,
      careerTeam: nextCareerTeamName,
    });
    const newStandings = buildCareerStandings(nextCareerTeamName, newSchedule, teamsAfterAssignment);
    const firstPendingFixtureIndex = newSchedule.findIndex((fixture) => !fixture.isComplete);

    dispatch(setCareerSeasonHistoryAction(updatedHistory));
    dispatch(setCareerSeasonAction(careerSeason + 1));
    dispatch(setCareerTeamAction(nextCareerTeamName));
    dispatch(setCareerDomesticCountryAction(nextLeagueCountry));
    dispatch(setCareerDomesticTeamsAction(teamsAfterAssignment));
    dispatch(setCareerGlobalPlayerPoolAction(assignmentResult.globalPlayerPool || careerGlobalPlayerPool || []));
    dispatch(setCareerAuctionSummaryAction(null));
    dispatch(setCareerOffersAction([]));
    dispatch(
      setCareerPlayerProfileAction(
        syncCareerPlayerProfile({
          teams: teamsAfterAssignment,
          careerTeam: nextCareerTeamName,
          careerPlayerProfile: {
            ...careerPlayerProfile,
            currentValue: nextValuation,
          },
        })
      )
    );
    dispatch(setCareerScheduleAction(newSchedule));
    dispatch(setCareerStandingsAction(newStandings));
    dispatch(setCareerMatchIndexAction(firstPendingFixtureIndex >= 0 ? firstPendingFixtureIndex : 0));
    dispatch(setCareerPlayerStatsAction({}));
    dispatch(setStageAction(matchStatusEnum.CareerSeasonSchedule));
  };

  const handleRetireCareer = () => {
    dispatch(setCareerRetiredAction(true));
    dispatch(setStageAction(matchStatusEnum.CareerHistory));
  };

  const handleEndCareer = () => {
    setAutoSimMode(null);
    if (careerResultCommitSignatureRef) {
      careerResultCommitSignatureRef.current = '';
    }
    dispatch(resetMatchRuntimeAction());
  };

  const handleViewCareerHistory = () => {
    dispatch(setStageAction(matchStatusEnum.CareerHistory));
  };

  const handleBackToCareerSchedule = () => {
    if (careerRetired) {
      dispatch(setStageAction(matchStatusEnum.CareerHistory));
      return;
    }
    const nextMatch = resolveNextCareerMatch(careerSchedule);
    dispatch(setCareerMatchIndexAction(nextMatch ? careerSchedule.findIndex((match) => match.id === nextMatch.id) : careerSchedule.length));
    dispatch(setStageAction(matchStatusEnum.CareerSeasonSchedule));
  };

  return {
    beginCareer,
    handleCareerContinueAfterAuction,
    handleCareerStartNextMatch,
    commitCareerMatchResult,
    handleCareerMatchPrimaryAction,
    handleStartNextCareerSeason,
    handleRetireCareer,
    handleEndCareer,
    handleViewCareerHistory,
    handleBackToCareerSchedule,
  };
};
