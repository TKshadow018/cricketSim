import { ensurePlayerMeta } from "./controllerCommonUtils";

import { countries as countryCatalog } from "../../../gameData/countries";

import { TOP_RANKED_COUNTRY_PLAYER_PER_TEAM, BOTTOM_RANKED_COUNTRY_PLAYER_PER_TEAM, formatLabelMap, CAREER_FORMATS, randomInt } from "./careerPlayerDataUtils";

export const normalizeCountryRows = (countryRows = []) => {
  const fromInput = Array.isArray(countryRows) && countryRows.length
    ? countryRows
    : Object.values(countryCatalog || {});

  return fromInput
    .map((country) => {
      if (typeof country === 'string') {
        return {
          name: country,
          current_ranking: Number(countryCatalog?.[country]?.current_ranking || 999),
        };
      }

      return {
        name: country?.name || '',
        current_ranking: Number(country?.current_ranking || 999),
      };
    })
    .filter((country) => country.name)
    .sort((left, right) => left.current_ranking - right.current_ranking);
};

export const resolveDomesticTargetPerTeam = (ranking = 999) =>
  Number(ranking || 999) <= 10
    ? TOP_RANKED_COUNTRY_PLAYER_PER_TEAM
    : BOTTOM_RANKED_COUNTRY_PLAYER_PER_TEAM;

export const resolveBaseMarketPrice = (player = {}) => {
  const batting =
    Number(player.abilityToPlayPaceBall || 0) +
    Number(player.abilityToPlaySpinBall || 0) +
    Number(player.battingAggresion || 0);
  const bowling = Number(player.paceAbility || 0) + Number(player.spinAbility || 0);
  const fitness = Number(player.fitness ?? 100);
  const form = Number(player.form ?? 50);
  const morale = Number(player.morale ?? 50);
  const confidence = Number(player.confidence ?? 50);
  const age = Number(player.age || 25);
  const score = batting * 1.65 + bowling * 1.45 + fitness * 0.22 + form * 0.18 + morale * 0.15 + confidence * 0.15;

  let ageMultiplier = 1;
  if (age <= 21) {
    ageMultiplier = 1.16;
  } else if (age <= 27) {
    ageMultiplier = 1.08;
  } else if (age <= 32) {
    ageMultiplier = 0.98;
  } else {
    ageMultiplier = 0.86;
  }

  const estimated = score * 760 * ageMultiplier;
  return Math.max(80000, Math.round(estimated / 500) * 500);
};

export const formatCareerMatchLabel = (format) => formatLabelMap[format] || String(format || '').toUpperCase();

export const clampMetric = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value || 0)));

export const INJURY_CHANCE_PER_PLAYER = 0.005;

const normalizeRoleType = (player = {}) => String(player?.playerType || '').trim().toLowerCase();

const inferAbilityRole = (player = {}) => {
  if (player?.isWicketKeeper || normalizeRoleType(player).includes('wicketkeeper')) {
    return 'wicketkeeper';
  }

  const type = normalizeRoleType(player);
  if (type.includes('allrounder')) {
    return 'allrounder';
  }
  if (type.includes('bowler') || type.includes('pacer') || type.includes('spinner') || type.includes('spiner')) {
    return 'bowler';
  }

  return 'batsman';
};

const dominantBowlingField = (player = {}) =>
  Number(player?.paceAbility || 0) >= Number(player?.spinAbility || 0) ? 'paceAbility' : 'spinAbility';

const secondaryBowlingField = (player = {}) =>
  dominantBowlingField(player) === 'paceAbility' ? 'spinAbility' : 'paceAbility';

const distributePointsByWeights = (totalPoints, weightedFields = []) => {
  const roundedTotal = Math.round(Number(totalPoints || 0));
  const sign = roundedTotal >= 0 ? 1 : -1;
  const absoluteTotal = Math.abs(roundedTotal);
  const positiveWeights = weightedFields.map((entry) => ({
    field: entry.field,
    weight: Math.max(0, Number(entry.weight || 0)),
  }));
  const weightSum = positiveWeights.reduce((sum, entry) => sum + entry.weight, 0) || 1;

  const allocations = positiveWeights.map((entry) => {
    const exact = (absoluteTotal * entry.weight) / weightSum;
    return {
      field: entry.field,
      value: Math.floor(exact),
      fraction: exact - Math.floor(exact),
    };
  });

  let remainder = absoluteTotal - allocations.reduce((sum, entry) => sum + entry.value, 0);
  allocations.sort((left, right) => right.fraction - left.fraction);
  for (let index = 0; index < allocations.length && remainder > 0; index += 1) {
    allocations[index].value += 1;
    remainder -= 1;
  }

  return allocations.reduce((acc, entry) => {
    acc[entry.field] = (acc[entry.field] || 0) + entry.value * sign;
    return acc;
  }, {});
};

