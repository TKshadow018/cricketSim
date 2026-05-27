import { useEffect } from 'react';
import {
  getCareerAutoSave,
  createGameSave,
  createMatchHistoryEntry,
  getAutoGameSave,
  listGameSaves,
  removeCareerSave,
  removeGameSave,
  upsertAutoGameSave,
  upsertCareerAutoSave,
} from '../../../../firebase/firestoreService';
import { hydrateGameState } from '../../gameSlice';
import { speak } from '../../../../utils/speechUtils';
import { MODE_SERIES, MODE_TOURNAMENT, MODE_CAREER } from '../../utils/controllerCommonUtils';
import { matchStatusEnum } from '../../../../gameData/matchStatusEnum';

export const useControllerPersistence = ({
  authUser,
  isSavingGame,
  setIsSavingGame,
  setIsGlobalSaving,
  setSaveMessage,
  gameMode,
  ownTeam,
  opponentTeam,
  seriesLength,
  matchType,
  seriesStanding,
  tournamentUserTeam,
  tournamentOpponentTeams,
  stage,
  game,
  dispatch,
  setSavedGames,
  isGameInProgress,
  inProgressRef,
  authUidRef,
  gameSnapshotRef,
  resultSummary,
  matchTypeKey,
  seriesCurrentMatch,
  firstBattingSide,
  firstInnings,
  secondInnings,
  firstInningsTeamName,
  secondInningsTeamName,
  locationCountry,
  selectedStadium,
  tossWinner,
  savedHistorySignatureRef,
  careerTeam,
  careerSeason,
  careerMatchIndex,
  careerSchedule,
}) => {
  const refreshSavedGames = async () => {
    if (!authUser?.uid) {
      setSavedGames([]);
      return;
    }

    const [manualSaves, autoSave, careerAutoSave] = await Promise.all([
      listGameSaves(authUser.uid),
      getAutoGameSave(authUser.uid),
      getCareerAutoSave(authUser.uid),
    ]);

    const autoSaves = [careerAutoSave, autoSave].filter(Boolean);
    setSavedGames(autoSaves.length > 0 ? [...autoSaves, ...manualSaves] : manualSaves);
  };

  const persistAutoSaveSnapshot = async (snapshot, uid) => {
    if (!uid || !snapshot) {
      return;
    }

    const careerTitle = `Career: ${snapshot.careerTeam || snapshot.ownTeam} — Season ${snapshot.careerSeason || 1}, Match ${(snapshot.careerMatchIndex || 0) + 1}`;

    if (snapshot.gameMode === MODE_CAREER) {
      await upsertCareerAutoSave(uid, {
        title: careerTitle,
        stage: snapshot.stage,
        gameState: snapshot,
      });
      return;
    }

    await upsertAutoGameSave(uid, {
      title:
        snapshot.gameMode === MODE_SERIES
          ? `Autosave: ${snapshot.ownTeam} vs ${snapshot.opponentTeam} (${snapshot.seriesLength}-match series)`
          : snapshot.gameMode === MODE_TOURNAMENT
            ? `Autosave: ${snapshot.tournamentUserTeam || snapshot.ownTeam} tournament (${(snapshot.tournamentOpponentTeams || []).length + 1} teams)`
            : `Autosave: ${snapshot.ownTeam} vs ${snapshot.opponentTeam}`,
      stage: snapshot.stage,
      gameState: snapshot,
    });
  };

  const handleSaveGame = async () => {
    if (!authUser?.uid || isSavingGame) {
      return;
    }

    setIsSavingGame(true);
    setIsGlobalSaving(true);
    setSaveMessage('');

    try {
      const currentSaves = await listGameSaves(authUser.uid);
      if (currentSaves.length >= 5) {
        setSaveMessage('Maximum 5 saves reached. Delete one to save a new game.');
        return;
      }

      await createGameSave(authUser.uid, {
        title:
          gameMode === MODE_CAREER
            ? `Career: ${careerTeam} — Season ${careerSeason}, Match ${(careerMatchIndex || 0) + 1} of ${(careerSchedule || []).length}`
            : gameMode === MODE_SERIES
              ? `${ownTeam} vs ${opponentTeam} (${seriesLength}-match series, ${matchType.nameKey.toUpperCase()}, ${seriesStanding.ownWins}-${seriesStanding.opponentWins})`
              : gameMode === MODE_TOURNAMENT
                ? `${tournamentUserTeam || ownTeam} tournament (${(tournamentOpponentTeams || []).length + 1} teams)`
                : `${ownTeam} vs ${opponentTeam} (${matchType.nameKey.toUpperCase()})`,
        stage,
        gameState: game,
      });

      await refreshSavedGames();
      setSaveMessage('Game saved successfully.');
      speak('Game saved.');
    } catch (error) {
      setSaveMessage(error?.message || 'Failed to save game.');
    } finally {
      setIsSavingGame(false);
      setIsGlobalSaving(false);
    }
  };

  const handleLoadSavedGame = (saveItem) => {
    if (!saveItem?.gameState) {
      return;
    }

    dispatch(hydrateGameState(saveItem.gameState));
    setSaveMessage('Saved game loaded.');
    speak('Saved game loaded.');
  };

  const handleDeleteSavedGame = async (saveItem) => {
    const normalizedSaveItem = typeof saveItem === 'string' ? { id: saveItem } : saveItem;
    const saveId = normalizedSaveItem?.storageId || normalizedSaveItem?.id;
    if (!authUser?.uid || !saveId) {
      return;
    }

    try {
      if (normalizedSaveItem?.sourceCollection === 'careerSaves') {
        await removeCareerSave(authUser.uid, saveId);
      } else {
        await removeGameSave(authUser.uid, saveId);
      }
      await refreshSavedGames();
      setSaveMessage('Saved game deleted.');
    } catch (error) {
      setSaveMessage(error?.message || 'Failed to delete saved game.');
    }
  };

  useEffect(() => {
    if (!authUser?.uid || !isGameInProgress) {
      return;
    }

    const timer = setTimeout(() => {
      persistAutoSaveSnapshot(game, authUser.uid).catch(() => {});
    }, 800);

    return () => clearTimeout(timer);
  }, [authUser?.uid, game, isGameInProgress]);

  useEffect(() => {
    const flushAutoSave = () => {
      if (!inProgressRef.current || !authUidRef.current) {
        return;
      }

      persistAutoSaveSnapshot(gameSnapshotRef.current, authUidRef.current).catch(() => {});
    };

    window.addEventListener('beforeunload', flushAutoSave);

    return () => {
      flushAutoSave();
      window.removeEventListener('beforeunload', flushAutoSave);
    };
  }, [inProgressRef, authUidRef, gameSnapshotRef]);

  useEffect(() => {
    if (!authUser?.uid || stage !== matchStatusEnum.MatchEnd) {
      return;
    }

    const summaryLine = String(resultSummary || '').trim();
    const signature = [
      authUser.uid,
      ownTeam,
      opponentTeam,
      matchTypeKey,
      gameMode,
      seriesCurrentMatch,
      firstBattingSide,
      firstInnings.score,
      firstInnings.wickets,
      firstInnings.balls,
      secondInnings.score,
      secondInnings.wickets,
      secondInnings.balls,
      summaryLine,
    ].join('|');

    if (savedHistorySignatureRef.current === signature) {
      return;
    }

    savedHistorySignatureRef.current = signature;

    let winnerTeam = 'Tie';
    if (secondInnings.score > firstInnings.score) {
      winnerTeam = secondInningsTeamName;
    } else if (secondInnings.score < firstInnings.score) {
      winnerTeam = firstInningsTeamName;
    }

    createMatchHistoryEntry(authUser.uid, {
      ownTeam,
      opponentTeam,
      gameMode,
      seriesLength,
      seriesCurrentMatch,
      matchTypeKey,
      locationCountry,
      selectedStadium,
      tossWinner,
      tossDecision: game.tossDecision,
      firstInningsTeamName,
      secondInningsTeamName,
      firstInningsScore: firstInnings.score,
      firstInningsWickets: firstInnings.wickets,
      firstInningsBalls: firstInnings.balls,
      secondInningsScore: secondInnings.score,
      secondInningsWickets: secondInnings.wickets,
      secondInningsBalls: secondInnings.balls,
      summary: summaryLine,
      winnerTeam,
    }).catch(() => {
      savedHistorySignatureRef.current = '';
    });
  }, [
    authUser?.uid,
    stage,
    ownTeam,
    opponentTeam,
    gameMode,
    seriesLength,
    seriesCurrentMatch,
    matchTypeKey,
    firstBattingSide,
    firstInnings.score,
    firstInnings.wickets,
    firstInnings.balls,
    secondInnings.score,
    secondInnings.wickets,
    secondInnings.balls,
    firstInningsTeamName,
    secondInningsTeamName,
    resultSummary,
    locationCountry,
    selectedStadium,
    tossWinner,
    game.tossDecision,
    savedHistorySignatureRef,
  ]);

  return {
    refreshSavedGames,
    handleSaveGame,
    handleLoadSavedGame,
    handleDeleteSavedGame,
  };
};
