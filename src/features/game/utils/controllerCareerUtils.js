import { collectTeamStatsForInnings, formatOvers } from './controllerCommonUtils';
import { buildScorecard } from './controllerCommonUtils';

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
  matchFormat = 't20',
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
      playerId: entry.playerId,
      team: entry.team,
      name: entry.name,
      playerType: entry.playerType || '',
      isWicketKeeper: !!entry.isWicketKeeper,
      paceAbility: entry.paceAbility || 0,
      spinAbility: entry.spinAbility || 0,
      abilityToPlayPaceBall: entry.abilityToPlayPaceBall || 0,
      abilityToPlaySpinBall: entry.abilityToPlaySpinBall || 0,
      fitness: entry.fitness ?? 100,
      morale: entry.morale ?? 50,
      battingOrderCoeff: entry.battingOrderCoeff ?? 0,
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
      playerId: previous.playerId ?? entry.playerId,
      playerType: previous.playerType || entry.playerType || '',
      isWicketKeeper: previous.isWicketKeeper || !!entry.isWicketKeeper,
      paceAbility: previous.paceAbility || entry.paceAbility || 0,
      spinAbility: previous.spinAbility || entry.spinAbility || 0,
      abilityToPlayPaceBall: previous.abilityToPlayPaceBall || entry.abilityToPlayPaceBall || 0,
      abilityToPlaySpinBall: previous.abilityToPlaySpinBall || entry.abilityToPlaySpinBall || 0,
      fitness: previous.fitness ?? entry.fitness ?? 100,
      morale: previous.morale ?? entry.morale ?? 50,
      battingOrderCoeff: previous.battingOrderCoeff || entry.battingOrderCoeff || 0,
      runs: previous.runs + entry.runs,
      outs: previous.outs + entry.outs,
      wickets: previous.wickets + entry.wickets,
      balls: previous.balls + entry.balls,
      ballsBowled: previous.ballsBowled + entry.ballsBowled,
      runsConceded: previous.runsConceded + entry.runsConceded,
      matches: previous.matches + 1,
      formatStats: {
        ...(previous.formatStats || {}),
        [matchFormat]: {
          runs: Number(previous.formatStats?.[matchFormat]?.runs || 0) + entry.runs,
          outs: Number(previous.formatStats?.[matchFormat]?.outs || 0) + entry.outs,
          wickets: Number(previous.formatStats?.[matchFormat]?.wickets || 0) + entry.wickets,
          balls: Number(previous.formatStats?.[matchFormat]?.balls || 0) + entry.balls,
          ballsBowled: Number(previous.formatStats?.[matchFormat]?.ballsBowled || 0) + entry.ballsBowled,
          runsConceded: Number(previous.formatStats?.[matchFormat]?.runsConceded || 0) + entry.runsConceded,
          matches: Number(previous.formatStats?.[matchFormat]?.matches || 0) + 1,
        },
      },
    };
  });

  return merged;
};

