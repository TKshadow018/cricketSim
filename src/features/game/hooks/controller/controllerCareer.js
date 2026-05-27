import { matchStatusEnum } from '../../../../gameData/matchStatusEnum';
import { MODE_CAREER } from '../../utils/controllerCommonUtils';
import {
  buildCareerSeasonSchedule,
  buildCareerStandings,
  resolveNextCareerMatch,
  simulateCareerFixture,
} from '../../utils/controllerCareerScheduleUtils';

export const createCareerFlowHandlers = ({
  dispatch,
  gameMode,
  stage,
  careerTeam,
  careerPlayerProfile,
  careerDomesticCountry,
  careerDomesticTeams,
  careerOffers,
  careerRetired,
  careerSeason,
  careerSeasonLength,
  careerMatchIndex,
  careerSchedule,
  careerStandings,
  careerPlayerStats,
  careerSeasonHistory,
  setCareerTeamAction,
  setCareerPlayerProfileAction,
  setCareerDomesticCountryAction,
  setCareerDomesticTeamsAction,
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
  setStageAction,
  resetMatchRuntimeAction,
  setAutoSimMode,
}) => {
  const beginCareer = ({ team, seasonLength, playerProfile, domesticCountry, domesticTeams, offers }) => {
    if (!team || !playerProfile?.name || !domesticCountry || !Array.isArray(domesticTeams) || domesticTeams.length < 2) return;

    const schedule = buildCareerSeasonSchedule(team, domesticTeams, seasonLength || 'standard');
    const initialStandings = buildCareerStandings(team, [], domesticTeams);

    dispatch(setCareerTeamAction(team));
    dispatch(setCareerPlayerProfileAction(playerProfile));
    dispatch(setCareerDomesticCountryAction(domesticCountry));
    dispatch(setCareerDomesticTeamsAction(domesticTeams));
    dispatch(setCareerOffersAction(Array.isArray(offers) ? offers : []));
    dispatch(setCareerRetiredAction(false));
    dispatch(setCareerSeasonAction(1));
    dispatch(setCareerSeasonLengthAction(seasonLength || 'standard'));
    dispatch(setCareerFormatAction('t20'));
    dispatch(setCareerMatchIndexAction(0));
    dispatch(setCareerScheduleAction(schedule));
    dispatch(setCareerStandingsAction(initialStandings));
    dispatch(setCareerPlayerStatsAction({}));
    dispatch(setCareerSeasonHistoryAction([]));
    dispatch(setStageAction(matchStatusEnum.CareerSeasonSchedule));
  };

  const handleCareerStartNextMatch = () => {
    if (careerRetired) return;
    const schedule = [...(careerSchedule || [])];
    if (!schedule.length) return;

    let index = schedule.findIndex((match) => !match.isComplete);
    if (index < 0) {
      dispatch(setStageAction(matchStatusEnum.CareerSeasonSummary));
      return;
    }

    let updatedStats = { ...(careerPlayerStats || {}) };
    while (index < schedule.length) {
      const match = schedule[index];
      if (match.isComplete) {
        index += 1;
        continue;
      }

      const { result, updatedStats: statsAfterMatch } = simulateCareerFixture({
        match,
        careerTeam,
        careerPlayerProfile,
        existingStats: updatedStats,
        seasonNumber: careerSeason,
      });
      updatedStats = statsAfterMatch;
      schedule[index] = { ...match, isComplete: true, result };
      index += 1;

      if (match.isUserMatch) {
        break;
      }
    }

    const nextPendingIndex = schedule.findIndex((match) => !match.isComplete);
    dispatch(setCareerScheduleAction(schedule));
    dispatch(setCareerPlayerStatsAction(updatedStats));
    dispatch(setCareerStandingsAction(buildCareerStandings(careerTeam, schedule, careerDomesticTeams)));
    dispatch(setCareerMatchIndexAction(nextPendingIndex >= 0 ? nextPendingIndex : schedule.length));

    if (nextPendingIndex < 0) {
      dispatch(setStageAction(matchStatusEnum.CareerSeasonSummary));
    }
  };

  const commitCareerMatchResult = () => {};

  const handleCareerMatchPrimaryAction = () => {
    if (gameMode !== MODE_CAREER || stage !== matchStatusEnum.MatchEnd) return;
    dispatch(setStageAction(matchStatusEnum.CareerSeasonSchedule));
  };

  const handleStartNextCareerSeason = () => {
    if (careerRetired) return;
    const currentAge = (careerPlayerProfile?.age || 18) + Math.max((careerSeason || 1) - 1, 0);
    if (currentAge >= 40) {
      dispatch(setCareerRetiredAction(true));
      dispatch(setStageAction(matchStatusEnum.CareerHistory));
      return;
    }

    const seasonEntry = {
      season: careerSeason,
      careerTeam,
      standings: careerStandings,
      schedule: careerSchedule,
      playerAge: currentAge,
    };
    const updatedHistory = [...(careerSeasonHistory || []), seasonEntry];
    const newSchedule = buildCareerSeasonSchedule(careerTeam, careerDomesticTeams, careerSeasonLength);
    const newStandings = buildCareerStandings(careerTeam, [], careerDomesticTeams);

    dispatch(setCareerSeasonHistoryAction(updatedHistory));
    dispatch(setCareerSeasonAction(careerSeason + 1));
    dispatch(setCareerScheduleAction(newSchedule));
    dispatch(setCareerStandingsAction(newStandings));
    dispatch(setCareerMatchIndexAction(0));
    dispatch(setCareerPlayerStatsAction({}));
    dispatch(setStageAction(matchStatusEnum.CareerSeasonSchedule));
  };

  const handleRetireCareer = () => {
    dispatch(setCareerRetiredAction(true));
    dispatch(setStageAction(matchStatusEnum.CareerHistory));
  };

  const handleEndCareer = () => {
    setAutoSimMode(null);
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
