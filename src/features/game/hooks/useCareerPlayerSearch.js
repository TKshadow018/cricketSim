import React from "react";

function useCareerPlayerSearch({
    careerGlobalPlayerPool,
    normalizedCareerStats,
    showGlobalPlayerSearch,
    searchName,
    searchPlayerType,
    searchCountry,
    batVsPaceRange,
    batVsSpinRange,
    paceAbilityRange,
    spinAbilityRange,
    aggressionRange,
    matchesRange,
    runsRange,
    runsPerMatchRange,
    wicketsRange,
    globalSearchPage,
    setGlobalSearchPage,
}) {
const hasGlobalSearchFilters = React.useMemo(() => {
    return [
      searchName,
      searchPlayerType,
      searchCountry,
      batVsPaceRange,
      batVsSpinRange,
      paceAbilityRange,
      spinAbilityRange,
      aggressionRange,
      matchesRange,
      runsRange,
      runsPerMatchRange,
      wicketsRange,
    ].some((value) => String(value || '').trim() !== '');
  }, [
    searchName,
    searchPlayerType,
    searchCountry,
    batVsPaceRange,
    batVsSpinRange,
    paceAbilityRange,
    spinAbilityRange,
    aggressionRange,
    matchesRange,
    runsRange,
    runsPerMatchRange,
    wicketsRange,
  ]);

const searchableGlobalPlayers = React.useMemo(() => {
    if (!showGlobalPlayerSearch || !hasGlobalSearchFilters) {
      return [];
    }

    const rows = (careerGlobalPlayerPool || []).map((player) => {
      const teamName = player.assignedTeamName || '';
      const statById = teamName && player?.id
        ? normalizedCareerStats.byTeamAndPlayerId.get(`${teamName}::${player.id}`)
        : null;
      const statByName = teamName && player?.name
        ? normalizedCareerStats.byTeamAndName.get(`${teamName}::${player.name}`)
        : null;
      const stats = statById || statByName || {};
      const runs = Number(stats.runs || 0);
      const wickets = Number(stats.wickets || 0);
      const matches = Number(stats.matches || 0);
      const outs = Number(stats.outs || 0);
      const runsConceded = Number(stats.runsConceded || 0);
      const battingAverage = outs > 0 ? runs / outs : runs > 0 ? runs : 0;
      const bowlingAverage = wickets > 0 ? runsConceded / wickets : null;
      const runsPerMatch = matches > 0 ? runs / matches : 0;
      const batVsPace = Number(player.abilityToPlayPaceBall || 0);
      const batVsSpin = Number(player.abilityToPlaySpinBall || 0);
      const paceAbility = Number(player.paceAbility || 0);
      const spinAbility = Number(player.spinAbility || 0);
      const aggression = Number(player.battingAggresion || 0);
      const abilityScore = Number(player.abilityScore || (
        batVsPace +
        batVsSpin +
        aggression +
        paceAbility +
        spinAbility
      ));

      return {
        id: player.id,
        name: player.name,
        team: teamName || 'Unassigned',
        country: player.country || '',
        playerType: player.playerType || '',
        batVsPace,
        batVsSpin,
        paceAbility,
        spinAbility,
        aggression,
        matches,
        abilityScore,
        runs,
        runsPerMatch,
        wickets,
        battingAverage,
        bowlingAverage,
        baseMarketPrice: Number(player.baseMarketPrice || 0),
      };
    });

    return rows;
  }, [careerGlobalPlayerPool, hasGlobalSearchFilters, normalizedCareerStats, showGlobalPlayerSearch]);

const globalPlayerTypeOptions = React.useMemo(() => {
    const set = new Set(
      (careerGlobalPlayerPool || [])
        .map((player) => String(player.playerType || '').trim())
        .filter(Boolean)
    );
    return [...set].sort((left, right) => left.localeCompare(right));
  }, [careerGlobalPlayerPool]);

const filteredGlobalPlayers = React.useMemo(() => {
    const nameQuery = String(searchName || '').trim().toLowerCase();
    const inRange = (value, rangeRaw) => {
      const text = String(rangeRaw || '').trim();
      if (!text) {
        return true;
      }

      const bounded = text.match(/^(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)$/);
      if (bounded) {
        const first = Number(bounded[1]);
        const second = Number(bounded[2]);
        const min = Math.min(first, second);
        const max = Math.max(first, second);
        return Number(value) >= min && Number(value) <= max;
      }

      const single = Number(text);
      if (Number.isFinite(single)) {
        return Number(value) >= single;
      }

      return true;
    };

    return searchableGlobalPlayers
      .filter((player) => !nameQuery || String(player.name || '').toLowerCase().includes(nameQuery))
      .filter((player) => !searchCountry || player.country === searchCountry)
      .filter((player) => !searchPlayerType || player.playerType === searchPlayerType)
      .filter((player) => inRange(player.batVsPace, batVsPaceRange))
      .filter((player) => inRange(player.batVsSpin, batVsSpinRange))
      .filter((player) => inRange(player.paceAbility, paceAbilityRange))
      .filter((player) => inRange(player.spinAbility, spinAbilityRange))
      .filter((player) => inRange(player.aggression, aggressionRange))
      .filter((player) => inRange(player.matches, matchesRange))
      .filter((player) => inRange(player.runs, runsRange))
      .filter((player) => inRange(player.runsPerMatch, runsPerMatchRange))
      .filter((player) => inRange(player.wickets, wicketsRange))
      .sort((left, right) => right.abilityScore - left.abilityScore || right.runs - left.runs || right.wickets - left.wickets);
  }, [
    searchableGlobalPlayers,
    searchName,
    searchCountry,
    searchPlayerType,
    batVsPaceRange,
    batVsSpinRange,
    paceAbilityRange,
    spinAbilityRange,
    aggressionRange,
    matchesRange,
    runsRange,
    runsPerMatchRange,
    wicketsRange,
  ]);

React.useEffect(() => {
    setGlobalSearchPage(1);
  }, [
    searchName,
    searchCountry,
    searchPlayerType,
    batVsPaceRange,
    batVsSpinRange,
    paceAbilityRange,
    spinAbilityRange,
    aggressionRange,
    matchesRange,
    runsRange,
    runsPerMatchRange,
    wicketsRange,
  ]);

const totalFilteredPlayers = filteredGlobalPlayers.length;

const totalSearchPages = Math.max(1, Math.ceil(totalFilteredPlayers / 25));

const normalizedGlobalSearchPage = Math.min(Math.max(1, globalSearchPage), totalSearchPages);

React.useEffect(() => {
    if (globalSearchPage !== normalizedGlobalSearchPage) {
      setGlobalSearchPage(normalizedGlobalSearchPage);
    }
  }, [globalSearchPage, normalizedGlobalSearchPage]);

const paginatedGlobalPlayers = React.useMemo(() => {
    const start = (normalizedGlobalSearchPage - 1) * 25;
    return filteredGlobalPlayers.slice(start, start + 25);
  }, [filteredGlobalPlayers, normalizedGlobalSearchPage]);

  return {
    hasGlobalSearchFilters,
    searchableGlobalPlayers,
    globalPlayerTypeOptions,
    filteredGlobalPlayers,
    totalFilteredPlayers,
    totalSearchPages,
    normalizedGlobalSearchPage,
    paginatedGlobalPlayers,
  };
}

export default useCareerPlayerSearch;
