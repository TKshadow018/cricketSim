import { useControllerHandlersBundle } from './useControllerHandlersBundle';

jest.mock('./controllerTeamManagement', () => ({ createTeamManagementHandlers: jest.fn() }));
jest.mock('./controllerCompetitionFlow', () => ({ createCompetitionFlowHandlers: jest.fn() }));
jest.mock('./controllerTossAndSimulation', () => ({ useTossAndSimulationHandlers: jest.fn() }));
jest.mock('./controllerPersistence', () => ({ useControllerPersistence: jest.fn() }));
jest.mock('./controllerCareer', () => ({ createCareerFlowHandlers: jest.fn() }));

describe('useControllerHandlersBundle', () => {
  test('composes each handler group and supplies the career action to competition flow', () => {
    const teamHandlers = { moveOwnPlayerToXI: jest.fn() };
    const careerHandlers = { handleCareerMatchPrimaryAction: jest.fn() };
    const prepareTournamentMatch = jest.fn();
    const nextPrepareTournamentMatch = jest.fn();
    const competitionHandlers = { prepareTournamentMatch: nextPrepareTournamentMatch };
    const tossAndSimulationHandlers = { handleTossCall: jest.fn() };
    const persistenceHandlers = { handleSaveGame: jest.fn() };
    const teamArgs = { ownTeam: 'Falcons' };
    const competitionArgs = { gameMode: 'tournament' };
    const tossArgs = { tossWinner: 'Falcons' };
    const persistenceArgs = { authUser: { uid: 'user-1' } };
    const careerArgs = { careerTeam: 'Falcons' };
    const mocks = {
      team: jest.requireMock('./controllerTeamManagement').createTeamManagementHandlers,
      competition: jest.requireMock('./controllerCompetitionFlow').createCompetitionFlowHandlers,
      toss: jest.requireMock('./controllerTossAndSimulation').useTossAndSimulationHandlers,
      persistence: jest.requireMock('./controllerPersistence').useControllerPersistence,
      career: jest.requireMock('./controllerCareer').createCareerFlowHandlers,
    };
    mocks.team.mockReturnValue(teamHandlers);
    mocks.career.mockReturnValue(careerHandlers);
    mocks.competition.mockReturnValue(competitionHandlers);
    mocks.toss.mockReturnValue(tossAndSimulationHandlers);
    mocks.persistence.mockReturnValue(persistenceHandlers);
    const setPrepareTournamentMatch = jest.fn();

    const result = useControllerHandlersBundle({
      teamArgs,
      competitionArgs,
      tossArgs,
      persistenceArgs,
      careerArgs,
      prepareTournamentMatch,
      setPrepareTournamentMatch,
    });

    expect(mocks.team).toHaveBeenCalledWith(teamArgs);
    expect(mocks.career).toHaveBeenCalledWith(careerArgs);
    expect(mocks.competition).toHaveBeenCalledWith({
      ...competitionArgs,
      prepareTournamentMatch,
      handleCareerMatchPrimaryAction: careerHandlers.handleCareerMatchPrimaryAction,
    });
    expect(mocks.toss).toHaveBeenCalledWith(tossArgs);
    expect(mocks.persistence).toHaveBeenCalledWith(persistenceArgs);
    expect(setPrepareTournamentMatch).toHaveBeenCalledWith(nextPrepareTournamentMatch);
    expect(result).toEqual({
      teamHandlers,
      competitionHandlers,
      tossAndSimulationHandlers,
      persistenceHandlers,
      careerHandlers,
    });
  });
});
