import { shuffleArray } from './controllerCommonUtils';

export const CAREER_SEASON_LENGTHS = {
  short: 1,
  standard: 2,
  full: 3,
};

export const CAREER_FORMATS = ['t20', 'odi', 'firstClass'];
const DOMESTIC_TEAM_COUNT = 12;
const PLAYERS_PER_TEAM = 15;

const FIRST_NAMES = ['Aarav', 'Vihaan', 'Arjun', 'Rehan', 'Kabir', 'Ishan', 'Zayan', 'Rohan', 'Dev', 'Sam'];
const LAST_NAMES = ['Sharma', 'Khan', 'Patel', 'Singh', 'Rao', 'Das', 'Ali', 'Nair', 'Kumar', 'Roy'];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFrom = (list) => list[randomInt(0, list.length - 1)];
const formatLabelMap = { t20: 'T20', odi: 'ODI', firstClass: 'First Class' };

export const formatCareerMatchLabel = (format) => formatLabelMap[format] || String(format || '').toUpperCase();

export const createGeneratedDomesticPlayer = ({ id, country }) => ({
  id,
  name: `${randomFrom(FIRST_NAMES)} ${randomFrom(LAST_NAMES)}`,
  country,
  abilityToPlayPaceBall: randomInt(30, 95),
  abilityToPlaySpinBall: randomInt(30, 95),
  battingAggresion: randomInt(30, 95),
  spinAbility: randomInt(20, 90),
  paceAbility: randomInt(20, 90),
  isWicketKeeper: Math.random() < 0.15,
});

export const createDomesticTeamsForCountry = (country) => {
  let playerId = 10000;
  return Array.from({ length: DOMESTIC_TEAM_COUNT }).map((_, index) => {
    const teamName = `${country} Club ${index + 1}`;
    const players = Array.from({ length: PLAYERS_PER_TEAM }).map(() =>
      createGeneratedDomesticPlayer({ id: playerId++, country })
    );
    return {
      id: `club-${index + 1}`,
      name: teamName,
      country,
      players,
    };
  });
};

export const buildCareerOffers = (domesticTeams = [], count = 3) =>
  shuffleArray(domesticTeams).slice(0, Math.min(count, domesticTeams.length)).map((team) => team.name);

const buildRoundRobinFixturesForFormat = (teamNames = [], format) => {
  const fixtures = [];
  let matchNumber = 1;
  for (let i = 0; i < teamNames.length; i += 1) {
    for (let j = i + 1; j < teamNames.length; j += 1) {
      const teamA = teamNames[i];
      const teamB = teamNames[j];
      fixtures.push({
        id: `${format}-M${matchNumber}`,
        format,
        matchNumber,
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
  }
  return shuffleArray(fixtures);
};

export const buildCareerSeasonSchedule = (careerTeam, domesticTeams, seasonLength = 'standard') => {
  const teamNames = (domesticTeams || []).map((team) => team.name).filter(Boolean);
  if (!careerTeam || teamNames.length < 2) {
    return [];
  }

  const formatCount = CAREER_SEASON_LENGTHS[seasonLength] || CAREER_SEASON_LENGTHS.standard;
  const selectedFormats = CAREER_FORMATS.slice(0, Math.max(1, Math.min(formatCount, CAREER_FORMATS.length)));
  let globalIndex = 1;
  const allFixtures = selectedFormats.flatMap((format) =>
    buildRoundRobinFixturesForFormat(teamNames, format).map((fixture) => {
      const isUserMatch = fixture.teamA === careerTeam || fixture.teamB === careerTeam;
      const opponent = isUserMatch ? (fixture.teamA === careerTeam ? fixture.teamB : fixture.teamA) : '';
      return {
        ...fixture,
        id: `${format}-${globalIndex}`,
        globalMatchNumber: globalIndex++,
        isUserMatch,
        opponent,
        locationCountry: opponent || fixture.teamA,
      };
    })
  );

  return allFixtures;
};

export const resolveNextCareerMatch = (schedule = []) => (schedule || []).find((match) => !match.isComplete) || null;

export const buildCareerStandings = (careerTeam, schedule = [], domesticTeams = []) => {
  const standings = {};
  (domesticTeams || []).forEach((team) => {
    standings[team.name] = { wins: 0, losses: 0, ties: 0, points: 0, played: 0 };
  });
  if (careerTeam && !standings[careerTeam]) {
    standings[careerTeam] = { wins: 0, losses: 0, ties: 0, points: 0, played: 0 };
  }

  (schedule || []).forEach((match) => {
    if (!match.isComplete || !match.result) return;
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

  return standings;
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

export const simulateCareerFixture = ({
  match,
  careerTeam,
  careerPlayerProfile,
  existingStats = {},
  seasonNumber = 1,
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
  if (match.isUserMatch && careerPlayerProfile?.name) {
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

  return { result, updatedStats };
};
