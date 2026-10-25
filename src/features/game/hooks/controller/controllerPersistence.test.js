import React, { act } from 'react';
import { render } from '@testing-library/react';
import { useControllerPersistence } from './controllerPersistence';

jest.mock('../../../../firebase/firestoreService', () => ({
  getCareerAutoSave: jest.fn(),
  createGameSave: jest.fn(),
  createMatchHistoryEntry: jest.fn(),
  getAutoGameSave: jest.fn(),
  listGameSaves: jest.fn(),
  removeCareerSave: jest.fn(),
  removeGameSave: jest.fn(),
  upsertAutoGameSave: jest.fn(),
  upsertCareerAutoSave: jest.fn(),
}));

jest.mock('../../../../utils/speechUtils', () => ({ speak: jest.fn() }));
jest.mock('../../gameSlice', () => ({
  hydrateGameState: jest.fn((gameState) => ({ type: 'game/hydrate', payload: gameState })),
}));
jest.mock('../../utils/controllerCommonUtils', () => ({
  MODE_SERIES: 'series',
  MODE_TOURNAMENT: 'tournament',
  MODE_CAREER: 'career',
}));
jest.mock('../../../../gameData/matchStatusEnum', () => ({ matchStatusEnum: { MatchEnd: 'match-end' } }));

const baseGame = {
  tossDecision: 'bat',
  ownTeam: 'Falcons',
  opponentTeam: 'Ravens',
  gameMode: 'single',
  stage: 'setup',
};

const makeProps = (overrides = {}) => ({
  authUser: { uid: 'user-1' },
  isSavingGame: false,
  setIsSavingGame: jest.fn(),
  setIsGlobalSaving: jest.fn(),
  setSaveMessage: jest.fn(),
  gameMode: 'single',
  ownTeam: 'Falcons',
  opponentTeam: 'Ravens',
  seriesLength: 3,
  matchType: { nameKey: 't20' },
  seriesStanding: { ownWins: 2, opponentWins: 1 },
  tournamentUserTeam: 'Falcons',
  tournamentOpponentTeams: ['Ravens', 'Hawks'],
  stage: 'setup',
  game: baseGame,
  dispatch: jest.fn(),
  setSavedGames: jest.fn(),
  isGameInProgress: false,
  inProgressRef: { current: false },
  authUidRef: { current: 'user-1' },
  gameSnapshotRef: { current: baseGame },
  resultSummary: 'Falcons won',
  matchTypeKey: 't20',
  seriesCurrentMatch: 2,
  firstBattingSide: 'own',
  firstInnings: { score: 100, wickets: 3, balls: 120 },
  secondInnings: { score: 101, wickets: 4, balls: 118 },
  firstInningsTeamName: 'Falcons',
  secondInningsTeamName: 'Ravens',
  locationCountry: 'India',
  selectedStadium: 'National Ground',
  tossWinner: 'Falcons',
  savedHistorySignatureRef: { current: '' },
  careerTeam: 'Falcons',
  careerSeason: 3,
  careerMatchIndex: 2,
  careerSchedule: Array(9).fill({}),
  ...overrides,
});

const makeHarness = (hookProps) => {
  const controls = { current: null };
  const Harness = ({ props }) => {
    controls.current = useControllerPersistence(props);
    return null;
  };
  const view = render(<Harness props={hookProps} />);
  return { ...view, controls, Harness };
};

const firestore = () => jest.requireMock('../../../../firebase/firestoreService');

