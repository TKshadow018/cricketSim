import { ensurePlayerMeta, shuffleArray } from "./controllerCommonUtils";

import { getDomesticLocationsForCountry } from "../../../gameData/domesticClubLocations";
import { assignPlayerSkills } from "../../../gameData/playerSkills";
import { playerListForNation } from "../../../gameData/playerListForNation";

import { randomInt, AI_PLAYER_TYPE_DISTRIBUTION, buildFakerPlayerData, CLUB_PREFIXES, CLUB_SUFFIXES, DOMESTIC_TEAM_PLAYER_TYPE_COUNTS, DOMESTIC_TEAM_COUNT, toSlug, DEFAULT_GLOBAL_ASSIGN_STEP_PER_TEAM, MIN_LOCAL_PLAYER_RATIO } from "./careerPlayerDataUtils";

import { normalizeCountryRows, resolveDomesticTargetPerTeam, resolveBaseMarketPrice } from "./careerPlayerProgressionUtils";

const pickWeightedAiPlayerType = () => {
  const roll = randomInt(1, 100);
  let cumulative = 0;
  for (let i = 0; i < AI_PLAYER_TYPE_DISTRIBUTION.length; i += 1) {
    cumulative += AI_PLAYER_TYPE_DISTRIBUTION[i].weight;
    if (roll <= cumulative) {
      return AI_PLAYER_TYPE_DISTRIBUTION[i].key;
    }
  }
};

export const createGeneratedDomesticPlayer = ({ id, country, playerType: forcedPlayerType }) => {
  const playerType = forcedPlayerType || pickWeightedAiPlayerType();
  const personData = buildFakerPlayerData(country, playerType);

  return ensurePlayerMeta({
    ...personData,
    id,
    country: country || personData.country || '',
    playerType,
  });
};

const buildDomesticTeamName = (location, index) => {
  const usePrefix = index % 2 === 0;
  if (usePrefix) {
    const prefix = CLUB_PREFIXES[index % CLUB_PREFIXES.length];
    return `${prefix} ${location}`;
  }

  const suffix = CLUB_SUFFIXES[index % CLUB_SUFFIXES.length];
  return `${location} ${suffix}`;
};

const buildDomesticPlayerTypeTargets = (teamCount) =>
  DOMESTIC_TEAM_PLAYER_TYPE_COUNTS.reduce((acc, entry) => {
    acc[entry.type] = entry.count * teamCount;
    return acc;
  }, {});

const createDomesticPlayerPoolByType = ({ country, teamCount, startId }) => {
  const typeTargets = buildDomesticPlayerTypeTargets(teamCount);

  const pools = Object.keys(typeTargets).reduce((acc, playerType) => {
    const totalByType = typeTargets[playerType] || 0;
    const typePlayers = Array.from({ length: totalByType }).map((_, index) =>
      createGeneratedDomesticPlayer({
        id: startId + index,
        country,
        playerType,
      })
    );
    acc[playerType] = shuffleArray(typePlayers);
    startId += totalByType;
    return acc;
  }, {});

  return { pools };
};

export const createDomesticTeamsForCountry = (country, options = {}) => {
  const withPlayers = options.withPlayers !== false;
  const startId = Number(options.startId || 10000);
  const locations = shuffleArray(getDomesticLocationsForCountry(country)).slice(0, DOMESTIC_TEAM_COUNT);
  const { pools } = withPlayers
    ? createDomesticPlayerPoolByType({
      country,
      teamCount: locations.length,
      startId,
    })
    : { pools: {} };

  return locations.map((location, index) => {
    const teamName = buildDomesticTeamName(location, index);
    const players = withPlayers
      ? shuffleArray(
        DOMESTIC_TEAM_PLAYER_TYPE_COUNTS.reduce((acc, entry) => {
          const selected = pools[entry.type]?.splice(0, entry.count) || [];
          acc.push(...selected);
          return acc;
        }, [])
      )
      : [];

    return {
      id: `club-${index + 1}`,
      name: teamName,
      location,
      country,
      players,
    };
  });
};

const assignNationalPlayersToDomesticTeams = (teams, country) => {
  const nationalRoster = Array.isArray(playerListForNation[country]) ? playerListForNation[country] : [];
  if (!teams.length || !nationalRoster.length) {
    return teams;
  }

  const shuffledRoster = shuffleArray([...nationalRoster]);
  const playersByTeam = teams.map(() => []);

  shuffledRoster.forEach((player, playerIndex) => {
    const teamIndex = playerIndex % teams.length;
    const team = teams[teamIndex];
    playersByTeam[teamIndex].push(
      ensurePlayerMeta({
        ...player,
        skills: assignPlayerSkills(player, 2),
        id: `national-${toSlug(country)}-${player.id ?? playerIndex + 1}`,
        country,
        sourceCountry: country,
        isNationalTeamPlayer: true,
        assignedTeamId: team.id,
        assignedTeamName: team.name,
      })
    );
  });

  return teams.map((team, teamIndex) => ({
    ...team,
    players: [...(team.players || []), ...playersByTeam[teamIndex]],
  }));
};