const buildCareerInningsRows = ({ inningsState, battingPlayers = [], bowlingPlayers = [] }) => {
  const battingRows = (battingPlayers || []).map((player, index) => {
    if (!player) {
      return null;
    }

    const stat = inningsState?.battingStats?.[index] || {
      runs: 0,
      balls: 0,
      isOut: false,
      outByBowler: '',
      outAtScore: '',
      outAtBall: '',
    };
    const strikeRate = stat.balls > 0 ? ((stat.runs / stat.balls) * 100).toFixed(2) : '0.00';
    const isCurrent = index === inningsState?.strikerIndex || index === inningsState?.nonStrikerIndex;

    return {
      playerId: player.id,
      name: player.name,
      playerType: player.playerType || '',
      isWicketKeeper: !!player.isWicketKeeper,
      paceAbility: player.paceAbility || 0,
      spinAbility: player.spinAbility || 0,
      abilityToPlayPaceBall: player.abilityToPlayPaceBall || 0,
      abilityToPlaySpinBall: player.abilityToPlaySpinBall || 0,
      runs: stat.runs,
      balls: stat.balls,
      strikeRate,
      dismissal: stat.isOut
        ? `b ${stat.outByBowler || 'Unknown'} @ ${stat.outAtScore || '-'} (${stat.outAtBall || '-'})`
        : stat.balls > 0 || isCurrent
          ? 'Not Out'
          : 'Yet to bat',
      isNotOut: !stat.isOut && (stat.balls > 0 || isCurrent),
    };
  }).filter(Boolean);

  const bowlingRows = (bowlingPlayers || []).map((player, index) => {
    if (!player) {
      return null;
    }

    const stat = inningsState?.bowlingStats?.[index] || { balls: 0, runsConceded: 0, wickets: 0 };
    const overs = `${Math.floor(stat.balls / 6)}.${stat.balls % 6}`;
    const economy = stat.balls > 0 ? (stat.runsConceded / (stat.balls / 6)).toFixed(2) : '0.00';
    const avgPerWicket = stat.wickets > 0 ? (stat.runsConceded / stat.wickets).toFixed(2) : '-';

    return {
      playerId: player.id,
      name: player.name,
      playerType: player.playerType || '',
      isWicketKeeper: !!player.isWicketKeeper,
      paceAbility: player.paceAbility || 0,
      spinAbility: player.spinAbility || 0,
      abilityToPlayPaceBall: player.abilityToPlayPaceBall || 0,
      abilityToPlaySpinBall: player.abilityToPlaySpinBall || 0,
      overs,
      runsConceded: stat.runsConceded,
      economy,
      avgPerWicket,
      wickets: stat.wickets,
      isCurrent: index === inningsState?.currentBowlerIndex,
    };
  }).filter((row) => row.overs !== '0.0');

  return { battingRows, bowlingRows };
};

export const buildCareerMatchScorecard = ({
  firstBattingSide,
  ownPlayers = [],
  opponentPlayers = [],
  ownTeam = '',
  opponentTeam = '',
  firstInnings,
  secondInnings,
  firstInningsTeamName,
  secondInningsTeamName,
}) => {
  const firstBattingPlayers = firstBattingSide === 'own' ? ownPlayers : opponentPlayers;
  const firstBowlingPlayers = firstBattingSide === 'own' ? opponentPlayers : ownPlayers;
  const secondBattingPlayers = firstBattingSide === 'own' ? opponentPlayers : ownPlayers;
  const secondBowlingPlayers = firstBattingSide === 'own' ? ownPlayers : opponentPlayers;
  const firstBattingTeam = firstBattingSide === 'own' ? ownTeam : opponentTeam;
  const firstBowlingTeam = firstBattingSide === 'own' ? opponentTeam : ownTeam;
  const secondBattingTeam = firstBattingSide === 'own' ? opponentTeam : ownTeam;
  const secondBowlingTeam = firstBattingSide === 'own' ? ownTeam : opponentTeam;

  const firstRows = buildCareerInningsRows({
    inningsState: firstInnings,
    battingPlayers: firstBattingPlayers,
    bowlingPlayers: firstBowlingPlayers,
  });
  const secondRows = buildCareerInningsRows({
    inningsState: secondInnings,
    battingPlayers: secondBattingPlayers,
    bowlingPlayers: secondBowlingPlayers,
  });

  return {
    currentInnings: buildScorecard(
      `${secondBattingTeam || secondInningsTeamName || 'Second'} Innings`,
      secondInnings,
      secondRows,
      formatOvers(secondInnings?.balls || 0)
    ),
    previousInnings: buildScorecard(
      `${firstBattingTeam || firstInningsTeamName || 'First'} Innings`,
      firstInnings,
      firstRows,
      formatOvers(firstInnings?.balls || 0)
    ),
  };
};
