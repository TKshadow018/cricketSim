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

const clampPlayerMetric = (value, min = 0, max = 100) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return min;
  }
  return Math.max(min, Math.min(max, numeric));
};

const hashSeed = (value) => {
  const text = String(value || 'player');
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return hash;
};

const inferPlayerBucket = (player = {}) => {
  const normalizedType = String(player?.playerType || '').trim().toLowerCase();
  const battingSkill = Number(player?.abilityToPlayPaceBall || 0) + Number(player?.abilityToPlaySpinBall || 0);
  const bowlingSkill = Math.max(Number(player?.paceAbility || 0), Number(player?.spinAbility || 0));

  if (player?.isWicketKeeper || normalizedType.includes('wicketkeeper')) {
    return 'wicketkeeper';
  }

  if (normalizedType.includes('allrounder')) {
    return 'allrounder';
  }

  if (
    normalizedType.includes('bowler') ||
    normalizedType.includes('pacer') ||
    normalizedType.includes('spinner') ||
    normalizedType.includes('spiner')
  ) {
    return 'bowler';
  }

  if (bowlingSkill >= 30 && battingSkill >= 70) {
    return 'allrounder';
  }

  if (bowlingSkill >= 30) {
    return 'bowler';
  }

  return 'batsman';
};

export const getBattingOrderCoeffRange = (player = {}) => {
  const bucket = inferPlayerBucket(player);

  if (bucket === 'bowler') {
    return [1, 30];
  }

  if (bucket === 'wicketkeeper' || bucket === 'allrounder') {
    return [40, 90];
  }

  return [50, 100];
};

export const buildRandomBattingOrderCoeff = (player = {}) => {
  const [min, max] = getBattingOrderCoeffRange(player);
  return min + Math.floor(Math.random() * (max - min + 1));
};

const buildDeterministicBattingOrderCoeff = (player = {}) => {
  const [min, max] = getBattingOrderCoeffRange(player);
  const seed = `${player?.id || ''}|${player?.name || ''}|${player?.team || ''}|${player?.country || ''}|${player?.playerType || ''}`;
  return min + (hashSeed(seed) % (max - min + 1));
};

export const ensurePlayerMeta = (player = {}) => ({
  ...player,
  fitness: clampPlayerMetric(player?.fitness ?? 100),
  morale: clampPlayerMetric(player?.morale ?? 50),
  form: clampPlayerMetric(player?.form ?? 50),
  confidence: clampPlayerMetric(player?.confidence ?? 50),
  battingOrderCoeff: clampPlayerMetric(
    player?.battingOrderCoeff ?? buildDeterministicBattingOrderCoeff(player),
    1,
    100
  ),
});

export const sortPlayersByBattingOrder = (players = []) =>
  (players || [])
    .map((player) => ensurePlayerMeta(player))
    .sort(
      (left, right) =>
        right.battingOrderCoeff - left.battingOrderCoeff ||
        (Number(right.abilityToPlayPaceBall || 0) + Number(right.abilityToPlaySpinBall || 0)) -
          (Number(left.abilityToPlayPaceBall || 0) + Number(left.abilityToPlaySpinBall || 0)) ||
        String(left.name || '').localeCompare(String(right.name || ''))
    );

