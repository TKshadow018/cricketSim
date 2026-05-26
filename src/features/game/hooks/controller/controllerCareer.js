import { matchStatusEnum } from '../../../../gameData/matchStatusEnum';
import { MODE_CAREER } from '../../utils/controllerCommonUtils';
import { buildCareerSeasonSchedule, buildCareerStandings, resolveNextCareerMatch } from '../../utils/controllerCareerScheduleUtils';
import { mergePlayerStatsForCurrentMatch } from '../../utils/controllerCareerUtils';

export const createCareerFlowHandlers = ({
  dispatch,
  gameMode,
  stage,
  careerTeam,
  careerSeason,
  careerSeasonLength,
  careerFormat,
  careerMatchIndex,
  careerSchedule,
  careerStandings,
  careerPlayerStats,
  careerSeasonHistory,
  countryList,
  careerResultCommitSignatureRef,
  firstInnings,
  secondInnings,
  firstInningsTeamName,
  secondInningsTeamName,
  firstBattingSide,
  ownPlayers,
  opponentPlayers,
  ownTeam,
  opponentTeam,
  resultSummary,
  setCareerTeamAction,
  setCareerSeasonAction,
  setCareerSeasonLengthAction,
  setCareerFormatAction,
  setCareerMatchIndexAction,
  setCareerScheduleAction,
  setCareerStandingsAction,
  setCareerPlayerStatsAction,
  setCareerSeasonHistoryAction,
  setStageAction,
  setOpponentTeamAction,
  setLocationCountryAction,
  setMatchTypeKeyAction,
  resetMatchForCareerAction,
  resetMatchRuntimeAction,
  setAutoSimMode,
}) => {
  const buildCareerMatchPlayerStats = () =>
    mergePlayerStatsForCurrentMatch({
      existingStats: careerPlayerStats,
      firstBattingSide,
      ownPlayers,
      opponentPlayers,
      ownTeam,
      opponentTeam,
      firstInnings,
      secondInnings,
    });

  const resolveCareerMatchWinner = () => {
    if (secondInnings.score > firstInnings.score) return secondInningsTeamName;
    if (secondInnings.score < firstInnings.score) return firstInningsTeamName;
    return 'Tie';
  };

  const beginCareer = ({ team, format, seasonLength }) => {
    if (!team) return;

    const schedule = buildCareerSeasonSchedule(team, countryList, seasonLength || 'standard');
    const initialStandings = buildCareerStandings(team, []);

    dispatch(setCareerTeamAction(team));
    dispatch(setCareerSeasonAction(1));
    dispatch(setCareerSeasonLengthAction(seasonLength || 'standard'));
    dispatch(setCareerFormatAction(format || 't20'));
    dispatch(setCareerMatchIndexAction(0));
    dispatch(setCareerScheduleAction(schedule));
    dispatch(setCareerStandingsAction(initialStandings));
    dispatch(setCareerPlayerStatsAction({}));
    dispatch(setCareerSeasonHistoryAction([]));
    dispatch(setStageAction(matchStatusEnum.CareerSeasonSchedule));
  };

  const handleCareerStartNextMatch = () => {
    const nextMatch = resolveNextCareerMatch(careerSchedule);
    if (!nextMatch) return;

    dispatch(resetMatchForCareerAction());
    dispatch(setOpponentTeamAction(nextMatch.opponent));
    dispatch(setLocationCountryAction(nextMatch.locationCountry));
    dispatch(setMatchTypeKeyAction(careerFormat));
    careerResultCommitSignatureRef.current = '';
    setAutoSimMode(null);
    dispatch(setStageAction(matchStatusEnum.TossTime));
  };

  const commitCareerMatchResult = () => {
    if (gameMode !== MODE_CAREER || stage !== matchStatusEnum.MatchEnd) return;

    const currentMatch = careerSchedule[careerMatchIndex];
    if (!currentMatch || currentMatch.isComplete) return;

    const signature = [
      careerMatchIndex,
      firstInnings.score,
      firstInnings.wickets,
      firstInnings.balls,
      secondInnings.score,
      secondInnings.wickets,
      secondInnings.balls,
      resultSummary,
    ].join('|');

    if (careerResultCommitSignatureRef.current === signature) return;
    careerResultCommitSignatureRef.current = signature;

    const winner = resolveCareerMatchWinner();

    const updatedSchedule = careerSchedule.map((match, index) =>
      index === careerMatchIndex
        ? {
            ...match,
            isComplete: true,
            result: {
              winner,
              summary: resultSummary,
              ownScore: ownTeam === firstInningsTeamName ? firstInnings.score : secondInnings.score,
              ownWickets: ownTeam === firstInningsTeamName ? firstInnings.wickets : secondInnings.wickets,
              opponentScore: ownTeam === firstInningsTeamName ? secondInnings.score : firstInnings.score,
              opponentWickets: ownTeam === firstInningsTeamName ? secondInnings.wickets : firstInnings.wickets,
            },
          }
        : match
    );

    const updatedStandings = buildCareerStandings(careerTeam, updatedSchedule);
    const updatedStats = buildCareerMatchPlayerStats();

    dispatch(setCareerScheduleAction(updatedSchedule));
    dispatch(setCareerStandingsAction(updatedStandings));
    dispatch(setCareerPlayerStatsAction(updatedStats));
    dispatch(setCareerMatchIndexAction(careerMatchIndex + 1));
  };

  const handleCareerMatchPrimaryAction = () => {
    if (gameMode !== MODE_CAREER) return;

    commitCareerMatchResult();

    const completedCount = (careerSchedule || []).filter((m) => m.isComplete).length;
    const totalMatches = (careerSchedule || []).length;

    if (completedCount >= totalMatches) {
      dispatch(setStageAction(matchStatusEnum.CareerSeasonSummary));
      return;
    }

    dispatch(setStageAction(matchStatusEnum.CareerSeasonSchedule));
  };

  const handleStartNextCareerSeason = () => {
    const seasonEntry = {
      season: careerSeason,
      careerTeam,
      schedule: careerSchedule,
      standings: careerStandings,
    };
    const updatedHistory = [...(careerSeasonHistory || []), seasonEntry];
    const newSchedule = buildCareerSeasonSchedule(careerTeam, countryList, careerSeasonLength);
    const newStandings = buildCareerStandings(careerTeam, []);

    dispatch(setCareerSeasonHistoryAction(updatedHistory));
    dispatch(setCareerSeasonAction(careerSeason + 1));
    dispatch(setCareerScheduleAction(newSchedule));
    dispatch(setCareerStandingsAction(newStandings));
    dispatch(setCareerMatchIndexAction(0));
    dispatch(setCareerPlayerStatsAction({}));
    dispatch(setStageAction(matchStatusEnum.CareerSeasonSchedule));
  };

  const handleEndCareer = () => {
    setAutoSimMode(null);
    dispatch(resetMatchRuntimeAction());
  };

  const handleViewCareerHistory = () => {
    dispatch(setStageAction(matchStatusEnum.CareerHistory));
  };

  const handleBackToCareerSchedule = () => {
    dispatch(setStageAction(matchStatusEnum.CareerSeasonSchedule));
  };

  return {
    beginCareer,
    handleCareerStartNextMatch,
    commitCareerMatchResult,
    handleCareerMatchPrimaryAction,
    handleStartNextCareerSeason,
    handleEndCareer,
    handleViewCareerHistory,
    handleBackToCareerSchedule,
  };
};
