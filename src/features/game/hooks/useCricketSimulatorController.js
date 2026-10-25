import { useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getEffectiveAuthUser } from '../../../config/runtimeConfig';







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
  setOpponentBattingOrderIds as setOpponentBattingOrderIdsAction,
  setOpponentPlayingXI as setOpponentPlayingXIAction,
  setOpponentTeamRoles as setOpponentTeamRolesAction,
  setOpponentTeam as setOpponentTeamAction,
  setOwnCustomPlayers as setOwnCustomPlayersAction,
  setOwnBattingOrderIds as setOwnBattingOrderIdsAction,
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
  setCareerGlobalPlayerPool as setCareerGlobalPlayerPoolAction,
  setCareerAuctionSummary as setCareerAuctionSummaryAction,
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
import { resolveResultSummary } from '../../../utils/simulatorUtils';
import { pickDefaultRoles, sanitizeRoles } from '../utils/controllerCommonUtils';
import { createNavigationHandlers } from './controller/controllerNavigation';
import { useControllerRuntimeFromContext } from './controller/useControllerRuntimeFromContext';
import { buildMainControllerApi } from './controller/buildMainControllerApi';
import { useControllerDerivedState } from './controller/useControllerDerivedState';
import { buildControllerInningsActions } from './controller/controllerInningsActions';
import { useControllerBootstrap } from './controller/useControllerBootstrap';
import { prepareTournamentMatchState } from './controller/controllerTournamentMatchPrep';






export function useCricketSimulatorController() {
  const dispatch = useDispatch();
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
    ownBattingOrderIds,
    opponentBattingOrderIds,
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
    careerGlobalPlayerPool,
    careerAuctionSummary,
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
  const tournamentResultCommitSignatureRef = useRef('');
  const careerResultCommitSignatureRef = useRef('');
  const processDeliveryRef = useRef(null);
  const openInningsRef = useRef(null);
  const resolveStadiumConditionRef = useRef(null);
  const gameSnapshotRef = useRef(game);
  const authUidRef = useRef(authUser?.uid || '');
  const [autoSimMode, setAutoSimMode] = useState(null);

  const {
  countryList,
  matchType,
  maxBalls,
  availableOwnPlayers,
  availableOpponentPlayers,
  ownPlayers,
  opponentPlayers,
  ownSelectedXIIds,
  opponentSelectedXIIds,
  ownSelectedXIPlayers,
  opponentSelectedXIPlayers,
  ownAvailablePool,
  opponentAvailablePool,
  ownSanitizedRoles,
  opponentSanitizedRoles,
  ownXIReady,
  opponentXIReady,
  ownBowlingRolesReady,
  opponentBowlingRolesReady,
  ownRolesReady,
  opponentRolesReady,
  venueStadiums,
  userTeamName,
  isCurrentMatchUserInvolved,
  isUserWinner,
  firstInningsTeamName,
  secondInningsTeamName,
  isGameInProgress,
} = useControllerDerivedState({
  stage,
  gameMode,
  tournamentUserTeam,
  matchTypeKey,
  ownTeam,
  opponentTeam,
  ownPlayingXI,
  opponentPlayingXI,
  ownBattingOrderIds,
  opponentBattingOrderIds,
  ownCustomPlayers,
  opponentCustomPlayers,
  ownTeamRoles,
  opponentTeamRoles,
  locationCountry,
  tossWinner,
  firstBattingSide,
  careerTeam,
  careerDomesticTeams,
});

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

  const {
  openInnings,
  handleSelectOpener,
  handleSelectNextBatter,
  handleSelectBowler,
  processDelivery,
  firstInningsView,
  secondInningsView,
} = buildControllerInningsActions({
  firstBattingSide,
  ownPlayers,
  opponentPlayers,
  ownTeam,
  opponentTeam,
  isCurrentMatchUserInvolved,
  userTeamName,
  gameMode,
  careerPlayerProfile,
  firstInnings,
  secondInnings,
  dispatch,
  setFirstInningsAction,
  setSecondInningsAction,
  matchType,
  setShowScoreboardAction,
  firstInningsTeamName,
  setStageAction,
  maxBalls,
  battingIntent,
  bowlingIntent,
  ownSanitizedRoles,
  opponentSanitizedRoles,
  matchCondition,
  matchTypeKey,
  locationCountry,
  setBattingIntentAction,
  setBowlingIntentAction,
});
openInningsRef.current = openInnings;
processDeliveryRef.current = processDelivery;

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
    setCareerGlobalPlayerPoolAction,
    setCareerAuctionSummaryAction,
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
      firstInningsTeamName,
      firstInnings.score,
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
      ownBattingOrderIds, opponentBattingOrderIds,
      ownSelectedXIPlayers, opponentSelectedXIPlayers, ownCustomPlayers, opponentCustomPlayers,
      ownBowlingRolesReady, opponentBowlingRolesReady,
      ownSanitizedRoles, opponentSanitizedRoles, ownXIReady, opponentXIReady, ownRolesReady,
      opponentRolesReady, isCurrentMatchUserInvolved, selectedStadium, venueStadiums,
      matchCondition, resultSummary, autoSimMode, maxBalls, userTeamName, isSavingGame,
      isGameInProgress, locationCountry, tossWinner, openInnings, firstInningsView,
      secondInningsView, prepareTournamentMatch, pickDefaultRoles,
      sanitizeRoles,
      careerTeam, careerSeason, careerSeasonLength, careerFormat, careerMatchIndex,
      careerSchedule, careerStandings, careerPlayerStats, careerSeasonHistory,
      careerPlayerProfile, careerDomesticCountry, careerDomesticTeams, careerOffers, careerRetired,
      careerAuctionSummary,
      careerGlobalPlayerPool,
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
      setStageAction, setOwnPlayingXIAction, setOwnBattingOrderIdsAction, setOwnTeamRolesAction,
      setOpponentPlayingXIAction, setOpponentBattingOrderIdsAction,
      setOpponentTeamRolesAction, setOwnCustomPlayersAction, setOpponentCustomPlayersAction,
      setTournamentMatchesAction, setTournamentPlayerStatsAction, setSeriesResultsAction,
      setSeriesPlayerStatsAction, setTossWinnerAction, setTossCallAction, setMatchConditionAction,
      setFirstInningsAction, setSecondInningsAction, setShowScoreboardAction,
      setSeriesCurrentMatchAction, setTournamentChampionAction,
      setOpponentTeamAction, setOwnTeamAction, setLocationCountryAction, setSelectedStadiumAction, setMatchTypeKeyAction,
      setCareerTeamAction, setCareerPlayerProfileAction, setCareerDomesticCountryAction,
      setCareerDomesticTeamsAction, setCareerGlobalPlayerPoolAction, setCareerOffersAction, setCareerRetiredAction, setCareerSeasonAction,
      setCareerAuctionSummaryAction,
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
      ownBowlingRolesReady, opponentBowlingRolesReady,
      ownBattingOrderIds, opponentBattingOrderIds,
      ownXIReady, opponentXIReady, ownRolesReady, opponentRolesReady,
      processDelivery, handleSelectOpener, handleSelectNextBatter, handleSelectBowler,
      setPreferredVoice, speak,
      careerTeam, careerSeason, careerSeasonLength, careerFormat, careerMatchIndex,
      careerSchedule, careerStandings, careerPlayerStats, careerSeasonHistory,
      careerPlayerProfile, careerDomesticCountry, careerDomesticTeams, careerOffers, careerRetired,
      careerAuctionSummary,
      careerGlobalPlayerPool,
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
