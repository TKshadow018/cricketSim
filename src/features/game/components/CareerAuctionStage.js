import React from 'react';
import StageShell from './StageShell';
import AppButton from '../../../components/ui/AppButton';
import PlayerNameWithType from './PlayerNameWithType';
import TeamNameWithLogo from './TeamNameWithLogo';

function CareerAuctionStage({
  stageCommonProps,
  careerSeason,
  careerPlayerProfile,
  careerDomesticCountry,
  careerTeam,
  careerAuctionSummary,
  handleCareerContinueAfterAuction,
}) {
  const summary = careerAuctionSummary || {};
  const budgetRows = Array.isArray(summary.budgetTable) ? summary.budgetTable : [];
  const marqueeRows = Array.isArray(summary.marqueeBids) ? summary.marqueeBids.slice(0, 28) : [];
  const timeline = Array.isArray(summary.auctionTimeline) ? summary.auctionTimeline : [];
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isAutoPlay, setIsAutoPlay] = React.useState(true);
  const [playbackMs, setPlaybackMs] = React.useState(900);
  const [pausedForUserMoment, setPausedForUserMoment] = React.useState(false);
  const [revealedBidCount, setRevealedBidCount] = React.useState(0);
  const profileName = careerPlayerProfile?.name || 'Career Player';
  const playerAuctionEvent = summary.careerPlayerEvent;
  const currentEvent = timeline[currentIndex] || null;
  const shownRows = timeline.slice(0, Math.max(0, currentIndex + 1)).slice(-16).reverse();
  const isAtFinalAuctionState = timeline.length > 0 && currentIndex >= timeline.length - 1;

  React.useEffect(() => {
    setCurrentIndex(0);
    setIsAutoPlay(true);
    setPausedForUserMoment(false);
  }, [timeline.length]);

  React.useEffect(() => {
    if (!isAutoPlay || !timeline.length || currentIndex >= timeline.length - 1) {
      return undefined;
    }
    const timer = setTimeout(() => {
      setCurrentIndex((prev) => Math.min(prev + 1, timeline.length - 1));
    }, playbackMs);
    return () => clearTimeout(timer);
  }, [currentIndex, timeline.length, isAutoPlay, playbackMs]);

  React.useEffect(() => {
    if (!currentEvent?.isCareerPlayer || pausedForUserMoment || !isAutoPlay) {
      return;
    }
    setPausedForUserMoment(true);
    setIsAutoPlay(false);
  }, [currentEvent, pausedForUserMoment, isAutoPlay]);

  React.useEffect(() => {
    const bids = Array.isArray(currentEvent?.bids) ? currentEvent.bids : [];
    setRevealedBidCount(0);
    if (!bids.length) {
      return undefined;
    }

    let localIndex = 0;
    const timer = setInterval(() => {
      localIndex += 1;
      setRevealedBidCount(localIndex);
      if (localIndex >= bids.length) {
        clearInterval(timer);
      }
    }, 170);

    return () => clearInterval(timer);
  }, [currentEvent]);

  const domesticRatioPercent = Math.round(Number(summary.playerPoolComposition?.domesticRatio || 0.85) * 100);
  const foreignRatioPercent = Math.round(Number(summary.playerPoolComposition?.foreignRatio || 0.15) * 100);
  const teamRules = summary.teamRules || {};
  const domesticRange = teamRules.domesticPerTeam || [15, 20];
  const foreignRange = teamRules.foreignPerTeam || [5, 8];
  const minimumRoleLimits = teamRules.minimumRoleLimits || {};
  const progressLabel = timeline.length ? `${Math.min(currentIndex + 1, timeline.length)} / ${timeline.length}` : '0 / 0';
  const currentEventBidCount = Array.isArray(currentEvent?.bids) ? currentEvent.bids.length : 0;
  const phaseLabel = !currentEvent
    ? 'Auction loading'
    : !currentEvent.isSold && currentEventBidCount === 0
      ? 'Going Once'
      : !currentEvent.isSold && currentEventBidCount === 1
        ? 'Going Twice'
        : currentEvent.isSold
          ? 'SOLD'
          : 'Live Bidding';
  const momentum = currentEvent
    ? Math.min(100, Math.round(((currentEvent.abilityScore || 0) / 350) * 45 + currentEventBidCount * 8 + (currentEvent.isSold ? 18 : 0)))
    : 0;

  const auctioneerLine = !currentEvent
    ? 'Auctioneer: Welcome to today\'s player market. Waiting for first nomination.'
    : !currentEvent.isSold && currentEventBidCount === 0
      ? `Auctioneer: ${currentEvent.playerName} at base ${currentEvent.basePriceLabel}. Any bidder?`
      : !currentEvent.isSold && currentEventBidCount === 1
        ? `Auctioneer: One bid in. Going once for ${currentEvent.playerName}.`
        : !currentEvent.isSold
          ? `Auctioneer: ${currentEventBidCount} clubs in the race for ${currentEvent.playerName}.`
          : `Auctioneer: SOLD! ${currentEvent.playerName} to ${currentEvent.winnerTeam} for ${currentEvent.amountLabel}.`;

  const liveBudgetRows = React.useMemo(() => {
    if (isAtFinalAuctionState) {
      return budgetRows || [];
    }

    const baseByTeam = (budgetRows || []).reduce((acc, row) => {
      acc[row.team] = {
        ...row,
        signings: 0,
        spent: 0,
        domesticPlayers: 0,
        foreignPlayers: 0,
        roleCounts: {
          wicketkeepers: 0,
          bowling: 0,
          batting: 0,
        },
      };
      return acc;
    }, {});

    const revealedEvents = timeline.slice(0, Math.max(0, currentIndex + 1));
    revealedEvents.forEach((event) => {
      if (!event?.isSold || !event?.winnerTeam || !baseByTeam[event.winnerTeam]) {
        return;
      }

      const row = baseByTeam[event.winnerTeam];
      row.signings += 1;
      row.spent += Number(event.amount || 0);
      if (event.playerCountry && row.country && event.playerCountry === row.country) {
        row.domesticPlayers += 1;
      } else {
        row.foreignPlayers += 1;
      }
      if (event.isWicketkeeperProfile) {
        row.roleCounts.wicketkeepers += 1;
      }
      if (event.isBowlingProfile) {
        row.roleCounts.bowling += 1;
      }
      if (event.isBattingProfile) {
        row.roleCounts.batting += 1;
      }
    });

    return Object.values(baseByTeam)
      .map((row) => ({
        ...row,
        budgetLeft: Math.max(0, Number(row.budgetStart || 0) - Number(row.spent || 0)),
        budgetLeftLabel: `$${Math.max(0, Number(row.budgetStart || 0) - Number(row.spent || 0)).toLocaleString('en-US')}`,
        spentLabel: `$${Number(row.spent || 0).toLocaleString('en-US')}`,
      }))
      .sort((left, right) => Number(right.spent || 0) - Number(left.spent || 0) || String(left.team).localeCompare(String(right.team)));
  }, [budgetRows, timeline, currentIndex, isAtFinalAuctionState]);

  const quotaSummary = React.useMemo(() => {
    const rows = liveBudgetRows || [];
    const total = rows.length;
    const passingAll = rows.filter((row) => {
      const wkPass = Number(row.roleCounts?.wicketkeepers || 0) >= Number(minimumRoleLimits.wicketkeepers || 2);
      const bowlingPass = Number(row.roleCounts?.bowling || 0) >= Number(minimumRoleLimits.bowlingProfiles || 10);
      const battingPass = Number(row.roleCounts?.batting || 0) >= Number(minimumRoleLimits.battingProfiles || 12);
      const domesticPass = Number(row.domesticPlayers || 0) >= Number(domesticRange[0] || 15) && Number(row.domesticPlayers || 0) <= Number(domesticRange[1] || 20);
      const foreignPass = Number(row.foreignPlayers || 0) >= Number(foreignRange[0] || 5) && Number(row.foreignPlayers || 0) <= Number(foreignRange[1] || 8);
      return wkPass && bowlingPass && battingPass && domesticPass && foreignPass;
    }).length;

    return {
      total,
      passingAll,
      failing: Math.max(0, total - passingAll),
    };
  }, [liveBudgetRows, minimumRoleLimits, domesticRange, foreignRange]);

  const teamMomentumRows = React.useMemo(() => {
    if (isAtFinalAuctionState) {
      const rows = (budgetRows || []).map((row) => ({
        team: row.team,
        country: row.country,
        signings: Number(row.signings || 0),
        spend: Number(row.spent || 0),
      }));
      const maxSpend = Math.max(1, ...rows.map((row) => row.spend));
      return rows
        .map((row) => ({
          ...row,
          heat: Math.min(100, Math.round((row.spend / maxSpend) * 70 + row.signings * 4)),
        }))
        .sort((left, right) => right.heat - left.heat || right.spend - left.spend)
        .slice(0, 8);
    }

    const teamMap = (budgetRows || []).reduce((acc, row) => {
      acc[row.team] = {
        team: row.team,
        country: row.country,
        signings: 0,
        spend: 0,
      };
      return acc;
    }, {});

    timeline.slice(0, Math.max(0, currentIndex + 1)).forEach((event) => {
      if (!event?.isSold || !event?.winnerTeam || !teamMap[event.winnerTeam]) {
        return;
      }
      teamMap[event.winnerTeam].signings += 1;
      teamMap[event.winnerTeam].spend += Number(event.amount || 0);
    });

    const rows = Object.values(teamMap);
    const maxSpend = Math.max(1, ...rows.map((row) => row.spend));
    return rows
      .map((row) => ({
        ...row,
        heat: Math.min(100, Math.round((row.spend / maxSpend) * 70 + row.signings * 4)),
      }))
      .sort((left, right) => right.heat - left.heat || right.spend - left.spend)
      .slice(0, 8);
  }, [budgetRows, timeline, currentIndex, isAtFinalAuctionState]);

  const quotaBadgeStyle = (passed) => ({
    display: 'inline-block',
    padding: '2px 6px',
    borderRadius: '999px',
    fontSize: '0.72em',
    fontWeight: 700,
    color: passed ? '#D3FFE0' : '#FFD7D7',
    background: passed ? 'rgba(38, 179, 91, 0.22)' : 'rgba(209, 61, 61, 0.22)',
    border: passed ? '1px solid rgba(79, 219, 132, 0.5)' : '1px solid rgba(255, 109, 109, 0.48)',
    marginRight: '4px',
  });

  const currentEventNarration = currentEvent?.isCareerPlayer
    ? currentEvent.isSold
      ? `${profileName} enters the room. ${currentEventBidCount} clubs jump in and ${currentEvent.winnerTeam} seal the deal at ${currentEvent.amountLabel}.`
      : `${profileName} is nominated, but no club closes the deal in this round.`
    : currentEvent?.isSold
      ? `${currentEvent.winnerTeam} outbid ${Math.max(0, currentEventBidCount - 1)} other club${currentEventBidCount - 1 === 1 ? '' : 's'} for ${currentEvent.playerName}.`
      : `${currentEvent?.playerName || 'Player'} goes unsold at base ${currentEvent?.basePriceLabel || '-'}.`;

  return (
    <StageShell
      {...stageCommonProps}
      title={`Season ${careerSeason || 1} Auction`}
      subtitle={
        <>
          <PlayerNameWithType player={careerPlayerProfile} name={profileName} />
          {' • '}
          {careerDomesticCountry || 'Domestic League'} Auction Complete
        </>
      }
    >
      <div className="sim-scoreboard-panel" style={{ marginBottom: '12px' }}>
        <h4 className="sim-section-title" style={{ marginTop: 0 }}>Auction Rules</h4>
        <small>Player pool: {domesticRatioPercent}% domestic, {foreignRatioPercent}% foreign</small>
        <br />
        <small>Team size: {domesticRange[0]}-{domesticRange[1]} domestic, {foreignRange[0]}-{foreignRange[1]} foreign</small>
        <br />
        <small>Each team budget: ${Number(teamRules.equalBudget || 0).toLocaleString('en-US')}</small>
        <br />
        <small>Bid amount range: base price ±30%</small>
        <br />
        <small>
          Minimum roles: {minimumRoleLimits.wicketkeepers || 2} wicketkeepers, {minimumRoleLimits.bowlingProfiles || 10} bowling profile,
          {' '}
          {minimumRoleLimits.battingProfiles || 12} batting profile
        </small>
      </div>

      <div className="sim-scoreboard-panel" style={{ marginBottom: '12px' }}>
        <h4 className="sim-section-title" style={{ marginTop: 0 }}>Live Quota Summary</h4>
        <small>
          Clubs passing all roster rules right now: {quotaSummary.passingAll} / {quotaSummary.total}
          {quotaSummary.total ? ` (${Math.round((quotaSummary.passingAll / quotaSummary.total) * 100)}%)` : ''}
        </small>
        <br />
        <small>Clubs still outside at least one rule: {quotaSummary.failing}</small>
      </div>

      <div className="sim-scoreboard-panel" style={{ marginBottom: '12px' }}>
        <h4 className="sim-section-title" style={{ marginTop: 0 }}>Auctioneer Lane</h4>
        <div className="sim-auctioneer-lane">{auctioneerLine}</div>
      </div>

      <div className="sim-scoreboard-panel" style={{ marginBottom: '12px' }}>
        <h4 className="sim-section-title" style={{ marginTop: 0 }}>Team Momentum</h4>
        <div className="sim-auction-momentum-grid">
          {teamMomentumRows.map((row) => (
            <div key={`momentum-${row.team}`} className="sim-auction-momentum-row">
              <div className="sim-auction-momentum-label">
                <TeamNameWithLogo teamName={row.team} size={16} />
              </div>
              <div className="sim-auction-momentum-bar">
                <span style={{ width: `${Math.max(8, row.heat)}%` }} />
              </div>
              <small>{row.heat}%</small>
            </div>
          ))}
        </div>
      </div>

      <div className="sim-scoreboard-panel" style={{ marginBottom: '12px' }}>
        <h4 className="sim-section-title" style={{ marginTop: 0 }}>Live Auction Feed ({progressLabel})</h4>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
          <AppButton
            text={isAutoPlay ? 'Pause Auto Play' : 'Resume Auto Play'}
            variant="secondary"
            fullWidth={false}
            onClick={() => setIsAutoPlay((prev) => !prev)}
            disabled={!timeline.length || currentIndex >= timeline.length - 1}
          />
          <small>Speed: {playbackMs} ms</small>
          <input
            type="range"
            min={250}
            max={1800}
            step={50}
            value={playbackMs}
            onChange={(event) => setPlaybackMs(Number(event.target.value) || 900)}
            style={{ width: '180px' }}
          />
        </div>

        {currentEvent ? (
          <div className="sim-saved-item" style={{ marginBottom: '8px' }}>
            <div className="sim-saved-item-content">
              <strong>Nomination {currentEvent.index}: {currentEvent.playerName}</strong>
              <small>{currentEvent.playerCountry} • Rating {currentEvent.abilityScore} • Base {currentEvent.basePriceLabel}</small>
              <small>
                {currentEvent.isSold
                  ? `Sold to ${currentEvent.winnerTeam} for ${currentEvent.amountLabel}`
                  : 'Unsold'}
              </small>
              <small>{currentEventNarration}</small>
            </div>
          </div>
        ) : (
          <p style={{ margin: 0 }}>Preparing auction timeline...</p>
        )}

        <div className={`sim-auction-broadcast-bar sim-auction-broadcast-bar--${String(phaseLabel).toLowerCase().replace(/\s+/g, '-')}`}>
          <span className="sim-auction-broadcast-label">{phaseLabel}</span>
          <div className="sim-auction-broadcast-meter">
            <span style={{ width: `${Math.max(8, momentum)}%` }} />
          </div>
          <span className="sim-auction-broadcast-score">{momentum}% heat</span>
        </div>

        {currentEvent?.isCareerPlayer ? (
          <div className="sim-saved-item" style={{ marginBottom: '8px', border: '1px solid rgba(255,215,0,0.4)' }}>
            <div className="sim-saved-item-content">
              <strong>Spotlight: Your Auction Moment</strong>
              <small>{currentEventNarration}</small>
              <small>Auto play paused so you can review this bidding battle.</small>
            </div>
          </div>
        ) : null}

        {timeline.length ? (
          <div className="sim-auction-ticker" aria-label="Auction ticker">
            {timeline.slice(Math.max(0, currentIndex - 6), currentIndex + 1).map((event) => (
              <span key={`ticker-${event.playerId}-${event.index}`} className="sim-auction-ticker-item">
                <strong>#{event.index}</strong> {event.playerName} {event.isSold ? `• ${event.winnerTeam}` : '• unsold'}
              </span>
            ))}
          </div>
        ) : null}

        {currentEvent?.bids?.length ? (
          <div className="sim-table-scroll-shell">
            <table style={{ width: '100%', minWidth: '320px', borderCollapse: 'collapse', fontSize: '0.88em', marginBottom: '8px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '4px 6px' }}>Bidder</th>
                  <th style={{ textAlign: 'center', padding: '4px 6px' }}>Bid</th>
                </tr>
              </thead>
              <tbody>
                {currentEvent.bids.slice(0, revealedBidCount).map((bid, index) => (
                  <tr
                    key={`${currentEvent.playerId}-${bid.team}-${index}`}
                    className={`sim-auction-bid-row ${index === 0 ? 'sim-auction-bid-row--winner' : ''}`}
                  >
                    <td style={{ padding: '4px 6px' }}><TeamNameWithLogo teamName={bid.team} size={18} /></td>
                    <td style={{ textAlign: 'center', padding: '4px 6px', fontWeight: index === 0 ? 700 : 500 }}>${Number(bid.amount || 0).toLocaleString('en-US')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <AppButton
            text="Previous"
            variant="secondary"
            fullWidth={false}
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={!timeline.length || currentIndex <= 0}
          />
          <AppButton
            text="Next"
            variant="secondary"
            fullWidth={false}
            onClick={() => setCurrentIndex((prev) => Math.min(timeline.length - 1, prev + 1))}
            disabled={!timeline.length || currentIndex >= timeline.length - 1}
          />
          <AppButton
            text="Jump to Final"
            variant="secondary"
            fullWidth={false}
            onClick={() => setCurrentIndex(Math.max(0, timeline.length - 1))}
            disabled={!timeline.length}
          />
        </div>

        {shownRows.length ? (
          <div style={{ marginTop: '8px' }}>
            {shownRows.map((event) => (
              <div key={`${event.playerId}-${event.index}`} className="sim-saved-item" style={{ marginBottom: '5px' }}>
                <div className="sim-saved-item-content">
                  <strong>#{event.index} {event.playerName}</strong>
                  <small>
                    {event.isSold ? <><TeamNameWithLogo teamName={event.winnerTeam} size={16} /> • {event.amountLabel}</> : 'Unsold'}
                  </small>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="sim-scoreboard-panel" style={{ marginBottom: '12px' }}>
        <h4 className="sim-section-title" style={{ marginTop: 0 }}>Assigned Club</h4>
        <p style={{ margin: '6px 0' }}>
          <strong>{profileName}</strong> signed for <strong><TeamNameWithLogo teamName={careerTeam || 'TBD'} size={18} /></strong>
          {playerAuctionEvent?.amountLabel ? ` for ${playerAuctionEvent.amountLabel}` : ''}.
        </p>
        <small>
          {summary.totalPlayersAuctioned ? `${summary.totalPlayersAuctioned} players auctioned across ${summary.teamCount || 0} clubs.` : 'Auction results generated.'}
        </small>
      </div>

      <div className="sim-scoreboard-panel" style={{ marginBottom: '12px' }}>
        <h4 className="sim-section-title" style={{ marginTop: 0 }}>Club Budgets</h4>
        <div className="sim-table-scroll-shell">
          <table style={{ width: '100%', minWidth: '760px', borderCollapse: 'collapse', fontSize: '0.9em' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '4px 8px' }}>Club</th>
                <th style={{ textAlign: 'center', padding: '4px' }}>Signings</th>
                <th style={{ textAlign: 'center', padding: '4px' }}>Dom</th>
                <th style={{ textAlign: 'center', padding: '4px' }}>For</th>
                <th style={{ textAlign: 'center', padding: '4px' }}>WK/BWL/BAT</th>
                <th style={{ textAlign: 'left', padding: '4px 6px' }}>Quota</th>
                <th style={{ textAlign: 'center', padding: '4px' }}>Spent</th>
                <th style={{ textAlign: 'center', padding: '4px' }}>Left</th>
              </tr>
            </thead>
            <tbody>
              {liveBudgetRows.map((row) => {
                const wkPass = Number(row.roleCounts?.wicketkeepers || 0) >= Number(minimumRoleLimits.wicketkeepers || 2);
                const bowlingPass = Number(row.roleCounts?.bowling || 0) >= Number(minimumRoleLimits.bowlingProfiles || 10);
                const battingPass = Number(row.roleCounts?.batting || 0) >= Number(minimumRoleLimits.battingProfiles || 12);
                const domesticPass = Number(row.domesticPlayers || 0) >= Number(domesticRange[0] || 15) && Number(row.domesticPlayers || 0) <= Number(domesticRange[1] || 20);
                const foreignPass = Number(row.foreignPlayers || 0) >= Number(foreignRange[0] || 5) && Number(row.foreignPlayers || 0) <= Number(foreignRange[1] || 8);

                return (
                  <tr key={row.team} style={{ background: row.team === careerTeam ? 'rgba(255,255,255,0.08)' : 'transparent' }}>
                    <td style={{ padding: '4px 8px' }}><TeamNameWithLogo teamName={row.team} size={18} /></td>
                    <td style={{ textAlign: 'center', padding: '4px' }}>{row.signings}</td>
                    <td style={{ textAlign: 'center', padding: '4px' }}>{row.domesticPlayers ?? 0}</td>
                    <td style={{ textAlign: 'center', padding: '4px' }}>{row.foreignPlayers ?? 0}</td>
                    <td style={{ textAlign: 'center', padding: '4px' }}>
                      {row.roleCounts?.wicketkeepers ?? 0}/{row.roleCounts?.bowling ?? 0}/{row.roleCounts?.batting ?? 0}
                    </td>
                    <td style={{ textAlign: 'left', padding: '4px 6px' }}>
                      <span style={quotaBadgeStyle(wkPass)}>WK</span>
                      <span style={quotaBadgeStyle(bowlingPass)}>BWL</span>
                      <span style={quotaBadgeStyle(battingPass)}>BAT</span>
                      <span style={quotaBadgeStyle(domesticPass)}>DOM</span>
                      <span style={quotaBadgeStyle(foreignPass)}>FOR</span>
                    </td>
                    <td style={{ textAlign: 'center', padding: '4px' }}>{row.spentLabel || '-'}</td>
                    <td style={{ textAlign: 'center', padding: '4px', fontWeight: 'bold' }}>{row.budgetLeftLabel || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sim-scoreboard-panel" style={{ marginBottom: '12px' }}>
        <h4 className="sim-section-title" style={{ marginTop: 0 }}>Marquee Bids</h4>
        {marqueeRows.length ? (
          marqueeRows.map((event) => (
            <div key={`${event.playerId}-${event.winnerTeam}`} className="sim-saved-item" style={{ marginBottom: '6px' }}>
              <div className="sim-saved-item-content">
                <strong>{event.playerName} → <TeamNameWithLogo teamName={event.winnerTeam} size={18} /></strong>
                <small>{event.playerCountry} • {event.role} • Rating {event.abilityScore}</small>
                <small>{event.amountLabel}</small>
              </div>
            </div>
          ))
        ) : (
          <p style={{ margin: 0 }}>No marquee bids captured.</p>
        )}
      </div>

      <AppButton text="Continue to Season Schedule" onClick={handleCareerContinueAfterAuction} fullWidth />
    </StageShell>
  );
}

export default CareerAuctionStage;