export const applyAbilityDeltaToPlayer = (player = {}, totalDelta = 0) => {
  if (!totalDelta) {
    return player;
  }

  const role = inferAbilityRole(player);
  const dominantField = dominantBowlingField(player);
  const secondaryField = secondaryBowlingField(player);

  let weightedFields;
  if (role === 'batsman' || role === 'wicketkeeper') {
    weightedFields = [
      { field: 'abilityToPlayPaceBall', weight: 26.67 },
      { field: 'abilityToPlaySpinBall', weight: 26.67 },
      { field: 'battingAggresion', weight: 26.67 },
      { field: 'paceAbility', weight: 10 },
      { field: 'spinAbility', weight: 10 },
    ];
  } else if (role === 'bowler') {
    weightedFields = [
      { field: dominantField, weight: 50 },
      { field: secondaryField, weight: 20 },
      { field: 'abilityToPlayPaceBall', weight: 10 },
      { field: 'abilityToPlaySpinBall', weight: 10 },
      { field: 'battingAggresion', weight: 10 },
    ];
  } else {
    weightedFields = [
      { field: dominantField, weight: 30 },
      { field: 'abilityToPlayPaceBall', weight: 15 },
      { field: 'abilityToPlaySpinBall', weight: 15 },
      { field: 'battingAggresion', weight: 15 },
      { field: secondaryField, weight: 25 },
    ];
  }

  const deltas = distributePointsByWeights(totalDelta, weightedFields);
  return {
    ...player,
    abilityToPlayPaceBall: clampMetric(Number(player?.abilityToPlayPaceBall || 0) + Number(deltas.abilityToPlayPaceBall || 0)),
    abilityToPlaySpinBall: clampMetric(Number(player?.abilityToPlaySpinBall || 0) + Number(deltas.abilityToPlaySpinBall || 0)),
    battingAggresion: clampMetric(Number(player?.battingAggresion || 0) + Number(deltas.battingAggresion || 0)),
    paceAbility: clampMetric(Number(player?.paceAbility || 0) + Number(deltas.paceAbility || 0)),
    spinAbility: clampMetric(Number(player?.spinAbility || 0) + Number(deltas.spinAbility || 0)),
  };
};

const buildLeaderboardAbilityBonuses = (careerPlayerStats = {}) => {
  const entries = Object.values(careerPlayerStats || {}).filter((entry) => entry && entry.name);
  const top20 = new Set();
  const top5 = new Set();

  CAREER_FORMATS.forEach((format) => {
    const players = entries
      .map((entry) => {
        const formatEntry = entry.formatStats?.[format];
        if (!formatEntry) {
          return null;
        }

        return {
          key: entry.key,
          runs: Number(formatEntry.runs || 0),
          wickets: Number(formatEntry.wickets || 0),
          balls: Number(formatEntry.balls || 0),
          runsConceded: Number(formatEntry.runsConceded || 0),
          matches: Number(formatEntry.matches || 0),
          name: entry.name,
        };
      })
      .filter(Boolean)
      .filter((entry) => entry.matches > 0 || entry.runs > 0 || entry.wickets > 0);

    const topScorers = [...players]
      .sort((left, right) => right.runs - left.runs || left.balls - right.balls || left.name.localeCompare(right.name))
      .slice(0, 20);
    const topWicketTakers = [...players]
      .sort((left, right) => right.wickets - left.wickets || left.runsConceded - right.runsConceded || left.name.localeCompare(right.name))
      .slice(0, 20);

    const absorbRanking = (list = []) => {
      list.forEach((entry, index) => {
        if (!entry?.key) {
          return;
        }
        top20.add(entry.key);
        if (index < 5) {
          top5.add(entry.key);
        }
      });
    };

    absorbRanking(topScorers);
    absorbRanking(topWicketTakers);
  });

  return { top20, top5 };
};

const randomAgeDelta = (age = 25) => {
  const numericAge = Number(age || 25);
  if (numericAge <= 20) {
    return randomInt(5, 15);
  }
  if (numericAge <= 28) {
    return randomInt(3, 10);
  }
  if (numericAge <= 34) {
    return randomInt(-5, 5);
  }
  return randomInt(-25, -15);
};

export const applyEndOfSeasonPlayerAbilityUpdates = ({
  domesticTeams = [],
  careerPlayerStats = {},
  currentAge = 25,
  careerTeam = '',
  careerPlayerProfile = null,
}) => {
  const leaderboardBonuses = buildLeaderboardAbilityBonuses(careerPlayerStats);
  const careerPlayerId = careerPlayerProfile?.playerId ? String(careerPlayerProfile.playerId) : null;
  const careerPlayerName = careerPlayerProfile?.name ? String(careerPlayerProfile.name) : null;

  return (domesticTeams || []).map((team) => ({
    ...team,
    players: (team.players || []).map((player) => {
      const normalized = ensurePlayerMeta(player);
      const isCareerPlayer =
        team.name === careerTeam &&
        ((careerPlayerId && String(normalized.id) === careerPlayerId) || (careerPlayerName && normalized.name === careerPlayerName));
      const playerAge = isCareerPlayer ? currentAge : Number(normalized.age || 25);
      const key = `${team.name}::${normalized.id ?? ''}::${normalized.name || ''}`;
      const leaderboardBonus = (leaderboardBonuses.top20.has(key) ? 3 : 0) + (leaderboardBonuses.top5.has(key) ? 3 : 0);
      const seasonDelta = randomAgeDelta(playerAge) + leaderboardBonus;

      return applyAbilityDeltaToPlayer(normalized, seasonDelta);
    }),
  }));
};
