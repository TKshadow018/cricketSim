import React from "react";
import { matchStatusEnum } from "../../../gameData/matchStatusEnum";
import AppButton from "../../../components/ui/AppButton";
import StageShell from "./StageShell";
import { MatchResultCard } from "./ResultCards";
import TeamNameWithFlag from "./TeamNameWithFlag";
import PlayerNameWithType from "./PlayerNameWithType";
import CareerSeasonSummaryStage from "./CareerSeasonSummaryStage";
import CareerHistoryStage from "./CareerHistoryStage";

function MatchSummaryStages(props) {
  const {
    stage,
    stageCommonProps,
    game,
    firstInningsTeamName,
    secondInningsTeamName,
    toggleScoreboard,
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
    onMatchPrimaryAction,
    resetMatch,
    oversDisplay,
    careerTeam,
    careerSeason,
    careerSchedule,
    careerStandings,
    careerPlayerStats,
    careerSeasonHistory,
    careerPlayerProfile,
    careerDomesticCountry,
    careerDomesticTeams,
    careerOffers,
    careerRetired,
    careerTopRunScorers,
    careerTopWicketTakers,
    handleStartNextCareerSeason,
    handleEndCareer,
    handleRetireCareer,
    handleBackToCareerSchedule,
  } = props;

  const isSeriesMode = gameMode === 'series';
  
  const isTournamentMode = gameMode === 'tournament';
  
  const isCareerMode = gameMode === 'career';
  
  const isSeriesLastMatch = isSeriesMode && seriesCurrentMatch >= seriesLength;

  return (
    <>
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
            onCloseScoreboard={toggleScoreboard}
            showScoreboard={game.showScoreboard}
            scorecard={buildTeamTwoScorecard()}
            onPrimaryAction={onMatchPrimaryAction}
            autoSelectTopMomOnPrimaryAction={isCareerMode}
            primaryActionLabel={
              isCareerMode
                ? 'Back to Schedule'
                : isSeriesMode
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
                      <td><PlayerNameWithType player={entry} /></td>
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
                      <td><PlayerNameWithType player={entry} /></td>
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
                  ? `Congratulations! ${tournamentChampion} wins the tournament!`
                  : `${tournamentChampion} wins the tournament.`}
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
                      <td><PlayerNameWithType player={entry} /></td>
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
                      <td><PlayerNameWithType player={entry} /></td>
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
{stage === matchStatusEnum.CareerSeasonSummary && (
        <CareerSeasonSummaryStage
          stageCommonProps={stageCommonProps}
          careerTeam={careerTeam}
          careerSeason={careerSeason}
          careerSchedule={careerSchedule}
          careerStandings={careerStandings}
          careerPlayerStats={careerPlayerStats}
          careerTopRunScorers={careerTopRunScorers}
          careerTopWicketTakers={careerTopWicketTakers}
          careerPlayerProfile={careerPlayerProfile}
          careerDomesticCountry={careerDomesticCountry}
          careerDomesticTeams={careerDomesticTeams}
          careerOffers={careerOffers}
          careerRetired={careerRetired}
          handleStartNextCareerSeason={handleStartNextCareerSeason}
          handleEndCareer={handleEndCareer}
          handleRetireCareer={handleRetireCareer}
        />
      )}
{stage === matchStatusEnum.CareerHistory && (
        <CareerHistoryStage
          stageCommonProps={stageCommonProps}
          careerTeam={careerTeam}
          careerSeason={careerSeason}
          careerTopRunScorers={careerTopRunScorers}
          careerTopWicketTakers={careerTopWicketTakers}
          careerSeasonHistory={careerSeasonHistory}
          careerPlayerProfile={careerPlayerProfile}
          careerDomesticCountry={careerDomesticCountry}
          careerRetired={careerRetired}
          handleBackToCareerSchedule={handleBackToCareerSchedule}
        />
      )}
    </>
  );
}

export default MatchSummaryStages;
