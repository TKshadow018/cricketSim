import { collectTeamStatsForInnings, formatOvers } from './controllerCommonUtils';

export const buildTopRunScorers = (statsList = []) =>
  [...statsList]
    .sort((left, right) => right.runs - left.runs || left.balls - right.balls || left.name.localeCompare(right.name))
    .slice(0, 10)
    .map((entry) => ({
      ...entry,
      battingAverage: entry.outs > 0 ? (entry.runs / entry.outs).toFixed(2) : 'NA',
      strikeRate: entry.balls > 0 ? ((entry.runs / entry.balls) * 100).toFixed(2) : '0.00',
    }));

export const buildTopWicketTakers = (statsList = []) =>
  [...statsList]
    .sort(
      (left, right) =>
        right.wickets - left.wickets || left.ballsBowled - right.ballsBowled || left.name.localeCompare(right.name)
    )
    .slice(0, 10)
    .map((entry) => ({
      ...entry,
      overs: formatOvers(entry.ballsBowled),
      bowlingAverage: entry.wickets > 0 ? (entry.runsConceded / entry.wickets).toFixed(2) : 'NA',
      economy: entry.ballsBowled > 0 ? ((entry.runsConceded * 6) / entry.ballsBowled).toFixed(2) : '0.00',
    }));

export const mergePlayerStatsForCurrentMatch = ({
  existingStats,
  firstBattingSide,
  ownPlayers,
  opponentPlayers,
  ownTeam,
  opponentTeam,
  firstInnings,
  secondInnings,
}) => {
  const delta = {};
  const firstBattingPlayers = firstBattingSide === 'own' ? ownPlayers : opponentPlayers;
  const firstBowlingPlayers = firstBattingSide === 'own' ? opponentPlayers : ownPlayers;
  const secondBattingPlayers = firstBattingSide === 'own' ? opponentPlayers : ownPlayers;
  const secondBowlingPlayers = firstBattingSide === 'own' ? ownPlayers : opponentPlayers;
  const firstBattingTeam = firstBattingSide === 'own' ? ownTeam : opponentTeam;
  const firstBowlingTeam = firstBattingSide === 'own' ? opponentTeam : ownTeam;
  const secondBattingTeam = firstBattingSide === 'own' ? opponentTeam : ownTeam;
  const secondBowlingTeam = firstBattingSide === 'own' ? ownTeam : opponentTeam;

  collectTeamStatsForInnings({
    teamName: firstBattingTeam,
    players: firstBattingPlayers,
    battingStats: firstInnings.battingStats,
    targetMap: delta,
  });
  collectTeamStatsForInnings({
    teamName: firstBowlingTeam,
    players: firstBowlingPlayers,
    bowlingStats: firstInnings.bowlingStats,
    targetMap: delta,
  });
  collectTeamStatsForInnings({
    teamName: secondBattingTeam,
    players: secondBattingPlayers,
    battingStats: secondInnings.battingStats,
    targetMap: delta,
  });
  collectTeamStatsForInnings({
    teamName: secondBowlingTeam,
    players: secondBowlingPlayers,
    bowlingStats: secondInnings.bowlingStats,
    targetMap: delta,
  });

  const merged = { ...(existingStats || {}) };
  Object.values(delta).forEach((entry) => {
    const previous = merged[entry.key] || {
      key: entry.key,
      team: entry.team,
      name: entry.name,
      runs: 0,
      outs: 0,
      wickets: 0,
      balls: 0,
      ballsBowled: 0,
      runsConceded: 0,
      matches: 0,
    };

    merged[entry.key] = {
      ...previous,
      runs: previous.runs + entry.runs,
      outs: previous.outs + entry.outs,
      wickets: previous.wickets + entry.wickets,
      balls: previous.balls + entry.balls,
      ballsBowled: previous.ballsBowled + entry.ballsBowled,
      runsConceded: previous.runsConceded + entry.runsConceded,
      matches: previous.matches + 1,
    };
  });

  return merged;
};
