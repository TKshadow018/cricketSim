import { battingAction, bowlingAction } from '../../../../gameData/actionType';
import { prepareTournamentMatchState } from './controllerTournamentMatchPrep';

const createActions = () => {
  const actionNames = [
    'setOwnTeamAction',
    'setOpponentTeamAction',
    'setOwnPlayingXIAction',
    'setOpponentPlayingXIAction',
    'setOwnTeamRolesAction',
    'setOpponentTeamRolesAction',
    'setBattingIntentAction',
    'setBowlingIntentAction',
    'setFirstInningsAction',
    'setSecondInningsAction',
    'setShowScoreboardAction',
    'setTournamentCurrentMatchIdAction',
  ];
  return Object.fromEntries(actionNames.map((name) => [name, (payload) => ({ type: name, payload })]));
};

describe('tournament match preparation', () => {
  test('leaves the current match untouched when either team is missing', () => {
    const dispatch = jest.fn();
    const tournamentResultCommitSignatureRef = { current: 'old-result' };
    const actions = createActions();

    prepareTournamentMatchState({
      match: { id: 'match-1', teamA: 'Team A' },
      dispatch,
      tournamentResultCommitSignatureRef,
      ...actions,
    });

    expect(dispatch).not.toHaveBeenCalled();
    expect(tournamentResultCommitSignatureRef.current).toBe('old-result');
  });

  test('resets teams, selections, innings, intents, scoreboard, and commit signature for a valid fixture', () => {
    const dispatch = jest.fn();
    const tournamentResultCommitSignatureRef = { current: 'previous-signature' };
    const actions = createActions();

    prepareTournamentMatchState({
      match: { id: 'match-2', teamA: 'Team A', teamB: 'Team B' },
      dispatch,
      tournamentResultCommitSignatureRef,
      ...actions,
    });

    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual(Object.keys(actions));
    expect(dispatch).toHaveBeenCalledWith({ type: 'setOwnTeamAction', payload: 'Team A' });
    expect(dispatch).toHaveBeenCalledWith({ type: 'setOpponentTeamAction', payload: 'Team B' });
    expect(dispatch).toHaveBeenCalledWith({ type: 'setOwnPlayingXIAction', payload: [] });
    expect(dispatch).toHaveBeenCalledWith({ type: 'setOpponentPlayingXIAction', payload: [] });
    expect(dispatch).toHaveBeenCalledWith({ type: 'setBattingIntentAction', payload: battingAction.normal });
    expect(dispatch).toHaveBeenCalledWith({ type: 'setBowlingIntentAction', payload: bowlingAction.normal });
    expect(dispatch).toHaveBeenCalledWith({ type: 'setTournamentCurrentMatchIdAction', payload: 'match-2' });
    expect(tournamentResultCommitSignatureRef.current).toBe('');

    const firstInnings = dispatch.mock.calls.find(([action]) => action.type === 'setFirstInningsAction')[0].payload;
    const secondInnings = dispatch.mock.calls.find(([action]) => action.type === 'setSecondInningsAction')[0].payload;
    expect(firstInnings).toMatchObject({ score: 0, wickets: 0, balls: 0 });
    expect(secondInnings).toMatchObject({ score: 0, wickets: 0, balls: 0 });
    expect(firstInnings).not.toBe(secondInnings);
  });
});
