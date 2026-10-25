import { shuffleArray } from "./controllerCommonUtils";

import { CAREER_FORMATS } from "./careerPlayerDataUtils";

const buildRoundRobinFixturesForFormat = (teamNames = [], format) => {
  const baseTeams = shuffleArray((teamNames || []).filter(Boolean));
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

export const formatScoreRange = {
  t20: [130, 230],
  odi: [180, 360],
  firstClass: [220, 520],
};

export const formatBallsRange = {
  t20: [90, 120],
  odi: [180, 300],
  firstClass: [240, 420],
};
