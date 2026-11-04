import React from "react";
import { createPortal } from 'react-dom';
import { AnimatePresence } from "framer-motion";
import { useCricketSimulatorController } from "./hooks/useCricketSimulatorController";
import { stageOrder } from "../../utils/simulatorUtils";
import { matchStatusEnum } from "../../gameData/matchStatusEnum";

import PreMatchStages from "./components/PreMatchStages";
import LiveMatchStages from "./components/LiveMatchStages";
import CareerAnalyticsDashboard from "./components/CareerAnalyticsDashboard";
import TeamNameWithFlag from './components/TeamNameWithFlag';
import PlayerNameWithType from './components/PlayerNameWithType';
import CareerPlayerProfileModal from './components/CareerPlayerProfileModal';
import {
  CAREER_FORMATS,
  formatCareerMatchLabel,
  getCareerFormatStandings,
  sortStandings,
} from './utils/controllerCareerScheduleUtils';
import { buildSaveSummary } from './components/preMatchStageUtils';
import "./simulator.css";

function CricketSimulator({
  onSavedGamesCountChange,
  showSavedGamesDialog = false,
  onCloseSavedGamesDialog,
}) {
  const controller = useCricketSimulatorController();
  const [showDomesticStats, setShowDomesticStats] = React.useState(false);
  const [savePendingDelete, setSavePendingDelete] = React.useState(null);
  const [savedGamesActionError, setSavedGamesActionError] = React.useState('');
  const [careerPlayerModal, setCareerPlayerModal] = React.useState(null);
  const [domesticStatsFormatTab, setDomesticStatsFormatTab] = React.useState('t20');
  const [domesticStatsTeamTab, setDomesticStatsTeamTab] = React.useState('');
  const [showLeagueTable, setShowLeagueTable] = React.useState(false);
  const [showLeaguePlayerStats, setShowLeaguePlayerStats] = React.useState(false);
  const [leagueTableFormatTab, setLeagueTableFormatTab] = React.useState('t20');
  const [leaguePlayerFormatTab, setLeaguePlayerFormatTab] = React.useState('t20');
  const [selectedLeagueCountry, setSelectedLeagueCountry] = React.useState('');
  const [showGlobalPlayerSearch, setShowGlobalPlayerSearch] = React.useState(false);
  const [searchName, setSearchName] = React.useState('');
  const [searchPlayerType, setSearchPlayerType] = React.useState('');
  const [searchCountry, setSearchCountry] = React.useState('');
  const [batVsPaceRange, setBatVsPaceRange] = React.useState('');
  const [batVsSpinRange, setBatVsSpinRange] = React.useState('');
  const [paceAbilityRange, setPaceAbilityRange] = React.useState('');
  const [spinAbilityRange, setSpinAbilityRange] = React.useState('');
  const [aggressionRange, setAggressionRange] = React.useState('');
  const [matchesRange, setMatchesRange] = React.useState('');
  const [runsRange, setRunsRange] = React.useState('');
  const [runsPerMatchRange, setRunsPerMatchRange] = React.useState('');
  const [wicketsRange, setWicketsRange] = React.useState('');
  const [globalSearchPage, setGlobalSearchPage] = React.useState(1);
  const simShellRef = React.useRef(null);
  const {
    game,
    gameMode,
    seriesLength,
    seriesCurrentMatch,
    seriesResults,
    seriesStanding,
    seriesTopRunScorers,
    seriesTopWicketTakers,
    seriesProgressLabel,
    tournamentUserTeam,
    tournamentOpponentTeams,
    tournamentMatches,
    tournamentChampion,
    tournamentResults,
    tournamentTopRunScorers,
    tournamentTopWicketTakers,
    tournamentProgressLabel,
    isCurrentMatchUserInvolved,
    autoSimMode,
    countryList,
    venueStadiums,
    availableVoices,
    matchType,
    matchVisual,
    firstInningsTeamName,
    secondInningsTeamName,
    isUserWinner,
    firstInningsView,
    secondInningsView,
    savedGames,
    isSavingGame,
    isGlobalSaving,
    isSavesLoading,
    saveMessage,
    teamOneFinal,
    teamTwoFinal,
    resultSummary,
    momRecommendations,
    announceManOfTheMatch,
    goToNextStage,
    goToPreviousStage,
    selectGameMode,
    selectSeriesLength,
    toggleTournamentOpponent,
    prepareTournamentFixtures,
    confirmTournamentFixtures,
    randomizeTournamentFixtures,
    updateTournamentFixture,
    matchPrimaryAction,
    simulateCurrentOver,
    simulateFullMatch,
    toggleScoreboard,
    setMatchTypeKey,
    setOwnTeam,
    setOpponentTeam,
    setLocationCountry,
    setSelectedStadium,
    setCommentator,
    setPreferredVoice,
    speak,
    saveGame,
    loadSavedGame,
    deleteSavedGame,
    setBattingIntent,
    setBattingTactics,
    setBowlingIntent,
    setBowlingTactics,
    processDelivery,
    handleSelectOpener,
    handleSelectNextBatter,
    handleSelectBowler,
    handleTossCall,
    handleUserTossDecision,
    ownAvailablePool,
    opponentAvailablePool,
    ownSelectedXIIds,
    opponentSelectedXIIds,
    ownBattingOrderIds,
    opponentBattingOrderIds,
    ownSelectedXIPlayers,
    opponentSelectedXIPlayers,
    ownTeamRoles,
    opponentTeamRoles,
    ownXIReady,
    opponentXIReady,
    ownRolesReady,
    opponentRolesReady,
    moveOwnPlayerToXI,
    removeOwnPlayerFromXI,
    moveOwnPlayerInBattingOrder,
    moveOpponentPlayerToXI,
    removeOpponentPlayerFromXI,
    moveOpponentPlayerInBattingOrder,
    setOwnRole,
    setOpponentRole,
    createCustomPlayer,
    autoPickOwnXI,
    autoPickOpponentXI,
    autoPositionOwnXI,
    autoPositionOpponentXI,
    startMatchWithSelectedXI,
    buildTeamOneScorecard,
    buildTeamTwoScorecard,
    resetMatch,
    oversDisplay,
    careerTeam,
    careerSeason,
    careerFormat,
    careerMatchIndex,
    careerSchedule,
    careerStandings,
    careerPlayerStats,
    careerSeasonHistory,
    careerPlayerProfile,
    careerDomesticCountry,
    careerDomesticTeams,
    careerGlobalPlayerPool,
    careerAuctionSummary,
    careerOffers,
    careerRetired,
    careerTopRunScorers,
    careerTopWicketTakers,
    careerProgressLabel,
    beginCareer,
    handleCareerContinueAfterAuction,
    handleCareerStartNextMatch,
    handleStartNextCareerSeason,
    handleEndCareer,
    handleRetireCareer,
    handleViewCareerHistory,
    handleBackToCareerSchedule,
  } = controller;

  React.useEffect(() => {
    onSavedGamesCountChange?.(Array.isArray(savedGames) ? savedGames.length : 0);
  }, [onSavedGamesCountChange, savedGames]);

  React.useLayoutEffect(() => {
    if (simShellRef.current) {
      simShellRef.current.scrollTop = 0;
    }
  }, [game.stage]);

  const stageIndex = stageOrder.indexOf(game.stage) + 1;
  const stageCommonProps = {
    stageIndex,
    totalStages: stageOrder.length,
    className: `sim-stage-${game.stage}`,
  };
  const isLiveStage = [
    matchStatusEnum.TeamOneBat,
    matchStatusEnum.TeamTwoBat,
    matchStatusEnum.MatchEnd,
    matchStatusEnum.SeriesSummary,
    matchStatusEnum.TournamentChampion,
    matchStatusEnum.CareerSeasonSummary,
    matchStatusEnum.CareerHistory,
  ].includes(game.stage);
  const isCareerMode = gameMode === 'career';

  const normalizedCareerStats = React.useMemo(() => {
    const entries = Object.values(careerPlayerStats || {});
    const byTeamAndPlayerId = new Map();
    const byTeamAndName = new Map();

    entries.forEach((entry) => {
      const keyParts = String(entry?.key || '').split('::');
      const team = entry?.team || keyParts[0] || '';
      const playerId = keyParts[1] || '';
      const playerName = entry?.name || keyParts[2] || '';

      if (team && playerId) {
        byTeamAndPlayerId.set(`${team}::${playerId}`, entry);
      }
      if (team && playerName) {
        byTeamAndName.set(`${team}::${playerName}`, entry);
      }
    });

    return { byTeamAndPlayerId, byTeamAndName };
  }, [careerPlayerStats]);

  const domesticTeamStatsByFormat = React.useMemo(() => {
    const domesticTeams = (careerDomesticTeams || []).filter(
      (team) => !careerDomesticCountry || team.country === careerDomesticCountry
    );

    return CAREER_FORMATS.reduce((acc, format) => {
      acc[format] = domesticTeams.map((team) => {
        const rows = (team.players || []).map((player) => {
          const fromId = normalizedCareerStats.byTeamAndPlayerId.get(`${team.name}::${player.id}`);
          const fromName = normalizedCareerStats.byTeamAndName.get(`${team.name}::${player.name}`);
          const entry = fromId || fromName || {};
          const formatStats = entry.formatStats?.[format] || {};
          const ballsBowled = Number(formatStats.ballsBowled || 0);
          const wickets = Number(formatStats.wickets || 0);
          const runsConceded = Number(formatStats.runsConceded || 0);
          const outs = Number(formatStats.outs || 0);
          const runs = Number(formatStats.runs || 0);
          const balls = Number(formatStats.balls || 0);
          return {
            ...player,
            runs,
            balls,
            outs,
            wickets,
            matches: Number(formatStats.matches || 0),
            ballsBowled,
            runsConceded,
            overs: `${Math.floor(ballsBowled / 6)}.${ballsBowled % 6}`,
            strikeRate: balls > 0 ? ((runs * 100) / balls).toFixed(2) : '0.00',
            battingAverage: outs > 0 ? (runs / outs).toFixed(2) : 'NA',
            economy: ballsBowled > 0 ? ((runsConceded * 6) / ballsBowled).toFixed(2) : '0.00',
            bowlingAverage: wickets > 0 ? (runsConceded / wickets).toFixed(2) : 'NA',
          };
        });

        rows.sort((left, right) => right.runs - left.runs || right.wickets - left.wickets || left.name.localeCompare(right.name));
        return {
          teamName: team.name,
          rows,
        };
      });
      return acc;
    }, {});
  }, [careerDomesticCountry, careerDomesticTeams, normalizedCareerStats]);

  const domesticTeamsForSelectedFormat = React.useMemo(
    () => domesticTeamStatsByFormat[domesticStatsFormatTab] || [],
    [domesticTeamStatsByFormat, domesticStatsFormatTab]
  );

  const selectedDomesticTeamStats = React.useMemo(
    () => domesticTeamsForSelectedFormat.find((entry) => entry.teamName === domesticStatsTeamTab) || null,
    [domesticTeamsForSelectedFormat, domesticStatsTeamTab]
  );

  React.useEffect(() => {
    if (!domesticTeamsForSelectedFormat.length) {
      if (domesticStatsTeamTab !== '') {
        setDomesticStatsTeamTab('');
      }
      return;
    }

    const hasCurrentTeam = domesticTeamsForSelectedFormat.some((entry) => entry.teamName === domesticStatsTeamTab);
    if (!hasCurrentTeam) {
      setDomesticStatsTeamTab(domesticTeamsForSelectedFormat[0].teamName);
    }
  }, [domesticTeamsForSelectedFormat, domesticStatsTeamTab]);

  const currentUserSeasonStats = React.useMemo(() => {
    if (!careerPlayerProfile?.name) {
      return null;
    }

    const byId = careerPlayerProfile.playerId
      ? normalizedCareerStats.byTeamAndPlayerId.get(`${careerTeam}::${careerPlayerProfile.playerId}`)
      : null;
    const byName = normalizedCareerStats.byTeamAndName.get(`${careerTeam}::${careerPlayerProfile.name}`);
    const stats = byId || byName || null;
    const ballsBowled = Number(stats?.ballsBowled || 0);

    return {
      ...careerPlayerProfile,
      runs: Number(stats?.runs || 0),
      balls: Number(stats?.balls || 0),
      wickets: Number(stats?.wickets || 0),
      matches: Number(stats?.matches || 0),
      outs: Number(stats?.outs || 0),
      overs: `${Math.floor(ballsBowled / 6)}.${ballsBowled % 6}`,
      runsConceded: Number(stats?.runsConceded || 0),
    };
  }, [careerPlayerProfile, careerTeam, normalizedCareerStats]);

  const buildCareerPlayerProfileData = React.useCallback((player, teamNameHint = '') => {
    if (!player?.name) {
      return null;
    }

    const teamName = teamNameHint || player.team || '';
    const fromId = player.id ? normalizedCareerStats.byTeamAndPlayerId.get(`${teamName}::${player.id}`) : null;
    const fromName = normalizedCareerStats.byTeamAndName.get(`${teamName}::${player.name}`);
    const stats = fromId || fromName || {};
    const teamRoster = (careerDomesticTeams || []).find((team) => team.name === teamName)?.players || [];
    const rosterPlayer = player.id
      ? teamRoster.find((entry) => String(entry.id) === String(player.id))
      : teamRoster.find((entry) => entry.name === player.name);
    const base = rosterPlayer || player;
    const ballsBowled = Number(stats.ballsBowled || player.ballsBowled || 0);
    const runsConceded = Number(stats.runsConceded || player.runsConceded || 0);

    return {
      ...base,
      team: teamName,
      runs: Number(stats.runs || player.runs || 0),
      balls: Number(stats.balls || player.balls || 0),
      wickets: Number(stats.wickets || player.wickets || 0),
      matches: Number(stats.matches || player.matches || 0),
      outs: Number(stats.outs || player.outs || 0),
      ballsBowled,
      overs: `${Math.floor(ballsBowled / 6)}.${ballsBowled % 6}`,
      runsConceded,
      economy: ballsBowled > 0 ? ((runsConceded * 6) / ballsBowled).toFixed(2) : '0.00',
      strikeRate: Number(stats.balls || player.balls || 0) > 0
        ? ((Number(stats.runs || player.runs || 0) * 100) / Number(stats.balls || player.balls || 0)).toFixed(2)
        : '0.00',
      battingAverage: Number(stats.outs || player.outs || 0) > 0
        ? (Number(stats.runs || player.runs || 0) / Number(stats.outs || player.outs || 0)).toFixed(2)
        : 'NA',
      bowlingAverage: Number(stats.wickets || player.wickets || 0) > 0
        ? (runsConceded / Number(stats.wickets || player.wickets || 0)).toFixed(2)
        : 'NA',
    };
  }, [careerDomesticTeams, normalizedCareerStats]);

  const openCareerPlayerProfile = React.useCallback((player, teamNameHint = '', title = 'Player Season Stats and Ability') => {
    const profile = buildCareerPlayerProfileData(player, teamNameHint);
    if (!profile) {
      return;
    }

    setCareerPlayerModal({
      title,
      player: profile,
    });
  }, [buildCareerPlayerProfileData]);

  const leagueTableStandingsForSelectedFormat = React.useMemo(
    () => getCareerFormatStandings(careerStandings || {}, leagueTableFormatTab),
    [careerStandings, leagueTableFormatTab]
  );

  const teamCountryByName = React.useMemo(() => {
    const map = new Map();
    (careerDomesticTeams || []).forEach((team) => {
      if (team?.name) {
        map.set(team.name, team.country || '');
      }
    });
    return map;
  }, [careerDomesticTeams]);

  const leagueTableRowsForSelectedCountry = React.useMemo(() => {
    const currentRows = sortStandings(leagueTableStandingsForSelectedFormat);

    if (!selectedLeagueCountry) {
      return currentRows;
    }

    const selectedTeams = (careerDomesticTeams || []).filter((team) => team.country === selectedLeagueCountry);
    const standingsByTeam = new Map(currentRows.map((row) => [row.team, row]));

    const selectedCountryStandings = selectedTeams.reduce((acc, team) => {
      const row = standingsByTeam.get(team.name) || {};
      acc[team.name] = {
        wins: Number(row.wins || 0),
        losses: Number(row.losses || 0),
        ties: Number(row.ties || 0),
        points: Number(row.points || 0),
        played: Number(row.played || 0),
      };
      return acc;
    }, {});

    return sortStandings(selectedCountryStandings);
  }, [careerDomesticTeams, leagueTableStandingsForSelectedFormat, selectedLeagueCountry]);

  const leaguePlayerStatsByFormat = React.useMemo(() => {
    const teamCountryMap = new Map();
    (careerDomesticTeams || []).forEach((team) => {
      if (team?.name) {
        teamCountryMap.set(team.name, team.country || '');
      }
    });

    const entries = Object.values(careerPlayerStats || {}).filter((entry) => entry && entry.name);
    const byFormat = CAREER_FORMATS.reduce((acc, format) => {
      const players = entries
        .filter((entry) => !selectedLeagueCountry || teamCountryMap.get(entry.team) === selectedLeagueCountry)
        .map((entry) => {
        const formatEntry = entry.formatStats?.[format];
        if (!formatEntry) {
          return {
            ...entry,
            runs: 0,
            wickets: 0,
            balls: 0,
            ballsBowled: 0,
            runsConceded: 0,
            matches: 0,
            outs: 0,
          };
        }

        return {
          ...entry,
          runs: Number(formatEntry.runs || 0),
          wickets: Number(formatEntry.wickets || 0),
          balls: Number(formatEntry.balls || 0),
          ballsBowled: Number(formatEntry.ballsBowled || 0),
          runsConceded: Number(formatEntry.runsConceded || 0),
          matches: Number(formatEntry.matches || 0),
          outs: Number(formatEntry.outs || 0),
        };
      }).filter((entry) => entry.matches > 0 || entry.runs > 0 || entry.wickets > 0);

      const topScorers = [...players]
        .sort((left, right) => right.runs - left.runs || left.balls - right.balls || left.name.localeCompare(right.name))
        .slice(0, 20);

      const topWicketTakers = [...players]
        .sort((left, right) => right.wickets - left.wickets || left.runsConceded - right.runsConceded || left.name.localeCompare(right.name))
        .slice(0, 20);

      acc[format] = { topScorers, topWicketTakers };
      return acc;
    }, {});

    return byFormat;
  }, [careerDomesticTeams, careerPlayerStats, selectedLeagueCountry]);

  const availableLeagueCountries = React.useMemo(() => {
    const countrySet = new Set((careerDomesticTeams || []).map((team) => team.country).filter(Boolean));
    return [...countrySet].sort((left, right) => left.localeCompare(right));
  }, [careerDomesticTeams]);

  React.useEffect(() => {
    if (!availableLeagueCountries.length) {
      if (selectedLeagueCountry !== '') {
        setSelectedLeagueCountry('');
      }
      return;
    }

    if (!selectedLeagueCountry || !availableLeagueCountries.includes(selectedLeagueCountry)) {
      const preferred = availableLeagueCountries.includes(careerDomesticCountry)
        ? careerDomesticCountry
        : availableLeagueCountries[0];
      setSelectedLeagueCountry(preferred);
    }
  }, [availableLeagueCountries, selectedLeagueCountry, careerDomesticCountry]);

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

  const globalPoolCountryCounts = React.useMemo(() => {
    const map = new Map();
    (careerGlobalPlayerPool || []).forEach((player) => {
      const country = String(player?.country || 'Unknown');
      if (!map.has(country)) {
        map.set(country, { country, assigned: 0, unassigned: 0, total: 0 });
      }
      const entry = map.get(country);
      entry.total += 1;
      if (player?.assignedTeamId) {
        entry.assigned += 1;
      } else {
        entry.unassigned += 1;
      }
    });

    return [...map.values()].sort((left, right) => left.country.localeCompare(right.country));
  }, [careerGlobalPlayerPool]);

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

  const loadSavedGameFromDialog = async (save) => {
    setSavedGamesActionError('');
    try {
      await loadSavedGame(save);
      onCloseSavedGamesDialog?.();
    } catch (error) {
      setSavedGamesActionError(error instanceof Error ? error.message : 'Unable to load this saved match.');
    }
  };

  const deleteSavedGameFromDialog = async () => {
    if (!savePendingDelete) {
      return;
    }

    setSavedGamesActionError('');
    try {
      await deleteSavedGame(savePendingDelete);
      setSavePendingDelete(null);
    } catch (error) {
      setSavedGamesActionError(error instanceof Error ? error.message : 'Unable to delete this saved match.');
    }
  };

  return (
    <div className="sim-shell" ref={simShellRef}>
      <CareerAnalyticsDashboard
      isCareerMode={isCareerMode}
      careerTeam={careerTeam}
      careerDomesticCountry={careerDomesticCountry}
      careerDomesticTeams={careerDomesticTeams}
      careerPlayerStats={careerPlayerStats}
      careerPlayerProfile={careerPlayerProfile}
      careerStandings={careerStandings}
      careerGlobalPlayerPool={careerGlobalPlayerPool}
    />

      {isGlobalSaving ? (
        <div className="sim-saving-overlay" role="status" aria-live="polite">
          <span className="sim-saving-ball" aria-hidden="true" />
          <p>Saving match...</p>
        </div>
      ) : null}
      <AnimatePresence mode="wait">
        {isLiveStage ? (
          <>
            <div className="sim-top-strip">
              <p>
                {isCareerMode
                  ? `Career — ${matchType.nameKey.toUpperCase()}`
                  : gameMode === 'series'
                  ? `${matchType.nameKey.toUpperCase()} Series`
                  : gameMode === 'tournament'
                    ? `${matchType.nameKey.toUpperCase()} Tournament`
                    : `${matchType.nameKey.toUpperCase()} Match`}
              </p>
              <p>
                <TeamNameWithFlag teamName={game.ownTeam} /> vs <TeamNameWithFlag teamName={game.opponentTeam} />
              </p>
              <p>
                {isCareerMode
                  ? careerProgressLabel
                  : gameMode === 'tournament'
                  ? tournamentProgressLabel
                  : seriesProgressLabel}
              </p>
              <p>Venue: {game.selectedStadium || game.locationCountry}</p>
            </div>
            <LiveMatchStages
              key={`live-${game.stage}`}
              stage={game.stage}
              stageCommonProps={stageCommonProps}
              game={game}
              matchType={matchType}
              firstInningsTeamName={firstInningsTeamName}
              secondInningsTeamName={secondInningsTeamName}
              firstInningsView={firstInningsView}
              secondInningsView={secondInningsView}
              setBattingIntent={setBattingIntent}
              setBattingTactics={setBattingTactics}
              setBowlingIntent={setBowlingIntent}
              setBowlingTactics={setBowlingTactics}
              onSaveGame={saveGame}
              isSavingGame={isSavingGame}
              saveMessage={saveMessage}
              processDelivery={processDelivery}
              handleSelectOpener={handleSelectOpener}
              handleSelectNextBatter={handleSelectNextBatter}
              handleSelectBowler={handleSelectBowler}
              toggleScoreboard={toggleScoreboard}
              buildTeamOneScorecard={buildTeamOneScorecard}
              buildTeamTwoScorecard={buildTeamTwoScorecard}
              teamOneFinal={teamOneFinal}
              teamTwoFinal={teamTwoFinal}
              resultSummary={resultSummary}
              momRecommendations={momRecommendations}
              onSelectManOfTheMatch={announceManOfTheMatch}
              gameMode={gameMode}
              seriesLength={seriesLength}
              seriesCurrentMatch={seriesCurrentMatch}
              seriesResults={seriesResults}
              seriesStanding={seriesStanding}
              seriesTopRunScorers={seriesTopRunScorers}
              seriesTopWicketTakers={seriesTopWicketTakers}
              tournamentChampion={tournamentChampion}
              tournamentResults={tournamentResults}
              tournamentTopRunScorers={tournamentTopRunScorers}
              tournamentTopWicketTakers={tournamentTopWicketTakers}
              isCurrentMatchUserInvolved={isCurrentMatchUserInvolved}
              autoSimMode={autoSimMode}
              onMatchPrimaryAction={matchPrimaryAction}
              onSimulateOver={simulateCurrentOver}
              onSimulateMatch={simulateFullMatch}
              resetMatch={resetMatch}
              oversDisplay={oversDisplay}
              careerTeam={careerTeam}
              careerSeason={careerSeason}
              careerFormat={careerFormat}
              careerMatchIndex={careerMatchIndex}
              careerSchedule={careerSchedule}
              careerStandings={careerStandings}
              careerPlayerStats={careerPlayerStats}
              careerSeasonHistory={careerSeasonHistory}
              careerPlayerProfile={careerPlayerProfile}
              careerDomesticCountry={careerDomesticCountry}
              careerDomesticTeams={careerDomesticTeams}
              careerOffers={careerOffers}
              careerRetired={careerRetired}
              careerTopRunScorers={careerTopRunScorers}
              careerTopWicketTakers={careerTopWicketTakers}
              careerProgressLabel={careerProgressLabel}
              handleStartNextCareerSeason={handleStartNextCareerSeason}
              handleEndCareer={handleEndCareer}
              handleRetireCareer={handleRetireCareer}
              handleViewCareerHistory={handleViewCareerHistory}
              handleBackToCareerSchedule={handleBackToCareerSchedule}
            />
          </>
        ) : (
          <PreMatchStages
            key={`pre-${game.stage}`}
            stage={game.stage}
            stageCommonProps={stageCommonProps}
            game={game}
            countryList={countryList}
            venueStadiums={venueStadiums}
            availableVoices={availableVoices}
            matchVisual={matchVisual}
            goToNextStage={goToNextStage}
            goToPreviousStage={goToPreviousStage}
            selectGameMode={selectGameMode}
            selectSeriesLength={selectSeriesLength}
            tournamentUserTeam={tournamentUserTeam}
            tournamentOpponentTeams={tournamentOpponentTeams}
            tournamentMatches={tournamentMatches}
            toggleTournamentOpponent={toggleTournamentOpponent}
            prepareTournamentFixtures={prepareTournamentFixtures}
            confirmTournamentFixtures={confirmTournamentFixtures}
            randomizeTournamentFixtures={randomizeTournamentFixtures}
            updateTournamentFixture={updateTournamentFixture}
            setMatchTypeKey={setMatchTypeKey}
            setOwnTeam={setOwnTeam}
            setOpponentTeam={setOpponentTeam}
            setLocationCountry={setLocationCountry}
            setSelectedStadium={setSelectedStadium}
            setCommentator={setCommentator}
            setPreferredVoice={setPreferredVoice}
            speak={speak}
            savedGames={savedGames}
            isSavesLoading={isSavesLoading}
            saveMessage={saveMessage}
            onLoadSavedGame={loadSavedGame}
            onDeleteSavedGame={deleteSavedGame}
            handleTossCall={handleTossCall}
            handleUserTossDecision={handleUserTossDecision}
            isUserWinner={isUserWinner}
            ownAvailablePool={ownAvailablePool}
            opponentAvailablePool={opponentAvailablePool}
            ownSelectedXIIds={ownSelectedXIIds}
            opponentSelectedXIIds={opponentSelectedXIIds}
            ownBattingOrderIds={ownBattingOrderIds}
            opponentBattingOrderIds={opponentBattingOrderIds}
            ownSelectedXIPlayers={ownSelectedXIPlayers}
            opponentSelectedXIPlayers={opponentSelectedXIPlayers}
            ownTeamRoles={ownTeamRoles}
            opponentTeamRoles={opponentTeamRoles}
            ownXIReady={ownXIReady}
            opponentXIReady={opponentXIReady}
            ownRolesReady={ownRolesReady}
            opponentRolesReady={opponentRolesReady}
            moveOwnPlayerToXI={moveOwnPlayerToXI}
            removeOwnPlayerFromXI={removeOwnPlayerFromXI}
            moveOwnPlayerInBattingOrder={moveOwnPlayerInBattingOrder}
            moveOpponentPlayerToXI={moveOpponentPlayerToXI}
            removeOpponentPlayerFromXI={removeOpponentPlayerFromXI}
            moveOpponentPlayerInBattingOrder={moveOpponentPlayerInBattingOrder}
            setOwnRole={setOwnRole}
            setOpponentRole={setOpponentRole}
            createCustomPlayer={createCustomPlayer}
            autoPickOwnXI={autoPickOwnXI}
            autoPickOpponentXI={autoPickOpponentXI}
            autoPositionOwnXI={autoPositionOwnXI}
            autoPositionOpponentXI={autoPositionOpponentXI}
            startMatchWithSelectedXI={startMatchWithSelectedXI}
            beginCareer={beginCareer}
            careerTeam={careerTeam}
            careerSeason={careerSeason}
            careerMatchIndex={careerMatchIndex}
            careerSchedule={careerSchedule}
            careerStandings={careerStandings}
            careerPlayerProfile={careerPlayerProfile}
            careerDomesticCountry={careerDomesticCountry}
            careerDomesticTeams={careerDomesticTeams}
            careerGlobalPlayerPool={careerGlobalPlayerPool}
            careerAuctionSummary={careerAuctionSummary}
            careerOffers={careerOffers}
            careerRetired={careerRetired}
            handleCareerContinueAfterAuction={handleCareerContinueAfterAuction}
            handleCareerStartNextMatch={handleCareerStartNextMatch}
            handleViewCareerHistory={handleViewCareerHistory}
          />
        )}
      </AnimatePresence>

      {showSavedGamesDialog
        ? createPortal(
          <div className="dashboard-b-saved-overlay apex-theme" role="dialog" aria-modal="true" aria-labelledby="dashboard-b-saved-title">
            <section className="dashboard-b-saved-dialog">
              <header className="dashboard-b-saved-header">
                <div>
                  <p className="dashboard-b-saved-kicker">MATCH VAULT</p>
                  <h2 id="dashboard-b-saved-title">Saved Matches &amp; Sessions</h2>
                </div>
                <button
                  type="button"
                  className="dashboard-b-saved-close"
                  aria-label="Close saved matches"
                  onClick={() => {
                    setSavedGamesActionError('');
                    setSavePendingDelete(null);
                    onCloseSavedGamesDialog?.();
                  }}
                >
                  ×
                </button>
              </header>

              {isSavesLoading ? <p className="dashboard-b-saved-empty">Loading saved matches...</p> : null}
              {!isSavesLoading && !savedGames?.length ? (
                <p className="dashboard-b-saved-empty">No saved matches yet. Save a match to see it here.</p>
              ) : null}
              {!isSavesLoading && savedGames?.length ? (
                <div className="dashboard-b-saved-list">
                  {savedGames.map((save) => {
                    const updatedAt = save?.updatedAt?.toDate
                      ? save.updatedAt.toDate()
                      : save?.updatedAt
                        ? new Date(save.updatedAt)
                        : null;
                    const updatedText = updatedAt && !Number.isNaN(updatedAt.getTime())
                      ? updatedAt.toLocaleString()
                      : 'Recently updated';

                    return (
                      <article key={save.id} className="dashboard-b-saved-item">
                        <div>
                          <h3>{save.title || 'Saved Match'}</h3>
                          <p>{buildSaveSummary(save, matchStatusEnum)}</p>
                          <small>{updatedText}</small>
                        </div>
                        <div className="dashboard-b-saved-item-actions">
                          <button type="button" onClick={() => loadSavedGameFromDialog(save)}>
                            LOAD MATCH
                          </button>
                          <button
                            type="button"
                            className="dashboard-b-saved-delete"
                            onClick={() => setSavePendingDelete(save)}
                          >
                            DELETE
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : null}
              {savedGamesActionError ? (
                <p className="dashboard-b-saved-error" role="alert">{savedGamesActionError}</p>
              ) : null}
              {saveMessage ? <p className="dashboard-b-saved-empty">{saveMessage}</p> : null}

              {savePendingDelete ? (
                <div className="dashboard-b-delete-overlay" role="alertdialog" aria-modal="true" aria-labelledby="dashboard-b-delete-title">
                  <section className="dashboard-b-delete-dialog">
                    <h3 id="dashboard-b-delete-title">Delete saved match?</h3>
                    <p>This will permanently remove “{savePendingDelete.title || 'Saved Match'}”.</p>
                    <div>
                      <button type="button" onClick={() => setSavePendingDelete(null)}>CANCEL</button>
                      <button type="button" className="dashboard-b-saved-delete" onClick={deleteSavedGameFromDialog}>
                        DELETE MATCH
                      </button>
                    </div>
                  </section>
                </div>
              ) : null}
            </section>
          </div>,
          document.body
        )
        : null}
    </div>
  );
}

export default CricketSimulator;
