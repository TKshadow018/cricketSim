import React from 'react';
import StageShell from './StageShell';
import AppButton from '../../../components/ui/AppButton';
import { MatchResultCard } from './ResultCards';
import {
  CAREER_FORMATS,
  formatCareerMatchLabel,
  getCareerFormatStandings,
  sortStandings,
} from '../utils/controllerCareerScheduleUtils';
import PlayerNameWithType from './PlayerNameWithType';

function CareerSeasonScheduleStage({
  stageCommonProps,
  careerTeam,
  careerSeason,
  careerMatchIndex,
  careerSchedule,
  careerStandings,
  careerDomesticCountry,
  careerDomesticTeams,
  careerPlayerProfile,
  careerRetired,
  handleCareerStartNextMatch,
  handleViewCareerHistory,
}) {
  const allFixtures = careerSchedule || [];
  const leagueTeamNames = React.useMemo(() => {
    const teams = (careerDomesticTeams || []).filter((team) => !careerDomesticCountry || team.country === careerDomesticCountry);
    return new Set(teams.map((team) => team.name).filter(Boolean));
  }, [careerDomesticCountry, careerDomesticTeams]);
  const leagueFixtures = React.useMemo(() => {
    if (!allFixtures.length) {
      return [];
    }

    return allFixtures.filter((fixture) => {
      if (!fixture) {
        return false;
      }
      if (careerDomesticCountry && fixture.leagueCountry) {
        return fixture.leagueCountry === careerDomesticCountry;
      }
      return leagueTeamNames.has(fixture.teamA) && leagueTeamNames.has(fixture.teamB);
    });
  }, [allFixtures, careerDomesticCountry, leagueTeamNames]);
  const completedMatches = leagueFixtures.filter((m) => m.isComplete);
  const nextMatch = leagueFixtures.find(
    (m) => !m.isComplete && (m.isUserMatch || m.teamA === careerTeam || m.teamB === careerTeam)
  );
  const nextScheduledMatch = leagueFixtures.find((m) => !m.isComplete);
  const nextGlobalScheduledMatch = allFixtures.find((m) => !m.isComplete);
  const currentAge = (careerPlayerProfile?.age || 18) + Math.max((careerSeason || 1) - 1, 0);
  const [selectedCompletedMatch, setSelectedCompletedMatch] = React.useState(null);
  const [showFullSchedule, setShowFullSchedule] = React.useState(false);
  const [showPointsTable, setShowPointsTable] = React.useState(false);

  React.useEffect(() => {
    setShowFullSchedule(false);
    setShowPointsTable(false);
  }, [careerSeason]);

  const visibleFixtures = React.useMemo(() => {
    if (showFullSchedule) {
      return leagueFixtures;
    }

    return nextMatch ? [nextMatch] : nextScheduledMatch ? [nextScheduledMatch] : [];
  }, [showFullSchedule, leagueFixtures, nextMatch, nextScheduledMatch]);

  const simulateButtonLabel = nextMatch
    ? 'Simulate Until Next Club Match'
    : nextGlobalScheduledMatch
      ? 'Simulate Remaining AI Matches'
      : 'No Fixtures Left';

  const leagueStandingsByFormat = React.useMemo(() => {
    return CAREER_FORMATS.reduce((acc, format) => {
      const standingsList = sortStandings(getCareerFormatStandings(careerStandings || {}, format));
      const filtered = standingsList.filter((row) => leagueTeamNames.has(row.team));
      acc[format] = filtered;
      return acc;
    }, {});
  }, [careerStandings, leagueTeamNames]);

  return (
    <StageShell
      {...stageCommonProps}
      title={`Season ${careerSeason} Schedule`}
      subtitle={
        <>
          <PlayerNameWithType player={careerPlayerProfile} name={careerPlayerProfile?.name || 'Career Player'} /> ({currentAge})
          {' • '}
          {careerTeam} • {completedMatches.length} of {leagueFixtures.length} fixtures completed
        </>
      }
    >
      <div className="sim-scoreboard-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
          <h4 className="sim-section-title" style={{ margin: 0 }}>
            {showFullSchedule ? 'Fixtures' : 'Next Fixture'}
          </h4>
          <AppButton
            text={showFullSchedule ? 'Hide Full Schedule' : 'Show Full Schedule'}
            variant="secondary"
            fullWidth={false}
            onClick={() => setShowFullSchedule((prev) => !prev)}
          />
        </div>
        {visibleFixtures.length ? visibleFixtures.map((match) => {
          const isCurrent = match === nextMatch;
          const isCompleted = !!match.isComplete;
          const resultText = match.isComplete && match.result
            ? match.isUserMatch
              ? `${match.result.winner === careerTeam ? '✅ Won' : match.result.winner === 'Tie' ? '🤝 Tie' : '❌ Lost'} — ${match.result.summary}`
              : `🧮 Auto-simulated — ${match.result.summary}`
            : isCurrent
            ? '▶ Your next match'
            : match === nextScheduledMatch
            ? '▶ Next scheduled match'
            : 'Upcoming';

          return (
            <div
              key={match.id}
              className={`sim-saved-item sim-player-pick-btn ${isCurrent ? 'active' : ''}`}
              style={{ opacity: match.isComplete ? 0.7 : 1, cursor: isCompleted ? 'pointer' : 'default' }}
              role={isCompleted ? 'button' : undefined}
              tabIndex={isCompleted ? 0 : undefined}
              onClick={isCompleted ? () => setSelectedCompletedMatch(match) : undefined}
              onKeyDown={
                isCompleted
                  ? (event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedCompletedMatch(match);
                      }
                    }
                  : undefined
              }
            >
              <div className="sim-saved-item-content">
                <strong>Match {match.matchNumber || 'N/A'}: {match.teamA} vs {match.teamB}</strong>
                <small>{formatCareerMatchLabel(match.format)}</small>
                <small>{match.scheduledDateLabel || match.scheduledDate || 'TBD'}</small>
                <small>{resultText}</small>
              </div>
            </div>
          );
        }) : <p style={{ margin: 0 }}>No upcoming match scheduled.</p>}
      </div>

        {selectedCompletedMatch?.result ? (
          <div className="sim-confirm-overlay" role="dialog" aria-modal="true" aria-label="Completed fixture scoreboard">
            <div className="sim-confirm-modal sim-career-stats-modal">
              <button
                type="button"
                className="sim-modal-top-close"
                aria-label="Close"
                onClick={() => setSelectedCompletedMatch(null)}
              >
                ×
              </button>
              <div className="sim-career-stats-scroll">
                <MatchResultCard
                  teamOneLine={`${selectedCompletedMatch.teamA} ${selectedCompletedMatch.result.teamAScore}`}
                  teamTwoLine={`${selectedCompletedMatch.teamB} ${selectedCompletedMatch.result.teamBScore}`}
                  teamOneName={selectedCompletedMatch.teamA}
                  teamTwoName={selectedCompletedMatch.teamB}
                  teamOneScore={selectedCompletedMatch.result.teamAScore}
                  teamOneWickets={selectedCompletedMatch.result.teamAWickets || 0}
                  teamTwoScore={selectedCompletedMatch.result.teamBScore}
                  teamTwoWickets={selectedCompletedMatch.result.teamBWickets || 0}
                  teamOneOvers={selectedCompletedMatch.result.scorecard?.previousInnings?.overs || ''}
                  teamTwoOvers={selectedCompletedMatch.result.scorecard?.currentInnings?.overs || ''}
                  summary={selectedCompletedMatch.result.summary}
                  momRecommendations={[]}
                  onSelectManOfTheMatch={null}
                  onPrimaryAction={() => setSelectedCompletedMatch(null)}
                  primaryActionLabel="Close Scoreboard"
                  showScoreboard
                  scorecard={selectedCompletedMatch.result.scorecard}
                />
              </div>
            </div>
          </div>
        ) : null}

      <div className="sim-scoreboard-panel" style={{ marginTop: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <h4 className="sim-section-title" style={{ margin: 0 }}>Points Table</h4>
          <AppButton
            text={showPointsTable ? 'Hide Points Table' : 'Show Points Table'}
            variant="secondary"
            fullWidth={false}
            onClick={() => setShowPointsTable((prev) => !prev)}
          />
        </div>
      </div>

      {showPointsTable ? (
        CAREER_FORMATS.map((format) => {
          const standingsList = leagueStandingsByFormat[format] || [];
          if (!standingsList.length) {
            return null;
          }

          return (
            <div key={`standing-${format}`} className="sim-scoreboard-panel">
              <h4 className="sim-section-title">{formatCareerMatchLabel(format)} Standings</h4>
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
                    <tr key={`${format}-${row.team}`} style={{ background: row.team === careerTeam ? 'rgba(255,255,255,0.08)' : 'transparent' }}>
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
          );
        })
      ) : null}

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        {nextGlobalScheduledMatch && (
          <AppButton text={simulateButtonLabel} onClick={handleCareerStartNextMatch} fullWidth />
        )}
        {careerRetired ? <AppButton text="Retired" disabled fullWidth={false} /> : null}
        <AppButton text="Career History" onClick={handleViewCareerHistory} variant="secondary" fullWidth={false} />
      </div>
    </StageShell>
  );
}

export default CareerSeasonScheduleStage;