export const createDomesticTeamsForAllCountries = (countryRows = []) => {
  const normalizedCountries = normalizeCountryRows(countryRows);

  return normalizedCountries.flatMap((country, countryIndex) => {
    const teams = createDomesticTeamsForCountry(country.name, { withPlayers: false }).map((team, teamIndex) => ({
      ...team,
      id: `club-${toSlug(country.name)}-${countryIndex + 1}-${teamIndex + 1}`,
      countryRank: Number(country.current_ranking || 999),
      players: [],
    }));

    return assignNationalPlayersToDomesticTeams(teams, country.name);
  });
};

export const createGlobalCareerPlayerPool = (countryRows = []) => {
  const normalizedCountries = normalizeCountryRows(countryRows);
  let nextPlayerId = 500000;

  return normalizedCountries.flatMap((country) => {
    const perTeamTarget = resolveDomesticTargetPerTeam(country.current_ranking);
    const totalCountryPlayers = perTeamTarget * DOMESTIC_TEAM_COUNT;

    return Array.from({ length: totalCountryPlayers }).map(() => {
      const generated = createGeneratedDomesticPlayer({
        id: `gp-${nextPlayerId}`,
        country: country.name,
      });
      nextPlayerId += 1;
      const abilityScore =
        Number(generated.abilityToPlayPaceBall || 0) +
        Number(generated.abilityToPlaySpinBall || 0) +
        Number(generated.battingAggresion || 0) +
        Number(generated.paceAbility || 0) +
        Number(generated.spinAbility || 0);

      return {
        ...generated,
        sourceCountry: country.name,
        countryRank: Number(country.current_ranking || 999),
        baseMarketPrice: resolveBaseMarketPrice(generated),
        abilityScore,
        assignedTeamId: '',
        assignedTeamName: '',
      };
    });
  });
};

const pickUnassignedFromPool = ({ pool = [], count = 0, country = '', exactCountry = false, excludedIds = new Set() }) => {
  if (!count) {
    return [];
  }

  const selected = [];
  for (let index = 0; index < pool.length && selected.length < count; index += 1) {
    const player = pool[index];
    const isUnassigned = !player?.assignedTeamId;
    if (!isUnassigned) {
      continue;
    }

    const playerId = String(player?.id ?? '');
    if (playerId && excludedIds.has(playerId)) {
      continue;
    }

    if (exactCountry && player.country !== country) {
      continue;
    }

    if (!exactCountry && country && player.country === country) {
      continue;
    }

    selected.push(player);
  }

  return selected;
};

export const assignGlobalPoolPlayersToDomesticTeams = ({
  domesticTeams = [],
  globalPlayerPool = [],
  countryRows = [],
  stepPerTeam = DEFAULT_GLOBAL_ASSIGN_STEP_PER_TEAM,
  minimumLocalRatio = MIN_LOCAL_PLAYER_RATIO,
}) => {
  const rankingByCountry = normalizeCountryRows(countryRows).reduce((acc, country) => {
    acc[country.name] = Number(country.current_ranking || 999);
    return acc;
  }, {});

  const pool = shuffleArray((globalPlayerPool || []).map((player) => ({ ...player })));
  const teams = (domesticTeams || []).map((team) => ({
    ...team,
    players: (team.players || []).map((player) => ensurePlayerMeta(player)),
  }));

  const normalizedStep = Math.max(1, Number(stepPerTeam || DEFAULT_GLOBAL_ASSIGN_STEP_PER_TEAM));

  teams.forEach((team) => {
    const rank = Number(rankingByCountry[team.country] || team.countryRank || 999);
    const targetPerTeam = resolveDomesticTargetPerTeam(rank);
    const currentPlayers = Array.isArray(team.players) ? team.players : [];
    const currentCount = currentPlayers.length;
    if (currentCount >= targetPerTeam) {
      return;
    }

    const toAssign = Math.min(normalizedStep, targetPerTeam - currentCount);
    const currentLocal = currentPlayers.filter((player) => player.country === team.country).length;
    const minLocalAfterAssign = Math.ceil((currentCount + toAssign) * minimumLocalRatio);
    const requiredLocalAdds = Math.max(0, minLocalAfterAssign - currentLocal);
    const localPlayers = pickUnassignedFromPool({
      pool,
      count: requiredLocalAdds,
      country: team.country,
      exactCountry: true,
    });
    const selectedIdSet = new Set(localPlayers.map((player) => String(player?.id ?? '')).filter(Boolean));
    const remainingSlots = toAssign - localPlayers.length;
    const foreignPlayers = pickUnassignedFromPool({
      pool,
      count: remainingSlots,
      country: team.country,
      exactCountry: false,
      excludedIds: selectedIdSet,
    });
    foreignPlayers.forEach((player) => {
      const playerId = String(player?.id ?? '');
      if (playerId) {
        selectedIdSet.add(playerId);
      }
    });
    const homeFallback = pickUnassignedFromPool({
      pool,
      count: Math.max(0, remainingSlots - foreignPlayers.length),
      country: team.country,
      exactCountry: true,
      excludedIds: selectedIdSet,
    });

    const selectedPlayers = [...localPlayers, ...foreignPlayers, ...homeFallback]
      .slice(0, toAssign)
      .map((player) => {
        player.assignedTeamId = team.id;
        player.assignedTeamName = team.name;
        return ensurePlayerMeta({
          ...player,
        });
      });

    team.players = [...currentPlayers, ...selectedPlayers];
  });

  return {
    domesticTeams: teams,
    globalPlayerPool: pool,
  };
};
