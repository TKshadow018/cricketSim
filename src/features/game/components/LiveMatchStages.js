import React from 'react';
import { matchStatusEnum } from '../../../gameData/matchStatusEnum';
import AppButton from '../../../components/ui/AppButton';
import StageShell from './StageShell';
import InningsStage from './InningsStage';
import { MatchResultCard } from './ResultCards';

function LiveMatchStages({
  stage,
  stageCommonProps,
  game,
  matchType,
  firstInningsTeamName,
  secondInningsTeamName,
  firstInningsView,
  secondInningsView,
  setBattingIntent,
  setBowlingIntent,
  processDelivery,
  handleSelectOpener,
  handleSelectNextBatter,
  handleSelectBowler,
  toggleScoreboard,
  buildTeamOneScorecard,
  buildTeamTwoScorecard,
  teamOneFinal,
  teamTwoFinal,
  resultSummary,
  resetMatch,
  oversDisplay,
}) {
  return (
    <>
      {stage === matchStatusEnum.TeamOneBat && (
        <StageShell
          {...stageCommonProps}
          title={`${firstInningsTeamName} Innings`}
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
            title={`${firstInningsTeamName} Batting`}
            subtitle={`Over ${oversDisplay(game.firstInnings.balls)} / ${matchType.over}`}
            score={game.firstInnings.score}
            wickets={game.firstInnings.wickets}
            lastEvent={game.firstInnings.lastEvent}
            isUserBatting={firstInningsView.isUserBatting}
            isUserBowling={firstInningsView.isUserBowling}
            strikerName={firstInningsView.strikerName}
            nonStrikerName={firstInningsView.nonStrikerName}
            currentBowlerName={firstInningsView.currentBowlerName}
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
            bowlingIntent={game.bowlingIntent}
            onBattingIntent={setBattingIntent}
            onBowlingIntent={setBowlingIntent}
            onBowlBall={() => processDelivery(true)}
            canPlayNextBall={firstInningsView.canPlayNextBall}
            showScoreboard={game.showScoreboard}
            scorecard={buildTeamOneScorecard()}
            commentary={game.firstInnings.commentary}
          />
        </StageShell>
      )}

      {stage === matchStatusEnum.TeamTwoBat && (
        <StageShell
          {...stageCommonProps}
          title={`${secondInningsTeamName} Chase`}
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
            title={`${secondInningsTeamName} Batting`}
            subtitle={`Target ${game.firstInnings.score + 1} • Over ${oversDisplay(game.secondInnings.balls)} / ${matchType.over}`}
            score={game.secondInnings.score}
            wickets={game.secondInnings.wickets}
            lastEvent={game.secondInnings.lastEvent}
            isUserBatting={secondInningsView.isUserBatting}
            isUserBowling={secondInningsView.isUserBowling}
            strikerName={secondInningsView.strikerName}
            nonStrikerName={secondInningsView.nonStrikerName}
            currentBowlerName={secondInningsView.currentBowlerName}
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
            bowlingIntent={game.bowlingIntent}
            onBattingIntent={setBattingIntent}
            onBowlingIntent={setBowlingIntent}
            onBowlBall={() => processDelivery(false)}
            canPlayNextBall={secondInningsView.canPlayNextBall}
            showScoreboard={game.showScoreboard}
            scorecard={buildTeamTwoScorecard()}
            commentary={game.secondInnings.commentary}
          />
        </StageShell>
      )}

      {stage === matchStatusEnum.MatchEnd && (
        <StageShell
          {...stageCommonProps}
          title="Match End"
          subtitle="Final result and scorecard snapshot."
          rightSlot={
            <AppButton
              text={game.showScoreboard ? 'Hide Scoreboard' : 'Show Scoreboard'}
              onClick={toggleScoreboard}
              fullWidth={false}
            />
          }
        >
          <MatchResultCard
            teamOneLine={teamOneFinal}
            teamTwoLine={teamTwoFinal}
            teamOneOvers={oversDisplay(game.firstInnings.balls)}
            teamTwoOvers={oversDisplay(game.secondInnings.balls)}
            summary={resultSummary}
            showScoreboard={game.showScoreboard}
            scorecard={buildTeamTwoScorecard()}
            onNewMatch={resetMatch}
          />
        </StageShell>
      )}
    </>
  );
}

export default LiveMatchStages;
