import React, { useMemo, useState } from 'react';
import { matchStatusEnum } from '../../../gameData/matchStatusEnum';
import AppButton from '../../../components/ui/AppButton';
import PreMatchBasicStages from './PreMatchBasicStages';
import PreMatchSelectionStages from './PreMatchSelectionStages';
import { buildStadiumSelectionItems, setCommentatorName } from './preMatchStageUtils';

function PreMatchStages({
  stage,
  stageCommonProps,
  game,
  countryList,
  venueStadiums,
  availableVoices,
  matchVisual,
  goToNextStage,
  goToPreviousStage,
  selectGameMode,
  selectSeriesLength,
  tournamentUserTeam,
  tournamentOpponentTeams,
  tournamentMatches,
  toggleTournamentOpponent,
  prepareTournamentFixtures,
  confirmTournamentFixtures,
  randomizeTournamentFixtures,
  updateTournamentFixture,
  setMatchTypeKey,
  setOwnTeam,
  setOpponentTeam,
  setLocationCountry,
  setSelectedStadium,
  setCommentator,
  setPreferredVoice,
  speak,
  savedGames,
  isSavesLoading,
  saveMessage,
  onLoadSavedGame,
  onDeleteSavedGame,
  handleTossCall,
  handleUserTossDecision,
  isUserWinner,
  ownAvailablePool,
  opponentAvailablePool,
  ownSelectedXIIds,
  opponentSelectedXIIds,
  ownSelectedXIPlayers,
  opponentSelectedXIPlayers,
  ownTeamRoles,
  opponentTeamRoles,
  ownXIReady,
  opponentXIReady,
  ownRolesReady,
  opponentRolesReady,
  moveOwnPlayerToXI,
  removeOwnPlayerFromXI,
  moveOpponentPlayerToXI,
  removeOpponentPlayerFromXI,
  setOwnRole,
  setOpponentRole,
  createCustomPlayer,
  autoPickOwnXI,
  autoPickOpponentXI,
  startMatchWithSelectedXI,
  beginCareer,
  careerTeam,
  careerSeason,
  careerMatchIndex,
  careerSchedule,
  careerStandings,
  handleCareerStartNextMatch,
  handleViewCareerHistory,
}) {
  const [saveToDelete, setSaveToDelete] = useState(null);
  const [dragPayload, setDragPayload] = useState(null);
  const [customPlayerModal, setCustomPlayerModal] = useState({
    open: false,
    teamKey: 'own',
    name: '',
    abilityToPlayPaceBall: 60,
    abilityToPlaySpinBall: 60,
    battingAggresion: 60,
    spinAbility: 20,
    paceAbility: 20,
    isWicketKeeper: false,
  });

  const stadiumSelectionItems = useMemo(
    () => buildStadiumSelectionItems(venueStadiums),
    [venueStadiums]
  );

  const showSetupBackButton =
    (stage >= matchStatusEnum.ChooseMatchType && stage < matchStatusEnum.TeamOneBat) ||
    stage === matchStatusEnum.ChooseSeriesLength ||
    stage === matchStatusEnum.SetupTournamentFixtures;

  const setupBackSlot = showSetupBackButton ? (
    <AppButton text="Back" variant="secondary" fullWidth={false} onClick={goToPreviousStage} />
  ) : null;

  const selectedCommentatorVoice = useMemo(
    () => availableVoices.find((voice) => voice.name === game.commentator),
    [availableVoices, game.commentator]
  );

  const commentatorDisplayName = setCommentatorName(selectedCommentatorVoice || game.commentator);

  const readDragPayload = (event) => {
    const text = event?.dataTransfer?.getData('application/json') || event?.dataTransfer?.getData('text/plain');
    if (!text) {
      return null;
    }

    try {
      const parsed = JSON.parse(text);
      if (!parsed || !parsed.teamKey || !parsed.sourceList) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  };

  const onDragStart = (event, teamKey, sourceList, playerId) => {
    const payload = { teamKey, sourceList, playerId };
    setDragPayload(payload);

    if (event?.dataTransfer) {
      const encoded = JSON.stringify(payload);
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('application/json', encoded);
      event.dataTransfer.setData('text/plain', encoded);
    }
  };

  const onDragEnd = () => {
    setDragPayload(null);
  };

  const onDropToAvailable = (teamKey, event) => {
    event?.preventDefault();
    const payload = readDragPayload(event) || dragPayload;

    if (!payload || payload.teamKey !== teamKey || payload.sourceList !== 'selected') {
      return;
    }

    if (teamKey === 'own') {
      removeOwnPlayerFromXI(payload.playerId);
    } else {
      removeOpponentPlayerFromXI(payload.playerId);
    }
    setDragPayload(null);
  };

  const onDropToSelected = (teamKey, event) => {
    event?.preventDefault();
    const payload = readDragPayload(event) || dragPayload;

    if (!payload || payload.teamKey !== teamKey || payload.sourceList !== 'available') {
      return;
    }

    if (teamKey === 'own') {
      moveOwnPlayerToXI(payload.playerId);
    } else {
      moveOpponentPlayerToXI(payload.playerId);
    }
    setDragPayload(null);
  };

  const openCustomModal = (teamKey) => {
    setCustomPlayerModal({
      open: true,
      teamKey,
      name: '',
      abilityToPlayPaceBall: 60,
      abilityToPlaySpinBall: 60,
      battingAggresion: 60,
      spinAbility: 20,
      paceAbility: 20,
      isWicketKeeper: false,
    });
  };

  const closeCustomModal = () => {
    setCustomPlayerModal((previous) => ({ ...previous, open: false }));
  };

  const updateCustomField = (key, value) => {
    setCustomPlayerModal((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const submitCustomPlayer = () => {
    const normalizedName = customPlayerModal.name.trim();
    if (!normalizedName) {
      return;
    }

    const clamp = (value) => Math.max(0, Math.min(99, Number(value) || 0));
    createCustomPlayer(customPlayerModal.teamKey, {
      name: normalizedName,
      abilityToPlayPaceBall: clamp(customPlayerModal.abilityToPlayPaceBall),
      abilityToPlaySpinBall: clamp(customPlayerModal.abilityToPlaySpinBall),
      battingAggresion: clamp(customPlayerModal.battingAggresion),
      spinAbility: clamp(customPlayerModal.spinAbility),
      paceAbility: clamp(customPlayerModal.paceAbility),
      isWicketKeeper: !!customPlayerModal.isWicketKeeper,
    });

    closeCustomModal();
  };

  return (
    <>
      <PreMatchBasicStages
        stage={stage}
        stageCommonProps={stageCommonProps}
        game={game}
        setupBackSlot={setupBackSlot}
        countryList={countryList}
        stadiumSelectionItems={stadiumSelectionItems}
        availableVoices={availableVoices}
        matchVisual={matchVisual}
        goToNextStage={goToNextStage}
        selectGameMode={selectGameMode}
        selectSeriesLength={selectSeriesLength}
        tournamentUserTeam={tournamentUserTeam}
        tournamentOpponentTeams={tournamentOpponentTeams}
        toggleTournamentOpponent={toggleTournamentOpponent}
        prepareTournamentFixtures={prepareTournamentFixtures}
        setMatchTypeKey={setMatchTypeKey}
        setOwnTeam={setOwnTeam}
        setOpponentTeam={setOpponentTeam}
        setLocationCountry={setLocationCountry}
        setSelectedStadium={setSelectedStadium}
        setCommentator={setCommentator}
        setPreferredVoice={setPreferredVoice}
        speak={speak}
        savedGames={savedGames}
        isSavesLoading={isSavesLoading}
        saveMessage={saveMessage}
        onLoadSavedGame={onLoadSavedGame}
        onDeleteSavedGame={onDeleteSavedGame}
        saveToDelete={saveToDelete}
        setSaveToDelete={setSaveToDelete}
        handleTossCall={handleTossCall}
        handleUserTossDecision={handleUserTossDecision}
        commentatorDisplayName={commentatorDisplayName}
        isUserWinner={isUserWinner}
        beginCareer={beginCareer}
        careerTeam={careerTeam}
        careerSeason={careerSeason}
        careerMatchIndex={careerMatchIndex}
        careerSchedule={careerSchedule}
        careerStandings={careerStandings}
        handleCareerStartNextMatch={handleCareerStartNextMatch}
        handleViewCareerHistory={handleViewCareerHistory}
      />

      <PreMatchSelectionStages
        stage={stage}
        stageCommonProps={stageCommonProps}
        setupBackSlot={setupBackSlot}
        tournamentMatches={tournamentMatches}
        tournamentUserTeam={tournamentUserTeam}
        tournamentOpponentTeams={tournamentOpponentTeams}
        randomizeTournamentFixtures={randomizeTournamentFixtures}
        confirmTournamentFixtures={confirmTournamentFixtures}
        updateTournamentFixture={updateTournamentFixture}
        ownSelectedXIIds={ownSelectedXIIds}
        opponentSelectedXIIds={opponentSelectedXIIds}
        ownAvailablePool={ownAvailablePool}
        opponentAvailablePool={opponentAvailablePool}
        ownSelectedXIPlayers={ownSelectedXIPlayers}
        opponentSelectedXIPlayers={opponentSelectedXIPlayers}
        ownTeamRoles={ownTeamRoles}
        opponentTeamRoles={opponentTeamRoles}
        setOwnRole={setOwnRole}
        setOpponentRole={setOpponentRole}
        ownXIReady={ownXIReady}
        opponentXIReady={opponentXIReady}
        ownRolesReady={ownRolesReady}
        opponentRolesReady={opponentRolesReady}
        moveOwnPlayerToXI={moveOwnPlayerToXI}
        removeOwnPlayerFromXI={removeOwnPlayerFromXI}
        moveOpponentPlayerToXI={moveOpponentPlayerToXI}
        removeOpponentPlayerFromXI={removeOpponentPlayerFromXI}
        autoPickOwnXI={autoPickOwnXI}
        autoPickOpponentXI={autoPickOpponentXI}
        openCustomModal={openCustomModal}
        startMatchWithSelectedXI={startMatchWithSelectedXI}
        goToNextStage={goToNextStage}
        onDropToAvailable={onDropToAvailable}
        onDropToSelected={onDropToSelected}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        customPlayerModal={customPlayerModal}
        updateCustomField={updateCustomField}
        closeCustomModal={closeCustomModal}
        submitCustomPlayer={submitCustomPlayer}
      />
    </>
  );
}

export default PreMatchStages;
