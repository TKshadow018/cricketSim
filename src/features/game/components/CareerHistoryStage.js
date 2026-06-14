import React from 'react';
import StageShell from './StageShell';
import AppButton from '../../../components/ui/AppButton';
import {
  CAREER_FORMATS,
  formatCareerMatchLabel,
  getCareerFormatStandings,
  sortStandings,
} from '../utils/controllerCareerScheduleUtils';
import PlayerNameWithType from './PlayerNameWithType';

function CareerHistoryStage({
  stageCommonProps,
  careerTeam,
  careerSeason,
  careerTopRunScorers,
  careerTopWicketTakers,
  careerSeasonHistory,
  careerPlayerProfile,
  careerDomesticCountry,
  careerRetired,
  handleBackToCareerSchedule,
}) {
  const seasons = (careerSeasonHistory || []).slice().reverse();

  const buildCompactAwardsSummary = (awards = []) => {
    if (!Array.isArray(awards) || !awards.length) {
      return '';
    }

    return awards
      .map((award) => {
        const shortTitle =
          award.id === 'best-batsman'
            ? 'BAT'
            : award.id === 'best-bowler'
              ? 'BWL'
              : award.id === 'young-player'
                ? 'YNG'
                : award.id === 'player-of-year'
                  ? 'POY'
                  : award.id === 'most-mom'
                    ? 'MOM'
                    : 'AWD';
        const winnerName = award?.winner?.name || 'N/A';
        return `${shortTitle}: ${winnerName}`;
      })
      .join(' | ');
  };

  return (
    <StageShell
      {...stageCommonProps}
      title="Career History"
      subtitle={
        <>
          <PlayerNameWithType player={careerPlayerProfile} name={careerPlayerProfile?.name || careerTeam} />
          {' '}
          {careerRetired ? 'Retired' : 'Active'} career across {careerSeason > 1 ? careerSeason - 1 : 0} completed season{careerSeason > 2 ? 's' : ''}
        </>
      }
    >
      <div className="sim-scoreboard-panel">
        <h4 className="sim-section-title">Profile</h4>
        <p>Name: <PlayerNameWithType player={careerPlayerProfile} name={careerPlayerProfile?.name || 'N/A'} /></p>
        <p>Nationality: {careerPlayerProfile?.nationality || 'N/A'}</p>
        <p>Domestic League Country: {careerDomesticCountry || 'N/A'}</p>
      </div>

      {careerTopRunScorers?.length > 0 && (
        <div className="sim-scoreboard-panel">
          <h4 className="sim-section-title">All-Time Top Run Scorers</h4>
          {careerTopRunScorers.slice(0, 10).map((entry) => (
            <p key={entry.key}><PlayerNameWithType player={entry} /> ({entry.team}) — {entry.runs} runs in {entry.matches} matches (avg {entry.battingAverage})</p>
          ))}
        </div>
      )}

      {careerTopWicketTakers?.length > 0 && (
        <div className="sim-scoreboard-panel">
          <h4 className="sim-section-title">All-Time Top Wicket Takers</h4>
          {careerTopWicketTakers.slice(0, 10).map((entry) => (
            <p key={entry.key}><PlayerNameWithType player={entry} /> ({entry.team}) — {entry.wickets} wickets in {entry.matches} matches (avg {entry.bowlingAverage})</p>
          ))}
        </div>
      )}

      {seasons.length > 0 && (
        <div className="sim-scoreboard-panel">
          <h4 className="sim-section-title">Season History</h4>
          {seasons.map((season) => {
            const seasonRows = CAREER_FORMATS.map((format) => {
              const standings = sortStandings(getCareerFormatStandings(season.standings || {}, format));
              const leader = standings[0];
              const userRow = standings.find((row) => row.team === season.careerTeam);
              return { format, leader, userRow };
            });

            return (
              <div key={season.season} className="sim-saved-item sim-player-pick-btn">
                <div className="sim-saved-item-content">
                  <strong>Season {season.season}</strong>
                  {seasonRows.map((entry) => (
                    <small key={`season-${season.season}-${entry.format}`}>
                      {formatCareerMatchLabel(entry.format)}: {entry.leader ? `Leader ${entry.leader.team} (${entry.leader.points} pts)` : 'No results'}
                      {entry.userRow
                        ? ` | ${season.careerTeam}: ${entry.userRow.wins}W/${entry.userRow.losses}L/${entry.userRow.ties}T (${entry.userRow.points} pts)`
                        : ''}
                    </small>
                  ))}
                  {season.seasonReport?.awards?.length > 0 ? (
                    <small>
                      Awards: {buildCompactAwardsSummary(season.seasonReport.awards)}
                    </small>
                  ) : null}
                </div>
                  {season.seasonReport ? (
                    <div className="sim-season-report-shell">
                      <h4 className="sim-section-title">Season Report</h4>
                      <p>Season Age: {season.seasonReport.currentAge}</p>

                      {season.seasonReport.awards?.length > 0 ? (
                        <div className="sim-scoreboard-panel">
                          <h4 className="sim-section-title">Season Awards</h4>
                          {season.seasonReport.awards.map((award) => (
                            <p key={`history-award-${season.season}-${award.id}`}>
                              <strong>{award.title}:</strong>{' '}
                              {award.winner
                                ? `${award.winner.name} (${award.winner.team}) - ${award.summary}`
                                : award.summary}
                            </p>
                          ))}
                        </div>
                      ) : null}

                      {season.seasonReport.abilityChangePreview?.length > 0 ? (
                        <div className="sim-scoreboard-panel">
                          <h4 className="sim-section-title">Ability Changes</h4>
                          <table className="sim-scoreboard-table">
                            <thead>
                              <tr>
                                <th>Player</th>
                                <th>Team</th>
                                <th>Net</th>
                              </tr>
                            </thead>
                            <tbody>
                              {season.seasonReport.abilityChangePreview.slice(0, 12).map((row) => (
                                <tr key={`history-ability-${season.season}-${row.team}-${row.player.id}`}>
                                  <td><PlayerNameWithType player={row.player} /></td>
                                  <td>{row.team}</td>
                                  <td><strong>{row.delta >= 0 ? `+${row.delta}` : row.delta}</strong></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : null}

                      {season.seasonReport.topRunScorers?.length > 0 ? (
                        <div className="sim-scoreboard-panel">
                          <h4 className="sim-section-title">Top Run Scorers</h4>
                          {season.seasonReport.topRunScorers.slice(0, 5).map((entry, index) => (
                            <p key={`history-runs-${season.season}-${entry.key}`}><strong>#{index + 1} <PlayerNameWithType player={entry} /></strong> ({entry.team}) — {entry.runs} runs</p>
                          ))}
                        </div>
                      ) : null}

                      {season.seasonReport.topWicketTakers?.length > 0 ? (
                        <div className="sim-scoreboard-panel">
                          <h4 className="sim-section-title">Top Wicket Takers</h4>
                          {season.seasonReport.topWicketTakers.slice(0, 5).map((entry, index) => (
                            <p key={`history-wickets-${season.season}-${entry.key}`}><strong>#{index + 1} <PlayerNameWithType player={entry} /></strong> ({entry.team}) — {entry.wickets} wickets</p>
                          ))}
                        </div>
                      ) : null}

                      {season.seasonReport.progressionNotes?.length > 0 ? (
                        <div className="sim-scoreboard-panel">
                          <h4 className="sim-section-title">Highlighted Performances</h4>
                          {season.seasonReport.progressionNotes.slice(0, 8).map((note, index) => (
                            <p key={`history-note-${season.season}-${index}`}><strong><PlayerNameWithType player={note} name={note.player} /></strong> ({note.team}) — {note.note}</p>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
              </div>
            );
          })}
        </div>
      )}

      {seasons.length === 0 && (
        <p className="sim-section-title">No completed seasons yet.</p>
      )}

      <AppButton text="Back to Schedule" onClick={handleBackToCareerSchedule} fullWidth />
    </StageShell>
  );
}

export default CareerHistoryStage;
