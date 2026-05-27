import { useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { getEffectiveAuthUser } from '../../../config/runtimeConfig';
import { battingAction, bowlingAction } from '../../../gameData/actionType';
import { countries } from '../../../gameData/countries';
import { stadiums } from '../../../gameData/stadiums';
import { getPlayersForNations, playerListForNation } from '../../../gameData/playerListForNation';
import { matchTypeList } from '../../../gameData/matchTypeList';
import { matchStatusEnum } from '../../../gameData/matchStatusEnum';
import {
  resetMatchRuntime,
  resetMatchForCareer,
  setGameMode as setGameModeAction,
  setBattingIntent as setBattingIntentAction,
  setBowlingIntent as setBowlingIntentAction,
  setCommentator as setCommentatorAction,
  setFirstBattingSide as setFirstBattingSideAction,
  setFirstInnings as setFirstInningsAction,
  setLocationCountry as setLocationCountryAction,
  setMatchCondition as setMatchConditionAction,
  setMatchTypeKey as setMatchTypeKeyAction,
  setOpponentCustomPlayers as setOpponentCustomPlayersAction,
  setOpponentPlayingXI as setOpponentPlayingXIAction,
  setOpponentTeamRoles as setOpponentTeamRolesAction,
  setOpponentTeam as setOpponentTeamAction,
  setOwnCustomPlayers as setOwnCustomPlayersAction,
  setOwnPlayingXI as setOwnPlayingXIAction,
  setOwnTeamRoles as setOwnTeamRolesAction,
  setOwnTeam as setOwnTeamAction,
  setSecondInnings as setSecondInningsAction,
  setSelectedStadium as setSelectedStadiumAction,
  setSeriesCurrentMatch as setSeriesCurrentMatchAction,
  setSeriesLength as setSeriesLengthAction,
  setSeriesPlayerStats as setSeriesPlayerStatsAction,
  setSeriesResults as setSeriesResultsAction,
  setTournamentChampion as setTournamentChampionAction,
  setTournamentCurrentMatchId as setTournamentCurrentMatchIdAction,
  setTournamentMatches as setTournamentMatchesAction,
  setTournamentOpponentTeams as setTournamentOpponentTeamsAction,
  setTournamentPlayerStats as setTournamentPlayerStatsAction,
  setTournamentUserTeam as setTournamentUserTeamAction,
  setShowScoreboard as setShowScoreboardAction,
  setStage as setStageAction,
  setTossCall as setTossCallAction,
  setTossDecision as setTossDecisionAction,
  setTossWinner as setTossWinnerAction,
  toggleShowScoreboard,
  setCareerTeam as setCareerTeamAction,
  setCareerPlayerProfile as setCareerPlayerProfileAction,
  setCareerDomesticCountry as setCareerDomesticCountryAction,
  setCareerDomesticTeams as setCareerDomesticTeamsAction,
  setCareerOffers as setCareerOffersAction,
  setCareerRetired as setCareerRetiredAction,
  setCareerSeason as setCareerSeasonAction,
  setCareerSeasonLength as setCareerSeasonLengthAction,
  setCareerFormat as setCareerFormatAction,
  setCareerMatchIndex as setCareerMatchIndexAction,
  setCareerSchedule as setCareerScheduleAction,
  setCareerStandings as setCareerStandingsAction,
  setCareerPlayerStats as setCareerPlayerStatsAction,
  setCareerSeasonHistory as setCareerSeasonHistoryAction,
} from '../gameSlice';
import {
  setPreferredVoice,
  speak,
} from '../../../utils/speechUtils';
import {
  resolveResultSummary,
  stageOrder,
} from '../../../utils/simulatorUtils';
import {
  MODE_SERIES,
  MODE_TOURNAMENT,
  MODE_CAREER,
  buildPlayingXI,
  normalizePlayingXIIds,
  pickDefaultRoles,
  sanitizeRoles,
} from '../utils/controllerCommonUtils';
import { createNavigationHandlers } from './controller/controllerNavigation';
import { useControllerRuntimeFromContext } from './controller/useControllerRuntimeFromContext';
import { buildMainControllerApi } from './controller/buildMainControllerApi';
import { useControllerBootstrap } from './controller/useControllerBootstrap';
import { prepareTournamentMatchState } from './controller/controllerTournamentMatchPrep';
import {
  getInningsContext as getInningsContextHelper,
  handleSelectBowler as handleSelectBowlerHelper,
  handleSelectNextBatter as handleSelectNextBatterHelper,
  handleSelectOpener as handleSelectOpenerHelper,
  openInnings as openInningsHelper,
  updateInningsState as updateInningsStateHelper,
} from './controller/controllerInningsCore';
import { processDelivery as processDeliveryHelper } from './controller/controllerDeliveryEngine';
import { buildInningsViewModel as buildInningsViewModelHelper } from './controller/controllerInningsViewModel';

export function useCricketSimulatorController() {
  const dispatch = useDispatch();
  const location = useLocation();
  const game = useSelector((state) => state.game);
  const authUser = useSelector((state) => getEffectiveAuthUser(state.auth.user));
  const {
    stage,
    gameMode,
    seriesLength,
    seriesCurrentMatch,
    seriesResults,
    seriesPlayerStats,
    tournamentUserTeam,
    tournamentOpponentTeams,
    tournamentMatches,
    tournamentCurrentMatchId,
    tournamentChampion,
    tournamentPlayerStats,
    matchTypeKey,
    ownTeam,
    opponentTeam,
    ownPlayingXI,
    opponentPlayingXI,
    ownCustomPlayers,
    opponentCustomPlayers,
    ownTeamRoles,
    opponentTeamRoles,
    locationCountry,
    selectedStadium,
    commentator,
    tossWinner,
    firstBattingSide,
    matchCondition,
    battingIntent,
    bowlingIntent,
    firstInnings,
    secondInnings,
    careerTeam,
    careerPlayerProfile,
    careerDomesticCountry,
    careerDomesticTeams,
    careerOffers,
    careerRetired,
    careerSeason,
    careerSeasonLength,
    careerFormat,
    careerMatchIndex,
    careerSchedule,
    careerStandings,
    careerPlayerStats,
    careerSeasonHistory,
  } = game;

  const [availableVoices, setAvailableVoices] = useState([]);
  const [savedGames, setSavedGames] = useState([]);
  const [isSavingGame, setIsSavingGame] = useState(false);
  const [isGlobalSaving, setIsGlobalSaving] = useState(false);
  const [isSavesLoading, setIsSavesLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const inProgressRef = useRef(false);
  const savedHistorySignatureRef = useRef('');
  const seriesResultCommitSignatureRef = useRef('');
  const tournamentResultCommitSignatureRef = useRef('');
  const careerResultCommitSignatureRef = useRef('');
  const processDeliveryRef = useRef(null);
  const openInningsRef = useRef(null);
  const resolveStadiumConditionRef = useRef(null);
  const gameSnapshotRef = useRef(game);
  const authUidRef = useRef(authUser?.uid || '');
  const [autoSimMode, setAutoSimMode] = useState(null);

  const countryList = useMemo(
    () => Object.values(countries).sort((a, b) => a.current_ranking - b.current_ranking),
    []
  );
  const fallbackPlayers = useMemo(
    () => Object.values(playerListForNation).find((players) => Array.isArray(players) && players.length > 0) || [],
    []
  );
  const matchType = matchTypeList[matchTypeKey] || matchTypeList.t20;
  const maxBalls = matchType.over * 6;
  const { ownPlayers: fullOwnPlayers, opponentPlayers: fullOpponentPlayers } = getPlayersForNations(
    ownTeam,
    opponentTeam
  );

  const availableOwnPlayers =
    fullOwnPlayers.length > 0
      ? [...fullOwnPlayers, ...(Array.isArray(ownCustomPlayers) ? ownCustomPlayers : [])]
      : fallbackPlayers;
  const availableOpponentPlayers =
    fullOpponentPlayers.length > 0
      ? [...fullOpponentPlayers, ...(Array.isArray(opponentCustomPlayers) ? opponentCustomPlayers : [])]
      : fallbackPlayers;

  const ownPlayers = buildPlayingXI(availableOwnPlayers, ownPlayingXI);
  const opponentPlayers = buildPlayingXI(availableOpponentPlayers, opponentPlayingXI);

  const ownSelectedXIIds = normalizePlayingXIIds(availableOwnPlayers, ownPlayingXI);
  const opponentSelectedXIIds = normalizePlayingXIIds(availableOpponentPlayers, opponentPlayingXI);

  const ownSelectedXIPlayers = availableOwnPlayers.filter((player) => ownSelectedXIIds.includes(player.id));
  const opponentSelectedXIPlayers = availableOpponentPlayers.filter((player) =>
    opponentSelectedXIIds.includes(player.id)
  );

  const ownAvailablePool = availableOwnPlayers.filter((player) => !ownSelectedXIIds.includes(player.id));
  const opponentAvailablePool = availableOpponentPlayers.filter(
    (player) => !opponentSelectedXIIds.includes(player.id)
  );

  const ownSanitizedRoles = sanitizeRoles(ownTeamRoles, ownSelectedXIIds);
  const opponentSanitizedRoles = sanitizeRoles(opponentTeamRoles, opponentSelectedXIIds);

  const ownXIReady = ownSelectedXIIds.length === 11;
  const opponentXIReady = opponentSelectedXIIds.length === 11;
  const ownRolesReady =
    !!ownSanitizedRoles.captainId &&
    !!ownSanitizedRoles.viceCaptainId &&
    !!ownSanitizedRoles.wicketKeeperId &&
    ownSanitizedRoles.captainId !== ownSanitizedRoles.viceCaptainId;
  const opponentRolesReady =
    !!opponentSanitizedRoles.captainId &&
    !!opponentSanitizedRoles.viceCaptainId &&
    !!opponentSanitizedRoles.wicketKeeperId &&
    opponentSanitizedRoles.captainId !== opponentSanitizedRoles.viceCaptainId;
  const venueStadiums = stadiums[locationCountry] || [];

  const userTeamName = gameMode === MODE_TOURNAMENT ? tournamentUserTeam : gameMode === MODE_CAREER ? careerTeam : ownTeam;
  const isCurrentMatchUserInvolved =
    !!userTeamName && (ownTeam === userTeamName || opponentTeam === userTeamName);
  const isUserWinner = tossWinner === userTeamName;
  const firstInningsTeamName = firstBattingSide === 'own' ? ownTeam : opponentTeam;
  const secondInningsTeamName = firstBattingSide === 'own' ? opponentTeam : ownTeam;
  const isGameInProgress =
    stage === matchStatusEnum.TeamOneBat ||
    stage === matchStatusEnum.TeamTwoBat ||
    stage === matchStatusEnum.TossResult ||
    stage === matchStatusEnum.ChooseOwnPlayingXI ||
    stage === matchStatusEnum.ChooseOpponentPlayingXI ||
    stage === matchStatusEnum.CareerSeasonSchedule;

  useControllerBootstrap({
    authUser,
    game,
    isGameInProgress,
    inProgressRef,
    gameSnapshotRef,
    authUidRef,
    commentator,
    dispatch,
    setCommentatorAction,
    setAvailableVoices,
    setSavedGames,
    setIsSavesLoading,
    setSaveMessage,
  });

  const getInningsContext = (isFirstInnings, firstSide = firstBattingSide) =>
    getInningsContextHelper({
      isFirstInnings,
      firstSide,
      firstBattingSide,
      ownPlayers,
      opponentPlayers,
      ownTeam,
      opponentTeam,
      isCurrentMatchUserInvolved,
      userTeamName,
    });

  const setFirstInnings = (value) => dispatch(setFirstInningsAction(value));
  const setSecondInnings = (value) => dispatch(setSecondInningsAction(value));

  const updateInningsState = (isFirstInnings, updater) =>
    updateInningsStateHelper({
      isFirstInnings,
      firstInnings,
      secondInnings,
      setFirstInnings,
      setSecondInnings,
      updater,
    });

  let prepareTournamentMatch = (match) =>
    prepareTournamentMatchState({
      match,
      dispatch,
      setOwnTeamAction,
      setOpponentTeamAction,
      setOwnPlayingXIAction,
      setOpponentPlayingXIAction,
      setOwnTeamRolesAction,
      setOpponentTeamRolesAction,
      setBattingIntentAction,
      setBowlingIntentAction,
      setFirstInningsAction,
      setSecondInningsAction,
      setShowScoreboardAction,
      setTournamentCurrentMatchIdAction,
      tournamentResultCommitSignatureRef,
    });
  const {
    goToNextStage,
    goToPreviousStage,
    selectGameMode: handleSelectGameMode,
    selectSeriesLength: handleSelectSeriesLength,
    toggleTournamentOpponent: handleToggleTournamentOpponent,
    randomizeTournamentFixtures,
    updateTournamentFixture,
    prepareTournamentFixtures,
    confirmTournamentFixtures,
  } = createNavigationHandlers({
    stage,
    gameMode,
    tournamentMatches,
    tournamentOpponentTeams,
    tournamentUserTeam,
    dispatch,
    setStageAction,
    setTossCallAction,
    prepareTournamentMatch: (match) => prepareTournamentMatch(match),
    setGameModeAction,
    setTournamentChampionAction,
    setTournamentMatchesAction,
    setTournamentCurrentMatchIdAction,
    setTournamentOpponentTeamsAction,
    setTournamentPlayerStatsAction,
    setSeriesCurrentMatchAction,
    setSeriesResultsAction,
    setSeriesPlayerStatsAction,
    setSeriesLengthAction,
    setSaveMessage,
    setCareerTeamAction,
    setCareerPlayerProfileAction,
    setCareerDomesticCountryAction,
    setCareerDomesticTeamsAction,
    setCareerOffersAction,
    setCareerRetiredAction,
    setCareerSeasonAction,
    setCareerSeasonLengthAction,
    setCareerFormatAction,
    setCareerMatchIndexAction,
    setCareerScheduleAction,
    setCareerStandingsAction,
    setCareerPlayerStatsAction,
    setCareerSeasonHistoryAction,
  });

  const openInnings = (firstSide = firstBattingSide) =>
    openInningsHelper({
      firstSide,
      firstBattingSide,
      getContext: getInningsContext,
      setFirstInnings,
      setSecondInnings,
      matchType,
      dispatch,
      setShowScoreboardAction,
      firstInningsTeamName,
      setStageAction,
      matchStatusEnum,
    });
  openInningsRef.current = openInnings;

  const handleSelectOpener = (isFirstInnings, selectedIndex) =>
    handleSelectOpenerHelper({
      isFirstInnings,
      selectedIndex,
      getContext: getInningsContext,
      updateState: updateInningsState,
    });

  const handleSelectNextBatter = (isFirstInnings, batterIndex) =>
    handleSelectNextBatterHelper({
      isFirstInnings,
      batterIndex,
      getContext: getInningsContext,
      updateState: updateInningsState,
    });

  const handleSelectBowler = (isFirstInnings, bowlerIndex) =>
    handleSelectBowlerHelper({
      isFirstInnings,
      bowlerIndex,
      getContext: getInningsContext,
      matchType,
      updateState: updateInningsState,
    });

  const processDelivery = (isFirstInnings) =>
    processDeliveryHelper({
      isFirstInnings,
      firstInnings,
      secondInnings,
      getContext: getInningsContext,
      matchType,
      maxBalls,
      battingIntent,
      bowlingIntent,
      ownSanitizedRoles,
      opponentSanitizedRoles,
      ownTeam,
      opponentTeam,
      matchCondition,
      matchTypeKey,
      locationCountry,
      dispatch,
      setBattingIntentAction,
      setBowlingIntentAction,
      setFirstInnings,
      setSecondInnings,
      firstInningsScore: firstInnings.score,
      setStageAction,
    });

  processDeliveryRef.current = processDelivery;

  const buildInningsViewModel = (isFirstInnings, inningState) =>
    buildInningsViewModelHelper({
      isFirstInnings,
      inningState,
      getContext: getInningsContext,
      matchType,
      maxBalls,
    });

  const firstInningsView = buildInningsViewModel(true, firstInnings);
  const secondInningsView = buildInningsViewModel(false, secondInnings);

  const resultSummary = useMemo(
    () =>
      resolveResultSummary({
        firstInningsScore: firstInnings.score,
        secondInningsScore: secondInnings.score,
        secondInningsWickets: secondInnings.wickets,
        firstInningsTeamName,
        secondInningsTeamName,
      }),
    [
      firstInnings.score,
      firstInningsTeamName,
      secondInnings.score,
      secondInnings.wickets,
      secondInningsTeamName,
    ]
  );

  const runtime = useControllerRuntimeFromContext({
    dispatch,
    authUser,
    game,
    derived: {
      stage, gameMode, ownTeam, opponentTeam, seriesLength, seriesCurrentMatch,
      seriesResults, seriesPlayerStats, tournamentUserTeam, tournamentOpponentTeams,
      tournamentMatches, tournamentCurrentMatchId, tournamentChampion, tournamentPlayerStats,
      matchType, matchTypeKey, firstBattingSide, firstInnings, secondInnings,
      firstInningsTeamName, secondInningsTeamName, ownPlayers, opponentPlayers,
      ownSelectedXIIds, opponentSelectedXIIds, availableOwnPlayers, availableOpponentPlayers,
      ownSelectedXIPlayers, opponentSelectedXIPlayers, ownCustomPlayers, opponentCustomPlayers,
      ownSanitizedRoles, opponentSanitizedRoles, ownXIReady, opponentXIReady, ownRolesReady,
      opponentRolesReady, isCurrentMatchUserInvolved, selectedStadium, venueStadiums,
      matchCondition, resultSummary, autoSimMode, maxBalls, userTeamName, isSavingGame,
      isGameInProgress, locationCountry, tossWinner, openInnings, firstInningsView,
      secondInningsView, prepareTournamentMatch, pickDefaultRoles,
      sanitizeRoles,
      careerTeam, careerSeason, careerSeasonLength, careerFormat, careerMatchIndex,
      careerSchedule, careerStandings, careerPlayerStats, careerSeasonHistory,
      careerPlayerProfile, careerDomesticCountry, careerDomesticTeams, careerOffers, careerRetired,
      countryList,
    },
    setters: { setSavedGames, setIsSavingGame, setIsGlobalSaving, setSaveMessage, setAutoSimMode },
    refs: {
      inProgressRef,
      authUidRef,
      gameSnapshotRef,
      processDeliveryRef,
      openInningsRef,
      resolveStadiumConditionRef,
      savedHistorySignatureRef,
      careerResultCommitSignatureRef,
    },
    actions: {
      resetMatchRuntime,
      resetMatchForCareerAction: resetMatchForCareer,
      resetMatchRuntimeAction: resetMatchRuntime,
      setBattingIntentAction, setBowlingIntentAction, setTossDecisionAction, setFirstBattingSideAction,
      setStageAction, setOwnPlayingXIAction, setOwnTeamRolesAction, setOpponentPlayingXIAction,
      setOpponentTeamRolesAction, setOwnCustomPlayersAction, setOpponentCustomPlayersAction,
      setTournamentMatchesAction, setTournamentPlayerStatsAction, setSeriesResultsAction,
      setSeriesPlayerStatsAction, setTossWinnerAction, setTossCallAction, setMatchConditionAction,
      setFirstInningsAction, setSecondInningsAction, setShowScoreboardAction,
      setSeriesCurrentMatchAction, setTournamentChampionAction,
      setOpponentTeamAction, setLocationCountryAction, setMatchTypeKeyAction,
      setCareerTeamAction, setCareerPlayerProfileAction, setCareerDomesticCountryAction,
      setCareerDomesticTeamsAction, setCareerOffersAction, setCareerRetiredAction, setCareerSeasonAction,
      setCareerFormatAction, setCareerSeasonLengthAction, setCareerMatchIndexAction, setCareerScheduleAction,
      setCareerStandingsAction, setCareerPlayerStatsAction, setCareerSeasonHistoryAction,
    },
  });

  return buildMainControllerApi({
    runtime,
    core: {
      game, gameMode, seriesLength, seriesCurrentMatch, seriesResults,
      tournamentUserTeam, tournamentOpponentTeams, tournamentMatches,
      tournamentCurrentMatchId, tournamentChampion, isCurrentMatchUserInvolved,
      autoSimMode, availableVoices, countryList, matchType, venueStadiums,
      firstInningsTeamName, secondInningsTeamName, isUserWinner, firstInningsView,
      secondInningsView, savedGames, isSavingGame, isGlobalSaving, isSavesLoading,
      saveMessage, firstInnings, secondInnings, resultSummary, availableOwnPlayers,
      availableOpponentPlayers, ownAvailablePool, opponentAvailablePool,
      ownSelectedXIIds, opponentSelectedXIIds, ownSelectedXIPlayers,
      opponentSelectedXIPlayers, ownSanitizedRoles, opponentSanitizedRoles,
      ownXIReady, opponentXIReady, ownRolesReady, opponentRolesReady,
      processDelivery, handleSelectOpener, handleSelectNextBatter, handleSelectBowler,
      setPreferredVoice, speak,
      careerTeam, careerSeason, careerSeasonLength, careerFormat, careerMatchIndex,
      careerSchedule, careerStandings, careerPlayerStats, careerSeasonHistory,
      careerPlayerProfile, careerDomesticCountry, careerDomesticTeams, careerOffers, careerRetired,
    },
    navigation: {
      goToNextStage,
      goToPreviousStage,
      handleSelectGameMode,
      handleSelectSeriesLength,
      handleToggleTournamentOpponent,
      prepareTournamentFixtures,
      confirmTournamentFixtures,
      randomizeTournamentFixtures,
      updateTournamentFixture,
      toggleScoreboard: () => dispatch(toggleShowScoreboard()),
    },
    mutations: {
      setMatchTypeKey: (value) => dispatch(setMatchTypeKeyAction(value)),
      setOwnTeam: (value) => {
        dispatch(setOwnTeamAction(value));
        dispatch(setTournamentUserTeamAction(value));
        dispatch(setTournamentOpponentTeamsAction([]));
        dispatch(setTournamentMatchesAction([]));
        dispatch(setTournamentCurrentMatchIdAction(''));
        dispatch(setTournamentChampionAction(''));
        dispatch(setTournamentPlayerStatsAction({}));
        dispatch(setOwnPlayingXIAction([]));
        dispatch(setOwnCustomPlayersAction([]));
        dispatch(setOwnTeamRolesAction({ captainId: null, viceCaptainId: null, wicketKeeperId: null }));
      },
      setOpponentTeam: (value) => {
        dispatch(setOpponentTeamAction(value));
        dispatch(setOpponentPlayingXIAction([]));
        dispatch(setOpponentCustomPlayersAction([]));
        dispatch(setOpponentTeamRolesAction({ captainId: null, viceCaptainId: null, wicketKeeperId: null }));
      },
      setLocationCountry: (value) => dispatch(setLocationCountryAction(value)),
      setCommentator: (value) => dispatch(setCommentatorAction(value)),
    },
    shared: {},
  });
}
