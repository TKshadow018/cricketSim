import { formatOvers, runMilestoneBonus, wicketMilestoneBonus } from './controllerCommonUtils';

const parseOversToBalls = (oversText = '0.0') => {
  const [oversPart, ballsPart] = String(oversText).split('.');
  const overs = Number(oversPart || 0);
  const balls = Number(ballsPart || 0);
  if (!Number.isFinite(overs) || !Number.isFinite(balls)) {
    return 0;
  }
  return overs * 6 + balls;
};

export const buildMomShortlistFromScorecards = ({ cards = [] }) => {
  const performanceMap = new Map();

  const ensureEntry = (team, row) => {
    const key = `${team}::${row?.playerId ?? ''}::${row?.name || ''}`;
    if (!performanceMap.has(key)) {
      performanceMap.set(key, {
        key,
        playerId: row?.playerId,
        name: row?.name || 'Unknown',
        team,
        runs: 0,
        balls: 0,
        wickets: 0,
        runsConceded: 0,
        ballsBowled: 0,
        notOut: false,
        points: 0,
      });
    }
    return performanceMap.get(key);
  };

  (cards || []).forEach(({ team, scorecard }) => {
    (scorecard?.battingRows || []).forEach((row) => {
      const entry = ensureEntry(team, row);
      entry.runs += Number(row?.runs || 0);
      entry.balls += Number(row?.balls || 0);
      entry.notOut = entry.notOut || !!row?.isNotOut;
    });

    (scorecard?.bowlingRows || []).forEach((row) => {
      const entry = ensureEntry(team, row);
      entry.wickets += Number(row?.wickets || 0);
      entry.runsConceded += Number(row?.runsConceded || 0);
      entry.ballsBowled += parseOversToBalls(row?.overs || '0.0');
    });
  });

  return Array.from(performanceMap.values())
    .map((entry) => {
      const economyBonus = entry.ballsBowled > 0 ? Math.max(0, 8 - entry.runsConceded / (entry.ballsBowled / 6)) : 0;
      const points = entry.runs + entry.wickets * 25 + (entry.notOut ? 5 : 0) + economyBonus;
      return {
        ...entry,
        points: Number(points.toFixed(2)),
      };
    })
    .sort(
      (left, right) =>
        right.points - left.points ||
        right.runs - left.runs ||
        right.wickets - left.wickets ||
        left.name.localeCompare(right.name)
    )
    .slice(0, 5)
    .map((entry, index) => ({
      rank: index + 1,
      recommended: index === 0,
      playerId: entry.playerId,
      name: entry.name,
      team: entry.team,
      points: entry.points,
    }));
};

