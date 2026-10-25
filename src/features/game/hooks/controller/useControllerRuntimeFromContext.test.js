import { useControllerRuntimeFromContext } from './useControllerRuntimeFromContext';

jest.mock('./useControllerRuntime', () => ({ useControllerRuntime: jest.fn() }));

test('combines context-derived state and setters into the runtime base', () => {
  const runtime = { handleSaveGame: jest.fn() };
  const useControllerRuntime = jest.requireMock('./useControllerRuntime').useControllerRuntime;
  useControllerRuntime.mockReturnValue(runtime);
  const dispatch = jest.fn();
  const authUser = { uid: 'user-1' };
  const game = { stage: 'MatchEnd' };
  const derived = { ownTeam: 'Falcons', resultSummary: 'Won' };
  const refs = { inProgressRef: { current: true } };
  const setters = { setSavedGames: jest.fn() };
  const actions = { setOwnTeamAction: jest.fn() };

  const result = useControllerRuntimeFromContext({
    dispatch,
    authUser,
    game,
    derived,
    refs,
    setters,
    actions,
  });

  expect(useControllerRuntime).toHaveBeenCalledWith({
    dispatch,
    base: { authUser, game, ...derived, ...setters },
    refs,
    actions,
  });
  expect(result).toBe(runtime);
});
