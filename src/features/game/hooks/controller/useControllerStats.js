import { useEffect, useMemo } from 'react';
import { speak } from '../../../../utils/speechUtils';
import { MODE_SERIES } from '../../utils/controllerCommonUtils';
import { buildMomRecommendations } from '../../utils/controllerMomUtils';
import { buildTopRunScorers, buildTopWicketTakers } from '../../utils/controllerCareerUtils';
import { resolveSeriesStanding } from '../../utils/controllerCommonUtils';
import { matchStatusEnum } from '../../../../gameData/matchStatusEnum';

export const useControllerStats = ({
  firstBattingSide,
  ownPlayers,
  opponentPlayers,
  firstInnings,
  secondInnings,
  ownTeam,
  opponentTeam,
  firstInningsTeamName,
  secondInningsTeamName,
  ownSanitizedRoles,
  opponentSanitizedRoles,
  seriesResults,
  seriesPlayerStats,
  gameMode,
  seriesCurrentMatch,
  seriesLength,
  tournamentMatches,
  tournamentPlayerStats,
  tournamentChampion,
  stage,
  resultSummary,
}) => {
  const momRecommendations = useMemo(() => {
    return buildMomRecommendations({
      firstBattingSide,
      ownPlayers,
      opponentPlayers,
      firstInnings,
      secondInnings,
      ownTeam,
      opponentTeam,
      firstInningsTeamName,
      secondInningsTeamName,
      ownSanitizedRoles,
      opponentSanitizedRoles,
    });
  }, [
    firstBattingSide,
    ownPlayers,
    opponentPlayers,
    firstInnings,
    secondInnings,
    ownTeam,
    opponentTeam,
    firstInningsTeamName,
    secondInningsTeamName,
    ownSanitizedRoles.captainId,
    ownSanitizedRoles.viceCaptainId,
    ownSanitizedRoles.wicketKeeperId,
    opponentSanitizedRoles.captainId,
    opponentSanitizedRoles.viceCaptainId,
    opponentSanitizedRoles.wicketKeeperId,
  ]);

  const seriesStanding = useMemo(() => resolveSeriesStanding(seriesResults, ownTeam, opponentTeam), [
    seriesResults,
    ownTeam,
    opponentTeam,
  ]);

  const seriesPlayerStatsList = useMemo(
    () => Object.values(seriesPlayerStats || {}).filter((entry) => entry && entry.name),
    [seriesPlayerStats]
  );
  const seriesTopRunScorers = useMemo(() => buildTopRunScorers(seriesPlayerStatsList), [seriesPlayerStatsList]);
  const seriesTopWicketTakers = useMemo(() => buildTopWicketTakers(seriesPlayerStatsList), [seriesPlayerStatsList]);
  const seriesProgressLabel =
    gameMode === MODE_SERIES ? `Match ${Math.min(seriesCurrentMatch, seriesLength)} of ${seriesLength}` : 'Single Match';

  const tournamentResults = useMemo(
    () => (tournamentMatches || []).filter((match) => match.isComplete),
    [tournamentMatches]
  );
  const tournamentPlayerStatsList = useMemo(
    () => Object.values(tournamentPlayerStats || {}).filter((entry) => entry && entry.name),
    [tournamentPlayerStats]
  );
  const tournamentTopRunScorers = useMemo(() => buildTopRunScorers(tournamentPlayerStatsList), [tournamentPlayerStatsList]);
  const tournamentTopWicketTakers = useMemo(
    () => buildTopWicketTakers(tournamentPlayerStatsList),
    [tournamentPlayerStatsList]
  );
  const tournamentPendingMatch = useMemo(
    () => (tournamentMatches || []).find((match) => !match.isComplete && match.teamA && match.teamB),
    [tournamentMatches]
  );
  const tournamentProgressLabel = tournamentPendingMatch
    ? `Round ${tournamentPendingMatch.round} • Match ${tournamentPendingMatch.matchNumber}`
    : tournamentChampion
      ? `Champion: ${tournamentChampion}`
      : 'Tournament in progress';

  const announceManOfTheMatch = (selected) => {
    if (!selected) {
      return;
    }

    let winnerTeam = '';
    if (secondInnings.score > firstInnings.score) {
      winnerTeam = secondInningsTeamName;
    } else if (secondInnings.score < firstInnings.score) {
      winnerTeam = firstInningsTeamName;
    }

    const pointsSummary = Array.isArray(selected.notes) ? selected.notes.slice(0, 5).join(', ') : '';
    const congratsLine = winnerTeam
      ? `Congratulations to ${winnerTeam} for winning the match.`
      : 'The match is tied. Congratulations to both teams for a great game.';

    const announcement = [
      `Man of the Match is ${selected.name} from ${selected.team}.`,
      `Batting performance ${selected.runs} runs in ${selected.balls} balls with strike rate ${selected.strikeRate}.`,
      `Bowling performance ${selected.oversBowled} overs, ${selected.runsConceded} runs conceded, ${selected.wickets} wickets.`,
      `Total Man of the Match points ${selected.points}.`,
      pointsSummary ? `Key points: ${pointsSummary}.` : '',
      congratsLine,
    ]
      .filter(Boolean)
      .join(' ');

    speak(announcement);
  };

  useEffect(() => {
    if (stage === matchStatusEnum.MatchEnd) {
      speak(resultSummary);
    }
  }, [resultSummary, stage]);

  useEffect(() => {
    if (stage !== matchStatusEnum.SeriesSummary || gameMode !== MODE_SERIES) {
      return;
    }

    const winnerLine =
      seriesStanding.ownWins > seriesStanding.opponentWins
        ? `${ownTeam} wins the series by ${seriesStanding.ownWins}-${seriesStanding.opponentWins}.`
        : seriesStanding.opponentWins > seriesStanding.ownWins
          ? `${opponentTeam} wins the series by ${seriesStanding.opponentWins}-${seriesStanding.ownWins}.`
          : `Series ended tied at ${seriesStanding.ownWins}-${seriesStanding.opponentWins}.`;

    speak(winnerLine);
  }, [stage, gameMode, seriesStanding.ownWins, seriesStanding.opponentWins, ownTeam, opponentTeam]);

  return {
    momRecommendations,
    seriesStanding,
    seriesTopRunScorers,
    seriesTopWicketTakers,
    seriesProgressLabel,
    tournamentResults,
    tournamentTopRunScorers,
    tournamentTopWicketTakers,
    tournamentProgressLabel,
    announceManOfTheMatch,
  };
};