export const buildMomRecommendations = ({
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
}) => {
  const firstBattingPlayers = firstBattingSide === 'own' ? ownPlayers : opponentPlayers;
  const firstBowlingPlayers = firstBattingSide === 'own' ? opponentPlayers : ownPlayers;
  const secondBattingPlayers = firstBattingSide === 'own' ? opponentPlayers : ownPlayers;
  const secondBowlingPlayers = firstBattingSide === 'own' ? ownPlayers : opponentPlayers;
  const firstBattingTeam = firstBattingSide === 'own' ? ownTeam : opponentTeam;
  const firstBowlingTeam = firstBattingSide === 'own' ? opponentTeam : ownTeam;
  const secondBattingTeam = firstBattingSide === 'own' ? opponentTeam : ownTeam;
  const secondBowlingTeam = firstBattingSide === 'own' ? ownTeam : opponentTeam;

  const performanceMap = new Map();
  const getKey = (team, playerId, name) => `${team}::${playerId}::${name}`;

  const ensurePlayer = (team, player) => {
    if (!player) {
      return null;
    }

    const key = getKey(team, player.id, player.name);
    if (!performanceMap.has(key)) {
      performanceMap.set(key, {
        key,
        playerId: player.id,
        name: player.name,
        team,
        playerType: player.playerType || '',
        isWicketKeeper: !!player.isWicketKeeper,
        paceAbility: player.paceAbility || 0,
        spinAbility: player.spinAbility || 0,
        abilityToPlayPaceBall: player.abilityToPlayPaceBall || 0,
        abilityToPlaySpinBall: player.abilityToPlaySpinBall || 0,
        runs: 0,
        balls: 0,
        wickets: 0,
        runsConceded: 0,
        ballsBowled: 0,
        notOut: false,
        strikeRate: 0,
        economy: 0,
        runsPerWicket: null,
        points: 0,
        notes: [],
      });
    }

    return performanceMap.get(key);
  };

  const addBattingStats = (teamName, players, inningState) => {
    players.forEach((player, index) => {
      const stat = inningState.battingStats[index] || { runs: 0, balls: 0, isOut: false };
      const entry = ensurePlayer(teamName, player);
      if (!entry) {
        return;
      }

      entry.runs += stat.runs || 0;
      entry.balls += stat.balls || 0;
      if ((stat.balls || 0) > 0 && !stat.isOut) {
        entry.notOut = true;
      }
    });
  };

  const addBowlingStats = (teamName, players, inningState) => {
    players.forEach((player, index) => {
      const stat = inningState.bowlingStats[index] || { wickets: 0, runsConceded: 0 };
      const entry = ensurePlayer(teamName, player);
      if (!entry) {
        return;
      }

      entry.wickets += stat.wickets || 0;
      entry.runsConceded += stat.runsConceded || 0;
      entry.ballsBowled += stat.balls || 0;
    });
  };

  addBattingStats(firstBattingTeam, firstBattingPlayers, firstInnings);
  addBowlingStats(firstBowlingTeam, firstBowlingPlayers, firstInnings);
  addBattingStats(secondBattingTeam, secondBattingPlayers, secondInnings);
  addBowlingStats(secondBowlingTeam, secondBowlingPlayers, secondInnings);

  const players = Array.from(performanceMap.values()).map((entry) => ({
    ...entry,
    strikeRate: entry.balls > 0 ? Number(((entry.runs / entry.balls) * 100).toFixed(2)) : 0,
    economy: entry.ballsBowled > 0 ? Number((entry.runsConceded / (entry.ballsBowled / 6)).toFixed(2)) : 0,
    runsPerWicket: entry.wickets > 0 ? Number((entry.runsConceded / entry.wickets).toFixed(2)) : null,
  }));

  const addPoints = (entry, value, reason) => {
    if (!entry || !value) {
      return;
    }

    entry.points += value;
    entry.notes.push(`${reason} (+${value})`);
  };

  const byRuns = [...players].sort(
    (left, right) =>
      right.runs - left.runs ||
      left.balls - right.balls ||
      right.wickets - left.wickets ||
      left.name.localeCompare(right.name)
  );
  [10, 7, 3].forEach((points, index) => {
    const target = byRuns[index];
    if (target && target.runs > 0) {
      addPoints(target, points, `${index + 1}${index === 0 ? 'st' : index === 1 ? 'nd' : 'rd'} highest run scorer`);
    }
  });

  const byWickets = [...players].sort(
    (left, right) =>
      right.wickets - left.wickets ||
      left.runsConceded - right.runsConceded ||
      right.runs - left.runs ||
      left.name.localeCompare(right.name)
  );
  [7, 5, 2].forEach((points, index) => {
    const target = byWickets[index];
    if (target && target.wickets > 0) {
      addPoints(target, points, `${index + 1}${index === 0 ? 'st' : index === 1 ? 'nd' : 'rd'} highest wicket taker`);
    }
  });

  const topTenScorers = byRuns.slice(0, 10).filter((entry) => entry.balls > 0 && entry.runs > 0);
  const byStrikeRate = [...topTenScorers].sort(
    (left, right) =>
      right.strikeRate - left.strikeRate ||
      right.runs - left.runs ||
      left.balls - right.balls ||
      left.name.localeCompare(right.name)
  );
  [3, 2, 1].forEach((points, index) => {
    const target = byStrikeRate[index];
    if (target) {
      addPoints(target, points, `${index + 1}${index === 0 ? 'st' : index === 1 ? 'nd' : 'rd'} strike rate in top 10 scorers`);
    }
  });

  const topSevenWicketTakers = byWickets.slice(0, 7).filter((entry) => entry.wickets > 0);
  const byLeastRunsPerWicket = [...topSevenWicketTakers].sort(
    (left, right) =>
      (left.runsPerWicket ?? Number.POSITIVE_INFINITY) - (right.runsPerWicket ?? Number.POSITIVE_INFINITY) ||
      right.wickets - left.wickets ||
      left.name.localeCompare(right.name)
  );
  [3, 2, 1].forEach((points, index) => {
    const target = byLeastRunsPerWicket[index];
    if (target) {
      addPoints(
        target,
        points,
        `${index + 1}${index === 0 ? 'st' : index === 1 ? 'nd' : 'rd'} least runs conceded per wicket (top 7 wicket takers)`
      );
    }
  });

  const economyEligible = players.filter((entry) => entry.ballsBowled > 0);
  const byLeastEconomy = [...economyEligible].sort(
    (left, right) => left.economy - right.economy || right.wickets - left.wickets || left.name.localeCompare(right.name)
  );
  [3, 2, 1].forEach((points, index) => {
    const target = byLeastEconomy[index];
    if (target) {
      addPoints(target, points, `${index + 1}${index === 0 ? 'st' : index === 1 ? 'nd' : 'rd'} least average runs conceded`);
    }
  });

  players.forEach((entry) => {
    addPoints(entry, runMilestoneBonus(entry.runs), 'Innings run milestone');
    addPoints(entry, wicketMilestoneBonus(entry.wickets), 'Innings wicket milestone');
    addPoints(entry, entry.notOut ? 1 : 0, 'Not out as batsman');
  });

  let winnerTeam = '';
  if (secondInnings.score > firstInnings.score) {
    winnerTeam = secondInningsTeamName;
  } else if (secondInnings.score < firstInnings.score) {
    winnerTeam = firstInningsTeamName;
  }

  if (winnerTeam) {
    const winningCaptainId = winnerTeam === ownTeam ? ownSanitizedRoles.captainId : opponentSanitizedRoles.captainId;
    const winningViceCaptainId = winnerTeam === ownTeam ? ownSanitizedRoles.viceCaptainId : opponentSanitizedRoles.viceCaptainId;
    const winningWicketKeeperId = winnerTeam === ownTeam ? ownSanitizedRoles.wicketKeeperId : opponentSanitizedRoles.wicketKeeperId;
    const winningCaptain = players.find((entry) => entry.team === winnerTeam && entry.playerId === winningCaptainId);
    const winningViceCaptain = players.find((entry) => entry.team === winnerTeam && entry.playerId === winningViceCaptainId);
    const winningWicketKeeper = players.find((entry) => entry.team === winnerTeam && entry.playerId === winningWicketKeeperId);
    addPoints(winningCaptain, 1, 'Winning team captain');
    addPoints(winningViceCaptain, 1, 'Winning team vice captain');
    addPoints(winningWicketKeeper, 1, 'Winning team wicket keeper');
  }

  return [...players]
    .sort(
      (left, right) =>
        right.points - left.points ||
        right.runs - left.runs ||
        right.wickets - left.wickets ||
        right.strikeRate - left.strikeRate ||
        left.name.localeCompare(right.name)
    )
    .slice(0, 5)
    .map((entry, index) => ({
      rank: index + 1,
      recommended: index === 0,
      playerId: entry.playerId,
      name: entry.name,
      team: entry.team,
      playerType: entry.playerType,
      isWicketKeeper: entry.isWicketKeeper,
      paceAbility: entry.paceAbility,
      spinAbility: entry.spinAbility,
      abilityToPlayPaceBall: entry.abilityToPlayPaceBall,
      abilityToPlaySpinBall: entry.abilityToPlaySpinBall,
      points: entry.points,
      runs: entry.runs,
      balls: entry.balls,
      notOut: entry.notOut,
      ballsBowled: entry.ballsBowled,
      oversBowled: formatOvers(entry.ballsBowled),
      runsConceded: entry.runsConceded,
      wickets: entry.wickets,
      strikeRate: entry.strikeRate.toFixed(2),
      economy: entry.economy.toFixed(2),
      runsPerWicket: entry.runsPerWicket === null ? '-' : entry.runsPerWicket.toFixed(2),
      notes: entry.notes,
    }));
};
