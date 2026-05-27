import React from 'react';
import StageShell from './StageShell';
import AppButton from '../../../components/ui/AppButton';
import { formatCareerMatchLabel, sortStandings } from '../utils/controllerCareerScheduleUtils';

function CareerSeasonScheduleStage({
  stageCommonProps,
  careerTeam,
  careerSeason,
  careerMatchIndex,
  careerSchedule,
  careerStandings,
  careerPlayerProfile,
  careerRetired,
  handleCareerStartNextMatch,
  handleViewCareerHistory,
}) {
  const completedMatches = (careerSchedule || []).filter((m) => m.isComplete);
  const nextMatch = (careerSchedule || []).find((m) => !m.isComplete);
  const standingsList = sortStandings(careerStandings || {});
  const currentAge = (careerPlayerProfile?.age || 18) + Math.max((careerSeason || 1) - 1, 0);

  return (
    <StageShell
      {...stageCommonProps}
      title={`Season ${careerSeason} Schedule`}
      subtitle={`${careerPlayerProfile?.name || 'Career Player'} (${currentAge}) • ${careerTeam} • ${completedMatches.length} of ${(careerSchedule || []).length} fixtures completed`}
    >
      <div className="sim-scoreboard-panel">
        <h4 className="sim-section-title">Fixtures</h4>
        {(careerSchedule || []).map((match, index) => {
          const isCurrent = match === nextMatch;
          const resultText = match.isComplete && match.result
            ? match.isUserMatch
              ? `${match.result.winner === careerTeam ? '✅ Won' : match.result.winner === 'Tie' ? '🤝 Tie' : '❌ Lost'} — ${match.result.summary}`
              : `🧮 Auto-simulated — ${match.result.summary}`
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
                <strong>Match {match.globalMatchNumber}: {match.teamA} vs {match.teamB}</strong>
                <small>{formatCareerMatchLabel(match.format)}</small>
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
          <AppButton text="Simulate Until Next Club Match" onClick={handleCareerStartNextMatch} fullWidth />
        )}
        {careerRetired ? <AppButton text="Retired" disabled fullWidth={false} /> : null}
        <AppButton text="Career History" onClick={handleViewCareerHistory} variant="secondary" fullWidth={false} />
      </div>
    </StageShell>
  );
}

export default CareerSeasonScheduleStage;
