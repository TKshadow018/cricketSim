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
import { DEFAULT_BATTING_TACTICS } from "../../utils/battingTactics";
import { DEFAULT_BOWLING_TACTICS } from "../../utils/bowlingTactics";
import { startTestMatch } from "../../utils/testMatch";
import { beginMatchRandom } from "../../utils/matchRandom";

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
  setTestMatchAction,
  setMatchRandomAction,
  maxBalls,
  battingIntent,
  battingTactics,
  bowlingIntent,
  bowlingTactics,
  ownSanitizedRoles,
  opponentSanitizedRoles,
  matchCondition,
  matchTypeKey,
  locationCountry,
  game,
  setBattingIntentAction,
  setBattingTacticsAction,
  setBowlingIntentAction,
  setBowlingTacticsAction,
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

const openInnings = (firstSide = firstBattingSide) => {
    const generator = game ? beginMatchRandom(game.matchRandom) : null;
    dispatch(setBattingTacticsAction(DEFAULT_BATTING_TACTICS));
    dispatch(setBowlingTacticsAction(DEFAULT_BOWLING_TACTICS));
    if (game?.ruleset === 'realism' && matchTypeKey === 'test') {
      dispatch(setTestMatchAction(startTestMatch({
        firstSide,
        ownPlayers,
        opponentPlayers,
        ownTeam,
        opponentTeam,
        userTeamName,
        teamControlName: gameMode === 'career' ? '' : userTeamName,
        days: gameMode === 'career' ? 4 : matchType.day,
        oversPerDay: matchType.over,
        randomSeed: generator ? Math.floor(generator.next() * 4294967296) : undefined,
      })));
      if (generator) dispatch(setMatchRandomAction(generator.snapshot()));
      dispatch(setShowScoreboardAction(false));
      dispatch(setStageAction(matchStatusEnum.TeamOneBat));
      return;
    }
    const result = openInningsHelper({
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
      random: generator ? generator.next : Math.random,
    });
    if (generator) dispatch(setMatchRandomAction(generator.snapshot()));
    return result;
  };

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
      battingTactics,
      bowlingIntent,
      bowlingTactics,
      ownSanitizedRoles,
      opponentSanitizedRoles,
      ownTeam,
      opponentTeam,
      matchCondition,
      matchTypeKey,
      locationCountry,
      ruleset: game?.ruleset,
      dispatch,
      setBattingIntentAction,
      setBattingTacticsAction,
      setBowlingIntentAction,
      setBowlingTacticsAction,
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
      ruleset: game?.ruleset,
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
