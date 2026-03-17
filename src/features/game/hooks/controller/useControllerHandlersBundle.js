import { createTeamManagementHandlers } from './controllerTeamManagement';
import { createCompetitionFlowHandlers } from './controllerCompetitionFlow';
import { useTossAndSimulationHandlers } from './controllerTossAndSimulation';
import { useControllerPersistence } from './controllerPersistence';

export const useControllerHandlersBundle = ({
  teamArgs,
  competitionArgs,
  tossArgs,
  persistenceArgs,
  prepareTournamentMatch,
  setPrepareTournamentMatch,
}) => {
  const teamHandlers = createTeamManagementHandlers(teamArgs);

  const competitionHandlers = createCompetitionFlowHandlers({
    ...competitionArgs,
    prepareTournamentMatch,
  });

  setPrepareTournamentMatch(competitionHandlers.prepareTournamentMatch);

  const tossAndSimulationHandlers = useTossAndSimulationHandlers(tossArgs);

  const persistenceHandlers = useControllerPersistence(persistenceArgs);

  return {
    teamHandlers,
    competitionHandlers,
    tossAndSimulationHandlers,
    persistenceHandlers,
  };
};
