import React from 'react';
import StageShell from './StageShell';
import AppButton from '../../../components/ui/AppButton';
import { sortStandings } from '../utils/controllerCareerScheduleUtils';

function CareerSeasonScheduleStage({
  stageCommonProps,
  careerTeam,
  careerSeason,
  careerMatchIndex,
  careerSchedule,
  careerStandings,
  handleCareerStartNextMatch,
  handleViewCareerHistory,
}) {
  const completedMatches = (careerSchedule || []).filter((m) => m.isComplete);
  const nextMatch = (careerSchedule || []).find((m) => !m.isComplete);
  const standingsList = sortStandings(careerStandings || {});

  return (
    <StageShell
      {...stageCommonProps}
      title={`Season ${careerSeason} Schedule`}
      subtitle={`${careerTeam} — ${completedMatches.length} of ${(careerSchedule || []).length} matches played`}
    >
      <div className="sim-scoreboard-panel">
        <h4 className="sim-section-title">Fixtures</h4>
        {(careerSchedule || []).map((match, index) => {
          const isCurrent = match === nextMatch;
          const resultText = match.isComplete && match.result
            ? `${match.result.winner === careerTeam ? '✅ Won' : match.result.winner === 'Tie' ? '🤝 Tie' : '❌ Lost'} — ${match.result.summary}`
            : isCurrent
            ? '▶ Next match'
            : 'Upcoming';

          return (
            <div
              key={match.id}
              className={`sim-saved-item sim-player-pick-btn ${isCurrent ? 'active' : ''}`}
              style={{ opacity: match.isComplete ? 0.7 : 1 }}
            >
              <div className="sim-saved-item-content">
                <strong>Match {match.matchNumber}: vs {match.opponent}</strong>
                <small>{match.locationCountry}</small>
                <small>{resultText}</small>
              </div>
            </div>
          );
        })}
      </div>

      {standingsList.length > 0 && (
        <div className="sim-scoreboard-panel">
          <h4 className="sim-section-title">Standings</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '4px 8px' }}>Team</th>
                <th style={{ textAlign: 'center', padding: '4px' }}>P</th>
                <th style={{ textAlign: 'center', padding: '4px' }}>W</th>
                <th style={{ textAlign: 'center', padding: '4px' }}>L</th>
                <th style={{ textAlign: 'center', padding: '4px' }}>T</th>
                <th style={{ textAlign: 'center', padding: '4px' }}>Pts</th>
              </tr>
            </thead>
            <tbody>
              {standingsList.map((row) => (
                <tr key={row.team} style={{ background: row.team === careerTeam ? 'rgba(255,255,255,0.08)' : 'transparent' }}>
                  <td style={{ padding: '4px 8px' }}>{row.team}</td>
                  <td style={{ textAlign: 'center', padding: '4px' }}>{row.played}</td>
                  <td style={{ textAlign: 'center', padding: '4px' }}>{row.wins}</td>
                  <td style={{ textAlign: 'center', padding: '4px' }}>{row.losses}</td>
                  <td style={{ textAlign: 'center', padding: '4px' }}>{row.ties}</td>
                  <td style={{ textAlign: 'center', padding: '4px', fontWeight: 'bold' }}>{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        {nextMatch && (
          <AppButton text="Play Next Match" onClick={handleCareerStartNextMatch} fullWidth />
        )}
        <AppButton text="Career History" onClick={handleViewCareerHistory} variant="secondary" fullWidth={false} />
      </div>
    </StageShell>
  );
}

export default CareerSeasonScheduleStage;
