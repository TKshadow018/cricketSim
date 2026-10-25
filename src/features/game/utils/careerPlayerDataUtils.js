import { createPerson } from "faker-user";

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

export const buildFakerPlayerData = (country, playerType) => {
  const fakerCountry = resolveFakerUserCountry(country);
  const custom = buildFakerCustomAttributes(playerType, country);
  const person = createPerson({ country: fakerCountry || undefined, minAge: 17, maxAge: 38, gender: 'male', custom });
  return {
    ...person,
    country: country || person.country || '',
  };
};

export const CAREER_SEASON_LENGTHS = {
  short: 1,
  standard: 2,
  full: 3,
};

export const CAREER_FORMATS = ['t20', 'odi', 'firstClass'];

export const DOMESTIC_TEAM_COUNT = 12;

export const TOP_RANKED_COUNTRY_PLAYER_PER_TEAM = 35;

export const BOTTOM_RANKED_COUNTRY_PLAYER_PER_TEAM = 25;

export const DEFAULT_GLOBAL_ASSIGN_STEP_PER_TEAM = 12;

export const MIN_LOCAL_PLAYER_RATIO = 0.75;

export const DOMESTIC_TEAM_PLAYER_TYPE_COUNTS = [
  { type: 'batsman', count: 8 },
  { type: 'wicketkeeper', count: 3 },
  { type: 'bowler spinner', count: 2 },
  { type: 'bowler pacer', count: 4 },
  { type: 'spin allrounder', count: 3 },
  { type: 'pace allrounder', count: 3 },
];

export const CLUB_PREFIXES = [
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

export const CLUB_SUFFIXES = [
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

export const AI_PLAYER_TYPE_DISTRIBUTION = [
  { key: 'batsman', weight: 35 },
  { key: 'bowler spinner', weight: 10 },
  { key: 'bowler pacer', weight: 15 },
  { key: 'wicketkeeper', weight: 15 },
  { key: 'pace allrounder', weight: 10 },
  { key: 'spin allrounder', weight: 15 },
];

export const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export const formatLabelMap = { t20: 'T20', odi: 'ODI', firstClass: 'First Class' };

export const toSlug = (value = '') =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
