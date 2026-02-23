import React from "react";
import { AnimatePresence } from "framer-motion";
import { useCricketSimulatorController } from "./hooks/useCricketSimulatorController";
import { stageOrder } from "../../utils/simulatorUtils";
import { matchStatusEnum } from "../../gameData/matchStatusEnum";
import PreMatchStages from "./components/PreMatchStages";
import LiveMatchStages from "./components/LiveMatchStages";
import "./simulator.css";

function CricketSimulator() {
  const controller = useCricketSimulatorController();
  const {
    game,
    countryList,
    venueStadiums,
    availableVoices,
    matchType,
    matchVisual,
    firstInningsTeamName,
    secondInningsTeamName,
    isUserWinner,
    firstInningsView,
    secondInningsView,
    savedGames,
    isSavingGame,
    isGlobalSaving,
    isSavesLoading,
    saveMessage,
    teamOneFinal,
    teamTwoFinal,
    resultSummary,
    momRecommendations,
    announceManOfTheMatch,
    goToNextStage,
    toggleScoreboard,
    setMatchTypeKey,
    setOwnTeam,
    setOpponentTeam,
    setLocationCountry,
    setSelectedStadium,
    setCommentator,
    setPreferredVoice,
    speak,
    saveGame,
    loadSavedGame,
    deleteSavedGame,
    setBattingIntent,
    setBowlingIntent,
    processDelivery,
    handleSelectOpener,
    handleSelectNextBatter,
    handleSelectBowler,
    handleTossCall,
    handleUserTossDecision,
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
    buildTeamOneScorecard,
    buildTeamTwoScorecard,
    resetMatch,
    oversDisplay,
  } = controller;

  const stageIndex = stageOrder.indexOf(game.stage) + 1;
  const stageCommonProps = {
    stageIndex,
    totalStages: stageOrder.length,
    className: `sim-stage-${game.stage}`,
  };
  const isLiveStage = [
    matchStatusEnum.TeamOneBat,
    matchStatusEnum.TeamTwoBat,
    matchStatusEnum.MatchEnd,
  ].includes(game.stage);

  return (
    <div className="sim-shell">
      {isGlobalSaving ? (
        <div className="sim-saving-overlay" role="status" aria-live="polite">
          <div className="sim-saving-ball">🏏</div>
          <p>Saving match...</p>
        </div>
      ) : null}
      <AnimatePresence mode="wait">
        {isLiveStage ? (
          <>
            <div className="sim-top-strip">
              <p>{matchType.nameKey.toUpperCase()} Match</p>
              <p>
                {game.ownTeam} vs {game.opponentTeam}
              </p>
              <p>Venue: {game.selectedStadium || game.locationCountry}</p>
            </div>
            <LiveMatchStages
              key={`live-${game.stage}`}
              stage={game.stage}
              stageCommonProps={stageCommonProps}
              game={game}
              matchType={matchType}
              firstInningsTeamName={firstInningsTeamName}
              secondInningsTeamName={secondInningsTeamName}
              firstInningsView={firstInningsView}
              secondInningsView={secondInningsView}
              setBattingIntent={setBattingIntent}
              setBowlingIntent={setBowlingIntent}
              onSaveGame={saveGame}
              isSavingGame={isSavingGame}
              saveMessage={saveMessage}
              processDelivery={processDelivery}
              handleSelectOpener={handleSelectOpener}
              handleSelectNextBatter={handleSelectNextBatter}
              handleSelectBowler={handleSelectBowler}
              toggleScoreboard={toggleScoreboard}
              buildTeamOneScorecard={buildTeamOneScorecard}
              buildTeamTwoScorecard={buildTeamTwoScorecard}
              teamOneFinal={teamOneFinal}
              teamTwoFinal={teamTwoFinal}
              resultSummary={resultSummary}
              momRecommendations={momRecommendations}
              onSelectManOfTheMatch={announceManOfTheMatch}
              resetMatch={resetMatch}
              oversDisplay={oversDisplay}
            />
          </>
        ) : (
          <PreMatchStages
            key={`pre-${game.stage}`}
            stage={game.stage}
            stageCommonProps={stageCommonProps}
            game={game}
            countryList={countryList}
            venueStadiums={venueStadiums}
            availableVoices={availableVoices}
            matchVisual={matchVisual}
            goToNextStage={goToNextStage}
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
            onLoadSavedGame={loadSavedGame}
            onDeleteSavedGame={deleteSavedGame}
            handleTossCall={handleTossCall}
            handleUserTossDecision={handleUserTossDecision}
            isUserWinner={isUserWinner}
            ownAvailablePool={ownAvailablePool}
            opponentAvailablePool={opponentAvailablePool}
            ownSelectedXIIds={ownSelectedXIIds}
            opponentSelectedXIIds={opponentSelectedXIIds}
            ownSelectedXIPlayers={ownSelectedXIPlayers}
            opponentSelectedXIPlayers={opponentSelectedXIPlayers}
            ownTeamRoles={ownTeamRoles}
            opponentTeamRoles={opponentTeamRoles}
            ownXIReady={ownXIReady}
            opponentXIReady={opponentXIReady}
            ownRolesReady={ownRolesReady}
            opponentRolesReady={opponentRolesReady}
            moveOwnPlayerToXI={moveOwnPlayerToXI}
            removeOwnPlayerFromXI={removeOwnPlayerFromXI}
            moveOpponentPlayerToXI={moveOpponentPlayerToXI}
            removeOpponentPlayerFromXI={removeOpponentPlayerFromXI}
            setOwnRole={setOwnRole}
            setOpponentRole={setOpponentRole}
            createCustomPlayer={createCustomPlayer}
            autoPickOwnXI={autoPickOwnXI}
            autoPickOpponentXI={autoPickOpponentXI}
            startMatchWithSelectedXI={startMatchWithSelectedXI}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default CricketSimulator;