describe('useControllerPersistence', () => {
  beforeEach(() => {
    const services = firestore();
    services.getCareerAutoSave.mockResolvedValue(null);
    services.getAutoGameSave.mockResolvedValue(null);
    services.listGameSaves.mockResolvedValue([]);
    services.createGameSave.mockResolvedValue(undefined);
    services.createMatchHistoryEntry.mockResolvedValue(undefined);
    services.removeCareerSave.mockResolvedValue(undefined);
    services.removeGameSave.mockResolvedValue(undefined);
    services.upsertAutoGameSave.mockResolvedValue(undefined);
    services.upsertCareerAutoSave.mockResolvedValue(undefined);
    jest.requireMock('../../gameSlice').hydrateGameState.mockImplementation((gameState) => ({ type: 'game/hydrate', payload: gameState }));
  });

  test('refreshes manual and automatic saves and clears saves when unauthenticated', async () => {
    const services = firestore();
    const careerSave = { id: 'career', sourceCollection: 'careerSaves' };
    const autoSave = { id: 'auto', sourceCollection: 'autoSaves' };
    const manualSaves = [{ id: 'manual' }];
    services.getCareerAutoSave.mockResolvedValue(careerSave);
    services.getAutoGameSave.mockResolvedValue(autoSave);
    services.listGameSaves.mockResolvedValue(manualSaves);

    const props = makeProps();
    const { controls } = makeHarness(props);
    await act(async () => controls.current.refreshSavedGames());
    expect(props.setSavedGames).toHaveBeenCalledWith([careerSave, autoSave, ...manualSaves]);
    expect(services.listGameSaves).toHaveBeenCalledWith('user-1');
    expect(services.getAutoGameSave).toHaveBeenCalledWith('user-1');
    expect(services.getCareerAutoSave).toHaveBeenCalledWith('user-1');

    const unauthenticated = makeProps({ authUser: null });
    const unauthenticatedHarness = makeHarness(unauthenticated);
    await act(async () => unauthenticatedHarness.controls.current.refreshSavedGames());
    expect(unauthenticated.setSavedGames).toHaveBeenCalledWith([]);
    expect(services.listGameSaves).toHaveBeenCalledTimes(1);
  });

  test.each([
    ['single', 'Falcons vs Ravens (T20)'],
    ['series', 'Falcons vs Ravens (3-match series, T20, 2-1)'],
    ['tournament', 'Falcons tournament (3 teams)'],
    ['career', 'Career: Falcons — Season 3, Match 3 of 9'],
  ])('saves a %s game and refreshes the save list', async (gameMode, expectedTitle) => {
    const services = firestore();
    const props = makeProps({ gameMode });
    const { controls } = makeHarness(props);
    await act(async () => controls.current.handleSaveGame());

    expect(services.createGameSave).toHaveBeenCalledWith('user-1', expect.objectContaining({
      title: expectedTitle,
      stage: 'setup',
      gameState: baseGame,
    }));
    expect(props.setSavedGames).toHaveBeenCalledWith([]);
    expect(props.setSaveMessage).toHaveBeenCalledWith('Game saved successfully.');
    expect(jest.requireMock('../../../../utils/speechUtils').speak).toHaveBeenCalledWith('Game saved.');
    expect(props.setIsSavingGame).toHaveBeenLastCalledWith(false);
    expect(props.setIsGlobalSaving).toHaveBeenLastCalledWith(false);
  });

  test('uses fallback values for empty career and tournament save metadata', async () => {
    const services = firestore();
    const career = makeProps({
      gameMode: 'career',
      careerTeam: '',
      careerSeason: 0,
      careerMatchIndex: 0,
      careerSchedule: null,
    });
    const careerHarness = makeHarness(career);
    await act(async () => careerHarness.controls.current.handleSaveGame());
    expect(services.createGameSave).toHaveBeenCalledWith('user-1', expect.objectContaining({
      title: 'Career:  — Season 0, Match 1 of 0',
    }));

    const tournamentManual = makeProps({
      gameMode: 'tournament',
      tournamentUserTeam: '',
      tournamentOpponentTeams: null,
    });
    const tournamentManualHarness = makeHarness(tournamentManual);
    await act(async () => tournamentManualHarness.controls.current.handleSaveGame());
    expect(services.createGameSave).toHaveBeenCalledWith('user-1', expect.objectContaining({
      title: 'Falcons tournament (1 teams)',
    }));

    jest.useFakeTimers();
    const snapshot = {
      ...baseGame,
      gameMode: 'tournament',
      ownTeam: 'Falcons',
      tournamentUserTeam: '',
      tournamentOpponentTeams: null,
    };
    const tournament = makeProps({ game: snapshot, isGameInProgress: true });
    const tournamentHarness = makeHarness(tournament);
    await act(async () => {
      jest.advanceTimersByTime(800);
      await Promise.resolve();
    });
    expect(services.upsertAutoGameSave).toHaveBeenCalledWith('user-1', expect.objectContaining({
      title: 'Autosave: Falcons tournament (1 teams)',
      gameState: snapshot,
    }));
    tournamentHarness.unmount();
    jest.useRealTimers();
  });

  test('blocks duplicate and over-limit saves and reports storage failures', async () => {
    const busy = makeProps({ isSavingGame: true });
    const busyHarness = makeHarness(busy);
    await act(async () => busyHarness.controls.current.handleSaveGame());
    expect(firestore().listGameSaves).not.toHaveBeenCalled();
    expect(busy.setIsSavingGame).not.toHaveBeenCalled();

    const unauthenticated = makeProps({ authUser: null });
    const noUserHarness = makeHarness(unauthenticated);
    await act(async () => noUserHarness.controls.current.handleSaveGame());
    expect(unauthenticated.setIsSavingGame).not.toHaveBeenCalled();

    const services = firestore();
    services.listGameSaves.mockResolvedValueOnce(Array(5).fill({ id: 'saved' }));
    const limited = makeProps();
    const limitedHarness = makeHarness(limited);
    await act(async () => limitedHarness.controls.current.handleSaveGame());
    expect(services.createGameSave).not.toHaveBeenCalled();
    expect(limited.setSaveMessage).toHaveBeenCalledWith('Maximum 5 saves reached. Delete one to save a new game.');
    expect(limited.setIsSavingGame).toHaveBeenLastCalledWith(false);

    services.listGameSaves.mockRejectedValueOnce(new Error('Storage unavailable'));
    const failed = makeProps();
    const failedHarness = makeHarness(failed);
    await act(async () => failedHarness.controls.current.handleSaveGame());
    expect(failed.setSaveMessage).toHaveBeenCalledWith('Storage unavailable');
    expect(failed.setIsGlobalSaving).toHaveBeenLastCalledWith(false);

    services.listGameSaves.mockRejectedValueOnce(new Error(''));
    const fallbackError = makeProps();
    const fallbackHarness = makeHarness(fallbackError);
    await act(async () => fallbackHarness.controls.current.handleSaveGame());
    expect(fallbackError.setSaveMessage).toHaveBeenCalledWith('Failed to save game.');
  });

  test('loads valid snapshots and ignores missing snapshots', () => {
    const props = makeProps();
    const { controls } = makeHarness(props);
    controls.current.handleLoadSavedGame(null);
    expect(props.dispatch).not.toHaveBeenCalled();
    expect(props.setSaveMessage).not.toHaveBeenCalled();

    const snapshot = { ownTeam: 'Hawks' };
    controls.current.handleLoadSavedGame({ gameState: snapshot });
    expect(props.dispatch).toHaveBeenCalledWith({ type: 'game/hydrate', payload: snapshot });
    expect(props.setSaveMessage).toHaveBeenCalledWith('Saved game loaded.');
    expect(jest.requireMock('../../../../utils/speechUtils').speak).toHaveBeenCalledWith('Saved game loaded.');
  });

  test('deletes manual and career saves, normalizes string ids, and reports failures', async () => {
    const services = firestore();
    const props = makeProps();
    const { controls } = makeHarness(props);
    await act(async () => controls.current.handleDeleteSavedGame(null));
    await act(async () => controls.current.handleDeleteSavedGame({ id: '' }));
    expect(services.removeGameSave).not.toHaveBeenCalled();

    await act(async () => controls.current.handleDeleteSavedGame('manual-id'));
    expect(services.removeGameSave).toHaveBeenCalledWith('user-1', 'manual-id');
    expect(props.setSaveMessage).toHaveBeenCalledWith('Saved game deleted.');

    await act(async () => controls.current.handleDeleteSavedGame({
      id: 'career-id',
      sourceCollection: 'careerSaves',
    }));
    expect(services.removeCareerSave).toHaveBeenCalledWith('user-1', 'career-id');

    services.removeGameSave.mockRejectedValueOnce(new Error('Delete denied'));
    await act(async () => controls.current.handleDeleteSavedGame({ storageId: 'manual-id' }));
    expect(props.setSaveMessage).toHaveBeenCalledWith('Delete denied');

    services.removeGameSave.mockRejectedValueOnce(new Error(''));
    await act(async () => controls.current.handleDeleteSavedGame({ id: 'manual-id' }));
    expect(props.setSaveMessage).toHaveBeenCalledWith('Failed to delete saved game.');

    const unauthenticated = makeProps({ authUser: null });
    const noUserHarness = makeHarness(unauthenticated);
    await act(async () => noUserHarness.controls.current.handleDeleteSavedGame('id'));
    expect(services.removeGameSave).toHaveBeenCalledTimes(3);
  });

  test.each([
    ['career', 'Career: Falcons — Season 3, Match 3'],
    ['series', 'Autosave: Falcons vs Ravens (3-match series)'],
    ['tournament', 'Autosave: Falcons tournament (3 teams)'],
    ['single', 'Autosave: Falcons vs Ravens'],
  ])('autosaves %s snapshots after the debounce delay', async (gameMode, expectedTitle) => {
    jest.useFakeTimers();
    const services = firestore();
    const snapshot = {
      ...baseGame,
      gameMode,
      ownTeam: 'Falcons',
      opponentTeam: 'Ravens',
      careerTeam: 'Falcons',
      careerSeason: 3,
      careerMatchIndex: 2,
      seriesLength: 3,
      tournamentUserTeam: 'Falcons',
      tournamentOpponentTeams: ['Ravens', 'Hawks'],
    };
    makeHarness(makeProps({ game: snapshot, isGameInProgress: true }));
    await act(async () => {
      jest.advanceTimersByTime(800);
      await Promise.resolve();
    });

    if (gameMode === 'career') {
      expect(services.upsertCareerAutoSave).toHaveBeenCalledWith('user-1', expect.objectContaining({ title: expectedTitle, gameState: snapshot }));
      expect(services.upsertAutoGameSave).not.toHaveBeenCalled();
    } else {
      expect(services.upsertAutoGameSave).toHaveBeenCalledWith('user-1', expect.objectContaining({ title: expectedTitle, gameState: snapshot }));
    }
    jest.useRealTimers();
  });

  test('flushes autosaves on unload and cleanup only while a match is in progress', () => {
    const services = firestore();
    const props = makeProps({ game: { ...baseGame, gameMode: 'series' } });
    const { unmount } = makeHarness(props);
    window.dispatchEvent(new Event('beforeunload'));
    expect(services.upsertAutoGameSave).not.toHaveBeenCalled();

    props.inProgressRef.current = true;
    props.gameSnapshotRef.current = null;
    window.dispatchEvent(new Event('beforeunload'));
    expect(services.upsertAutoGameSave).not.toHaveBeenCalled();
    props.gameSnapshotRef.current = { ...baseGame, gameMode: 'series', seriesLength: 3 };
    window.dispatchEvent(new Event('beforeunload'));
    expect(services.upsertAutoGameSave).toHaveBeenCalledTimes(1);
    props.inProgressRef.current = false;
    unmount();
    expect(services.upsertAutoGameSave).toHaveBeenCalledTimes(1);
  });

  test('absorbs failed autosave writes from debounce and unload handlers', async () => {
    jest.useFakeTimers();
    const services = firestore();
    services.upsertAutoGameSave.mockRejectedValue(new Error('Autosave unavailable'));
    const snapshot = { ...baseGame, gameMode: 'single' };
    const debounce = makeProps({ game: snapshot, isGameInProgress: true });
    const debounceHarness = makeHarness(debounce);
    await act(async () => {
      jest.advanceTimersByTime(800);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(services.upsertAutoGameSave).toHaveBeenCalledWith('user-1', expect.objectContaining({
      gameState: snapshot,
    }));
    debounceHarness.unmount();

    const unload = makeProps({
      game: snapshot,
      inProgressRef: { current: true },
      gameSnapshotRef: { current: snapshot },
    });
    const unloadHarness = makeHarness(unload);
    window.dispatchEvent(new Event('beforeunload'));
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(services.upsertAutoGameSave).toHaveBeenCalledTimes(2);
    unload.inProgressRef.current = false;
    unloadHarness.unmount();
    jest.useRealTimers();
  });

  test('records match outcomes once per signature and retries after a failed history write', async () => {
    const services = firestore();
    const props = makeProps({
      stage: 'match-end',
      resultSummary: 'Ravens won by 1 wicket',
      firstInnings: { score: 100, wickets: 8, balls: 120 },
      secondInnings: { score: 101, wickets: 9, balls: 119 },
    });
    const { rerender } = makeHarness(props);
    expect(services.createMatchHistoryEntry).toHaveBeenCalledWith('user-1', expect.objectContaining({
      winnerTeam: 'Ravens',
      summary: 'Ravens won by 1 wicket',
      tossDecision: 'bat',
    }));
    expect(props.savedHistorySignatureRef.current).toContain('Ravens won by 1 wicket');

    rerender(<HarnessForPersistence props={props} />);
    expect(services.createMatchHistoryEntry).toHaveBeenCalledTimes(1);

    const tied = makeProps({
      ...props,
      resultSummary: 'Match tied',
      firstInnings: { score: 100, wickets: 8, balls: 120 },
      secondInnings: { score: 100, wickets: 7, balls: 120 },
    });
    rerender(<HarnessForPersistence props={tied} />);
    expect(services.createMatchHistoryEntry).toHaveBeenLastCalledWith('user-1', expect.objectContaining({ winnerTeam: 'Tie' }));

    const firstWins = makeProps({
      ...props,
      resultSummary: 'Falcons won by 1 run',
      firstInnings: { score: 101, wickets: 6, balls: 120 },
      secondInnings: { score: 100, wickets: 9, balls: 120 },
    });
    rerender(<HarnessForPersistence props={firstWins} />);
    expect(services.createMatchHistoryEntry).toHaveBeenLastCalledWith('user-1', expect.objectContaining({ winnerTeam: 'Falcons' }));

    const emptySummary = makeProps({
      ...props,
      resultSummary: null,
      firstInnings: { score: 102, wickets: 6, balls: 120 },
      secondInnings: { score: 100, wickets: 9, balls: 120 },
    });
    rerender(<HarnessForPersistence props={emptySummary} />);
    expect(services.createMatchHistoryEntry).toHaveBeenLastCalledWith('user-1', expect.objectContaining({
      summary: '',
      winnerTeam: 'Falcons',
    }));

    services.createMatchHistoryEntry.mockRejectedValueOnce(new Error('history write failed'));
    const failed = makeProps({ ...props, resultSummary: 'retry this result' });
    rerender(<HarnessForPersistence props={failed} />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(failed.savedHistorySignatureRef.current).toBe('');
  });
});

const HarnessForPersistence = ({ props }) => {
  useControllerPersistence(props);
  return null;
};
