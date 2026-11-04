import { countBowlingRolePlayers, isBowlingQuotaPlayer } from "../../../gameData/playerTypes";

import { ensurePlayerMeta, isKeeper, battingScore, inferPrimaryRole, isBowlerOrAllrounder, bowlingScore, isUnavailableForSelection, inferBowlingStyle, getPerformanceForPlayer } from "./controllerCommonCoreUtils";

export const selectAIPlayingXI = ({
  roster = [],
  previousXIIds = [],
  lastMatchPerformanceById = {},
  lastMatchPerformanceByName = {},
  requireBowlingQuota = false,
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

    if (requireBowlingQuota) {
      enforceMinimumBowlingRoles(selected, players);
    }
    return selected.slice(0, 11).map((player) => player.id);
  };

  if (isFirstMatch) {
    return buildFirstMatchXI();
  }

  const selected = previousXIIds.map((id) => byId.get(String(id))).filter(Boolean).slice(0, 11);
  const previousXIIdSet = new Set(previousXIIds.map((id) => String(id)));
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

  if (requireBowlingQuota) {
    enforceMinimumBowlingRoles(selected, players, { selectedSet, replaceAt });
  }
  return selected.slice(0, 11).map((player) => player.id);
};

const enforceMinimumBowlingRoles = (selected, roster, selection = {}) => {
  const selectedSet = selection.selectedSet || new Set(selected.map((player) => String(player.id)));
  const replaceAt =
    selection.replaceAt ||
    ((index, replacement) => {
      selectedSet.delete(String(selected[index].id));
      selected[index] = replacement;
      selectedSet.add(String(replacement.id));
    });

  while (countBowlingRolePlayers(selected) < 5) {
    const replacement = roster
      .filter(
        (player) =>
          !selectedSet.has(String(player.id)) &&
          !isUnavailableForSelection(player) &&
          isBowlingQuotaPlayer(player)
      )
      .sort((left, right) => bowlingScore(right) - bowlingScore(left))[0];
    const replaceableIndex = selected
      .map((player, index) => ({ player, index }))
      .filter(({ player }) => !isKeeper(player) && !isBowlingQuotaPlayer(player))
      .sort((left, right) => battingScore(left.player) - battingScore(right.player))[0]?.index;

    if (!replacement || replaceableIndex === undefined) {
      return;
    }

    replaceAt(replaceableIndex, replacement);
  }
};
