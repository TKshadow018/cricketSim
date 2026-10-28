import React from "react";
import { matchStatusEnum } from "../../../gameData/matchStatusEnum";
import AppButton from "../../../components/ui/AppButton";
import StageShell from "./StageShell";
import InningsStage from "./InningsStage";
import TeamNameWithFlag from "./TeamNameWithFlag";
import MatchSummaryStages from "./MatchSummaryStages";

const buildInningsSituation = ({ innings, view, matchType, matchCondition, oversDisplay, target }) => {
  const score = Number(innings?.score) || 0;
  const wickets = Number(innings?.wickets) || 0;
  const balls = Number(innings?.balls) || 0;
  const maxBalls = Math.max(0, (Number(matchType?.over) || 0) * 6);
  const ballsRemaining = Math.max(0, maxBalls - balls);
  const runsRemaining = target === null ? null : Math.max(0, target - score);

  return {
    ...(view?.bowlingContext || {}),
    ...(view?.battingContext || {}),
    score,
    wickets,
    over: oversDisplay(balls),
    oversLimit: Number(matchType?.over) || 0,
    target,
    runsRemaining,
    ballsRemaining,
    currentRunRate: balls > 0 ? ((score / balls) * 6).toFixed(2) : '0.00',
    requiredRunRate:
      runsRemaining === null || ballsRemaining <= 0
        ? null
        : ((runsRemaining / ballsRemaining) * 6).toFixed(2),
    matchCondition: matchCondition || {},
  };
};

