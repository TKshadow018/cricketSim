import React from "react";
import { AnimatePresence } from "framer-motion";
import { useCricketSimulatorController } from "./hooks/useCricketSimulatorController";
import { stageOrder } from "../../utils/simulatorUtils";
import { matchStatusEnum } from "../../gameData/matchStatusEnum";

import PreMatchStages from "./components/PreMatchStages";
import LiveMatchStages from "./components/LiveMatchStages";
import CareerAnalyticsDashboard from "./components/CareerAnalyticsDashboard";
import TeamNameWithFlag from './components/TeamNameWithFlag';



import "./simulator.css";



function CricketSimulator() {
  const controller = useCricketSimulatorController();
  const simShellRef = React.useRef(null);

  const {
    game,
    gameMode,
    seriesLength,
    seriesCurrentMatch,
    seriesResults,
    seriesStanding,
    seriesTopRunScorers,
    seriesTopWicketTakers,
    seriesProgressLabel,
    tournamentUserTeam,
    tournamentOpponentTeams,
    tournamentMatches,
    tournamentChampion,
    tournamentResults,
    tournamentTopRunScorers,
    tournamentTopWicketTakers,
    tournamentProgressLabel,
    isCurrentMatchUserInvolved,
    autoSimMode,
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
    goToPreviousStage,
    selectGameMode,
    selectSeriesLength,
    toggleTournamentOpponent,
    prepareTournamentFixtures,
    confirmTournamentFixtures,
    randomizeTournamentFixtures,
    updateTournamentFixture,
    matchPrimaryAction,
    simulateCurrentOver,
    simulateFullMatch,
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
    ownBattingOrderIds,
    opponentBattingOrderIds,
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
    moveOwnPlayerInBattingOrder,
    moveOpponentPlayerToXI,
    removeOpponentPlayerFromXI,
    moveOpponentPlayerInBattingOrder,
    setOwnRole,
    setOpponentRole,
    createCustomPlayer,
    autoPickOwnXI,
    autoPickOpponentXI,
    autoPositionOwnXI,
    autoPositionOpponentXI,
    startMatchWithSelectedXI,
    buildTeamOneScorecard,
    buildTeamTwoScorecard,
    resetMatch,
    oversDisplay,
    careerTeam,
    careerSeason,
    careerFormat,
    careerMatchIndex,
    careerSchedule,
    careerStandings,
    careerPlayerStats,
    careerSeasonHistory,
    careerPlayerProfile,
    careerDomesticCountry,
    careerDomesticTeams,
    careerGlobalPlayerPool,
    careerAuctionSummary,
    careerOffers,
    careerRetired,
    careerTopRunScorers,
    careerTopWicketTakers,
    careerProgressLabel,
    beginCareer,
    handleCareerContinueAfterAuction,
    handleCareerStartNextMatch,
    handleStartNextCareerSeason,
    handleEndCareer,
    handleRetireCareer,
    handleViewCareerHistory,
    handleBackToCareerSchedule,
  } = controller;

  React.useLayoutEffect(() => {
    if (simShellRef.current) {
      simShellRef.current.scrollTop = 0;
    }
  }, [game.stage]);

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
    matchStatusEnum.SeriesSummary,
    matchStatusEnum.TournamentChampion,
    matchStatusEnum.CareerSeasonSummary,
    matchStatusEnum.CareerHistory,
  ].includes(game.stage);
  const isCareerMode = gameMode === 'career';

  return (
    <div className="sim-shell" ref={simShellRef}>
      <CareerAnalyticsDashboard
      isCareerMode={isCareerMode}
      careerTeam={careerTeam}
      careerDomesticCountry={careerDomesticCountry}
      careerDomesticTeams={careerDomesticTeams}
      careerPlayerStats={careerPlayerStats}
      careerPlayerProfile={careerPlayerProfile}
      careerStandings={careerStandings}
      careerGlobalPlayerPool={careerGlobalPlayerPool}
    />

      {isGlobalSaving ? (
        <div className="sim-saving-overlay" role="status" aria-live="polite">
          <span className="sim-saving-ball" aria-hidden="true" />
          <p>Saving match...</p>
        </div>
      ) : null}
      <AnimatePresence mode="wait">
        {isLiveStage ? (
          <>
            <div className="sim-top-strip">
              <p>
                {isCareerMode
                  ? `Career — ${matchType.nameKey.toUpperCase()}`
                  : gameMode === 'series'
                  ? `${matchType.nameKey.toUpperCase()} Series`
                  : gameMode === 'tournament'
                    ? `${matchType.nameKey.toUpperCase()} Tournament`
                    : `${matchType.nameKey.toUpperCase()} Match`}
              </p>
              <p>
                <TeamNameWithFlag teamName={game.ownTeam} /> vs <TeamNameWithFlag teamName={game.opponentTeam} />
              </p>
              <p>
                {isCareerMode
                  ? careerProgressLabel
                  : gameMode === 'tournament'
                  ? tournamentProgressLabel
                  : seriesProgressLabel}
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
              gameMode={gameMode}
              seriesLength={seriesLength}
              seriesCurrentMatch={seriesCurrentMatch}
              seriesResults={seriesResults}
              seriesStanding={seriesStanding}
              seriesTopRunScorers={seriesTopRunScorers}
              seriesTopWicketTakers={seriesTopWicketTakers}
              tournamentChampion={tournamentChampion}
              tournamentResults={tournamentResults}
              tournamentTopRunScorers={tournamentTopRunScorers}
              tournamentTopWicketTakers={tournamentTopWicketTakers}
              isCurrentMatchUserInvolved={isCurrentMatchUserInvolved}
              autoSimMode={autoSimMode}
              onMatchPrimaryAction={matchPrimaryAction}
              onSimulateOver={simulateCurrentOver}
              onSimulateMatch={simulateFullMatch}
              resetMatch={resetMatch}
              oversDisplay={oversDisplay}
              careerTeam={careerTeam}
              careerSeason={careerSeason}
              careerFormat={careerFormat}
              careerMatchIndex={careerMatchIndex}
              careerSchedule={careerSchedule}
              careerStandings={careerStandings}
              careerPlayerStats={careerPlayerStats}
              careerSeasonHistory={careerSeasonHistory}
              careerPlayerProfile={careerPlayerProfile}
              careerDomesticCountry={careerDomesticCountry}
              careerDomesticTeams={careerDomesticTeams}
              careerOffers={careerOffers}
              careerRetired={careerRetired}
              careerTopRunScorers={careerTopRunScorers}
              careerTopWicketTakers={careerTopWicketTakers}
              careerProgressLabel={careerProgressLabel}
              handleStartNextCareerSeason={handleStartNextCareerSeason}
              handleEndCareer={handleEndCareer}
              handleRetireCareer={handleRetireCareer}
              handleViewCareerHistory={handleViewCareerHistory}
              handleBackToCareerSchedule={handleBackToCareerSchedule}
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
            goToPreviousStage={goToPreviousStage}
            selectGameMode={selectGameMode}
            selectSeriesLength={selectSeriesLength}
            tournamentUserTeam={tournamentUserTeam}
            tournamentOpponentTeams={tournamentOpponentTeams}
            tournamentMatches={tournamentMatches}
            toggleTournamentOpponent={toggleTournamentOpponent}
            prepareTournamentFixtures={prepareTournamentFixtures}
            confirmTournamentFixtures={confirmTournamentFixtures}
            randomizeTournamentFixtures={randomizeTournamentFixtures}
            updateTournamentFixture={updateTournamentFixture}
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
            ownBattingOrderIds={ownBattingOrderIds}
            opponentBattingOrderIds={opponentBattingOrderIds}
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
            moveOwnPlayerInBattingOrder={moveOwnPlayerInBattingOrder}
            moveOpponentPlayerToXI={moveOpponentPlayerToXI}
            removeOpponentPlayerFromXI={removeOpponentPlayerFromXI}
            moveOpponentPlayerInBattingOrder={moveOpponentPlayerInBattingOrder}
            setOwnRole={setOwnRole}
            setOpponentRole={setOpponentRole}
            createCustomPlayer={createCustomPlayer}
            autoPickOwnXI={autoPickOwnXI}
            autoPickOpponentXI={autoPickOpponentXI}
            autoPositionOwnXI={autoPositionOwnXI}
            autoPositionOpponentXI={autoPositionOpponentXI}
            startMatchWithSelectedXI={startMatchWithSelectedXI}
            beginCareer={beginCareer}
            careerTeam={careerTeam}
            careerSeason={careerSeason}
            careerMatchIndex={careerMatchIndex}
            careerSchedule={careerSchedule}
            careerStandings={careerStandings}
            careerPlayerProfile={careerPlayerProfile}
            careerDomesticCountry={careerDomesticCountry}
            careerDomesticTeams={careerDomesticTeams}
            careerGlobalPlayerPool={careerGlobalPlayerPool}
            careerAuctionSummary={careerAuctionSummary}
            careerOffers={careerOffers}
            careerRetired={careerRetired}
            handleCareerContinueAfterAuction={handleCareerContinueAfterAuction}
            handleCareerStartNextMatch={handleCareerStartNextMatch}
            handleViewCareerHistory={handleViewCareerHistory}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default CricketSimulator;
