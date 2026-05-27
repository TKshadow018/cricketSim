import React from 'react';
import StageShell from './StageShell';
import AppButton from '../../../components/ui/AppButton';

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

  return (
    <StageShell
      {...stageCommonProps}
      title="Career History"
      subtitle={`${careerPlayerProfile?.name || careerTeam} — ${careerRetired ? 'Retired' : 'Active'} career across ${careerSeason > 1 ? careerSeason - 1 : 0} completed season${careerSeason > 2 ? 's' : ''}`}
    >
      <div className="sim-scoreboard-panel">
        <h4 className="sim-section-title">Profile</h4>
        <p>Name: {careerPlayerProfile?.name || 'N/A'}</p>
        <p>Nationality: {careerPlayerProfile?.nationality || 'N/A'}</p>
        <p>Domestic League Country: {careerDomesticCountry || 'N/A'}</p>
      </div>

      {careerTopRunScorers?.length > 0 && (
        <div className="sim-scoreboard-panel">
          <h4 className="sim-section-title">All-Time Top Run Scorers</h4>
          {careerTopRunScorers.slice(0, 10).map((entry) => (
            <p key={entry.key}>{entry.name} ({entry.team}) — {entry.runs} runs in {entry.matches} matches (avg {entry.battingAverage})</p>
          ))}
        </div>
      )}

      {careerTopWicketTakers?.length > 0 && (
        <div className="sim-scoreboard-panel">
          <h4 className="sim-section-title">All-Time Top Wicket Takers</h4>
          {careerTopWicketTakers.slice(0, 10).map((entry) => (
            <p key={entry.key}>{entry.name} ({entry.team}) — {entry.wickets} wickets in {entry.matches} matches (avg {entry.bowlingAverage})</p>
          ))}
        </div>
      )}

      {seasons.length > 0 && (
        <div className="sim-scoreboard-panel">
          <h4 className="sim-section-title">Season History</h4>
          {seasons.map((season) => {
            const standings = Object.entries(season.standings || {})
              .map(([team, stats]) => ({ team, ...stats }))
              .sort((a, b) => b.points - a.points);
            const leader = standings[0];
            const userRow = standings.find((row) => row.team === season.careerTeam);

            return (
              <div key={season.season} className="sim-saved-item sim-player-pick-btn">
                <div className="sim-saved-item-content">
                  <strong>Season {season.season}</strong>
                  {leader && <small>Leader: {leader.team} ({leader.points} pts)</small>}
                  {userRow && (
                    <small>
                      {season.careerTeam}: {userRow.wins}W/{userRow.losses}L/{userRow.ties}T — {userRow.points} pts
                    </small>
                  )}
                </div>
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
