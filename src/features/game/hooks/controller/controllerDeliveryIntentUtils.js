import { battingAction, bowlingAction } from '../../../../gameData/actionType';
import { canUseSpecialBall, canUseSuperShot } from '../../utils/controllerOutcomeUtils';

export const syncDeliveryIntentState = ({
  dispatch,
  isUserBatting,
  isUserBowling,
  isFirstInnings,
  inningsEnded,
  nextState,
  battingIntent,
  bowlingIntent,
  battingSide,
  bowlingSide,
  bowlerIndexForIntent,
  hasUserBowlingTactics,
  hasArmedSpecial,
  setBattingIntentAction,
  setBowlingIntentAction,
  setBowlingTacticsAction,
}) => {
  if (isUserBatting && nextState.freeHitArmed && battingIntent !== battingAction.freeHit) {
    dispatch(setBattingIntentAction(battingAction.freeHit));
  }

  if (isUserBatting && !nextState.freeHitArmed && battingIntent === battingAction.freeHit) {
    dispatch(setBattingIntentAction(battingAction.normal));
  }

  if (isUserBatting && battingIntent === battingAction.superShot) {
    const nextCanUseSuperShot = canUseSuperShot({
      striker: battingSide[nextState.strikerIndex],
      bowler: bowlingSide[bowlerIndexForIntent],
      inningState: nextState,
      strikerIndex: nextState.strikerIndex,
    });

    if (!nextCanUseSuperShot) {
      dispatch(setBattingIntentAction(battingAction.normal));
    }
  }

  if (hasUserBowlingTactics && hasArmedSpecial && !(isFirstInnings && inningsEnded)) {
    dispatch(setBowlingTacticsAction({ specialDeliveryArmed: false }));
  } else if (isUserBowling && bowlingIntent === bowlingAction.specialBowl) {
    const nextCanUseSpecialBall = canUseSpecialBall({
      bowler: bowlingSide[bowlerIndexForIntent],
      inningState: nextState,
    });

    if (!nextCanUseSpecialBall) {
      dispatch(setBowlingIntentAction(bowlingAction.normal));
    }
  }
};
