import React from "react";
import { AnimatePresence } from "framer-motion";
import { useCricketSimulatorController } from "./hooks/useCricketSimulatorController";
import { stageOrder } from "../../utils/simulatorUtils";
import { matchStatusEnum } from "../../gameData/matchStatusEnum";
import AppButton from '../../components/ui/AppButton';
import PreMatchStages from "./components/PreMatchStages";
import LiveMatchStages from "./components/LiveMatchStages";
import TeamNameWithFlag from './components/TeamNameWithFlag';
import PlayerNameWithType from './components/PlayerNameWithType';
import CareerPlayerProfileModal from './components/CareerPlayerProfileModal';
import {
  CAREER_FORMATS,
  formatCareerMatchLabel,
  getCareerFormatStandings,
  sortStandings,
} from './utils/controllerCareerScheduleUtils';
import "./simulator.css";

function CricketSimulator() {
  const controller = useCricketSimulatorController();
  const [showDomesticStats, setShowDomesticStats] = React.useState(false);
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
    setBowlingIntent,
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
    moveOpponentPlayerToXI,
    removeOpponentPlayerFromXI,
    setOwnRole,
    setOpponentRole,
    createCustomPlayer,
    autoPickOwnXI,
    autoPickOpponentXI,
    startMatchWithSelectedXI,
    buildTeamOneScorecard,
    buildTeamTwoScorecard,
    resetMatch,
    oversDisplay,
    careerTeam,
    careerSeason,
    careerSeasonLength,
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
    careerOffers,
    careerRetired,
    careerTopRunScorers,
    careerTopWicketTakers,
    careerProgressLabel,
    beginCareer,
    handleCareerStartNextMatch,
    handleStartNextCareerSeason,
    handleEndCareer,
    handleRetireCareer,
    handleViewCareerHistory,
    handleBackToCareerSchedule,
  } = controller;

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

  return (
    <div className="sim-shell">
      {isCareerMode ? (
        <div className="sim-career-tools">
          <AppButton
            text="Domestic Teams Season Stats"
            onClick={() => setShowDomesticStats(true)}
            fullWidth={false}
            variant="secondary"
          />
          <AppButton
            text="My Current Stats/Ability"
            onClick={() => openCareerPlayerProfile(currentUserSeasonStats, careerTeam, 'My Current Season Stats and Ability')}
            fullWidth={false}
            variant="secondary"
            disabled={!currentUserSeasonStats}
          />
          <AppButton
            text="See League Table"
            onClick={() => setShowLeagueTable(true)}
            fullWidth={false}
            variant="secondary"
          />
          <AppButton
            text="See League Player Statistics"
            onClick={() => setShowLeaguePlayerStats(true)}
            fullWidth={false}
            variant="secondary"
          />
          <AppButton
            text="Search Players Worldwide"
            onClick={() => setShowGlobalPlayerSearch(true)}
            fullWidth={false}
            variant="secondary"
          />
        </div>
      ) : null}

      {showDomesticStats ? (
        <div className="sim-confirm-overlay" role="dialog" aria-modal="true" aria-label="Domestic team season statistics">
          <div className="sim-confirm-modal sim-career-stats-modal">
            <button
              type="button"
              className="sim-modal-top-close"
              aria-label="Close"
              onClick={() => setShowDomesticStats(false)}
            >
              ×
            </button>
            <h4>Domestic Teams - Current Season Player Statistics</h4>
            <div className="sim-career-format-tabs" role="tablist" aria-label="Domestic player stats format tabs">
              {CAREER_FORMATS.map((format) => (
                <button
                  key={`domestic-player-tab-${format}`}
                  type="button"
                  className={`sim-career-format-tab ${domesticStatsFormatTab === format ? 'active' : ''}`}
                  role="tab"
                  aria-selected={domesticStatsFormatTab === format}
                  onClick={() => setDomesticStatsFormatTab(format)}
                >
                  {formatCareerMatchLabel(format)}
                </button>
              ))}
            </div>
            <div className="sim-career-format-tabs" role="tablist" aria-label="Domestic teams tabs">
              {domesticTeamsForSelectedFormat.map((entry) => (
                <button
                  key={`domestic-team-tab-${domesticStatsFormatTab}-${entry.teamName}`}
                  type="button"
                  className={`sim-career-format-tab ${domesticStatsTeamTab === entry.teamName ? 'active' : ''}`}
                  role="tab"
                  aria-selected={domesticStatsTeamTab === entry.teamName}
                  onClick={() => setDomesticStatsTeamTab(entry.teamName)}
                >
                  {entry.teamName}
                </button>
              ))}
            </div>
            <div className="sim-career-stats-scroll">
              {selectedDomesticTeamStats ? (
                <div key={selectedDomesticTeamStats.teamName} className="sim-scoreboard-panel">
                  <h4 className="sim-section-title">{selectedDomesticTeamStats.teamName}</h4>

                  <h4 className="sim-section-title">Batting</h4>
                  <table className="sim-scoreboard-table">
                    <thead>
                      <tr>
                        <th>Player</th>
                        <th>Mat</th>
                        <th>Runs</th>
                        <th>Balls</th>
                        <th>Outs</th>
                        <th>Avg</th>
                        <th>SR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...selectedDomesticTeamStats.rows]
                        .sort((left, right) => right.runs - left.runs || left.outs - right.outs || left.name.localeCompare(right.name))
                        .map((player) => (
                        <tr key={`${selectedDomesticTeamStats.teamName}-${player.id}`}>
                          <td>
                            <button
                              type="button"
                              className="sim-player-link-btn"
                              onClick={() => openCareerPlayerProfile(player, selectedDomesticTeamStats.teamName)}
                            >
                              <PlayerNameWithType player={player} />
                            </button>
                          </td>
                          <td>{player.matches}</td>
                          <td>{player.runs}</td>
                          <td>{player.balls}</td>
                          <td>{player.outs}</td>
                          <td>{player.battingAverage}</td>
                          <td>{player.strikeRate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <h4 className="sim-section-title">Bowling</h4>
                  <table className="sim-scoreboard-table">
                    <thead>
                      <tr>
                        <th>Player</th>
                        <th>Mat</th>
                        <th>Overs</th>
                        <th>Balls</th>
                        <th>Runs</th>
                        <th>Wkts</th>
                        <th>Econ</th>
                        <th>Avg</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...selectedDomesticTeamStats.rows]
                        .sort(
                          (left, right) =>
                            right.wickets - left.wickets ||
                            Number(left.economy) - Number(right.economy) ||
                            left.name.localeCompare(right.name)
                        )
                        .map((player) => (
                        <tr key={`${selectedDomesticTeamStats.teamName}-${player.id}-bowl`}>
                          <td>
                            <button
                              type="button"
                              className="sim-player-link-btn"
                              onClick={() => openCareerPlayerProfile(player, selectedDomesticTeamStats.teamName)}
                            >
                              <PlayerNameWithType player={player} />
                            </button>
                          </td>
                          <td>{player.matches}</td>
                          <td>{player.overs}</td>
                          <td>{player.ballsBowled}</td>
                          <td>{player.runsConceded}</td>
                          <td>{player.wickets}</td>
                          <td>{player.economy}</td>
                          <td>{player.bowlingAverage}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No team data available for this format yet.</p>
              )}
            </div>
            <div className="sim-save-row-actions">
              <AppButton text="Close" variant="secondary" fullWidth={false} onClick={() => setShowDomesticStats(false)} />
            </div>
          </div>
        </div>
      ) : null}

      {showLeagueTable ? (
        <div className="sim-confirm-overlay" role="dialog" aria-modal="true" aria-label="League table by format">
          <div className="sim-confirm-modal sim-career-stats-modal">
            <button
              type="button"
              className="sim-modal-top-close"
              aria-label="Close"
              onClick={() => setShowLeagueTable(false)}
            >
              ×
            </button>
            <h4>League Table</h4>
            <div className="sim-career-inline-fields">
              <label htmlFor="league-table-country-select">Country</label>
              <select
                id="league-table-country-select"
                className="sim-career-input"
                value={selectedLeagueCountry}
                onChange={(event) => setSelectedLeagueCountry(event.target.value)}
              >
                <option value="">Select country</option>
                {availableLeagueCountries.map((country) => (
                  <option key={`league-table-country-${country}`} value={country}>{country}</option>
                ))}
              </select>
            </div>
            <div className="sim-career-format-tabs" role="tablist" aria-label="League table format tabs">
              {CAREER_FORMATS.map((format) => (
                <button
                  key={`league-table-tab-${format}`}
                  type="button"
                  className={`sim-career-format-tab ${leagueTableFormatTab === format ? 'active' : ''}`}
                  role="tab"
                  aria-selected={leagueTableFormatTab === format}
                  onClick={() => setLeagueTableFormatTab(format)}
                >
                  {formatCareerMatchLabel(format)}
                </button>
              ))}
            </div>
            <div className="sim-career-stats-scroll">
              <div className="sim-scoreboard-panel">
                <h4 className="sim-section-title">{formatCareerMatchLabel(leagueTableFormatTab)} Standings ({selectedLeagueCountry || 'N/A'})</h4>
                <table className="sim-scoreboard-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Team</th>
                      <th>P</th>
                      <th>W</th>
                      <th>L</th>
                      <th>T</th>
                      <th>Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leagueTableRowsForSelectedCountry.map((row, index) => (
                      <tr key={`league-table-${leagueTableFormatTab}-${row.team}`}>
                        <td>{index + 1}</td>
                        <td>{row.team}</td>
                        <td>{row.played}</td>
                        <td>{row.wins}</td>
                        <td>{row.losses}</td>
                        <td>{row.ties}</td>
                        <td><strong>{row.points}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="sim-save-row-actions">
              <AppButton text="Close" variant="secondary" fullWidth={false} onClick={() => setShowLeagueTable(false)} />
            </div>
          </div>
        </div>
      ) : null}

      {showLeaguePlayerStats ? (
        <div className="sim-confirm-overlay" role="dialog" aria-modal="true" aria-label="League player statistics by format">
          <div className="sim-confirm-modal sim-career-stats-modal">
            <button
              type="button"
              className="sim-modal-top-close"
              aria-label="Close"
              onClick={() => setShowLeaguePlayerStats(false)}
            >
              ×
            </button>
            <h4>League Player Statistics</h4>
            <div className="sim-career-inline-fields">
              <label htmlFor="league-player-country-select">Country</label>
              <select
                id="league-player-country-select"
                className="sim-career-input"
                value={selectedLeagueCountry}
                onChange={(event) => setSelectedLeagueCountry(event.target.value)}
              >
                <option value="">Select country</option>
                {availableLeagueCountries.map((country) => (
                  <option key={`league-player-country-${country}`} value={country}>{country}</option>
                ))}
              </select>
            </div>
            <div className="sim-career-format-tabs" role="tablist" aria-label="League player stats format tabs">
              {CAREER_FORMATS.map((format) => (
                <button
                  key={`league-player-tab-${format}`}
                  type="button"
                  className={`sim-career-format-tab ${leaguePlayerFormatTab === format ? 'active' : ''}`}
                  role="tab"
                  aria-selected={leaguePlayerFormatTab === format}
                  onClick={() => setLeaguePlayerFormatTab(format)}
                >
                  {formatCareerMatchLabel(format)}
                </button>
              ))}
            </div>
            <div className="sim-career-stats-scroll">
              <div className="sim-scoreboard-panel">
                <h4 className="sim-section-title">Top 20 Scorers ({selectedLeagueCountry || 'N/A'} - {formatCareerMatchLabel(leaguePlayerFormatTab)})</h4>
                <table className="sim-scoreboard-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Player</th>
                      <th>Team</th>
                      <th>Mat</th>
                      <th>Runs</th>
                      <th>Balls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(leaguePlayerStatsByFormat[leaguePlayerFormatTab]?.topScorers || []).map((entry, index) => (
                      <tr key={`league-scorer-${leaguePlayerFormatTab}-${entry.key}`}>
                        <td>{index + 1}</td>
                        <td>
                          <button
                            type="button"
                            className="sim-player-link-btn"
                            onClick={() => openCareerPlayerProfile(entry, entry.team)}
                          >
                            <PlayerNameWithType player={entry} />
                          </button>
                        </td>
                        <td>{entry.team}</td>
                        <td>{entry.matches}</td>
                        <td>{entry.runs}</td>
                        <td>{entry.balls}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="sim-scoreboard-panel">
                <h4 className="sim-section-title">Top 20 Wicket Takers ({selectedLeagueCountry || 'N/A'} - {formatCareerMatchLabel(leaguePlayerFormatTab)})</h4>
                <table className="sim-scoreboard-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Player</th>
                      <th>Team</th>
                      <th>Mat</th>
                      <th>Wkts</th>
                      <th>Overs</th>
                      <th>Runs Conceded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(leaguePlayerStatsByFormat[leaguePlayerFormatTab]?.topWicketTakers || []).map((entry, index) => (
                      <tr key={`league-wicket-${leaguePlayerFormatTab}-${entry.key}`}>
                        <td>{index + 1}</td>
                        <td>
                          <button
                            type="button"
                            className="sim-player-link-btn"
                            onClick={() => openCareerPlayerProfile(entry, entry.team)}
                          >
                            <PlayerNameWithType player={entry} />
                          </button>
                        </td>
                        <td>{entry.team}</td>
                        <td>{entry.matches}</td>
                        <td>{entry.wickets}</td>
                        <td>{`${Math.floor((entry.ballsBowled || 0) / 6)}.${(entry.ballsBowled || 0) % 6}`}</td>
                        <td>{entry.runsConceded}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="sim-save-row-actions">
              <AppButton text="Close" variant="secondary" fullWidth={false} onClick={() => setShowLeaguePlayerStats(false)} />
            </div>
          </div>
        </div>
      ) : null}

      {showGlobalPlayerSearch ? (
        <div className="sim-confirm-overlay" role="dialog" aria-modal="true" aria-label="Global player search">
          <div className="sim-confirm-modal sim-career-stats-modal" style={{ width: '95vw', maxWidth: '1600px' }}>
            <button
              type="button"
              className="sim-modal-top-close"
              aria-label="Close"
              onClick={() => setShowGlobalPlayerSearch(false)}
            >
              ×
            </button>
            <h4>Search Players Worldwide</h4>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginTop: 8 }}>
              <div style={{ maxWidth: '200px', width: '100%', flex: '0 0 200px' }}>
                <div className="sim-career-inline-fields" style={{ display: 'grid', gap: 8 }}>
                  <input
                    className="sim-career-input"
                    type="text"
                    placeholder="Player Name"
                    value={searchName}
                    onChange={(event) => setSearchName(event.target.value)}
                  />
                  <select className="sim-career-input" value={searchPlayerType} onChange={(event) => setSearchPlayerType(event.target.value)}>
                    <option value="">All Player Types</option>
                    {globalPlayerTypeOptions.map((type) => (
                      <option key={`search-player-type-${type}`} value={type}>{type}</option>
                    ))}
                  </select>
                  <select className="sim-career-input" value={searchCountry} onChange={(event) => setSearchCountry(event.target.value)}>
                    <option value="">All Countries</option>
                    {availableLeagueCountries.map((country) => (
                      <option key={`search-country-${country}`} value={country}>{country}</option>
                    ))}
                  </select>
                  <input className="sim-career-input" type="text" placeholder="Bat vs Pace (e.g. 30-80)" value={batVsPaceRange} onChange={(event) => setBatVsPaceRange(event.target.value)} />
                  <input className="sim-career-input" type="text" placeholder="Bat vs Spin (e.g. 30-80)" value={batVsSpinRange} onChange={(event) => setBatVsSpinRange(event.target.value)} />
                  <input className="sim-career-input" type="text" placeholder="Pace Ability (e.g. 40-90)" value={paceAbilityRange} onChange={(event) => setPaceAbilityRange(event.target.value)} />
                  <input className="sim-career-input" type="text" placeholder="Spin Ability (e.g. 20-70)" value={spinAbilityRange} onChange={(event) => setSpinAbilityRange(event.target.value)} />
                  <input className="sim-career-input" type="text" placeholder="Aggression (e.g. 50-95)" value={aggressionRange} onChange={(event) => setAggressionRange(event.target.value)} />
                  <input className="sim-career-input" type="text" placeholder="Matches (e.g. 5-20)" value={matchesRange} onChange={(event) => setMatchesRange(event.target.value)} />
                  <input className="sim-career-input" type="text" placeholder="Total Runs (e.g. 200-900)" value={runsRange} onChange={(event) => setRunsRange(event.target.value)} />
                  <input className="sim-career-input" type="text" placeholder="Runs/Match (e.g. 20-60)" value={runsPerMatchRange} onChange={(event) => setRunsPerMatchRange(event.target.value)} />
                  <input className="sim-career-input" type="text" placeholder="Total Wickets (e.g. 5-30)" value={wicketsRange} onChange={(event) => setWicketsRange(event.target.value)} />
                </div>
              </div>

              <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                <div className="sim-career-inline-fields" style={{ marginBottom: 8 }}>
                  <span className="sim-series-length-card" style={{ padding: '6px 10px' }}>Players: {totalFilteredPlayers}</span>
                </div>

                <div className="sim-career-stats-scroll">
                  <div className="sim-scoreboard-panel">
                    <h4 className="sim-section-title">Players List ({totalFilteredPlayers})</h4>
                    {!hasGlobalSearchFilters ? (
                      <p>Enter at least one filter to load players.</p>
                    ) : (
                      <table className="sim-scoreboard-table">
                        <thead>
                          <tr>
                            <th>Player</th>
                            <th>Country</th>
                            <th>Team</th>
                            <th>Type</th>
                            <th>Bat vs Pace</th>
                            <th>Bat vs Spin</th>
                            <th>Pace</th>
                            <th>Spin</th>
                            <th>Aggression</th>
                            <th>Mat</th>
                            <th>Runs</th>
                            <th>Runs/Mat</th>
                            <th>Wkts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedGlobalPlayers.map((player) => (
                            <tr key={`global-search-${player.id}`}>
                              <td>{player.name}</td>
                              <td>{player.country}</td>
                              <td>{player.team}</td>
                              <td>{player.playerType}</td>
                              <td>{player.batVsPace}</td>
                              <td>{player.batVsSpin}</td>
                              <td>{player.paceAbility}</td>
                              <td>{player.spinAbility}</td>
                              <td>{player.aggression}</td>
                              <td>{player.matches}</td>
                              <td>{player.runs}</td>
                              <td>{player.runsPerMatch.toFixed(2)}</td>
                              <td>{player.wickets}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="sim-save-row-actions">
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="sim-series-length-card" style={{ padding: '6px 10px' }}>Page {normalizedGlobalSearchPage} of {totalSearchPages}</span>
                <AppButton text="Prev" onClick={() => setGlobalSearchPage((previous) => Math.max(1, previous - 1))} fullWidth={false} variant="secondary" disabled={normalizedGlobalSearchPage <= 1} />
                <AppButton text="Next" onClick={() => setGlobalSearchPage((previous) => Math.min(totalSearchPages, previous + 1))} fullWidth={false} variant="secondary" disabled={normalizedGlobalSearchPage >= totalSearchPages} />
                <AppButton text="Close" variant="secondary" fullWidth={false} onClick={() => setShowGlobalPlayerSearch(false)} />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <CareerPlayerProfileModal
        isOpen={!!careerPlayerModal?.player}
        title={careerPlayerModal?.title || 'Player Season Stats and Ability'}
        player={careerPlayerModal?.player || null}
        onClose={() => setCareerPlayerModal(null)}
      />

      {isGlobalSaving ? (
        <div className="sim-saving-overlay" role="status" aria-live="polite">
          <div className="sim-saving-ball">🏏</div>
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
              setBowlingIntent={setBowlingIntent}
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
              careerSeasonLength={careerSeasonLength}
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
            moveOpponentPlayerToXI={moveOpponentPlayerToXI}
            removeOpponentPlayerFromXI={removeOpponentPlayerFromXI}
            setOwnRole={setOwnRole}
            setOpponentRole={setOpponentRole}
            createCustomPlayer={createCustomPlayer}
            autoPickOwnXI={autoPickOwnXI}
            autoPickOpponentXI={autoPickOpponentXI}
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
            careerOffers={careerOffers}
            careerRetired={careerRetired}
            handleCareerStartNextMatch={handleCareerStartNextMatch}
            handleViewCareerHistory={handleViewCareerHistory}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default CricketSimulator;
