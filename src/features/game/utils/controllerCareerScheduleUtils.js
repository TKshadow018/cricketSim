import { shuffleArray } from './controllerCommonUtils';

export const CAREER_SEASON_LENGTHS = {
  short: 5,
  standard: 8,
  full: 12,
};

export const buildCareerSeasonSchedule = (careerTeam, countryList, seasonLength) => {
  const opponents = (countryList || [])
    .filter((team) => team.name !== careerTeam)
    .map((team) => team.name);

  const shuffled = shuffleArray(opponents);
  const count = CAREER_SEASON_LENGTHS[seasonLength] || CAREER_SEASON_LENGTHS.standard;
  const selected = shuffled.slice(0, count);

  return selected.map((opponent, index) => ({
    id: `M${index + 1}`,
    matchNumber: index + 1,
    opponent,
    locationCountry: opponent,
    isComplete: false,
    result: null,
  }));
};

export const resolveNextCareerMatch = (schedule) =>
  (schedule || []).find((match) => !match.isComplete) || null;

export const buildCareerStandings = (careerTeam, schedule) => {
  const standings = {};

  const initTeam = (name) => {
    if (!standings[name]) {
      standings[name] = { wins: 0, losses: 0, ties: 0, points: 0, played: 0 };
    }
  };

  initTeam(careerTeam);

  (schedule || []).forEach((match) => {
    if (!match.isComplete || !match.result) {
      return;
    }

    initTeam(match.opponent);

    const { winner } = match.result;
    standings[careerTeam].played += 1;
    standings[match.opponent].played += 1;

    if (!winner || winner === 'Tie') {
      standings[careerTeam].ties += 1;
      standings[careerTeam].points += 1;
      standings[match.opponent].ties += 1;
      standings[match.opponent].points += 1;
    } else if (winner === careerTeam) {
      standings[careerTeam].wins += 1;
      standings[careerTeam].points += 2;
      standings[match.opponent].losses += 1;
    } else {
      standings[match.opponent].wins += 1;
      standings[match.opponent].points += 2;
      standings[careerTeam].losses += 1;
    }
  });

  return standings;
};

export const sortStandings = (standings) =>
  Object.entries(standings)
    .map(([team, stats]) => ({ team, ...stats }))
    .sort((a, b) => b.points - a.points || b.wins - a.wins || a.losses - b.losses);
