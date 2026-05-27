import { useEffect } from 'react';
import { getAutoGameSave, getCareerAutoSave, listGameSaves } from '../../../../firebase/firestoreService';
import { getAvailableVoices, setPreferredVoice } from '../../../../utils/speechUtils';

export const useControllerBootstrap = ({
  authUser,
  game,
  isGameInProgress,
  inProgressRef,
  gameSnapshotRef,
  authUidRef,
  commentator,
  dispatch,
  setCommentatorAction,
  setAvailableVoices,
  setSavedGames,
  setIsSavesLoading,
  setSaveMessage,
}) => {
  useEffect(() => {
    inProgressRef.current = isGameInProgress;
    gameSnapshotRef.current = game;
    authUidRef.current = authUser?.uid || '';
  }, [authUser?.uid, game, isGameInProgress, inProgressRef, gameSnapshotRef, authUidRef]);

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      return undefined;
    }

    const syncVoices = () => {
      const voices = getAvailableVoices();
      const uniqueVoices = voices.filter(
        (voice, index, array) => array.findIndex((item) => item.name === voice.name) === index
      );
      setAvailableVoices(uniqueVoices);
      if (!commentator && uniqueVoices.length > 0) {
        dispatch(setCommentatorAction(uniqueVoices[0].name));
        setPreferredVoice(uniqueVoices[0].name);
      }
    };

    syncVoices();
    window.speechSynthesis.onvoiceschanged = syncVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [commentator, dispatch, setCommentatorAction, setAvailableVoices]);

  useEffect(() => {
    const loadSavedGames = async () => {
      if (!authUser?.uid) {
        setSavedGames([]);
        return;
      }

      setIsSavesLoading(true);
      try {
        const [manualSaves, autoSave, careerAutoSave] = await Promise.all([
          listGameSaves(authUser.uid),
          getAutoGameSave(authUser.uid),
          getCareerAutoSave(authUser.uid),
        ]);

        const autoSaves = [careerAutoSave, autoSave].filter(Boolean);
        const merged = autoSaves.length > 0 ? [...autoSaves, ...manualSaves] : manualSaves;
        setSavedGames(merged);
      } catch (error) {
        setSaveMessage(error?.message || 'Unable to load saved games.');
      } finally {
        setIsSavesLoading(false);
      }
    };

    loadSavedGames();
  }, [authUser?.uid, setSavedGames, setIsSavesLoading, setSaveMessage]);
};
