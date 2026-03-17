import { battingAction, bowlingAction } from '../../../../gameData/actionType';
import { buildInitialInnings } from '../../gameSlice';

export const prepareTournamentMatchState = ({
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
}) => {
  if (!match?.teamA || !match?.teamB) {
    return;
  }

  dispatch(setOwnTeamAction(match.teamA));
  dispatch(setOpponentTeamAction(match.teamB));
  dispatch(setOwnPlayingXIAction([]));
  dispatch(setOpponentPlayingXIAction([]));
  dispatch(setOwnTeamRolesAction({ captainId: null, viceCaptainId: null, wicketKeeperId: null }));
  dispatch(setOpponentTeamRolesAction({ captainId: null, viceCaptainId: null, wicketKeeperId: null }));
  dispatch(setBattingIntentAction(battingAction.normal));
  dispatch(setBowlingIntentAction(bowlingAction.normal));
  dispatch(setFirstInningsAction(buildInitialInnings()));
  dispatch(setSecondInningsAction(buildInitialInnings()));
  dispatch(setShowScoreboardAction(false));
  dispatch(setTournamentCurrentMatchIdAction(match.id));
  tournamentResultCommitSignatureRef.current = '';
};
