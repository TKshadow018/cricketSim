import { battingAction, bowlingAction } from '../../../../gameData/actionType';
import { matchStatusEnum } from '../../../../gameData/matchStatusEnum';
import { buildInitialInnings, buildRandomMatchCondition } from '../../gameSlice';
import { MODE_QUICK, MODE_SERIES, MODE_TOURNAMENT, MODE_CAREER } from '../../utils/controllerCommonUtils';
import { mergePlayerStatsForCurrentMatch } from '../../utils/controllerCareerUtils';
import { ensureTournamentNextRound, resolveWinnerFromScores } from '../../utils/controllerTournamentUtils';

export const createCompetitionFlowHandlers = ({
  dispatch,
  gameMode,
  stage,
  tournamentCurrentMatchId,
  tournamentMatches,
  tournamentResultCommitSignatureRef,
  firstInnings,
  secondInnings,
  resultSummary,
  firstInningsTeamName,
  secondInningsTeamName,
  setTournamentMatchesAction,
  setTournamentPlayerStatsAction,
  tournamentPlayerStats,
  firstBattingSide,
  ownPlayers,
  opponentPlayers,
  ownTeam,
  opponentTeam,
  seriesCurrentMatch,
  seriesResultCommitSignatureRef,
  seriesResults,
  setSeriesResultsAction,
  setSeriesPlayerStatsAction,
  seriesPlayerStats,
  setTossWinnerAction,
  setTossDecisionAction,
  setTossCallAction,
  setFirstBattingSideAction,
  setMatchConditionAction,
  setBattingIntentAction,
  setBowlingIntentAction,
  setFirstInningsAction,
  setSecondInningsAction,
  setShowScoreboardAction,
  setStageAction,
  resetMatchRuntime,
  setSeriesCurrentMatchAction,
  seriesLength,
  prepareTournamentMatch,
  setTournamentChampionAction,
  setAutoSimMode,
  handleCareerMatchPrimaryAction,
}) => {
  const buildTournamentPlayerStatsForCurrentMatch = () => {
    return mergePlayerStatsForCurrentMatch({
      existingStats: tournamentPlayerStats,
      firstBattingSide,
      ownPlayers,
      opponentPlayers,
      ownTeam,
      opponentTeam,
      firstInnings,
      secondInnings,
    });
  };

  const resolveTournamentWinnerTeam = () => {
    return resolveWinnerFromScores({
      firstInnings,
      secondInnings,
      firstInningsTeamName,
      secondInningsTeamName,
      tieAs: firstInningsTeamName,
    });
  };

  const commitTournamentMatchIfNeeded = () => {
    if (gameMode !== MODE_TOURNAMENT || stage !== matchStatusEnum.MatchEnd || !tournamentCurrentMatchId) {
      return { mergedMatches: tournamentMatches || [], winnerTeam: '' };
    }

    const signature = [
      tournamentCurrentMatchId,
      firstInnings.score,
      firstInnings.wickets,
      firstInnings.balls,
      secondInnings.score,
      secondInnings.wickets,
      secondInnings.balls,
      resultSummary,
    ].join('|');

    if (tournamentResultCommitSignatureRef.current === signature) {
      return { mergedMatches: tournamentMatches || [], winnerTeam: resolveTournamentWinnerTeam() };
    }

    tournamentResultCommitSignatureRef.current = signature;
    const winnerTeam = resolveTournamentWinnerTeam();
    const updatedMatches = (tournamentMatches || []).map((match) =>
      match.id === tournamentCurrentMatchId
        ? {
            ...match,
            winnerTeam,
            summary: resultSummary,
            firstInningsScore: firstInnings.score,
            firstInningsWickets: firstInnings.wickets,
            secondInningsScore: secondInnings.score,
            secondInningsWickets: secondInnings.wickets,
            isComplete: true,
          }
        : match
    );

    const mergedMatches = ensureTournamentNextRound(updatedMatches);
    dispatch(setTournamentMatchesAction(mergedMatches));
    dispatch(setTournamentPlayerStatsAction(buildTournamentPlayerStatsForCurrentMatch()));
    return { mergedMatches, winnerTeam };
  };

  const buildSeriesMatchPayload = () => {
    let winnerTeam = 'Tie';
    if (secondInnings.score > firstInnings.score) {
      winnerTeam = secondInningsTeamName;
    } else if (secondInnings.score < firstInnings.score) {
      winnerTeam = firstInningsTeamName;
    }

    return {
      matchNumber: seriesCurrentMatch,
      firstInningsTeamName,
      secondInningsTeamName,
      firstInningsScore: firstInnings.score,
      firstInningsWickets: firstInnings.wickets,
      firstInningsBalls: firstInnings.balls,
      secondInningsScore: secondInnings.score,
      secondInningsWickets: secondInnings.wickets,
      secondInningsBalls: secondInnings.balls,
      summary: resultSummary,
      winnerTeam,
    };
  };

  const buildSeriesPlayerStatsForCurrentMatch = () => {
    return mergePlayerStatsForCurrentMatch({
      existingStats: seriesPlayerStats,
      firstBattingSide,
      ownPlayers,
      opponentPlayers,
      ownTeam,
      opponentTeam,
      firstInnings,
      secondInnings,
    });
  };

  const commitSeriesMatchIfNeeded = () => {
    if (gameMode !== MODE_SERIES || stage !== matchStatusEnum.MatchEnd) {
      return;
    }

    const signature = [
      seriesCurrentMatch,
      firstInnings.score,
      firstInnings.wickets,
      firstInnings.balls,
      secondInnings.score,
      secondInnings.wickets,
      secondInnings.balls,
      resultSummary,
    ].join('|');

    if (seriesResultCommitSignatureRef.current === signature) {
      return;
    }

    seriesResultCommitSignatureRef.current = signature;
    const nextResults = [...(seriesResults || []), buildSeriesMatchPayload()];
    const nextSeriesStats = buildSeriesPlayerStatsForCurrentMatch();
    dispatch(setSeriesResultsAction(nextResults));
    dispatch(setSeriesPlayerStatsAction(nextSeriesStats));
  };

  const prepareNextSeriesMatch = () => {
    dispatch(setTossWinnerAction(''));
    dispatch(setTossDecisionAction(''));
    dispatch(setTossCallAction(''));
    dispatch(setFirstBattingSideAction(''));
    dispatch(setMatchConditionAction(buildRandomMatchCondition()));
    dispatch(setBattingIntentAction(battingAction.normal));
    dispatch(setBowlingIntentAction(bowlingAction.normal));
    dispatch(setFirstInningsAction(buildInitialInnings()));
    dispatch(setSecondInningsAction(buildInitialInnings()));
    dispatch(setShowScoreboardAction(false));
    dispatch(setStageAction(matchStatusEnum.TossTime));
  };

  const handleMatchPrimaryAction = () => {
    if (gameMode === MODE_QUICK) {
      dispatch(resetMatchRuntime());
      return;
    }

    if (gameMode === MODE_CAREER) {
      if (typeof handleCareerMatchPrimaryAction === 'function') {
        handleCareerMatchPrimaryAction();
      }
      return;
    }

    if (gameMode === MODE_TOURNAMENT) {
      const { mergedMatches } = commitTournamentMatchIfNeeded();
      const pending = mergedMatches.find((match) => !match.isComplete && match.teamA && match.teamB);

      if (!pending) {
        const finals = mergedMatches
          .filter((match) => match.isComplete)
          .sort((left, right) => right.round - left.round || right.matchNumber - left.matchNumber);
        const championTeam = finals[0]?.winnerTeam || '';
        dispatch(setTournamentChampionAction(championTeam));
        dispatch(setStageAction(matchStatusEnum.TournamentChampion));
        return;
      }

      prepareTournamentMatch(pending);
      dispatch(setStageAction(matchStatusEnum.TossTime));
      return;
    }

    commitSeriesMatchIfNeeded();

    if (seriesCurrentMatch >= seriesLength) {
      dispatch(setStageAction(matchStatusEnum.SeriesSummary));
      return;
    }

    dispatch(setSeriesCurrentMatchAction(seriesCurrentMatch + 1));
    prepareNextSeriesMatch();
  };

  const handlePlayFreshMatch = () => {
    seriesResultCommitSignatureRef.current = '';
    tournamentResultCommitSignatureRef.current = '';
    setAutoSimMode(null);
    dispatch(resetMatchRuntime());
  };

  return {
    prepareTournamentMatch,
    handleMatchPrimaryAction,
    handlePlayFreshMatch,
    commitSeriesMatchIfNeeded,
    commitTournamentMatchIfNeeded,
  };
};
