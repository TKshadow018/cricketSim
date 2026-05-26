import { matchStatusEnum } from '../../../../gameData/matchStatusEnum';
import { MODE_SERIES, MODE_TOURNAMENT, MODE_CAREER, buildRoundOneFixtures, areRoundFixturesValid, shuffleArray } from '../../utils/controllerCommonUtils';

export const createNavigationHandlers = ({
  stage,
  gameMode,
  tournamentMatches,
  tournamentOpponentTeams,
  tournamentUserTeam,
  dispatch,
  setStageAction,
  setTossCallAction,
  prepareTournamentMatch,
  setGameModeAction,
  setTournamentChampionAction,
  setTournamentMatchesAction,
  setTournamentCurrentMatchIdAction,
  setTournamentOpponentTeamsAction,
  setTournamentPlayerStatsAction,
  setSeriesCurrentMatchAction,
  setSeriesResultsAction,
  setSeriesPlayerStatsAction,
  setSeriesLengthAction,
  setSaveMessage,
  setCareerTeamAction,
  setCareerSeasonAction,
  setCareerSeasonLengthAction,
  setCareerFormatAction,
  setCareerMatchIndexAction,
  setCareerScheduleAction,
  setCareerStandingsAction,
  setCareerPlayerStatsAction,
  setCareerSeasonHistoryAction,
}) => {
  const goToNextStage = () => {
    if (stage === matchStatusEnum.ChooseGameMode) {
      if (gameMode === MODE_SERIES) {
        dispatch(setStageAction(matchStatusEnum.ChooseSeriesLength));
        return;
      }

      dispatch(setStageAction(matchStatusEnum.ChooseMatchType));
      return;
    }

    if (stage === matchStatusEnum.ChooseSeriesLength) {
      dispatch(setStageAction(matchStatusEnum.ChooseMatchType));
      return;
    }

    if (stage === matchStatusEnum.ChooseOpponent && gameMode !== MODE_TOURNAMENT) {
      dispatch(setStageAction(matchStatusEnum.ChooseMatchLocation));
      return;
    }

    if (stage === matchStatusEnum.ChooseCommentator && gameMode === MODE_TOURNAMENT) {
      const pending = (tournamentMatches || []).find((match) => !match.isComplete && match.teamA && match.teamB);
      if (pending) {
        prepareTournamentMatch(pending);
        dispatch(setTossCallAction(''));
        dispatch(setStageAction(matchStatusEnum.TossTime));
        return;
      }
    }

    const stageOrder = [
      matchStatusEnum.ChooseGameMode,
      matchStatusEnum.ChooseSeriesLength,
      matchStatusEnum.ChooseMatchType,
      matchStatusEnum.ChooseOwnTeam,
      matchStatusEnum.ChooseOpponent,
      matchStatusEnum.SetupTournamentFixtures,
      matchStatusEnum.ChooseMatchLocation,
      matchStatusEnum.ChooseCommentator,
      matchStatusEnum.TossTime,
      matchStatusEnum.TossResult,
      matchStatusEnum.ChooseOwnPlayingXI,
      matchStatusEnum.ChooseOpponentPlayingXI,
      matchStatusEnum.TeamOneBat,
      matchStatusEnum.TeamTwoBat,
      matchStatusEnum.MatchEnd,
      matchStatusEnum.SeriesSummary,
      matchStatusEnum.TournamentChampion,
    ];
    const currentIndex = stageOrder.indexOf(stage);
    if (currentIndex < stageOrder.length - 1) {
      dispatch(setStageAction(stageOrder[currentIndex + 1]));
    }
  };

  const goToPreviousStage = () => {
    if (stage === matchStatusEnum.ChooseMatchType) {
      if (gameMode === MODE_SERIES) {
        dispatch(setStageAction(matchStatusEnum.ChooseSeriesLength));
        return;
      }

      dispatch(setStageAction(matchStatusEnum.ChooseGameMode));
      return;
    }

    if (stage === matchStatusEnum.ChooseSeriesLength) {
      dispatch(setStageAction(matchStatusEnum.ChooseGameMode));
      return;
    }

    if (stage === matchStatusEnum.SetupTournamentFixtures) {
      dispatch(setStageAction(matchStatusEnum.ChooseOpponent));
      return;
    }

    if (stage === matchStatusEnum.ChooseMatchLocation && gameMode !== MODE_TOURNAMENT) {
      dispatch(setStageAction(matchStatusEnum.ChooseOpponent));
      return;
    }

    const stageOrder = [
      matchStatusEnum.ChooseGameMode,
      matchStatusEnum.ChooseSeriesLength,
      matchStatusEnum.ChooseMatchType,
      matchStatusEnum.ChooseOwnTeam,
      matchStatusEnum.ChooseOpponent,
      matchStatusEnum.SetupTournamentFixtures,
      matchStatusEnum.ChooseMatchLocation,
      matchStatusEnum.ChooseCommentator,
      matchStatusEnum.TossTime,
      matchStatusEnum.TossResult,
      matchStatusEnum.ChooseOwnPlayingXI,
      matchStatusEnum.ChooseOpponentPlayingXI,
      matchStatusEnum.TeamOneBat,
      matchStatusEnum.TeamTwoBat,
      matchStatusEnum.MatchEnd,
      matchStatusEnum.SeriesSummary,
      matchStatusEnum.TournamentChampion,
    ];
    const currentIndex = stageOrder.indexOf(stage);
    if (currentIndex > 0) {
      dispatch(setStageAction(stageOrder[currentIndex - 1]));
    }
  };

  const selectGameMode = (mode) => {
    dispatch(setGameModeAction(mode));
    dispatch(setTournamentChampionAction(''));
    dispatch(setTournamentMatchesAction([]));
    dispatch(setTournamentCurrentMatchIdAction(''));
    dispatch(setTournamentOpponentTeamsAction([]));
    dispatch(setTournamentPlayerStatsAction({}));
    dispatch(setSeriesCurrentMatchAction(1));
    dispatch(setSeriesResultsAction([]));
    dispatch(setSeriesPlayerStatsAction({}));

    if (mode !== MODE_CAREER) {
      dispatch(setCareerTeamAction(''));
      dispatch(setCareerSeasonAction(0));
      dispatch(setCareerSeasonLengthAction('standard'));
      dispatch(setCareerFormatAction('t20'));
      dispatch(setCareerMatchIndexAction(0));
      dispatch(setCareerScheduleAction([]));
      dispatch(setCareerStandingsAction({}));
      dispatch(setCareerPlayerStatsAction({}));
      dispatch(setCareerSeasonHistoryAction([]));
    }

    if (mode === MODE_TOURNAMENT) {
      dispatch(setSeriesLengthAction(1));
      dispatch(setStageAction(matchStatusEnum.ChooseMatchType));
      return;
    }

    if (mode === MODE_CAREER) {
      dispatch(setSeriesLengthAction(1));
      dispatch(setStageAction(matchStatusEnum.CareerSetup));
      return;
    }

    if (mode === MODE_SERIES) {
      dispatch(setStageAction(matchStatusEnum.ChooseSeriesLength));
      return;
    }

    dispatch(setSeriesLengthAction(1));
    dispatch(setStageAction(matchStatusEnum.ChooseMatchType));
  };

  const selectSeriesLength = (value) => {
    const normalized = Math.max(2, Math.min(7, Number(value) || 2));
    dispatch(setSeriesLengthAction(normalized));
    dispatch(setSeriesCurrentMatchAction(1));
    dispatch(setSeriesResultsAction([]));
    dispatch(setSeriesPlayerStatsAction({}));
    dispatch(setStageAction(matchStatusEnum.ChooseMatchType));
  };

  const toggleTournamentOpponent = (teamName) => {
    if (!teamName || teamName === tournamentUserTeam) {
      return;
    }

    const existing = Array.isArray(tournamentOpponentTeams) ? tournamentOpponentTeams : [];
    const exists = existing.includes(teamName);
    const nextTeams = exists ? existing.filter((name) => name !== teamName) : [...existing, teamName];

    if (!exists && nextTeams.length > 15) {
      return;
    }

    dispatch(setTournamentOpponentTeamsAction(nextTeams));
  };

  const randomizeTournamentFixtures = () => {
    const teams = [tournamentUserTeam, ...(tournamentOpponentTeams || [])].filter(Boolean);
    const randomized = buildRoundOneFixtures(shuffleArray(teams));
    dispatch(setTournamentMatchesAction(randomized));
  };

  const updateTournamentFixture = (matchId, key, value) => {
    const nextMatches = (tournamentMatches || []).map((match) =>
      match.id === matchId ? { ...match, [key]: value } : match
    );
    dispatch(setTournamentMatchesAction(nextMatches));
  };

  const prepareTournamentFixtures = () => {
    const selectedCount = (tournamentOpponentTeams || []).length;
    if (![3, 7, 15].includes(selectedCount)) {
      setSaveMessage('Tournament needs exactly 3, 7, or 15 opponents.');
      return;
    }

    const teams = [tournamentUserTeam, ...(tournamentOpponentTeams || [])].filter(Boolean);
    const fixtures = buildRoundOneFixtures(teams);
    dispatch(setTournamentMatchesAction(fixtures));
    dispatch(setStageAction(matchStatusEnum.SetupTournamentFixtures));
  };

  const confirmTournamentFixtures = () => {
    const teams = [tournamentUserTeam, ...(tournamentOpponentTeams || [])].filter(Boolean);
    const roundOne = (tournamentMatches || []).filter((match) => match.round === 1);

    if (!areRoundFixturesValid(roundOne, teams)) {
      setSaveMessage('Each team must appear exactly once in first-round fixtures.');
      return;
    }

    dispatch(setTournamentCurrentMatchIdAction(roundOne[0]?.id || ''));
    dispatch(setStageAction(matchStatusEnum.ChooseMatchLocation));
  };

  return {
    goToNextStage,
    goToPreviousStage,
    selectGameMode,
    selectSeriesLength,
    toggleTournamentOpponent,
    randomizeTournamentFixtures,
    updateTournamentFixture,
    prepareTournamentFixtures,
    confirmTournamentFixtures,
  };
};
