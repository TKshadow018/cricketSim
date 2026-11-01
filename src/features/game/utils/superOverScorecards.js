import { buildCareerInningsScorecard } from './controllerCareerUtils';
import { withInningsExtras } from './scorecardExtras';

export const buildSuperOverScorecards = ({ state, ownPlayers, opponentPlayers, ownTeam, opponentTeam }) => {
  const rounds = [...state.rounds];
  if (state.phase !== 'resolved') {
    rounds.push({
      round: state.round,
      firstSide: state.firstSide,
      firstInnings: state.firstInnings,
      secondInnings: state.phase === 'first' ? null : state.secondInnings,
    });
  }
  return rounds.flatMap((round) => [round.firstInnings, round.secondInnings].map((innings, index) => {
    if (!innings) return null;
    const side = index === 0 ? round.firstSide : round.firstSide === 'own' ? 'opponent' : 'own';
    const team = side === 'own' ? ownTeam : opponentTeam;
    const card = buildCareerInningsScorecard({
      teamName: `${team} Super Over ${round.round}`,
      inningsState: innings,
      battingPlayers: side === 'own' ? ownPlayers : opponentPlayers,
      bowlingPlayers: side === 'own' ? opponentPlayers : ownPlayers,
    });
    return { team, scorecard: withInningsExtras(card, innings) };
  }).filter(Boolean));
};
