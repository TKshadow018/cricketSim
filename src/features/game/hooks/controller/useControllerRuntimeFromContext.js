import { useControllerRuntime } from './useControllerRuntime';

export const useControllerRuntimeFromContext = ({
  dispatch,
  authUser,
  game,
  derived,
  refs,
  setters,
  actions,
}) => {
  return useControllerRuntime({
    dispatch,
    base: {
      authUser,
      game,
      ...derived,
      ...setters,
    },
    refs,
    actions,
  });
};
