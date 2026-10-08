import {
  buildScorecard,
  ensurePlayerMeta,
  formatOvers,
  selectAIPlayingXI,
  shuffleArray,
} from './controllerCommonUtils';
import { buildMomShortlistFromScorecards } from './controllerMomUtils';
import { getDomesticLocationsForCountry } from '../../../gameData/domesticClubLocations';
import { countries as countryCatalog } from '../../../gameData/countries';
import * as countryPersonNames from '../../../gameData/countryPersonNames';
import { createPerson } from 'faker-user';

const FAKER_USER_COUNTRY_MAP = {
  Afghanistan: 'Afghanistan',
  Australia: 'Australia',
  Bangladesh: 'Bangladesh',
  Canada: 'Canada',
  England: 'England',
  India: 'India',
  Ireland: 'Ireland',
  Kenya: 'Kenya',
  Namibia: 'SouthAfrica',
  Nepal: 'Nepal',
  Netherlands: 'Netherlands',
  'New Zealand': 'NewZealand',
  Oman: 'Oman',
  Pakistan: 'Pakistan',
  Scotland: 'Scotland',
  'South Africa': 'SouthAfrica',
  'Sri Lanka': 'SriLanka',
  UAE: 'UAE',
  'West Indies': 'WestIndies',
  Zimbabwe: 'Zimbabwe',
};

const COUNTRY_STAT_MODIFIERS = {
  India: 5,
  Australia: 3,
  'South Africa': 3,
  England: 2,
  Pakistan: 2,
  'Sri Lanka': 2,
  'New Zealand': 2,
  'West Indies': 1,
  Bangladesh: 3,
  Afghanistan: -2,
  Ireland: -3,
  Scotland: -5,
  Netherlands: -5,
  Oman: -10,
  UAE: -10,
  Canada: -10,
  Kenya: -7,
  Namibia: -8,
  Nepal: -5,
  Zimbabwe: -4,
};

const resolveFakerUserCountry = (country = '') => {
  const normalized = String(country || '').trim();
  const fakerCountry = FAKER_USER_COUNTRY_MAP[normalized];
  return fakerCountry ? [fakerCountry] : null;
};

const buildFallbackPlayerName = (country) => {
  const pools = resolveCountryNamePools(country);
  return `${randomFrom(pools.firstNames)} ${randomFrom(pools.lastNames)}`;
};

const buildFakerCustomAttributes = (playerType, country = '') => {
  const getRange = (min, max) => ({ min, max });
  const countryModifier = COUNTRY_STAT_MODIFIERS[country] || 0;
  
  const stats = {
    batsman: {
      abilityToPlayPaceBall: getRange(30 + countryModifier, 80 + countryModifier),
      abilityToPlaySpinBall: getRange(30 + countryModifier, 80 + countryModifier),
      battingAggresion: getRange(40 + countryModifier, 90 + countryModifier),
      paceAbility: getRange(8 + countryModifier, 15 + countryModifier),
      spinAbility: getRange(8 + countryModifier, 15 + countryModifier),
      isWicketKeeper: false,
    },
    'bowler spinner': {
      abilityToPlayPaceBall: getRange(8 + countryModifier, 15 + countryModifier),
      abilityToPlaySpinBall: getRange(8 + countryModifier, 15 + countryModifier),
      battingAggresion: getRange(10 + countryModifier, 80 + countryModifier),
      paceAbility: getRange(8 + countryModifier, 15 + countryModifier),
      spinAbility: getRange(30 + countryModifier, 80 + countryModifier),
      isWicketKeeper: false,
    },
    'bowler pacer': {
      abilityToPlayPaceBall: getRange(8 + countryModifier, 15 + countryModifier),
      abilityToPlaySpinBall: getRange(8 + countryModifier, 15 + countryModifier),
      battingAggresion: getRange(10 + countryModifier, 80 + countryModifier),
      paceAbility: getRange(30 + countryModifier, 80 + countryModifier),
      spinAbility: getRange(8 + countryModifier, 15 + countryModifier),
      isWicketKeeper: false,
    },
    wicketkeeper: {
      abilityToPlayPaceBall: getRange(35 + countryModifier, 75 + countryModifier),
      abilityToPlaySpinBall: getRange(35 + countryModifier, 75 + countryModifier),
      battingAggresion: getRange(40 + countryModifier, 80 + countryModifier),
      paceAbility: getRange(8 + countryModifier, 15 + countryModifier),
      spinAbility: getRange(8 + countryModifier, 15 + countryModifier),
      isWicketKeeper: true,
    },
    'pace allrounder': {
      abilityToPlayPaceBall: getRange(30 + countryModifier, 70 + countryModifier),
      abilityToPlaySpinBall: getRange(30 + countryModifier, 70 + countryModifier),
      battingAggresion: getRange(30 + countryModifier, 80 + countryModifier),
      paceAbility: getRange(30 + countryModifier, 75 + countryModifier),
      spinAbility: getRange(8 + countryModifier, 15 + countryModifier),
      isWicketKeeper: false,
    },
    'spin allrounder': {
      abilityToPlayPaceBall: getRange(30 + countryModifier, 70 + countryModifier),
      abilityToPlaySpinBall: getRange(30 + countryModifier, 70 + countryModifier),
      battingAggresion: getRange(30 + countryModifier, 80 + countryModifier),
      paceAbility: getRange(8 + countryModifier, 15 + countryModifier),
      spinAbility: getRange(30 + countryModifier, 75 + countryModifier),
      isWicketKeeper: false,
    },
  };
  const playerStats = stats[playerType] || stats.batsman;
  return [
    { field: 'abilityToPlayPaceBall', type: 'integer', min: playerStats.abilityToPlayPaceBall.min, max: playerStats.abilityToPlayPaceBall.max },
    { field: 'abilityToPlaySpinBall', type: 'integer', min: playerStats.abilityToPlaySpinBall.min, max: playerStats.abilityToPlaySpinBall.max },
    { field: 'battingAggresion', type: 'integer', min: playerStats.battingAggresion.min, max: playerStats.battingAggresion.max },
    { field: 'paceAbility', type: 'integer', min: playerStats.paceAbility.min, max: playerStats.paceAbility.max },
    { field: 'spinAbility', type: 'integer', min: playerStats.spinAbility.min, max: playerStats.spinAbility.max },
    { field: 'isWicketKeeper', type: 'fixed', value: playerStats.isWicketKeeper },
    { field: 'battingOrderCoeff', type: 'integer', min: 1, max: 100 },
    { field: 'fitness', type: 'integer', min: 75, max: 100 },
    { field: 'morale', type: 'integer', min: 40, max: 60 },
    { field: 'form', type: 'integer', min: 45, max: 60 },
    { field: 'confidence', type: 'integer', min: 45, max: 60 },
  ];
};

const buildFakerPlayerData = (country, playerType) => {
  const fakerCountry = resolveFakerUserCountry(country);
  const custom = buildFakerCustomAttributes(playerType, country);
  const fallbackName = buildFallbackPlayerName(country);

  try {
    const person = createPerson({ country: fakerCountry || undefined, minAge: 17, maxAge: 38, gender: 'male', custom });
    return {
      ...person,
      country: country || person.country || '',
    };
  } catch (error) {
    const person = createPerson({ minAge: 17, maxAge: 38, gender: 'male', custom });
    return {
      ...person,
      country: country || person.country || '',
      name: fallbackName,
    };
  }
};

export const CAREER_SEASON_LENGTHS = {
  short: 1,
  standard: 2,
  full: 3,
};

