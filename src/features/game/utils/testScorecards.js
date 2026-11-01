import { buildCareerInningsScorecard } from './controllerCareerUtils';
import { withInningsExtras } from './scorecardExtras';

export const buildTestInningsScorecards = ({ state, ownPlayers, opponentPlayers, ownTeam, opponentTeam, includeCurrent = false }) => {
  const entries = [...state.innings];
  if (includeCurrent && state.phase === 'batting') {
    entries.push({ side: state.currentSide, innings: state.currentInnings, reason: 'inProgress' });
  }
  return entries.map(({ side, innings, reason }) => {
    const team = side === 'own' ? ownTeam : opponentTeam;
    const card = buildCareerInningsScorecard({
      teamName: team,
      inningsState: innings,
      battingPlayers: side === 'own' ? ownPlayers : opponentPlayers,
      bowlingPlayers: side === 'own' ? opponentPlayers : ownPlayers,
    });
    return {
      team,
      score: innings.score,
      wickets: innings.wickets,
      reason,
      scorecard: withInningsExtras(card, innings),
    };
  });
};
