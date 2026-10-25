import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { useControllerBootstrap } from './useControllerBootstrap';

jest.mock('../../../../firebase/firestoreService', () => ({
  getAutoGameSave: jest.fn(),
  getCareerAutoSave: jest.fn(),
  listGameSaves: jest.fn(),
}));
jest.mock('../../../../utils/speechUtils', () => ({
  getAvailableVoices: jest.fn(),
  setPreferredVoice: jest.fn(),
}));

const makeOptions = (overrides = {}) => ({
  authUser: { uid: 'user-1' },
  game: { stage: 'TossTime' },
  isGameInProgress: true,
  inProgressRef: { current: false },
  gameSnapshotRef: { current: null },
  authUidRef: { current: '' },
  commentator: '',
  dispatch: jest.fn(),
  setCommentatorAction: jest.fn((voice) => ({ type: 'setCommentator', payload: voice })),
  setAvailableVoices: jest.fn(),
  setSavedGames: jest.fn(),
  setIsSavesLoading: jest.fn(),
  setSaveMessage: jest.fn(),
  ...overrides,
});

function HookHarness({ options }) {
  useControllerBootstrap(options);
  return null;
}

describe('useControllerBootstrap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.requireMock('../../../../utils/speechUtils').getAvailableVoices.mockReturnValue([]);
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: { onvoiceschanged: null },
    });
  });

  test('updates refs, deduplicates voices, and loads combined saves for an authenticated user', async () => {
    const firestore = jest.requireMock('../../../../firebase/firestoreService');
    const speech = jest.requireMock('../../../../utils/speechUtils');
    const manual = { id: 'manual' };
    const autosave = { id: 'auto' };
    const careerSave = { id: 'career' };
    const options = makeOptions();
    firestore.listGameSaves.mockResolvedValue([manual]);
    firestore.getAutoGameSave.mockResolvedValue(autosave);
    firestore.getCareerAutoSave.mockResolvedValue(careerSave);
    speech.getAvailableVoices.mockReturnValue([
      { name: 'Maya' },
      { name: 'Maya' },
      { name: 'Ravi' },
    ]);

    const { unmount } = render(<HookHarness options={options} />);

    expect(options.inProgressRef.current).toBe(true);
    expect(options.gameSnapshotRef.current).toBe(options.game);
    expect(options.authUidRef.current).toBe('user-1');
    expect(options.setAvailableVoices).toHaveBeenCalledWith([{ name: 'Maya' }, { name: 'Ravi' }]);
    expect(options.dispatch).toHaveBeenCalledWith({ type: 'setCommentator', payload: 'Maya' });
    expect(speech.setPreferredVoice).toHaveBeenCalledWith('Maya');
    expect(options.setIsSavesLoading).toHaveBeenNthCalledWith(1, true);
    await waitFor(() => expect(options.setSavedGames).toHaveBeenCalledWith([careerSave, autosave, manual]));
    expect(options.setIsSavesLoading).toHaveBeenLastCalledWith(false);

    unmount();
    expect(window.speechSynthesis.onvoiceschanged).toBeNull();
  });

  test('does not replace an existing commentator and handles missing users and speech support', async () => {
    const firestore = jest.requireMock('../../../../firebase/firestoreService');
    const options = makeOptions({ authUser: null, commentator: 'Ravi' });
    delete window.speechSynthesis;

    render(<HookHarness options={options} />);

    expect(options.authUidRef.current).toBe('');
    expect(options.setSavedGames).toHaveBeenCalledWith([]);
    expect(options.setAvailableVoices).not.toHaveBeenCalled();
    expect(options.dispatch).not.toHaveBeenCalled();
    expect(firestore.listGameSaves).not.toHaveBeenCalled();
  });

  test('keeps manual saves when autosaves are absent and reports load errors', async () => {
    const firestore = jest.requireMock('../../../../firebase/firestoreService');
    const manual = [{ id: 'manual' }];
    const options = makeOptions({ commentator: 'Ravi' });
    firestore.listGameSaves
      .mockResolvedValueOnce(manual)
      .mockRejectedValueOnce(new Error('offline'))
      .mockRejectedValueOnce({});
    firestore.getAutoGameSave.mockResolvedValue(null);
    firestore.getCareerAutoSave.mockResolvedValue(null);

    const { rerender } = render(<HookHarness options={options} />);
    await waitFor(() => expect(options.setSavedGames).toHaveBeenCalledWith(manual));
    expect(options.dispatch).not.toHaveBeenCalled();

    const failedOptions = makeOptions({ authUser: { uid: 'user-2' } });
    firestore.getAutoGameSave.mockResolvedValue(null);
    firestore.getCareerAutoSave.mockResolvedValue(null);
    rerender(<HookHarness options={failedOptions} />);
    await waitFor(() => expect(failedOptions.setSaveMessage).toHaveBeenCalledWith('offline'));
    expect(failedOptions.setIsSavesLoading).toHaveBeenLastCalledWith(false);

    const fallbackOptions = makeOptions({ authUser: { uid: 'user-3' } });
    rerender(<HookHarness options={fallbackOptions} />);
    await waitFor(() => expect(fallbackOptions.setSaveMessage).toHaveBeenCalledWith('Unable to load saved games.'));
    expect(fallbackOptions.setIsSavesLoading).toHaveBeenLastCalledWith(false);
  });
});
