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
    teamOneFinal,
    teamTwoFinal,
    resultSummary,
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
    setBattingIntent,
    setBowlingIntent,
    processDelivery,
    handleSelectOpener,
    handleSelectNextBatter,
    handleSelectBowler,
    handleTossCall,
    handleUserTossDecision,
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
            handleTossCall={handleTossCall}
            handleUserTossDecision={handleUserTossDecision}
            isUserWinner={isUserWinner}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default CricketSimulator;
