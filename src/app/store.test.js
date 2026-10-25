import { store } from './store';
import { setStage } from '../features/game/gameSlice';

jest.mock('../features/auth/authSlice', () => ({
  __esModule: true,
  default: (state = { user: null, isLoading: false }) => state,
}));

test('configures the authentication and game reducers in the root store', () => {
  expect(store.getState()).toEqual(expect.objectContaining({
    auth: expect.objectContaining({ user: null, isLoading: false }),
  }));
  expect(store.getState().game).toHaveProperty('stage');

  store.dispatch(setStage('TossTime'));
  expect(store.getState().game.stage).toBe('TossTime');
});
