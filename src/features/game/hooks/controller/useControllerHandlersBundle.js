import { createTeamManagementHandlers } from './controllerTeamManagement';
import { createCompetitionFlowHandlers } from './controllerCompetitionFlow';
import { useTossAndSimulationHandlers } from './controllerTossAndSimulation';
import { useControllerPersistence } from './controllerPersistence';
import { createCareerFlowHandlers } from './controllerCareer';

export const useControllerHandlersBundle = ({
  teamArgs,
  competitionArgs,
  tossArgs,
  persistenceArgs,
  careerArgs,
  prepareTournamentMatch,
  setPrepareTournamentMatch,
}) => {
  const teamHandlers = createTeamManagementHandlers(teamArgs);

  const careerHandlers = createCareerFlowHandlers(careerArgs);

  const competitionHandlers = createCompetitionFlowHandlers({
    ...competitionArgs,
    prepareTournamentMatch,
    handleCareerMatchPrimaryAction: careerHandlers.handleCareerMatchPrimaryAction,
  });

  setPrepareTournamentMatch(competitionHandlers.prepareTournamentMatch);

  const tossAndSimulationHandlers = useTossAndSimulationHandlers(tossArgs);

  const persistenceHandlers = useControllerPersistence(persistenceArgs);

  return {
    teamHandlers,
    competitionHandlers,
    tossAndSimulationHandlers,
    persistenceHandlers,
    careerHandlers,
  };
};