function LiveMatchStages(props) {
  const {
    stage,
    stageCommonProps,
    game,
    matchType,
    firstInningsTeamName,
    secondInningsTeamName,
    firstInningsView,
    secondInningsView,
    setBattingIntent,
    setBattingTactics,
    setBowlingIntent,
    setBowlingTactics,
    onSaveGame,
    isSavingGame,
    saveMessage,
    processDelivery,
    handleSelectOpener,
    handleSelectNextBatter,
    handleSelectBowler,
    toggleScoreboard,
    buildTeamOneScorecard,
    buildTeamTwoScorecard,
    isCurrentMatchUserInvolved,
    autoSimMode,
    onSimulateOver,
    onSimulateMatch,
    oversDisplay,
  } = props;
  const firstInningsBowlingSituation = buildInningsSituation({
    innings: game.firstInnings,
    view: firstInningsView,
    matchType,
    matchCondition: game.matchCondition,
    oversDisplay,
    target: null,
  });
  const secondInningsBowlingSituation = buildInningsSituation({
    innings: game.secondInnings,
    view: secondInningsView,
    matchType,
    matchCondition: game.matchCondition,
    oversDisplay,
    target: Number(game.firstInnings?.score || 0) + 1,
  });

  return (
    <>
{stage === matchStatusEnum.TeamOneBat && (
        <StageShell
          {...stageCommonProps}
          title={`${firstInningsTeamName} Innings`}
          titleNode={
            <span className="sim-stage-team-title">
              <TeamNameWithFlag teamName={firstInningsTeamName} />
              <span>Innings</span>
            </span>
          }
          subtitle={`Overs: ${oversDisplay(game.firstInnings.balls)} / ${matchType.over} • Wickets: ${game.firstInnings.wickets}`}
          rightSlot={
            <AppButton
              text={game.showScoreboard ? 'Hide Scoreboard' : 'Show Scoreboard'}
              onClick={toggleScoreboard}
              fullWidth={false}
            />
          }
          dark
        >
          <InningsStage
            title={
              <span className="sim-stage-team-title">
                <TeamNameWithFlag teamName={firstInningsTeamName} />
                <span>Batting</span>
              </span>
            }
            subtitle={`Over ${oversDisplay(game.firstInnings.balls)} / ${matchType.over}`}
            score={game.firstInnings.score}
            wickets={game.firstInnings.wickets}
            lastEvent={game.firstInnings.lastEvent}
            isUserBatting={firstInningsView.isUserBatting}
            isUserBowling={firstInningsView.isUserBowling}
            strikerName={firstInningsView.strikerName}
            nonStrikerName={firstInningsView.nonStrikerName}
            currentBowlerName={firstInningsView.currentBowlerName}
            strikerPlayer={firstInningsView.strikerPlayer}
            nonStrikerPlayer={firstInningsView.nonStrikerPlayer}
            currentBowlerPlayer={firstInningsView.currentBowlerPlayer}
            needsOpeners={game.firstInnings.needsOpeners}
            openerSelections={game.firstInnings.openerSelections}
            openerCandidates={firstInningsView.openerCandidates}
            onSelectOpener={(index) => handleSelectOpener(true, index)}
            waitingForNextBatter={game.firstInnings.waitingForNextBatter}
            nextBatterCandidates={firstInningsView.nextBatterCandidates}
            onSelectNextBatter={(index) => handleSelectNextBatter(true, index)}
            waitingForNextBowler={game.firstInnings.waitingForNextBowler}
            bowlerCandidates={firstInningsView.bowlerCandidates}
            onSelectBowler={(index) => handleSelectBowler(true, index)}
            battingActions={firstInningsView.battingActionOptions}
            bowlingActions={firstInningsView.bowlingActionOptions}
            battingIntent={game.battingIntent}
            battingTactics={game.battingTactics}
            battingContext={firstInningsBowlingSituation}
            bowlingIntent={game.bowlingIntent}
            bowlingTactics={game.bowlingTactics}
            bowlingContext={firstInningsBowlingSituation}
            onBattingIntent={setBattingIntent}
            onBattingTacticsChange={setBattingTactics}
            onBowlingIntent={setBowlingIntent}
            onBowlingTacticsChange={setBowlingTactics}
            onBowlBall={() => processDelivery(true)}
            onSaveGame={onSaveGame}
            isSavingGame={isSavingGame}
            saveMessage={saveMessage}
            canPlayNextBall={firstInningsView.canPlayNextBall}
            showSimulationActions={!isCurrentMatchUserInvolved}
            onSimulateOver={onSimulateOver}
            onSimulateMatch={onSimulateMatch}
            isAutoSimulating={!!autoSimMode}
            showScoreboard={game.showScoreboard}
            scorecard={buildTeamOneScorecard()}
            commentary={game.firstInnings.commentary}
            onCloseScoreboard={toggleScoreboard}
          />
        </StageShell>
      )}
{stage === matchStatusEnum.TeamTwoBat && (
        <StageShell
          {...stageCommonProps}
          title={`${secondInningsTeamName} Chase`}
          titleNode={
            <span className="sim-stage-team-title">
              <TeamNameWithFlag teamName={secondInningsTeamName} />
              <span>Chase</span>
            </span>
          }
          subtitle={`Target: ${game.firstInnings.score + 1} • Overs ${oversDisplay(game.secondInnings.balls)} / ${matchType.over}`}
          rightSlot={
            <AppButton
              text={game.showScoreboard ? 'Hide Scoreboard' : 'Show Scoreboard'}
              onClick={toggleScoreboard}
              fullWidth={false}
            />
          }
          dark
        >
          <InningsStage
            title={
              <span className="sim-stage-team-title">
                <TeamNameWithFlag teamName={secondInningsTeamName} />
                <span>Batting</span>
              </span>
            }
            subtitle={`Target ${game.firstInnings.score + 1} • Over ${oversDisplay(game.secondInnings.balls)} / ${matchType.over}`}
            score={game.secondInnings.score}
            wickets={game.secondInnings.wickets}
            lastEvent={game.secondInnings.lastEvent}
            isUserBatting={secondInningsView.isUserBatting}
            isUserBowling={secondInningsView.isUserBowling}
            strikerName={secondInningsView.strikerName}
            nonStrikerName={secondInningsView.nonStrikerName}
            currentBowlerName={secondInningsView.currentBowlerName}
            strikerPlayer={secondInningsView.strikerPlayer}
            nonStrikerPlayer={secondInningsView.nonStrikerPlayer}
            currentBowlerPlayer={secondInningsView.currentBowlerPlayer}
            needsOpeners={game.secondInnings.needsOpeners}
            openerSelections={game.secondInnings.openerSelections}
            openerCandidates={secondInningsView.openerCandidates}
            onSelectOpener={(index) => handleSelectOpener(false, index)}
            waitingForNextBatter={game.secondInnings.waitingForNextBatter}
            nextBatterCandidates={secondInningsView.nextBatterCandidates}
            onSelectNextBatter={(index) => handleSelectNextBatter(false, index)}
            waitingForNextBowler={game.secondInnings.waitingForNextBowler}
            bowlerCandidates={secondInningsView.bowlerCandidates}
            onSelectBowler={(index) => handleSelectBowler(false, index)}
            battingActions={secondInningsView.battingActionOptions}
            bowlingActions={secondInningsView.bowlingActionOptions}
            battingIntent={game.battingIntent}
            battingTactics={game.battingTactics}
            battingContext={secondInningsBowlingSituation}
            bowlingIntent={game.bowlingIntent}
            bowlingTactics={game.bowlingTactics}
            bowlingContext={secondInningsBowlingSituation}
            onBattingIntent={setBattingIntent}
            onBattingTacticsChange={setBattingTactics}
            onBowlingIntent={setBowlingIntent}
            onBowlingTacticsChange={setBowlingTactics}
            onBowlBall={() => processDelivery(false)}
            onSaveGame={onSaveGame}
            isSavingGame={isSavingGame}
            saveMessage={saveMessage}
            canPlayNextBall={secondInningsView.canPlayNextBall}
            showSimulationActions={!isCurrentMatchUserInvolved}
            onSimulateOver={onSimulateOver}
            onSimulateMatch={onSimulateMatch}
            isAutoSimulating={!!autoSimMode}
            showScoreboard={game.showScoreboard}
            scorecard={buildTeamTwoScorecard()}
            commentary={game.secondInnings.commentary}
            onCloseScoreboard={toggleScoreboard}
          />
        </StageShell>
      )}
      <MatchSummaryStages {...props} />
    </>
  );
}

export default LiveMatchStages;
