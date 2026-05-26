export const MODE_QUICK = 'quick';
export const MODE_SERIES = 'series';
export const MODE_TOURNAMENT = 'tournament';
export const MODE_CAREER = 'career';

export const buildScorecard = (inningsName, inningsState, inningsView, overText) => ({
  title: inningsName,
  line: `${inningsName} ${inningsState.score}/${inningsState.wickets}`,
  overs: overText,
  battingRows: inningsView.battingRows,
  bowlingRows: inningsView.bowlingRows,
});

export const randomKey = (map) => {
  const keys = Object.keys(map || {});
  if (!keys.length) {
    return '';
  }
  return keys[Math.floor(Math.random() * keys.length)];
};

export const runMilestoneBonus = (runs) => {
  if (runs >= 200) {
    return 20;
  }
  if (runs >= 150) {
    return 10;
  }
  if (runs >= 100) {
    return 5;
  }
  if (runs >= 50) {
    return 2;
  }
  if (runs >= 30) {
    return 1;
  }
  return 0;
};

export const wicketMilestoneBonus = (wickets) => {
  if (wickets >= 8) {
    return 20;
  }
  if (wickets >= 6) {
    return 10;
  }
  if (wickets >= 5) {
    return 5;
  }
  if (wickets >= 4) {
    return 2;
  }
  if (wickets >= 3) {
    return 1;
  }
  return 0;
};

export const formatOvers = (balls = 0) => `${Math.floor(balls / 6)}.${balls % 6}`;

export const collectTeamStatsForInnings = ({ teamName, players = [], battingStats = [], bowlingStats = [], targetMap }) => {
  players.forEach((player, index) => {
    if (!player) {
      return;
    }

    const statKey = `${teamName}::${player.id}::${player.name}`;
    if (!targetMap[statKey]) {
      targetMap[statKey] = {
        key: statKey,
        team: teamName,
        name: player.name,
        runs: 0,
        outs: 0,
        wickets: 0,
        balls: 0,
        ballsBowled: 0,
        runsConceded: 0,
        matches: 0,
      };
    }

    const batting = battingStats[index] || {};
    const bowling = bowlingStats[index] || {};
    targetMap[statKey].runs += batting.runs || 0;
    targetMap[statKey].outs += batting.isOut ? 1 : 0;
    targetMap[statKey].balls += batting.balls || 0;
    targetMap[statKey].wickets += bowling.wickets || 0;
    targetMap[statKey].ballsBowled += bowling.balls || 0;
    targetMap[statKey].runsConceded += bowling.runsConceded || 0;
    targetMap[statKey].matches += 1;
  });
};

export const resolveSeriesStanding = (results = [], ownTeamName = '', opponentTeamName = '') =>
  (results || []).reduce(
    (acc, result) => {
      if (result.winnerTeam === ownTeamName) {
        acc.ownWins += 1;
      } else if (result.winnerTeam === opponentTeamName) {
        acc.opponentWins += 1;
      } else {
        acc.ties += 1;
      }
      return acc;
    },
    { ownWins: 0, opponentWins: 0, ties: 0 }
  );

export const shuffleArray = (input = []) => {
  const arr = [...input];
  for (let index = arr.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [arr[index], arr[randomIndex]] = [arr[randomIndex], arr[index]];
  }
  return arr;
};

const addDaysToIsoDate = (baseDate, dayOffset = 0) => {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + dayOffset);
  return date.toISOString().slice(0, 10);
};

export const buildRoundOneFixtures = (teams = [], startDate = new Date().toISOString().slice(0, 10)) => {
  const normalized = teams.filter(Boolean);
  const fixtures = [];
  const pairs = Math.floor(normalized.length / 2);

  for (let index = 0; index < pairs; index += 1) {
    fixtures.push({
      id: `R1-M${index + 1}`,
      round: 1,
      matchNumber: index + 1,
      teamA: normalized[index * 2] || '',
      teamB: normalized[index * 2 + 1] || '',
      date: addDaysToIsoDate(startDate, index),
      winnerTeam: '',
      summary: '',
      isComplete: false,
    });
  }

  return fixtures;
};

export const areRoundFixturesValid = (fixtures = [], expectedTeams = []) => {
  const allTeams = expectedTeams.filter(Boolean);
  if (!fixtures.length || fixtures.length * 2 !== allTeams.length) {
    return false;
  }

  const used = fixtures.flatMap((match) => [match.teamA, match.teamB]).filter(Boolean);
  if (used.length !== allTeams.length) {
    return false;
  }

  const usedSet = new Set(used);
  if (usedSet.size !== allTeams.length) {
    return false;
  }

  return allTeams.every((team) => usedSet.has(team));
};

export const normalizePlayingXIIds = (allPlayers, selectedIds) => {
  const validIds = new Set(allPlayers.map((player) => player.id));
  return Array.from(new Set((selectedIds || []).filter((id) => validIds.has(id)))).slice(0, 11);
};

export const sanitizeRoles = (roles, selectedIds) => {
  const selectedSet = new Set(selectedIds);
  return {
    captainId: selectedSet.has(roles?.captainId) ? roles.captainId : null,
    viceCaptainId: selectedSet.has(roles?.viceCaptainId) ? roles.viceCaptainId : null,
    wicketKeeperId: selectedSet.has(roles?.wicketKeeperId) ? roles.wicketKeeperId : null,
  };
};

export const pickDefaultRoles = (players = [], selectedIds = []) => {
  const selectedSet = new Set(selectedIds);
  const selectedPlayers = players.filter((player) => selectedSet.has(player.id));
  const captainId = selectedPlayers[0]?.id ?? null;
  const viceCaptainId = selectedPlayers[1]?.id ?? selectedPlayers[0]?.id ?? null;
  const keeperId = selectedPlayers.find((player) => player.isWicketKeeper)?.id ?? selectedPlayers[0]?.id ?? null;

  return {
    captainId,
    viceCaptainId,
    wicketKeeperId: keeperId,
  };
};

export const buildPlayingXI = (allPlayers, selectedIds) => {
  const normalizedIds = normalizePlayingXIIds(allPlayers, selectedIds);
  const fallbackIds = allPlayers.slice(0, 11).map((player) => player.id);
  const finalIds = normalizedIds.length === 11 ? normalizedIds : fallbackIds;
  const byId = new Map(allPlayers.map((player) => [player.id, player]));

  return finalIds.map((id) => byId.get(id)).filter(Boolean);
};