export const CAREER_FORMATS = ['t20', 'odi', 'firstClass'];
const DOMESTIC_TEAM_COUNT = 12;
const TOP_RANKED_COUNTRY_PLAYER_PER_TEAM = 35;
const BOTTOM_RANKED_COUNTRY_PLAYER_PER_TEAM = 25;
const DEFAULT_GLOBAL_ASSIGN_STEP_PER_TEAM = 12;
const MIN_LOCAL_PLAYER_RATIO = 0.75;
const DOMESTIC_TEAM_PLAYER_TYPE_COUNTS = [
  { type: 'batsman', count: 8 },
  { type: 'wicketkeeper', count: 3 },
  { type: 'bowler spinner', count: 2 },
  { type: 'bowler pacer', count: 4 },
  { type: 'spin allrounder', count: 3 },
  { type: 'pace allrounder', count: 3 },
];
const DEFAULT_FIRST_NAMES = ['Aarav', 'Vihaan', 'Arjun', 'Rehan', 'Kabir', 'Ishan', 'Zayan', 'Rohan', 'Dev', 'Sam'];
const DEFAULT_LAST_NAMES = ['Sharma', 'Khan', 'Patel', 'Singh', 'Rao', 'Das', 'Ali', 'Nair', 'Kumar', 'Roy'];
const COUNTRY_NAME_POOLS = {
  Afghanistan: {
    firstNames: countryPersonNames.AfghanistanFirstNames,
    lastNames: countryPersonNames.AfghanistanLastNames,
  },
  Australia: {
    firstNames: countryPersonNames.AustraliaFirstNames,
    lastNames: countryPersonNames.AustraliaLastNames,
  },
  Bangladesh: {
    firstNames: countryPersonNames.BangladeshFirstNames,
    lastNames: countryPersonNames.BangladeshLastNames,
  },
  Canada: {
    firstNames: countryPersonNames.CanadaFirstNames,
    lastNames: countryPersonNames.CanadaLastNames,
  },
  England: {
    firstNames: countryPersonNames.EnglandFirstNames,
    lastNames: countryPersonNames.EnglandLastNames,
  },
  India: {
    firstNames: countryPersonNames.IndiaFirstNames,
    lastNames: countryPersonNames.IndiaLastNames,
  },
  Ireland: {
    firstNames: countryPersonNames.IrelandFirstNames,
    lastNames: countryPersonNames.IrelandLastNames,
  },
  Kenya: {
    firstNames: countryPersonNames.KenyaFirstNames,
    lastNames: countryPersonNames.KenyaLastNames,
  },
  Namibia: {
    firstNames: countryPersonNames.NamibiaFirstNames,
    lastNames: countryPersonNames.NamibiaLastNames,
  },
  Nepal: {
    firstNames: countryPersonNames.NepalFirstNames,
    lastNames: countryPersonNames.NepalLastNames,
  },
  Netherlands: {
    firstNames: countryPersonNames.NetherlandsFirstNames,
    lastNames: countryPersonNames.NetherlandsLastNames,
  },
  'New Zealand': {
    firstNames: countryPersonNames.NewZealandFirstNames,
    lastNames: countryPersonNames.NewZealandLastNames,
  },
  Oman: {
    firstNames: countryPersonNames.OmanFirstNames,
    lastNames: countryPersonNames.OmanLastNames,
  },
  Pakistan: {
    firstNames: countryPersonNames.PakistanFirstNames,
    lastNames: countryPersonNames.PakistanLastNames,
  },
  Scotland: {
    firstNames: countryPersonNames.ScotlandFirstNames,
    lastNames: countryPersonNames.ScotlandLastNames,
  },
  'South Africa': {
    firstNames: countryPersonNames.SouthAfricaFirstNames,
    lastNames: countryPersonNames.SouthAfricaLastNames,
  },
  'Sri Lanka': {
    firstNames: countryPersonNames.SriLankaFirstNames,
    lastNames: countryPersonNames.SriLankaLastNames,
  },
  UAE: {
    firstNames: countryPersonNames.UAEFirstNames,
    lastNames: countryPersonNames.UAELastNames,
  },
  'West Indies': {
    firstNames: countryPersonNames.WestIndiesFirstNames,
    lastNames: countryPersonNames.WestIndiesLastNames,
  },
  Zimbabwe: {
    firstNames: countryPersonNames.ZimbabweFirstNames,
    lastNames: countryPersonNames.ZimbabweLastNames,
  },
};
const CLUB_PREFIXES = [
  'Crimson',
  'Azure',
  'Golden',
  'Silver',
  'Royal',
  'Regal',
  'Mighty',
  'Rapid',
  'Thunder',
  'Lightning',
  'Blazing',
  'Flying',
  'Rising',
  'Iron',
  'Steel',
  'Emerald',
  'Scarlet',
  'Sapphire',
  'Diamond',
  'Obsidian',
  'Solar',
  'Lunar',
  'Cosmic',
  'Stellar',
  'Imperial',
  'Supreme',
  'Prime',
  'Elite',
  'Brave',
  'Fearless',
  'Valiant',
  'Grand',
  'Noble',
  'Swift',
  'Turbo',
  'Dynamic',
  'Turbocharged',
  'Fierce',
  'Bold',
  'Vibrant',
  'Radiant',
  'Shadow',
  'Phantom',
  'Arctic',
  'Desert',
  'Oceanic',
  'Forest',
  'Mountain',
  'River',
  'Frontier',
];
const CLUB_SUFFIXES = [
  'Titans',
  'Royals',
  'Warriors',
  'Strikers',
  'Blazers',
  'Falcons',
  'Knights',
  'Storm',
  'Giants',
  'Rangers',
  'Chargers',
  'Panthers',
  'Wolves',
  'Eagles',
  'Sharks',
  'Cobras',
  'Lions',
  'Tigers',
  'Dragons',
  'Raiders',
  'Gladiators',
  'Dynamos',
  'Cyclones',
  'Comets',
  'Mavericks',
  'Sentinels',
  'Guardians',
  'Invincibles',
  'Pirates',
  'Spartans',
  'Vikings',
  'Jets',
  'Hawks',
  'Phoenix',
  'Mariners',
  'Legends',
  'Stars',
  'Thunderbolts',
  'Trailblazers',
  'Firebirds',
  'Titans XI',
  'Kings',
  'Queens',
  'Defenders',
  'Outlaws',
  'Mustangs',
  'Bulls',
  'Stallions',
  'Voyagers',
  'Pioneers',
];
const AI_PLAYER_TYPE_DISTRIBUTION = [
  { key: 'batsman', weight: 35 },
  { key: 'bowler spinner', weight: 10 },
  { key: 'bowler pacer', weight: 15 },
  { key: 'wicketkeeper', weight: 15 },
  { key: 'pace allrounder', weight: 10 },
  { key: 'spin allrounder', weight: 15 },
];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFrom = (list) => list[randomInt(0, list.length - 1)];
const formatLabelMap = { t20: 'T20', odi: 'ODI', firstClass: 'First Class' };

const toSlug = (value = '') =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const normalizeCountryRows = (countryRows = []) => {
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

const resolveDomesticTargetPerTeam = (ranking = 999) =>
  Number(ranking || 999) <= 10
    ? TOP_RANKED_COUNTRY_PLAYER_PER_TEAM
    : BOTTOM_RANKED_COUNTRY_PLAYER_PER_TEAM;

const resolveBaseMarketPrice = (player = {}) => {
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

const resolveCountryNamePools = (country) => COUNTRY_NAME_POOLS[country] || {
  firstNames: DEFAULT_FIRST_NAMES,
  lastNames: DEFAULT_LAST_NAMES,
};

export const formatCareerMatchLabel = (format) => formatLabelMap[format] || String(format || '').toUpperCase();

const clampMetric = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value || 0)));
const INJURY_CHANCE_PER_PLAYER = 0.005;

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
  if (!roundedTotal || !weightedFields.length) {
    return {};
  }

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

