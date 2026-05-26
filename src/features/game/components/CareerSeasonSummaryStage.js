import React from 'react';
import StageShell from './StageShell';
import AppButton from '../../../components/ui/AppButton';
import { sortStandings } from '../utils/controllerCareerScheduleUtils';
import { buildSeasonProgressionNotes } from '../utils/controllerCareerPlayerUtils';

function CareerSeasonSummaryStage({
  stageCommonProps,
  careerTeam,
  careerSeason,
  careerSchedule,
  careerStandings,
  careerPlayerStats,
  careerTopRunScorers,
  careerTopWicketTakers,
  handleStartNextCareerSeason,
  handleEndCareer,
}) {
  const standingsList = sortStandings(careerStandings || {});
  const topTeam = standingsList[0];
  const userStanding = standingsList.find((row) => row.team === careerTeam);
  const progressionNotes = buildSeasonProgressionNotes(careerPlayerStats);
  const userWon = topTeam?.team === careerTeam;

  return (
    <StageShell
      {...stageCommonProps}
      title={`Season ${careerSeason} Complete`}
      subtitle={userWon ? `🏆 ${careerTeam} tops the standings!` : `Season finished — ${topTeam?.team || ''} leads the table.`}
    >
      <div className="sim-scoreboard-panel">
        <h4 className="sim-section-title">Final Standings</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '4px 8px' }}>#</th>
              <th style={{ textAlign: 'left', padding: '4px 8px' }}>Team</th>
              <th style={{ textAlign: 'center', padding: '4px' }}>P</th>
              <th style={{ textAlign: 'center', padding: '4px' }}>W</th>
              <th style={{ textAlign: 'center', padding: '4px' }}>L</th>
              <th style={{ textAlign: 'center', padding: '4px' }}>T</th>
              <th style={{ textAlign: 'center', padding: '4px', fontWeight: 'bold' }}>Pts</th>
            </tr>
          </thead>
          <tbody>
            {standingsList.map((row, i) => (
              <tr key={row.team} style={{ background: row.team === careerTeam ? 'rgba(255,255,255,0.08)' : 'transparent' }}>
                <td style={{ padding: '4px 8px' }}>{i + 1}</td>
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

      {userStanding && (
        <div className="sim-scoreboard-panel">
          <h4 className="sim-section-title">{careerTeam} Season Record</h4>
          <p>{userStanding.wins}W / {userStanding.losses}L / {userStanding.ties}T — {userStanding.points} points</p>
        </div>
      )}

      {careerTopRunScorers?.length > 0 && (
        <div className="sim-scoreboard-panel">
          <h4 className="sim-section-title">Top Run Scorers</h4>
          {careerTopRunScorers.slice(0, 5).map((entry) => (
            <p key={entry.key}>{entry.name} ({entry.team}) — {entry.runs} runs (avg {entry.battingAverage})</p>
          ))}
        </div>
      )}

      {careerTopWicketTakers?.length > 0 && (
        <div className="sim-scoreboard-panel">
          <h4 className="sim-section-title">Top Wicket Takers</h4>
          {careerTopWicketTakers.slice(0, 5).map((entry) => (
            <p key={entry.key}>{entry.name} ({entry.team}) — {entry.wickets} wkts (avg {entry.bowlingAverage})</p>
          ))}
        </div>
      )}

      {progressionNotes.length > 0 && (
        <div className="sim-scoreboard-panel">
          <h4 className="sim-section-title">Season Highlights</h4>
          {progressionNotes.slice(0, 8).map((note, i) => (
            <p key={i}><strong>{note.player}</strong> ({note.team}): {note.note}</p>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <AppButton text="Start Next Season" onClick={handleStartNextCareerSeason} fullWidth />
        <AppButton text="End Career" onClick={handleEndCareer} variant="secondary" fullWidth={false} />
      </div>
    </StageShell>
  );
}

export default CareerSeasonSummaryStage;
