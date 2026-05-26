import { useControllerStats } from './useControllerStats';
import { useControllerHandlersBundle } from './useControllerHandlersBundle';
import { buildScorecard } from '../../utils/controllerCommonUtils';
import { oversDisplay, stageOrder, matchVisual } from '../../../../utils/simulatorUtils';

export const useControllerRuntime = ({
  dispatch,
  base,
  refs,
  actions,
}) => {
  let prepareTournamentMatch = base.prepareTournamentMatch;

  const {
    momRecommendations,
    seriesStanding,
    seriesTopRunScorers,
    seriesTopWicketTakers,
    seriesProgressLabel,
    tournamentResults,
    tournamentTopRunScorers,
    tournamentTopWicketTakers,
    tournamentProgressLabel,
    careerTopRunScorers,
    careerTopWicketTakers,
    careerProgressLabel,
    announceManOfTheMatch,
  } = useControllerStats(base);

  const { teamHandlers, competitionHandlers, tossAndSimulationHandlers, persistenceHandlers, careerHandlers } =
    useControllerHandlersBundle({
      teamArgs: {
        ...base,
        dispatch,
        ...actions,
        openInnings: (firstSide) => refs.openInningsRef?.current?.(firstSide),
        pickDefaultRoles: base.pickDefaultRoles,
      },
      competitionArgs: {
        ...base,
        dispatch,
        ...actions,
      },
      tossArgs: {
        ...base,
        dispatch,
        ...actions,
        processDeliveryRef: refs.processDeliveryRef,
        openInningsRef: refs.openInningsRef,
        resolveStadiumConditionRef: refs.resolveStadiumConditionRef,
      },
      persistenceArgs: {
        ...base,
        dispatch,
        ...refs,
      },
      careerArgs: {
        ...base,
        dispatch,
        ...actions,
        careerResultCommitSignatureRef: refs.careerResultCommitSignatureRef,
      },
      prepareTournamentMatch,
      setPrepareTournamentMatch: (value) => {
        prepareTournamentMatch = value;
      },
    });

  const handleSetBattingIntent = (value) => {
    if (!base.isCurrentMatchUserInvolved) {
      return;
    }

    const activeView = base.firstInningsView.isUserBatting ? base.firstInningsView : base.secondInningsView;
    const targetAction = activeView.battingActionOptions.find((action) => action.key === value);
    if (!targetAction || targetAction.disabled) {
      return;
    }

    dispatch(actions.setBattingIntentAction(value));
  };

  const handleSetBowlingIntent = (value) => {
    if (!base.isCurrentMatchUserInvolved) {
      return;
    }

    const activeView = base.firstInningsView.isUserBowling ? base.firstInningsView : base.secondInningsView;
    const targetAction = activeView.bowlingActionOptions.find((action) => action.key === value);
    if (!targetAction || targetAction.disabled) {
      return;
    }

    dispatch(actions.setBowlingIntentAction(value));
  };

  const buildTeamOneScorecard = () => ({
    currentInnings: buildScorecard(
      `${base.firstInningsTeamName} Innings`,
      base.firstInnings,
      base.firstInningsView,
      oversDisplay(base.firstInnings.balls)
    ),
    previousInnings: null,
  });

  const buildTeamTwoScorecard = () => ({
    currentInnings: buildScorecard(
      `${base.secondInningsTeamName} Innings`,
      base.secondInnings,
      base.secondInningsView,
      oversDisplay(base.secondInnings.balls)
    ),
    previousInnings: buildScorecard(
      `${base.firstInningsTeamName} Innings`,
      base.firstInnings,
      base.firstInningsView,
      oversDisplay(base.firstInnings.balls)
    ),
  });

  return {
    momRecommendations,
    seriesStanding,
    seriesTopRunScorers,
    seriesTopWicketTakers,
    seriesProgressLabel,
    tournamentResults,
    tournamentTopRunScorers,
    tournamentTopWicketTakers,
    tournamentProgressLabel,
    careerTopRunScorers,
    careerTopWicketTakers,
    careerProgressLabel,
    announceManOfTheMatch,
    ...persistenceHandlers,
    ...teamHandlers,
    ...tossAndSimulationHandlers,
    ...careerHandlers,
    matchPrimaryAction: competitionHandlers.handleMatchPrimaryAction,
    resetMatch: competitionHandlers.handlePlayFreshMatch,
    setBattingIntent: handleSetBattingIntent,
    setBowlingIntent: handleSetBowlingIntent,
    buildTeamOneScorecard,
    buildTeamTwoScorecard,
    stageOrder,
    matchVisual,
    oversDisplay,
  };
};