const applyAbilityDeltaToPlayer = (player = {}, totalDelta = 0) => {
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

const pickWeightedAiPlayerType = () => {
  const roll = randomInt(1, 100);
  let cumulative = 0;
  for (let i = 0; i < AI_PLAYER_TYPE_DISTRIBUTION.length; i += 1) {
    cumulative += AI_PLAYER_TYPE_DISTRIBUTION[i].weight;
    if (roll <= cumulative) {
      return AI_PLAYER_TYPE_DISTRIBUTION[i].key;
    }
  }
  return 'batsman';
};

export const createGeneratedDomesticPlayer = ({ id, country, playerType: forcedPlayerType }) => {
  const playerType = forcedPlayerType || pickWeightedAiPlayerType();
  const personData = buildFakerPlayerData(country, playerType);

  return ensurePlayerMeta({
    ...personData,
    id,
    country,
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

export const createDomesticTeamsForAllCountries = (countryRows = []) => {
  const normalizedCountries = normalizeCountryRows(countryRows);

  return normalizedCountries.flatMap((country, countryIndex) =>
    createDomesticTeamsForCountry(country.name, { withPlayers: false }).map((team, teamIndex) => ({
      ...team,
      id: `club-${toSlug(country.name)}-${countryIndex + 1}-${teamIndex + 1}`,
      countryRank: Number(country.current_ranking || 999),
      players: [],
    }))
  );
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
    if (!toAssign) {
      return;
    }

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

const AUCTION_DOMESTIC_POOL_RATIO = 0.85;
const AUCTION_FOREIGN_POOL_RATIO = 0.15;
const AUCTION_EQUAL_TEAM_BUDGET = 4200000;
const AUCTION_MIN_DOMESTIC_PER_TEAM = 15;
const AUCTION_MAX_DOMESTIC_PER_TEAM = 20;
const AUCTION_MIN_FOREIGN_PER_TEAM = 5;
const AUCTION_MAX_FOREIGN_PER_TEAM = 8;
const AUCTION_MIN_WICKETKEEPERS = 2;
const AUCTION_MIN_BOWLING_PROFILE = 10;
const AUCTION_MIN_BATTING_PROFILE = 12;

const isAuctionWicketkeeper = (player = {}) => {
  const type = String(player?.playerType || '').toLowerCase();
  return Boolean(player?.isWicketKeeper) || type.includes('wicketkeeper');
};

const isAuctionAllrounder = (player = {}) => String(player?.playerType || '').toLowerCase().includes('allrounder');

const isAuctionBowlingProfile = (player = {}) => {
  const type = String(player?.playerType || '').toLowerCase();
  return isAuctionAllrounder(player) || type.includes('bowler') || type.includes('pacer') || type.includes('spinner') || type.includes('spiner');
};

const isAuctionBattingProfile = (player = {}) => {
  const type = String(player?.playerType || '').toLowerCase();
  return isAuctionAllrounder(player) || type.includes('batsman');
};

const updateAuctionRoleCounts = (team, player) => {
  if (isAuctionWicketkeeper(player)) {
    team.roleCounts.wicketkeepers += 1;
  }
  if (isAuctionBowlingProfile(player)) {
    team.roleCounts.bowling += 1;
  }
  if (isAuctionBattingProfile(player)) {
    team.roleCounts.batting += 1;
  }
};

const getAuctionRoleDeficits = (team) => ({
  wicketkeepers: Math.max(0, AUCTION_MIN_WICKETKEEPERS - Number(team?.roleCounts?.wicketkeepers || 0)),
  bowling: Math.max(0, AUCTION_MIN_BOWLING_PROFILE - Number(team?.roleCounts?.bowling || 0)),
  batting: Math.max(0, AUCTION_MIN_BATTING_PROFILE - Number(team?.roleCounts?.batting || 0)),
});

const playerHelpsAuctionDeficit = (team, player) => {
  const deficits = getAuctionRoleDeficits(team);
  return Boolean(
    (deficits.wicketkeepers > 0 && isAuctionWicketkeeper(player)) ||
    (deficits.bowling > 0 && isAuctionBowlingProfile(player)) ||
    (deficits.batting > 0 && isAuctionBattingProfile(player))
  );
};

const countOpenAuctionDeficitTypes = (team) => {
  const deficits = getAuctionRoleDeficits(team);
  return [deficits.wicketkeepers, deficits.bowling, deficits.batting].filter((value) => value > 0).length;
};

const canTeamSpendOnAuctionPlayer = (team, player) => {
  const remainingSlots = Math.max(0, Number(team?.squadTarget || 0) - Number(team?.players?.length || 0));
  const openDeficitTypes = countOpenAuctionDeficitTypes(team);

  if (openDeficitTypes <= 0) {
    return true;
  }

  if (!playerHelpsAuctionDeficit(team, player)) {
    return false;
  }

  if (remainingSlots <= openDeficitTypes) {
    return true;
  }

  return true;
};

const resolveAuctionNeedScore = ({ team, player }) => {
  const { wicketkeepers: wkDeficit, bowling: bowlDeficit, batting: batDeficit } = getAuctionRoleDeficits(team);
  const totalDeficit = wkDeficit + bowlDeficit + batDeficit;

  const helpsWk = isAuctionWicketkeeper(player);
  const helpsBowling = isAuctionBowlingProfile(player);
  const helpsBatting = isAuctionBattingProfile(player);

  const rolePressure =
    (wkDeficit > 0 && helpsWk ? 0.44 : 0) +
    (bowlDeficit > 0 && helpsBowling ? 0.42 : 0) +
    (batDeficit > 0 && helpsBatting ? 0.42 : 0);
  const deficitPenalty = totalDeficit > 0 && !(helpsWk || helpsBowling || helpsBatting) ? 0.32 : 0;
  const domesticNeed = Math.max(0, team.domesticTarget - team.domesticCount) / Math.max(1, team.domesticTarget);
  const foreignNeed = Math.max(0, team.foreignTarget - team.foreignCount) / Math.max(1, team.foreignTarget);

  const hardConstraintBoost = playerHelpsAuctionDeficit(team, player) && totalDeficit > 0 ? 0.35 : 0;

  return rolePressure + hardConstraintBoost + domesticNeed * 0.22 + foreignNeed * 0.18 - deficitPenalty;
};

const resolveUniqueBidAmount = ({ amount, minBid, maxBid, usedAmounts = new Set(), seed = 0 }) => {
  const safeMin = Number(minBid || 0);
  const safeMax = Number(maxBid || 0);
  const startingPoint = Math.max(safeMin, Math.min(safeMax, Math.round(Number(amount || safeMin) / 100) * 100));
  const offsets = [0];
  for (let step = 1; step <= 24; step += 1) {
    offsets.push(step * 100);
    offsets.push(-step * 100);
  }

  for (let index = 0; index < offsets.length; index += 1) {
    const candidate = startingPoint + offsets[(seed + index) % offsets.length];
    if (candidate >= safeMin && candidate <= safeMax && !usedAmounts.has(candidate)) {
      return candidate;
    }
  }

  for (let fallback = safeMin; fallback <= safeMax; fallback += 100) {
    if (!usedAmounts.has(fallback)) {
      return fallback;
    }
  }

  return startingPoint;
};

export const runCareerAuction = ({
  domesticTeams = [],
  globalPlayerPool = [],
  countryRows = [],
  leagueCountry = '',
  careerPlayer = null,
  maxSummaryEvents = 140,
}) => {
  const rankingByCountry = normalizeCountryRows(countryRows).reduce((acc, country) => {
    acc[country.name] = Number(country.current_ranking || 999);
    return acc;
  }, {});

  const leagueTeams = (domesticTeams || []).filter((team) => !leagueCountry || team.country === leagueCountry);
  const nonLeagueTeams = (domesticTeams || []).filter((team) => !leagueTeams.find((leagueTeam) => leagueTeam.id === team.id));

  const teams = leagueTeams.map((team) => {
    const domesticTarget = randomInt(AUCTION_MIN_DOMESTIC_PER_TEAM, AUCTION_MAX_DOMESTIC_PER_TEAM);
    const foreignTarget = randomInt(AUCTION_MIN_FOREIGN_PER_TEAM, AUCTION_MAX_FOREIGN_PER_TEAM);
    const squadTarget = domesticTarget + foreignTarget;

    return {
      ...team,
      players: [],
      countryRank: Number(rankingByCountry[team.country] || team.countryRank || 999),
      domesticTarget,
      foreignTarget,
      squadTarget,
      domesticCount: 0,
      foreignCount: 0,
      roleCounts: {
        wicketkeepers: 0,
        bowling: 0,
        batting: 0,
      },
      budgetStart: AUCTION_EQUAL_TEAM_BUDGET,
      budget: AUCTION_EQUAL_TEAM_BUDGET,
      spent: 0,
      signings: 0,
    };
  });

  const poolWithMeta = (globalPlayerPool || []).map((player) => {
    const normalized = ensurePlayerMeta(player);
    const abilityScore = Number(
      player?.abilityScore ||
      normalized.abilityToPlayPaceBall +
        normalized.abilityToPlaySpinBall +
        normalized.battingAggresion +
        normalized.paceAbility +
        normalized.spinAbility
    );
    return {
      ...normalized,
      sourceCountry: player?.sourceCountry || normalized.country,
      countryRank: Number(player?.countryRank || rankingByCountry[normalized.country] || 999),
      baseMarketPrice: Number(player?.baseMarketPrice || resolveBaseMarketPrice(normalized)),
      abilityScore,
      assignedTeamId: '',
      assignedTeamName: '',
      isCareerPlayer: false,
    };
  });

  if (careerPlayer?.id) {
    poolWithMeta.push({
      ...ensurePlayerMeta(careerPlayer),
      sourceCountry: careerPlayer.country || leagueCountry,
      countryRank: Number(rankingByCountry[careerPlayer.country] || rankingByCountry[leagueCountry] || 999),
      baseMarketPrice: Number(resolveBaseMarketPrice(careerPlayer) * 1.18),
      abilityScore:
        Number(careerPlayer.abilityToPlayPaceBall || 0) +
        Number(careerPlayer.abilityToPlaySpinBall || 0) +
        Number(careerPlayer.battingAggresion || 0) +
        Number(careerPlayer.paceAbility || 0) +
        Number(careerPlayer.spinAbility || 0),
      assignedTeamId: '',
      assignedTeamName: '',
      isCareerPlayer: true,
    });
  }

  const domesticPoolCandidates = shuffleArray(
    poolWithMeta.filter((player) => !player.isCareerPlayer && player.country === leagueCountry)
  );
  const foreignPoolCandidates = shuffleArray(
    poolWithMeta.filter((player) => !player.isCareerPlayer && player.country !== leagueCountry)
  );
  const totalSlots = teams.reduce((sum, team) => sum + team.squadTarget, 0);
  const desiredDomesticCount = Math.max(teams.length, Math.round(totalSlots * AUCTION_DOMESTIC_POOL_RATIO));
  const desiredForeignCount = Math.max(teams.length, Math.round(totalSlots * AUCTION_FOREIGN_POOL_RATIO));

  const selectedDomestic = domesticPoolCandidates.slice(0, Math.min(domesticPoolCandidates.length, desiredDomesticCount));
  const selectedForeign = foreignPoolCandidates.slice(0, Math.min(foreignPoolCandidates.length, desiredForeignCount));
  const selectedPoolIds = new Set([...selectedDomestic, ...selectedForeign].map((player) => String(player.id)));
  const reservePool = shuffleArray(
    poolWithMeta.filter((player) => !player.isCareerPlayer && !selectedPoolIds.has(String(player.id)))
  );

  let auctionPool = shuffleArray([...selectedDomestic, ...selectedForeign]);
  if (careerPlayer?.id) {
    const careerEntry = poolWithMeta.find((player) => String(player.id) === String(careerPlayer.id));
    if (careerEntry) {
      auctionPool = [careerEntry, ...auctionPool];
    }
  }

  const auctionTimeline = [];
  const allTeamsFilled = () => teams.every((team) => team.players.length >= team.squadTarget);

  const runNomination = (player, nominationIndex) => {
    if (!player || allTeamsFilled()) {
      return;
    }

    const basePrice = Math.max(70000, Number(player.baseMarketPrice || 80000));
    const minBid = Math.round((basePrice * 0.7) / 500) * 500;
    const maxBid = Math.round((basePrice * 1.3) / 500) * 500;
    const abilityScore = Number(player.abilityScore || 0);
    const demandBonus = abilityScore >= 305 ? 0.34 : abilityScore >= 280 ? 0.2 : abilityScore >= 250 ? 0.08 : 0;
    const isElite = abilityScore >= 310;
    const isTop = abilityScore >= 285;
    const isSolid = abilityScore >= 245;
    const targetBidderCount = isElite
      ? randomInt(Math.min(5, teams.length), Math.min(10, teams.length))
      : isTop
        ? randomInt(Math.min(2, teams.length), Math.min(6, teams.length))
        : isSolid
          ? randomInt(0, Math.min(4, teams.length))
          : randomInt(0, Math.min(2, teams.length));
    const minimumCareerBidderCount = player?.isCareerPlayer ? 1 : 0;
    const effectiveBidderCount = Math.max(minimumCareerBidderCount, targetBidderCount);

    if (effectiveBidderCount <= 0) {
      auctionTimeline.push({
        index: nominationIndex,
        playerId: player.id,
        playerName: player.name,
        playerType: player.playerType || '',
        playerCountry: player.country,
        abilityScore,
        basePrice,
        basePriceLabel: `$${Number(basePrice || 0).toLocaleString('en-US')}`,
        isWicketkeeperProfile: isAuctionWicketkeeper(player),
        isBowlingProfile: isAuctionBowlingProfile(player),
        isBattingProfile: isAuctionBattingProfile(player),
        winnerTeam: '',
        winnerCountry: '',
        amount: 0,
        amountLabel: '',
        isSold: false,
        isCareerPlayer: !!player.isCareerPlayer,
        bids: [],
      });
      return;
    }

    let interestedBids = teams
      .filter((team) => team.players.length < team.squadTarget)
      .filter((team) => team.budget >= minBid)
      .filter((team) => {
        const isDomesticForTeam = player.country === team.country;
        if (isDomesticForTeam) {
          return team.domesticCount < team.domesticTarget;
        }
        return team.foreignCount < team.foreignTarget;
      })
      .filter((team) => canTeamSpendOnAuctionPlayer(team, player))
      .map((team) => {
        const needScore = resolveAuctionNeedScore({ team, player });
        const normalizedAbility = Math.max(0.18, Math.min(1.2, abilityScore / 330));
        const interest = 0.45 + normalizedAbility * 0.45 + demandBonus + needScore + Math.random() * 0.35;
        const shouldBid = interest >= (isElite ? 0.56 : isTop ? 0.66 : isSolid ? 0.76 : 0.84);
        if (!shouldBid) {
          return null;
        }

        const rawMultiplier = 0.7 + Math.random() * 0.6 + (interest - 0.8) * 0.08;
        const clampedMultiplier = Math.max(0.7, Math.min(1.3, rawMultiplier));
        const amount = Math.max(minBid, Math.min(team.budget, maxBid, Math.round((basePrice * clampedMultiplier) / 500) * 500));

        return {
          team,
          amount,
          interest,
        };
      })
      .filter(Boolean)
      .sort((left, right) => right.amount - left.amount || right.interest - left.interest);

    if (player?.isCareerPlayer && !interestedBids.length) {
      const forcedTeam = teams
        .filter((team) => team.players.length < team.squadTarget)
        .filter((team) => {
          const isDomesticForTeam = player.country === team.country;
          if (isDomesticForTeam) {
            return team.domesticCount < team.domesticTarget;
          }
          return team.foreignCount < team.foreignTarget;
        })
        .sort((left, right) => {
          const needGap = resolveAuctionNeedScore({ team: right, player }) - resolveAuctionNeedScore({ team: left, player });
          if (needGap !== 0) {
            return needGap;
          }
          return Number(right.budget || 0) - Number(left.budget || 0);
        })[0] || null;

      if (forcedTeam) {
        interestedBids = [{
          team: forcedTeam,
          amount: Math.max(minBid, Math.min(maxBid, Math.min(Number(forcedTeam.budget || 0), Math.round(basePrice / 500) * 500))),
          interest: 1,
        }];
      }
    }

    const bids = [];
    const usedBidAmounts = new Set();
    const selectedBidders = interestedBids.slice(0, effectiveBidderCount);
    const topAnchor = Math.max(
      minBid,
      Math.min(maxBid, Math.round((selectedBidders[0]?.amount || basePrice) / 500) * 500)
    );
    const gapStep = Math.max(500, Math.round((basePrice * 0.035) / 500) * 500);

    selectedBidders.forEach((bid, bidIndex) => {
      const baseCandidate = Math.max(
        minBid,
        Math.min(maxBid, topAnchor - bidIndex * gapStep - (bidIndex > 0 ? randomInt(0, 2) * 100 : 0))
      );
      const uniqueAmount = resolveUniqueBidAmount({
        amount: baseCandidate,
        minBid,
        maxBid,
        usedAmounts: usedBidAmounts,
        seed: nominationIndex * 31 + bidIndex,
      });
      usedBidAmounts.add(uniqueAmount);
      bids.push({
        ...bid,
        amount: uniqueAmount,
      });
    });

    const winnerBid = bids[0] || null;
    if (winnerBid) {
      const winnerTeam = winnerBid.team;
      const assignedPlayer = ensurePlayerMeta(player);
      winnerTeam.players.push(assignedPlayer);
      winnerTeam.budget = Math.max(0, winnerTeam.budget - winnerBid.amount);
      winnerTeam.spent += winnerBid.amount;
      winnerTeam.signings += 1;
      if (player.country === winnerTeam.country) {
        winnerTeam.domesticCount += 1;
      } else {
        winnerTeam.foreignCount += 1;
      }
      updateAuctionRoleCounts(winnerTeam, player);
      player.assignedTeamId = winnerTeam.id;
      player.assignedTeamName = winnerTeam.name;
    }

    auctionTimeline.push({
      index: nominationIndex,
      playerId: player.id,
      playerName: player.name,
      playerType: player.playerType || '',
      playerCountry: player.country,
      abilityScore,
      basePrice,
      basePriceLabel: `$${Number(basePrice || 0).toLocaleString('en-US')}`,
      isWicketkeeperProfile: isAuctionWicketkeeper(player),
      isBowlingProfile: isAuctionBowlingProfile(player),
      isBattingProfile: isAuctionBattingProfile(player),
      winnerTeam: winnerBid?.team?.name || '',
      winnerCountry: winnerBid?.team?.country || '',
      amount: winnerBid?.amount || 0,
      amountLabel: winnerBid ? `$${Number(winnerBid.amount || 0).toLocaleString('en-US')}` : '',
      isSold: Boolean(winnerBid),
      isCareerPlayer: !!player.isCareerPlayer,
      bids: bids.slice(0, 8).map((entry) => ({
        team: entry.team.name,
        country: entry.team.country,
        amount: entry.amount,
      })),
    });
  };

  let nominationIndex = 1;
  auctionPool.forEach((player) => {
    runNomination(player, nominationIndex);
    nominationIndex += 1;
  });

  while (!allTeamsFilled() && reservePool.length) {
    const reservePlayer = reservePool.shift();
    runNomination(reservePlayer, nominationIndex);
    nominationIndex += 1;
  }

  const fallbackUnassigned = shuffleArray(
    poolWithMeta.filter((player) => !player.assignedTeamId && !player.isCareerPlayer)
  );

  teams.forEach((team) => {
    while (team.players.length < team.squadTarget && fallbackUnassigned.length) {
      const preferredIndex = fallbackUnassigned.findIndex((player) => {
        const isDomestic = player.country === team.country;
        const categoryFits = isDomestic ? team.domesticCount < team.domesticTarget : team.foreignCount < team.foreignTarget;
        return categoryFits && canTeamSpendOnAuctionPlayer(team, player);
      });
      const nextIndex = preferredIndex >= 0
        ? preferredIndex
        : fallbackUnassigned.findIndex((player) => {
            const isDomestic = player.country === team.country;
            if (isDomestic) {
              return team.domesticCount < team.domesticTarget;
            }
            return team.foreignCount < team.foreignTarget;
          });
      if (nextIndex < 0) {
        break;
      }
      const [nextPlayer] = fallbackUnassigned.splice(nextIndex, 1);
      const fallbackAmount = Math.max(50000, Math.round((Number(nextPlayer.baseMarketPrice || 80000) * 0.7) / 500) * 500);
      const actualSpend = Math.min(Number(team.budget || 0), fallbackAmount);
      team.players.push(ensurePlayerMeta(nextPlayer));
      team.spent += actualSpend;
      team.budget = Math.max(0, team.budget - actualSpend);
      team.signings += 1;
      if (nextPlayer.country === team.country) {
        team.domesticCount += 1;
      } else {
        team.foreignCount += 1;
      }
      updateAuctionRoleCounts(team, nextPlayer);
      nextPlayer.assignedTeamId = team.id;
      nextPlayer.assignedTeamName = team.name;
    }
  });

  const remainingUnassigned = poolWithMeta.filter((player) => !player.assignedTeamId && !player.isCareerPlayer);
  const nonLeagueAssignment = assignGlobalPoolPlayersToDomesticTeams({
    domesticTeams: nonLeagueTeams,
    globalPlayerPool: remainingUnassigned,
    countryRows,
  });

  const updatedTeams = [
    ...teams.map((team) => ({
      ...team,
      players: team.players,
    })),
    ...(nonLeagueAssignment.domesticTeams || []),
  ];

  const updatedGlobalPool = poolWithMeta
    .filter((player) => !player.isCareerPlayer)
    .map((player) => ({
      ...player,
      assignedTeamId: player.assignedTeamId || '',
      assignedTeamName: player.assignedTeamName || '',
    }));

  const domesticAuctionTeams = teams;
  const fallbackCareerTeam = domesticAuctionTeams[0]?.name || updatedTeams[0]?.name || '';
  const careerPlayerEvent = auctionTimeline.find((event) => event.isCareerPlayer && event.isSold);
  const resolvedCareerTeam = careerPlayerEvent?.winnerTeam || fallbackCareerTeam;

  const budgetTable = domesticAuctionTeams
    .map((team) => {
      const budgetStart = Number(team.budgetStart || 0);
      const budgetLeft = Math.max(0, Number(team.budget || 0));
      const spent = Math.max(0, budgetStart - budgetLeft);
      return {
        team: team.name,
        country: team.country,
        budgetStart,
        budgetLeft,
        spent,
        signings: team.signings,
        domesticPlayers: team.domesticCount,
        foreignPlayers: team.foreignCount,
        domesticTarget: team.domesticTarget,
        foreignTarget: team.foreignTarget,
        targetSize: team.squadTarget,
        roleCounts: {
          wicketkeepers: team.roleCounts.wicketkeepers,
          bowling: team.roleCounts.bowling,
          batting: team.roleCounts.batting,
        },
        averageSpend: team.signings > 0 ? Math.round(spent / team.signings) : 0,
        budgetStartLabel: `$${budgetStart.toLocaleString('en-US')}`,
        budgetLeftLabel: `$${budgetLeft.toLocaleString('en-US')}`,
        spentLabel: `$${spent.toLocaleString('en-US')}`,
      };
    })
    .sort((left, right) => right.spent - left.spent || left.team.localeCompare(right.team));

  const marqueeBids = [...auctionTimeline]
    .filter((event) => event.isSold)
    .sort((left, right) => right.amount - left.amount || right.abilityScore - left.abilityScore)
    .slice(0, Math.max(20, Number(maxSummaryEvents || 140)));

  return {
    domesticTeams: updatedTeams,
    globalPlayerPool: nonLeagueAssignment.globalPlayerPool || updatedGlobalPool,
    careerTeam: resolvedCareerTeam,
    auctionSummary: {
      leagueCountry,
      teamCount: domesticAuctionTeams.length,
      totalPlayersAuctioned: poolWithMeta.filter((player) => player.assignedTeamId).length,
      playerPoolComposition: {
        domesticRatio: AUCTION_DOMESTIC_POOL_RATIO,
        foreignRatio: AUCTION_FOREIGN_POOL_RATIO,
      },
      teamRules: {
        domesticPerTeam: [AUCTION_MIN_DOMESTIC_PER_TEAM, AUCTION_MAX_DOMESTIC_PER_TEAM],
        foreignPerTeam: [AUCTION_MIN_FOREIGN_PER_TEAM, AUCTION_MAX_FOREIGN_PER_TEAM],
        equalBudget: AUCTION_EQUAL_TEAM_BUDGET,
        bidRangePercent: [-30, 30],
        minimumRoleLimits: {
          wicketkeepers: AUCTION_MIN_WICKETKEEPERS,
          bowlingProfiles: AUCTION_MIN_BOWLING_PROFILE,
          battingProfiles: AUCTION_MIN_BATTING_PROFILE,
        },
      },
      auctionTimeline,
      marqueeBids,
      budgetTable,
      careerPlayerEvent: careerPlayerEvent || null,
    },
  };
};

const formatOfferAmount = (amount) => `$${Number(amount).toLocaleString('en-US')}`;

export const buildCareerOffers = (domesticTeams = [], count = 3) => {
  const selectedTeams = shuffleArray(domesticTeams).slice(0, Math.min(count, domesticTeams.length));
  const baseAmount = randomInt(240000, 325000);
  const increments = [randomInt(7000, 11000), randomInt(12000, 17000), randomInt(19000, 25000)];
  const uniqueAmounts = increments
    .map((offset, index) => baseAmount + offset + index * 137)
    .sort((left, right) => left - right);

  return selectedTeams.map((team, index) => {
    const amount = uniqueAmounts[index] || baseAmount + index * 10000;
    return {
      team: team.name,
      location: team.location || '',
      country: team.country || '',
      amount,
      amountLabel: formatOfferAmount(amount),
    };
  });
};

const buildRoundRobinFixturesForFormat = (teamNames = [], format) => {
  const baseTeams = shuffleArray((teamNames || []).filter(Boolean));
  if (baseTeams.length < 2) {
    return [];
  }

  const hasOddCount = baseTeams.length % 2 !== 0;
  const rotation = hasOddCount ? [...baseTeams, null] : [...baseTeams];
  const totalTeams = rotation.length;
  const half = totalTeams / 2;
  const totalRounds = totalTeams - 1;
  const fixtures = [];
  let matchNumber = 1;

  for (let roundIndex = 0; roundIndex < totalRounds; roundIndex += 1) {
    const left = rotation.slice(0, half);
    const right = rotation.slice(half).reverse();

    for (let pairIndex = 0; pairIndex < half; pairIndex += 1) {
      const firstTeam = left[pairIndex];
      const secondTeam = right[pairIndex];

      if (!firstTeam || !secondTeam) {
        continue;
      }

      // Alternate order to avoid one side always appearing first.
      const swapOrder = (roundIndex + pairIndex) % 2 === 1;
      const teamA = swapOrder ? secondTeam : firstTeam;
      const teamB = swapOrder ? firstTeam : secondTeam;

      fixtures.push({
        id: `${format}-M${matchNumber}`,
        format,
        matchNumber,
        round: roundIndex + 1,
        teamA,
        teamB,
        opponent: '',
        locationCountry: '',
        isUserMatch: false,
        isComplete: false,
        result: null,
      });
      matchNumber += 1;
    }

    const fixedTeam = rotation[0];
    const movedTeam = rotation[rotation.length - 1];
    const middleTeams = rotation.slice(1, rotation.length - 1);
    rotation.splice(0, rotation.length, fixedTeam, movedTeam, ...middleTeams);
  }

  return fixtures;
};

const addDays = (date, days = 0) => {
  const next = new Date(date);
  next.setDate(next.getDate() + Number(days || 0));
  return next;
};

const toIsoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateLabel = (date) =>
  date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export const buildCareerSeasonSchedule = (careerTeam, domesticTeams, seasonLength = 'standard', options = {}) => {
  const teamNames = (domesticTeams || []).map((team) => team.name).filter(Boolean);
  if (!careerTeam || teamNames.length < 2) {
    return [];
  }

  const leagueCountry = options?.leagueCountry || '';
  const parsedStartDate = options?.seasonStartDate ? new Date(options.seasonStartDate) : new Date();
  const seasonStartDate = Number.isNaN(parsedStartDate.getTime()) ? new Date() : parsedStartDate;
  seasonStartDate.setHours(12, 0, 0, 0);
  const fixtureGapDaysByFormat = {
    t20: 2,
    odi: 3,
    firstClass: 6,
  };
  const formatBreakDaysByFormat = {
    t20: 3,
    odi: 4,
    firstClass: 5,
  };

  const selectedFormats = [...CAREER_FORMATS];
  const seasonMultiplier = seasonLength === 'full' ? 2 : 1;
  let globalIndex = 1;
  let nextFixtureDate = new Date(seasonStartDate);
  const allFixtures = Array.from({ length: seasonMultiplier }).flatMap((_, cycleIndex) =>
    selectedFormats.flatMap((format) => {
      const fixturesForFormat = buildRoundRobinFixturesForFormat(teamNames, format).map((fixture) => {
        const isUserMatch = fixture.teamA === careerTeam || fixture.teamB === careerTeam;
        const opponent = isUserMatch ? (fixture.teamA === careerTeam ? fixture.teamB : fixture.teamA) : '';
        const scheduledDate = new Date(nextFixtureDate);

        nextFixtureDate = addDays(nextFixtureDate, fixtureGapDaysByFormat[format] || 2);
        return {
          ...fixture,
          id: `${format}-S${cycleIndex + 1}-${globalIndex}`,
          tournament: format,
          seasonCycle: cycleIndex + 1,
          globalMatchNumber: globalIndex++,
          leagueCountry,
          scheduledDate: toIsoDate(scheduledDate),
          scheduledDateLabel: formatDateLabel(scheduledDate),
          isUserMatch,
          opponent,
          locationCountry: opponent || fixture.teamA,
        };
      });

      nextFixtureDate = addDays(nextFixtureDate, formatBreakDaysByFormat[format] || 2);
      return fixturesForFormat;
    })
  );

  return allFixtures;
};

export const resolveNextCareerMatch = (schedule = []) => (schedule || []).find((match) => !match.isComplete) || null;

const createEmptyFormatStandings = (careerTeam, domesticTeams = []) => {
  const standings = {};
  (domesticTeams || []).forEach((team) => {
    standings[team.name] = { wins: 0, losses: 0, ties: 0, points: 0, played: 0 };
  });
  if (careerTeam && !standings[careerTeam]) {
    standings[careerTeam] = { wins: 0, losses: 0, ties: 0, points: 0, played: 0 };
  }
  return standings;
};

export const getCareerFormatStandings = (careerStandings = {}, format = 't20') => {
  if (!careerStandings || typeof careerStandings !== 'object') {
    return {};
  }

  if (careerStandings.t20 || careerStandings.odi || careerStandings.firstClass) {
    return careerStandings[format] || {};
  }

  return careerStandings;
};

export const buildCareerStandings = (careerTeam, schedule = [], domesticTeams = []) => {
  const standingsByFormat = CAREER_FORMATS.reduce((acc, format) => {
    acc[format] = createEmptyFormatStandings(careerTeam, domesticTeams);
    return acc;
  }, {});

  (schedule || []).forEach((match) => {
    if (!match.isComplete || !match.result) return;
    const formatKey = CAREER_FORMATS.includes(match.format) ? match.format : 't20';
    const standings = standingsByFormat[formatKey];
    const { teamA, teamB } = match;

    if (!standings[teamA]) standings[teamA] = { wins: 0, losses: 0, ties: 0, points: 0, played: 0 };
    if (!standings[teamB]) standings[teamB] = { wins: 0, losses: 0, ties: 0, points: 0, played: 0 };

    standings[teamA].played += 1;
    standings[teamB].played += 1;

    if (match.result.winner === 'Tie') {
      standings[teamA].ties += 1;
      standings[teamB].ties += 1;
      standings[teamA].points += 1;
      standings[teamB].points += 1;
      return;
    }

    const loser = match.result.winner === teamA ? teamB : teamA;
    standings[match.result.winner].wins += 1;
    standings[match.result.winner].points += 2;
    standings[loser].losses += 1;
  });

  return standingsByFormat;
};

export const sortStandings = (standings) =>
  Object.entries(standings || {})
    .map(([team, stats]) => ({ team, ...stats }))
    .sort((a, b) => b.points - a.points || b.wins - a.wins || a.losses - b.losses || a.team.localeCompare(b.team));

const formatScoreRange = {
  t20: [130, 230],
  odi: [180, 360],
  firstClass: [220, 520],
};

const formatBallsRange = {
  t20: [90, 120],
  odi: [180, 300],
  firstClass: [240, 420],
};

const buildCreatedPlayerMatchContribution = (format) => {
  if (format === 'firstClass') {
    return {
      runs: randomInt(0, 180),
      balls: randomInt(20, 220),
      outs: Math.random() < 0.75 ? 1 : 0,
      wickets: randomInt(0, 4),
      ballsBowled: randomInt(0, 72),
      runsConceded: randomInt(0, 90),
    };
  }
  if (format === 'odi') {
    return {
      runs: randomInt(0, 140),
      balls: randomInt(5, 120),
      outs: Math.random() < 0.8 ? 1 : 0,
      wickets: randomInt(0, 5),
      ballsBowled: randomInt(0, 60),
      runsConceded: randomInt(0, 80),
    };
  }
  return {
    runs: randomInt(0, 110),
    balls: randomInt(1, 70),
    outs: Math.random() < 0.85 ? 1 : 0,
    wickets: randomInt(0, 4),
    ballsBowled: randomInt(0, 24),
    runsConceded: randomInt(0, 50),
  };
};

const allocateTotals = (total, count, weights = []) => {
  if (!count || total <= 0) {
    return Array.from({ length: count }, () => 0);
  }

  const safeWeights = Array.from({ length: count }, (_, index) => Math.max(1, Number(weights[index] || 1)));
  const weightSum = safeWeights.reduce((sum, weight) => sum + weight, 0) || count;
  const values = safeWeights.map((weight) => Math.max(0, Math.floor((total * weight) / weightSum)));
  let remainder = total - values.reduce((sum, value) => sum + value, 0);

  while (remainder > 0) {
    const index = randomInt(0, count - 1);
    values[index] += 1;
    remainder -= 1;
  }

  return values;
};

const buildSyntheticInningsRows = ({ players = [], score = 0, wickets = 0, format = 't20', bowlingPlayers = null }) => {
  const battingPlayers = (players || [])
    .slice(0, 11)
    .sort(
      (left, right) =>
        Number(right?.battingOrderCoeff || 0) - Number(left?.battingOrderCoeff || 0) ||
        ((Number(right?.abilityToPlayPaceBall || 0) + Number(right?.abilityToPlaySpinBall || 0)) -
          (Number(left?.abilityToPlayPaceBall || 0) + Number(left?.abilityToPlaySpinBall || 0)))
    );
  const potentialBowlers = Array.isArray(bowlingPlayers) && bowlingPlayers.length ? [...bowlingPlayers] : [...battingPlayers];
  const battingWeights = battingPlayers.map((player) => {
    const battingSkill = ((Number(player.abilityToPlayPaceBall || 0) + Number(player.abilityToPlaySpinBall || 0)) / 2) || 1;
    return battingSkill + randomInt(1, 20);
  });
  const battingRuns = allocateTotals(score, battingPlayers.length, battingWeights);
  const [minBalls, maxBalls] = formatBallsRange[format] || [60, 120];
  const inningsBalls = randomInt(minBalls, maxBalls);
  const battingBalls = allocateTotals(inningsBalls, battingPlayers.length, battingWeights.map((weight) => weight + randomInt(0, 15)));
  const dismissedIndices = new Set(shuffleArray(battingPlayers.map((_, index) => index)).slice(0, Math.max(0, Math.min(wickets, battingPlayers.length - 1))));
  const battingBowlerNames = battingPlayers.map((player, index) => battingPlayers[(index + 1) % battingPlayers.length]?.name || player.name || 'Unknown');

  const battingRows = battingPlayers.map((player, index) => {
    const balls = battingBalls[index] || 0;
    const runs = battingRuns[index] || 0;
    const isOut = dismissedIndices.has(index);
    const strikeRate = balls > 0 ? ((runs / balls) * 100).toFixed(2) : '0.00';
    return {
      playerId: player.id,
      name: player.name,
      playerType: player.playerType || '',
      isWicketKeeper: !!player.isWicketKeeper,
      paceAbility: player.paceAbility || 0,
      spinAbility: player.spinAbility || 0,
      abilityToPlayPaceBall: player.abilityToPlayPaceBall || 0,
      abilityToPlaySpinBall: player.abilityToPlaySpinBall || 0,
      runs,
      balls,
      strikeRate,
      dismissal: isOut
        ? `b ${battingBowlerNames[index] || 'Unknown'} @ ${runs}/${index + 1}`
        : balls > 0
          ? 'Not Out'
          : 'Yet to bat',
      isNotOut: !isOut && balls > 0,
    };
  });

  const bowlers = potentialBowlers
    .slice()
    .sort((left, right) => {
      const leftSkill = Math.max(Number(left.paceAbility || 0), Number(left.spinAbility || 0));
      const rightSkill = Math.max(Number(right.paceAbility || 0), Number(right.spinAbility || 0));
      return rightSkill - leftSkill;
    })
    .slice(0, Math.min(5, potentialBowlers.length));
  const bowlingWeights = bowlers.map((player) => Math.max(Number(player.paceAbility || 0), Number(player.spinAbility || 0)) + randomInt(1, 20));
  const bowlingBalls = allocateTotals(inningsBalls, bowlers.length, bowlingWeights);
  const bowlingWickets = allocateTotals(wickets, bowlers.length, bowlingWeights.map((weight) => weight + randomInt(0, 10)));
  const battingRunRate = inningsBalls > 0 ? score / inningsBalls : 0;
  const bowlingRows = bowlers.map((player, index) => {
    const balls = bowlingBalls[index] || 0;
    const wicketsForPlayer = bowlingWickets[index] || 0;
    const runsConceded = Math.max(0, Math.round(balls * battingRunRate + randomInt(-4, 4)));
    const overs = formatOvers(balls);
    const economy = balls > 0 ? ((runsConceded * 6) / balls).toFixed(2) : '0.00';
    const avgPerWicket = wicketsForPlayer > 0 ? (runsConceded / wicketsForPlayer).toFixed(2) : '-';

    return {
      playerId: player.id,
      name: player.name,
      playerType: player.playerType || '',
      isWicketKeeper: !!player.isWicketKeeper,
      paceAbility: player.paceAbility || 0,
      spinAbility: player.spinAbility || 0,
      abilityToPlayPaceBall: player.abilityToPlayPaceBall || 0,
      abilityToPlaySpinBall: player.abilityToPlaySpinBall || 0,
      overs,
      runsConceded,
      economy,
      avgPerWicket,
      wickets: wicketsForPlayer,
      isCurrent: index === 0,
    };
  });

  return { battingRows, bowlingRows, inningsBalls };
};

const buildSimulatedInningsCard = ({ teamName, players = [], bowlingPlayers = null, score = 0, wickets = 0, format = 't20' }) => {
  const rows = buildSyntheticInningsRows({ players, score, wickets, format, bowlingPlayers });
  const [minBalls, maxBalls] = formatBallsRange[format] || [60, 120];
  const oversBalls = Math.max(minBalls, Math.min(Number(rows.inningsBalls || minBalls), maxBalls));
  return buildScorecard(
    `${teamName} Innings`,
    { score, wickets },
    rows,
    formatOvers(oversBalls)
  );
};

const parseOversToBalls = (oversText = '0.0') => {
  const [overPart, ballPart] = String(oversText).split('.');
  const overs = Number(overPart || 0);
  const balls = Number(ballPart || 0);
  if (!Number.isFinite(overs) || !Number.isFinite(balls)) {
    return 0;
  }
  return overs * 6 + balls;
};

const markContribution = (teamMap, playerId, playerName, key, value = true) => {
  if (playerId !== undefined && playerId !== null) {
    const idKey = String(playerId);
    teamMap[idKey] = {
      ...(teamMap[idKey] || {}),
      [key]: value,
    };
  }

  if (playerName) {
    const nameKey = String(playerName);
    teamMap[nameKey] = {
      ...(teamMap[nameKey] || {}),
      [key]: value,
    };
  }
};

const buildMatchContributionsFromScorecards = ({
  teamAName,
  teamBName,
  teamAScorecard,
  teamBScorecard,
}) => {
  const contributions = {
    [teamAName]: {},
    [teamBName]: {},
  };

  (teamAScorecard?.battingRows || []).forEach((row) => {
    if (Number(row?.balls || 0) > 0) {
      markContribution(contributions[teamAName], row?.playerId, row?.name, 'didBat', true);
    }
  });
  (teamBScorecard?.battingRows || []).forEach((row) => {
    if (Number(row?.balls || 0) > 0) {
      markContribution(contributions[teamBName], row?.playerId, row?.name, 'didBat', true);
    }
  });

  (teamBScorecard?.bowlingRows || []).forEach((row) => {
    if (parseOversToBalls(row?.overs || '0.0') > 0) {
      markContribution(contributions[teamAName], row?.playerId, row?.name, 'didBowl', true);
    }
  });
  (teamAScorecard?.bowlingRows || []).forEach((row) => {
    if (parseOversToBalls(row?.overs || '0.0') > 0) {
      markContribution(contributions[teamBName], row?.playerId, row?.name, 'didBowl', true);
    }
  });

  return contributions;
};

const buildPlayerKey = (teamName, player) => `${teamName}::${player?.id ?? ''}::${player?.name || ''}`;

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

const mergeSimulatedTeamStatsFromScorecard = ({
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

export const simulateCareerFixture = ({
  match,
  careerTeam,
  careerPlayerProfile,
  domesticTeams = [],
  existingStats = {},
  seasonNumber = 1,
  previousFixturesByTeam = {},
}) => {
  const [minScore, maxScore] = formatScoreRange[match.format] || [120, 240];
  const teamAScore = randomInt(minScore, maxScore);
  const teamBScore = randomInt(minScore, maxScore);
  const winner = teamAScore === teamBScore ? 'Tie' : teamAScore > teamBScore ? match.teamA : match.teamB;
  const result = {
    winner,
    teamAScore,
    teamBScore,
    summary:
      winner === 'Tie'
        ? `${formatCareerMatchLabel(match.format)}: ${match.teamA} tied with ${match.teamB}`
        : `${formatCareerMatchLabel(match.format)}: ${winner} won by ${randomInt(1, 8)} ${Math.random() > 0.5 ? 'wickets' : 'runs'}`,
  };

  const updatedStats = { ...(existingStats || {}) };
  const domesticByName = (domesticTeams || []).reduce((acc, team) => {
    if (team?.name) {
      acc[team.name] = team;
    }
    return acc;
  }, {});
  const teamARoster = Array.isArray(domesticByName[match.teamA]?.players)
    ? domesticByName[match.teamA].players.map((player) => ensurePlayerMeta(player))
    : [];
  const teamBRoster = Array.isArray(domesticByName[match.teamB]?.players)
    ? domesticByName[match.teamB].players.map((player) => ensurePlayerMeta(player))
    : [];

  const teamAContext = buildLastMatchContext(previousFixturesByTeam?.[match.teamA], match.teamA);
  const teamBContext = buildLastMatchContext(previousFixturesByTeam?.[match.teamB], match.teamB);
  const teamAXIIds = selectAIPlayingXI({
    roster: teamARoster,
    previousXIIds: teamAContext.previousXIIds,
    lastMatchPerformanceById: teamAContext.lastMatchPerformanceById,
    lastMatchPerformanceByName: teamAContext.lastMatchPerformanceByName,
  });
  const teamBXIIds = selectAIPlayingXI({
    roster: teamBRoster,
    previousXIIds: teamBContext.previousXIIds,
    lastMatchPerformanceById: teamBContext.lastMatchPerformanceById,
    lastMatchPerformanceByName: teamBContext.lastMatchPerformanceByName,
  });
  const teamAById = new Map(teamARoster.map((player) => [String(player.id), player]));
  const teamBById = new Map(teamBRoster.map((player) => [String(player.id), player]));
  const teamAPlayers = teamAXIIds.map((id) => teamAById.get(String(id))).filter(Boolean).slice(0, 11);
  const teamBPlayers = teamBXIIds.map((id) => teamBById.get(String(id))).filter(Boolean).slice(0, 11);

  const teamAWickets = randomInt(3, Math.max(3, Math.min(10, teamAPlayers.length)));
  const teamBWickets = randomInt(3, Math.max(3, Math.min(10, teamBPlayers.length)));

  const teamAScorecard = buildSimulatedInningsCard({
    teamName: match.teamA,
    players: teamAPlayers,
    bowlingPlayers: teamBPlayers,
    score: teamAScore,
    wickets: teamAWickets,
    format: match.format,
  });
  const teamBScorecard = buildSimulatedInningsCard({
    teamName: match.teamB,
    players: teamBPlayers,
    bowlingPlayers: teamAPlayers,
    score: teamBScore,
    wickets: teamBWickets,
    format: match.format,
  });

  mergeSimulatedTeamStatsFromScorecard({
    updatedStats,
    teamName: match.teamA,
    teamPlayers: teamAPlayers,
    battingCard: teamAScorecard,
    opponentBattingCard: teamBScorecard,
    seasonNumber,
    format: match.format,
  });

  mergeSimulatedTeamStatsFromScorecard({
    updatedStats,
    teamName: match.teamB,
    teamPlayers: teamBPlayers,
    battingCard: teamBScorecard,
    opponentBattingCard: teamAScorecard,
    seasonNumber,
    format: match.format,
  });

  const momShortlist = buildMomShortlistFromScorecards({
    cards: [
      { team: match.teamA, scorecard: teamAScorecard },
      { team: match.teamB, scorecard: teamBScorecard },
    ],
  });
  const matchContributionsByTeam = buildMatchContributionsFromScorecards({
    teamAName: match.teamA,
    teamBName: match.teamB,
    teamAScorecard,
    teamBScorecard,
  });
  const updatedDomesticTeams = applyDomesticMatchPlayerUpdates({
    domesticTeams,
    teamAName: match.teamA,
    teamBName: match.teamB,
    teamAXIIds: teamAPlayers.map((player) => player.id),
    teamBXIIds: teamBPlayers.map((player) => player.id),
    momShortlist,
    matchContributionsByTeam,
  });

  if (!teamAPlayers.length && !teamBPlayers.length && match.isUserMatch && careerPlayerProfile?.name) {
    const key = `career-player-${careerPlayerProfile.name.toLowerCase().replace(/\s+/g, '-')}`;
    const previous = updatedStats[key] || {
      key,
      team: careerTeam,
      name: careerPlayerProfile.name,
      runs: 0,
      outs: 0,
      wickets: 0,
      balls: 0,
      ballsBowled: 0,
      runsConceded: 0,
      matches: 0,
      season: seasonNumber,
    };
    const delta = buildCreatedPlayerMatchContribution(match.format);
    updatedStats[key] = {
      ...previous,
      team: careerTeam,
      season: seasonNumber,
      runs: previous.runs + delta.runs,
      outs: previous.outs + delta.outs,
      wickets: previous.wickets + delta.wickets,
      balls: previous.balls + delta.balls,
      ballsBowled: previous.ballsBowled + delta.ballsBowled,
      runsConceded: previous.runsConceded + delta.runsConceded,
      matches: previous.matches + 1,
    };
  }

  return {
    result: {
      ...result,
      teamAWickets,
      teamBWickets,
      scorecard: {
        currentInnings: teamBScorecard,
        previousInnings: teamAScorecard,
      },
      momShortlist,
    },
    updatedStats,
    updatedDomesticTeams,
  };
};