export const collectTeamStatsForInnings = ({ teamName, players = [], battingStats = [], bowlingStats = [], targetMap }) => {
  players.forEach((player, index) => {
    if (!player) {
      return;
    }

    const statKey = `${teamName}::${player.id}::${player.name}`;
    if (!targetMap[statKey]) {
      targetMap[statKey] = {
        key: statKey,
        playerId: player.id,
        team: teamName,
        name: player.name,
        playerType: player.playerType || '',
        isWicketKeeper: !!player.isWicketKeeper,
        paceAbility: player.paceAbility || 0,
        spinAbility: player.spinAbility || 0,
        abilityToPlayPaceBall: player.abilityToPlayPaceBall || 0,
        abilityToPlaySpinBall: player.abilityToPlaySpinBall || 0,
        fitness: player.fitness ?? 100,
        morale: player.morale ?? 50,
        battingOrderCoeff: player.battingOrderCoeff ?? buildDeterministicBattingOrderCoeff(player),
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

  return sortPlayersByBattingOrder(finalIds.map((id) => byId.get(id)).filter(Boolean));
};

const normalizeRoleType = (player = {}) => String(player?.playerType || '').trim().toLowerCase();

const isKeeper = (player = {}) => !!player?.isWicketKeeper || normalizeRoleType(player).includes('wicketkeeper');

const inferPrimaryRole = (player = {}) => {
  if (isKeeper(player)) {
    return 'wicketkeeper';
  }

  const type = normalizeRoleType(player);
  if (type.includes('allrounder')) {
    return 'allrounder';
  }
  if (type.includes('bowler') || type.includes('pacer') || type.includes('spinner') || type.includes('spiner')) {
    return 'bowler';
  }

  const bat = Number(player?.abilityToPlayPaceBall || 0) + Number(player?.abilityToPlaySpinBall || 0);
  const bowl = Math.max(Number(player?.paceAbility || 0), Number(player?.spinAbility || 0));
  if (bowl >= 30 && bat >= 70) {
    return 'allrounder';
  }
  if (bowl >= 30) {
    return 'bowler';
  }

  return 'batsman';
};

const inferBowlingStyle = (player = {}) => {
  const type = normalizeRoleType(player);
  if (type.includes('pace') || type.includes('pacer')) {
    return 'pace';
  }
  if (type.includes('spin') || type.includes('spinner') || type.includes('spiner')) {
    return 'spin';
  }

  return Number(player?.paceAbility || 0) >= Number(player?.spinAbility || 0) ? 'pace' : 'spin';
};

const isBowlerOrAllrounder = (player = {}) => {
  const role = inferPrimaryRole(player);
  return role === 'bowler' || role === 'allrounder';
};

const battingScore = (player = {}) => Number(player?.abilityToPlayPaceBall || 0) + Number(player?.abilityToPlaySpinBall || 0);
const bowlingScore = (player = {}) => Math.max(Number(player?.paceAbility || 0), Number(player?.spinAbility || 0));
const isUnavailableForSelection = (player = {}) => Number(player?.fitness ?? 100) < 30 || Number(player?.morale ?? 50) < 10;

const getPerformanceForPlayer = ({ player, byId = {}, byName = {} }) => {
  const byIdEntry = byId[String(player?.id ?? '')];
  if (byIdEntry) {
    return byIdEntry;
  }

  return byName[String(player?.name || '')] || { runs: 0, wickets: 0 };
};

export const selectAIPlayingXI = ({
  roster = [],
  previousXIIds = [],
  lastMatchPerformanceById = {},
  lastMatchPerformanceByName = {},
}) => {
  const players = (roster || []).map((player) => ensurePlayerMeta(player));
  const byId = new Map(players.map((player) => [String(player.id), player]));
  const isFirstMatch = !Array.isArray(previousXIIds) || previousXIIds.length === 0;

  const buildFirstMatchXI = () => {
    const selected = [];
    const selectedSet = new Set();
    const pick = (candidate) => {
      if (!candidate || selectedSet.has(String(candidate.id)) || selected.length >= 11) {
        return;
      }
      selected.push(candidate);
      selectedSet.add(String(candidate.id));
    };

    const keeper = [...players.filter((player) => isKeeper(player))].sort((a, b) => battingScore(b) - battingScore(a))[0];
    pick(keeper || [...players].sort((a, b) => battingScore(b) - battingScore(a))[0]);

    const battingCandidates = [...players]
      .filter((player) => inferPrimaryRole(player) === 'batsman' && !selectedSet.has(String(player.id)))
      .sort((a, b) => battingScore(b) - battingScore(a));
    const bowlerAllrounderCandidates = [...players]
      .filter((player) => isBowlerOrAllrounder(player) && !selectedSet.has(String(player.id)))
      .sort((a, b) => bowlingScore(b) - bowlingScore(a));

    const maxBatsmen = 4;
    const minBatsmen = 3;
    const minBowlerAllrounders = 6;
    const maxBowlerAllrounders = 7;

    let targetBatsmen = Math.min(maxBatsmen, battingCandidates.length);
    if (targetBatsmen < minBatsmen && battingCandidates.length >= minBatsmen) {
      targetBatsmen = minBatsmen;
    }
    if (targetBatsmen < minBatsmen && bowlerAllrounderCandidates.length >= maxBowlerAllrounders) {
      targetBatsmen = Math.min(targetBatsmen, minBatsmen);
    }

    let targetBowlerAllrounders = 10 - targetBatsmen;
    targetBowlerAllrounders = Math.max(minBowlerAllrounders, Math.min(maxBowlerAllrounders, targetBowlerAllrounders));

    battingCandidates.slice(0, targetBatsmen).forEach(pick);

    bowlerAllrounderCandidates.slice(0, targetBowlerAllrounders).forEach(pick);

    const countSelectedRoles = () => ({
      batsmen: selected.filter((player) => inferPrimaryRole(player) === 'batsman').length,
      bowlerAllrounders: selected.filter((player) => isBowlerOrAllrounder(player)).length,
    });

    const remainingCandidates = [...players]
      .filter((player) => !selectedSet.has(String(player.id)))
      .sort((a, b) => battingScore(b) - battingScore(a) || bowlingScore(b) - bowlingScore(a));

    remainingCandidates.forEach((candidate) => {
      const counts = countSelectedRoles();
      const role = inferPrimaryRole(candidate);

      if (role === 'batsman' && counts.batsmen >= maxBatsmen && counts.bowlerAllrounders < maxBowlerAllrounders) {
        return;
      }
      if (isBowlerOrAllrounder(candidate) && counts.bowlerAllrounders >= maxBowlerAllrounders && counts.batsmen < maxBatsmen) {
        return;
      }

      pick(candidate);
    });

    remainingCandidates.forEach(pick);

    return selected.slice(0, 11).map((player) => player.id);
  };

  if (isFirstMatch) {
    return buildFirstMatchXI();
  }

  const selected = previousXIIds.map((id) => byId.get(String(id))).filter(Boolean).slice(0, 11);
  const previousXIIdSet = new Set((previousXIIds || []).map((id) => String(id)));
  const selectedSet = new Set(selected.map((player) => String(player.id)));

  const getBench = () => players.filter((player) => !selectedSet.has(String(player.id)));

  const popBestBench = (predicate, sorter) => {
    const bench = getBench().filter((player) => !isUnavailableForSelection(player)).filter(predicate || (() => true));
    if (!bench.length) {
      return null;
    }
    bench.sort(sorter);
    return bench[0];
  };

  const replaceAt = (index, replacement) => {
    if (!replacement) {
      return;
    }
    selectedSet.delete(String(selected[index].id));
    selected[index] = replacement;
    selectedSet.add(String(replacement.id));
  };

  const replacementSorterByBatting = (a, b) => battingScore(b) - battingScore(a) || bowlingScore(b) - bowlingScore(a);
  const replacementSorterByBowling = (a, b) => bowlingScore(b) - bowlingScore(a) || battingScore(b) - battingScore(a);

  const selectedRoleCounts = () => {
    const counts = {
      batsman: 0,
      bowler: 0,
      wicketkeeper: 0,
      allrounder: 0,
      paceBowler: 0,
      spinBowler: 0,
    };

    selected.forEach((player) => {
      const role = inferPrimaryRole(player);
      counts[role] += 1;
      if (role === 'bowler') {
        const style = inferBowlingStyle(player);
        if (style === 'pace') {
          counts.paceBowler += 1;
        } else {
          counts.spinBowler += 1;
        }
      }
    });

    return counts;
  };

  const pickReplacementForRole = (player) => {
    const role = inferPrimaryRole(player);
    if (role === 'wicketkeeper') {
      return popBestBench((entry) => inferPrimaryRole(entry) === 'wicketkeeper', replacementSorterByBatting);
    }

    if (role === 'batsman') {
      return popBestBench((entry) => inferPrimaryRole(entry) === 'batsman', replacementSorterByBatting);
    }

    if (role === 'bowler') {
      return popBestBench((entry) => inferPrimaryRole(entry) === 'bowler', replacementSorterByBowling);
    }

    if (role === 'allrounder') {
      const counts = selectedRoleCounts();
      if (counts.batsman < 4) {
        const batsmanReplacement = popBestBench((entry) => inferPrimaryRole(entry) === 'batsman', replacementSorterByBatting);
        if (batsmanReplacement) {
          return batsmanReplacement;
        }
      }

      if (counts.paceBowler + counts.spinBowler < 3) {
        const bowlerReplacement = popBestBench((entry) => inferPrimaryRole(entry) === 'bowler', replacementSorterByBowling);
        if (bowlerReplacement) {
          return bowlerReplacement;
        }
      }

      return popBestBench((entry) => inferPrimaryRole(entry) === 'allrounder', replacementSorterByBowling);
    }

    return null;
  };

  selected.forEach((player, index) => {
    if (!isUnavailableForSelection(player)) {
      return;
    }

    const replacement =
      pickReplacementForRole(player) ||
      popBestBench((entry) => inferPrimaryRole(entry) === inferPrimaryRole(player), replacementSorterByBatting) ||
      popBestBench(null, replacementSorterByBatting);

    replaceAt(index, replacement);
  });

  selected.forEach((player, index) => {
    if (isKeeper(player) || isBowlerOrAllrounder(player)) {
      return;
    }

    if (!previousXIIdSet.has(String(player.id))) {
      return;
    }

    const performance = getPerformanceForPlayer({ player, byId: lastMatchPerformanceById, byName: lastMatchPerformanceByName });
    if (Number(performance.runs || 0) >= 10) {
      return;
    }

    const replacement = pickReplacementForRole(player) || popBestBench(null, replacementSorterByBatting);
    replaceAt(index, replacement);
  });

  const currentBowlerIndices = selected
    .map((player, index) => ({ player, index }))
    .filter(({ player }) => !isKeeper(player) && isBowlerOrAllrounder(player));

  const bowlingAlternativesByRole = {
    bowler: getBench()
      .filter((player) => inferPrimaryRole(player) === 'bowler' && !isUnavailableForSelection(player))
      .sort(replacementSorterByBowling),
    allrounder: getBench()
      .filter((player) => inferPrimaryRole(player) === 'allrounder' && !isUnavailableForSelection(player))
      .sort(replacementSorterByBowling),
  };

  const totalRoleAlternatives =
    (bowlingAlternativesByRole.bowler?.length || 0) + (bowlingAlternativesByRole.allrounder?.length || 0);

  if (currentBowlerIndices.length && totalRoleAlternatives) {
    const replacementCount = Math.min(currentBowlerIndices.length, totalRoleAlternatives, Math.floor(Math.random() * 3) + 1);
    const worstCurrent = [...currentBowlerIndices]
      .sort((left, right) => {
        const leftPerf = getPerformanceForPlayer({ player: left.player, byId: lastMatchPerformanceById, byName: lastMatchPerformanceByName });
        const rightPerf = getPerformanceForPlayer({ player: right.player, byId: lastMatchPerformanceById, byName: lastMatchPerformanceByName });
        return (
          Number(leftPerf.wickets || 0) - Number(rightPerf.wickets || 0) ||
          bowlingScore(left.player) - bowlingScore(right.player)
        );
      })
      .slice(0, replacementCount);

    worstCurrent.forEach(({ index, player }) => {
      const role = inferPrimaryRole(player);
      const bucket = role === 'allrounder' ? 'allrounder' : 'bowler';
      const replacement = bowlingAlternativesByRole[bucket]?.shift() || bowlingAlternativesByRole.bowler?.shift() || bowlingAlternativesByRole.allrounder?.shift();
      replaceAt(index, replacement);
    });
  }

  while (selected.length < 11) {
    const fallback = popBestBench(null, replacementSorterByBatting) || getBench()[0];
    if (!fallback) {
      break;
    }
    selected.push(fallback);
    selectedSet.add(String(fallback.id));
  }

  return selected.slice(0, 11).map((player) => player.id);
};
