import { createCareerSetupHandlers } from "./controllerCareerSetupHandlers";
import { createCareerMatchHandlers } from "./controllerCareerMatchHandlers";
import { createCareerSeasonHandlers } from "./controllerCareerSeasonHandlers";

export const createCareerFlowHandlers = (dependencies) => {
  const { launchCareerFixture, ...setupHandlers } = createCareerSetupHandlers(dependencies);
  const matchHandlers = createCareerMatchHandlers({
    ...dependencies,
    launchCareerFixture,
  });
  const seasonHandlers = createCareerSeasonHandlers(dependencies);

  return {
    ...setupHandlers,
    ...matchHandlers,
    ...seasonHandlers,
  };
};
