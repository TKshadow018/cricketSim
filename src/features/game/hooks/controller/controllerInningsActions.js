import {
  getInningsContext as getInningsContextHelper,
  handleSelectBowler as handleSelectBowlerHelper,
  handleSelectNextBatter as handleSelectNextBatterHelper,
  handleSelectOpener as handleSelectOpenerHelper,
  openInnings as openInningsHelper,
  updateInningsState as updateInningsStateHelper,
} from "./controllerInningsCore";
import { processDelivery as processDeliveryHelper } from "./controllerDeliveryEngine";
import { buildInningsViewModel as buildInningsViewModelHelper } from "./controllerInningsViewModel";
import { matchStatusEnum } from "../../../../gameData/matchStatusEnum";

export function buildControllerInningsActions({
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
}) {
const getInningsContext = (isFirstInnings, firstSide = firstBattingSide, inningStateOverride = null) =>
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
      gameMode,
      careerPlayerProfile,
      inningState: inningStateOverride || (isFirstInnings ? firstInnings : secondInnings),
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

const buildInningsViewModel = (isFirstInnings, inningState) =>
    buildInningsViewModelHelper({
      isFirstInnings,
      inningState,
      getContext: (inningsFlag, side, explicitInningsState) =>
        getInningsContext(inningsFlag, side, explicitInningsState || inningState),
      matchType,
      maxBalls,
    });

const firstInningsView = buildInningsViewModel(true, firstInnings);

const secondInningsView = buildInningsViewModel(false, secondInnings);

  return {
    openInnings,
    handleSelectOpener,
    handleSelectNextBatter,
    handleSelectBowler,
    processDelivery,
    firstInningsView,
    secondInningsView,
  };
}
