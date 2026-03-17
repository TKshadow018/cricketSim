export const ensureTournamentNextRound = (matches = []) => {
  const rounds = [...new Set(matches.map((match) => match.round))].sort((left, right) => left - right);
  if (!rounds.length) {
    return matches;
  }

  const latestRound = rounds[rounds.length - 1];
  const latestMatches = matches.filter((match) => match.round === latestRound);
  const allComplete = latestMatches.length > 0 && latestMatches.every((match) => match.isComplete);
  const latestAlreadyFinal = latestMatches.length === 1;

  if (!allComplete || latestAlreadyFinal) {
    return matches;
  }

  const winners = latestMatches.map((match) => match.winnerTeam).filter(Boolean);
  if (winners.length < 2 || winners.length % 2 !== 0) {
    return matches;
  }

  const nextRound = latestRound + 1;
  if (matches.some((match) => match.round === nextRound)) {
    return matches;
  }

  const nextMatches = [];
  for (let index = 0; index < winners.length; index += 2) {
    nextMatches.push({
      id: `R${nextRound}-M${index / 2 + 1}`,
      round: nextRound,
      matchNumber: index / 2 + 1,
      teamA: winners[index],
      teamB: winners[index + 1],
      date: '',
      winnerTeam: '',
      summary: '',
      isComplete: false,
    });
  }

  return [...matches, ...nextMatches];
};

export const resolveWinnerFromScores = ({ firstInnings, secondInnings, firstInningsTeamName, secondInningsTeamName, tieAs = '' }) => {
  if (secondInnings.score > firstInnings.score) {
    return secondInningsTeamName;
  }
  if (secondInnings.score < firstInnings.score) {
    return firstInningsTeamName;
  }
  return tieAs || firstInningsTeamName;
};
