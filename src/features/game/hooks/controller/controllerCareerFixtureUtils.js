import { buildCareerSeasonSchedule } from "../../utils/controllerCareerScheduleUtils";
import { selectAIPlayingXI } from "../../utils/controllerCommonUtils";
import { filterDomesticTeamsForLeagueCountry } from "./controllerCareerSetupUtils";

export const findTeamInningsCard = (scorecard, teamName) => {
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

export const getLatestCompletedFixtureForTeam = (schedule = [], teamName, beforeIndex = schedule.length) => {
  for (let index = Math.min(beforeIndex, schedule.length) - 1; index >= 0; index -= 1) {
    const fixture = schedule[index];
    if (fixture?.isComplete && (fixture.teamA === teamName || fixture.teamB === teamName)) {
      return fixture;
    }
  }

  return null;
};

export const toLeagueSlug = (value = '') =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const buildAllCountryLeagueSchedules = ({
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

export const prepareMatchXIAndRoles = (roster = [], lastFixture = null, teamName = '') => {
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
