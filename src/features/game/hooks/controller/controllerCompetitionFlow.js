import { battingAction, bowlingAction } from '../../../../gameData/actionType';
import { matchStatusEnum } from '../../../../gameData/matchStatusEnum';
import { buildInitialInnings, buildRandomMatchCondition } from '../../gameSlice';
import { MODE_QUICK, MODE_SERIES, MODE_TOURNAMENT, MODE_CAREER } from '../../utils/controllerCommonUtils';
import { mergePlayerStatsForCurrentMatch } from '../../utils/controllerCareerUtils';
import { ensureTournamentNextRound, resolveWinnerFromScores } from '../../utils/controllerTournamentUtils';
import { startSuperOver } from '../../utils/superOver';
import { getFirstInningsLeader, getTestWinner } from '../../utils/testMatch';
import { beginMatchRandom } from '../../utils/matchRandom';

export const createCompetitionFlowHandlers = ({
  dispatch,
  game,
  gameMode,
  stage,
  tournamentCurrentMatchId,
  tournamentMatches,
  userTeamName,
  setTournamentTiebreakAction,
  setTestMatchAction,
  setMatchRandomAction,
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
    const testResult = game?.testMatch?.result;
    if (testResult?.type === 'draw') return getFirstInningsLeader(game.testMatch, { ownTeam, opponentTeam });
    if (testResult?.type === 'win') return getTestWinner(game.testMatch, { ownTeam, opponentTeam });
    if (testResult?.type === 'tie' || (!testResult && firstInnings.score === secondInnings.score)) {
      return game?.tournamentTiebreak?.winnerTeam || '';
    }
    return resolveWinnerFromScores({
      firstInnings,
      secondInnings,
      firstInningsTeamName,
      secondInningsTeamName,
    });
  };

  const commitTournamentMatchIfNeeded = () => {
    if (gameMode !== MODE_TOURNAMENT || stage !== matchStatusEnum.MatchEnd || !tournamentCurrentMatchId) {
      return { mergedMatches: tournamentMatches || [], winnerTeam: '' };
    }
    const isTied = game?.testMatch?.result
      ? game.testMatch.result.type === 'tie'
      : firstInnings.score === secondInnings.score;
    if (isTied && game?.tournamentTiebreak?.phase !== 'resolved') {
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
            summary: game?.testMatch?.result?.type === 'draw'
              ? `${resultSummary} ${winnerTeam} advances on the first-innings lead.`
              : game?.tournamentTiebreak?.winnerTeam
              ? `${resultSummary} ${winnerTeam} won Super Over ${game.tournamentTiebreak.round}.`
              : resultSummary,
            firstInningsScore: firstInnings.score,
            firstInningsWickets: firstInnings.wickets,
            secondInningsScore: secondInnings.score,
            secondInningsWickets: secondInnings.wickets,
            ...(game?.testMatch?.result?.type === 'draw' ? { matchResult: 'Draw' } : {}),
            ...(game?.tournamentTiebreak?.winnerTeam
              ? { superOvers: game.tournamentTiebreak.rounds || [], matchResult: 'Tie' }
              : {}),
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
    if (game?.testMatch?.result) {
      winnerTeam = getTestWinner(game.testMatch, { ownTeam, opponentTeam });
    } else if (secondInnings.score > firstInnings.score) {
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
    if (game?.testMatch) dispatch(setTestMatchAction(null));
    if (setMatchRandomAction) dispatch(setMatchRandomAction(null));
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
      if (game?.testMatch?.result?.type === 'draw' && !getFirstInningsLeader(game.testMatch, { ownTeam, opponentTeam })) {
        const fixture = (tournamentMatches || []).find((match) => match.id === tournamentCurrentMatchId);
        if (!fixture) throw new Error('Cannot replay a Test match without its tournament fixture.');
        const replay = {
          ...fixture,
          drawnReplays: [...(fixture.drawnReplays || []), { summary: resultSummary, innings: game.testMatch.innings }],
        };
        dispatch(setTournamentMatchesAction((tournamentMatches || []).map((match) => match.id === fixture.id ? replay : match)));
        dispatch(setTestMatchAction(null));
        prepareTournamentMatch(replay);
        dispatch(setStageAction(matchStatusEnum.TossTime));
        return;
      }
      const isTied = game?.testMatch?.result
        ? game.testMatch.result.type === 'tie'
        : firstInnings.score === secondInnings.score;
      if (isTied && game?.tournamentTiebreak?.phase !== 'resolved') {
        if (!game?.tournamentTiebreak) {
          const generator = game && setMatchRandomAction ? beginMatchRandom(game.matchRandom) : null;
          dispatch(setTournamentTiebreakAction(startSuperOver({
            originalFirstSide: firstBattingSide,
            ownPlayers,
            opponentPlayers,
            ownTeam,
            opponentTeam,
            userTeamName,
            randomSeed: generator ? Math.floor(generator.next() * 4294967296) : undefined,
          })));
          if (generator) dispatch(setMatchRandomAction(generator.snapshot()));
        }
        return;
      }
      const { mergedMatches } = commitTournamentMatchIfNeeded();
      if (game?.tournamentTiebreak) dispatch(setTournamentTiebreakAction(null));
      if (game?.testMatch) dispatch(setTestMatchAction(null));
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
