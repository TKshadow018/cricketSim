import React from 'react';
import { matchStatusEnum } from '../../../gameData/matchStatusEnum';
import AppButton from '../../../components/ui/AppButton';
import StageShell from './StageShell';
import InningsStage from './InningsStage';
import { MatchResultCard } from './ResultCards';
import TeamNameWithFlag from './TeamNameWithFlag';

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
  teamOneFinal,
  teamTwoFinal,
  resultSummary,
  momRecommendations,
  onSelectManOfTheMatch,
  gameMode,
  seriesLength,
  seriesCurrentMatch,
  seriesResults,
  seriesStanding,
  seriesTopRunScorers,
  seriesTopWicketTakers,
  tournamentChampion,
  tournamentResults,
  tournamentTopRunScorers,
  tournamentTopWicketTakers,
  isCurrentMatchUserInvolved,
  autoSimMode,
  onMatchPrimaryAction,
  onSimulateOver,
  onSimulateMatch,
  resetMatch,
  oversDisplay,
}) {
  const isSeriesMode = gameMode === 'series';
  const isTournamentMode = gameMode === 'tournament';
  const isSeriesLastMatch = isSeriesMode && seriesCurrentMatch >= seriesLength;

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
            teamOneName={firstInningsTeamName}
            teamTwoName={secondInningsTeamName}
            teamOneScore={game.firstInnings.score}
            teamOneWickets={game.firstInnings.wickets}
            teamTwoScore={game.secondInnings.score}
            teamTwoWickets={game.secondInnings.wickets}
            teamOneOvers={oversDisplay(game.firstInnings.balls)}
            teamTwoOvers={oversDisplay(game.secondInnings.balls)}
            summary={resultSummary}
            momRecommendations={momRecommendations}
            onSelectManOfTheMatch={onSelectManOfTheMatch}
            showScoreboard={game.showScoreboard}
            scorecard={buildTeamTwoScorecard()}
            onPrimaryAction={onMatchPrimaryAction}
            primaryActionLabel={
              isSeriesMode
                ? (isSeriesLastMatch ? 'View Series Summary' : `Start Match ${seriesCurrentMatch + 1}`)
                : isTournamentMode
                  ? 'Next Knockout Match'
                  : 'Play New Match'
            }
          />
        </StageShell>
      )}

      {stage === matchStatusEnum.SeriesSummary && (
        <StageShell
          {...stageCommonProps}
          title="Series Summary"
          subtitle={`${seriesLength}-match series completed.`}
        >
          <div className="sim-series-summary-grid">
            <div className="sim-scoreboard-panel">
              <h4>Series Score</h4>
              <p>
                <TeamNameWithFlag teamName={game.ownTeam} /> {seriesStanding.ownWins} - {seriesStanding.opponentWins}{' '}
                <TeamNameWithFlag teamName={game.opponentTeam} />
              </p>
              <p>Tied matches: {seriesStanding.ties}</p>
            </div>

            <div className="sim-scoreboard-panel">
              <h4>Match Results</h4>
              <table className="sim-scoreboard-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Winner</th>
                    <th>Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {seriesResults.map((match) => (
                    <tr key={`series-result-${match.matchNumber}`}>
                      <td>{match.matchNumber}</td>
                      <td>{match.winnerTeam}</td>
                      <td>{match.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sim-scoreboard-panel">
              <h4>Top 10 Scorers</h4>
              <table className="sim-scoreboard-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Player</th>
                    <th>Team</th>
                    <th>Runs</th>
                    <th>Balls</th>
                    <th>Avg</th>
                    <th>SR</th>
                  </tr>
                </thead>
                <tbody>
                  {seriesTopRunScorers.map((entry, index) => (
                    <tr key={`series-runs-${entry.key}`}>
                      <td>{index + 1}</td>
                      <td>{entry.name}</td>
                      <td>{entry.team}</td>
                      <td>{entry.runs}</td>
                      <td>{entry.balls}</td>
                      <td>{entry.battingAverage}</td>
                      <td>{entry.strikeRate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sim-scoreboard-panel">
              <h4>Top 10 Wicket Takers</h4>
              <table className="sim-scoreboard-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Player</th>
                    <th>Team</th>
                    <th>Overs</th>
                    <th>Runs</th>
                    <th>Wickets</th>
                    <th>Avg/Wkt</th>
                    <th>Economy</th>
                  </tr>
                </thead>
                <tbody>
                  {seriesTopWicketTakers.map((entry, index) => (
                    <tr key={`series-wickets-${entry.key}`}>
                      <td>{index + 1}</td>
                      <td>{entry.name}</td>
                      <td>{entry.team}</td>
                      <td>{entry.overs}</td>
                      <td>{entry.runsConceded}</td>
                      <td>{entry.wickets}</td>
                      <td>{entry.bowlingAverage}</td>
                      <td>{entry.economy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <AppButton text="Start Fresh Match" onClick={resetMatch} />
          </div>
        </StageShell>
      )}

      {stage === matchStatusEnum.TournamentChampion && (
        <StageShell
          {...stageCommonProps}
          title="Tournament Champion"
          subtitle="Knockout completed. Celebrate the winner and review tournament leaders."
        >
          <div className="sim-series-summary-grid">
            <div className="sim-scoreboard-panel">
              <h4>Grand Congratulations</h4>
              <p className="sim-winner-line">
                {tournamentChampion === game.tournamentUserTeam
                  ? `🏆 Congratulations! ${tournamentChampion} wins the tournament!`
                  : `🏆 ${tournamentChampion} wins the tournament.`}
              </p>
            </div>

            <div className="sim-scoreboard-panel">
              <h4>Knockout Results</h4>
              <table className="sim-scoreboard-table">
                <thead>
                  <tr>
                    <th>Round</th>
                    <th>Match</th>
                    <th>Winner</th>
                    <th>Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {(tournamentResults || []).map((match) => (
                    <tr key={`tour-result-${match.id}`}>
                      <td>{match.round}</td>
                      <td>{match.matchNumber}</td>
                      <td>{match.winnerTeam}</td>
                      <td>{match.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sim-scoreboard-panel">
              <h4>Top 10 Tournament Scorers</h4>
              <table className="sim-scoreboard-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Player</th>
                    <th>Team</th>
                    <th>Runs</th>
                    <th>Balls</th>
                    <th>Avg</th>
                    <th>SR</th>
                  </tr>
                </thead>
                <tbody>
                  {tournamentTopRunScorers.map((entry, index) => (
                    <tr key={`tour-runs-${entry.key}`}>
                      <td>{index + 1}</td>
                      <td>{entry.name}</td>
                      <td>{entry.team}</td>
                      <td>{entry.runs}</td>
                      <td>{entry.balls}</td>
                      <td>{entry.battingAverage}</td>
                      <td>{entry.strikeRate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sim-scoreboard-panel">
              <h4>Top 10 Tournament Wicket Takers</h4>
              <table className="sim-scoreboard-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Player</th>
                    <th>Team</th>
                    <th>Overs</th>
                    <th>Runs</th>
                    <th>Wickets</th>
                    <th>Avg/Wkt</th>
                    <th>Economy</th>
                  </tr>
                </thead>
                <tbody>
                  {tournamentTopWicketTakers.map((entry, index) => (
                    <tr key={`tour-wickets-${entry.key}`}>
                      <td>{index + 1}</td>
                      <td>{entry.name}</td>
                      <td>{entry.team}</td>
                      <td>{entry.overs}</td>
                      <td>{entry.runsConceded}</td>
                      <td>{entry.wickets}</td>
                      <td>{entry.bowlingAverage}</td>
                      <td>{entry.economy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <AppButton text="Start Fresh Match" onClick={resetMatch} />
          </div>
        </StageShell>
      )}
    </>
  );
}

export default LiveMatchStages;
