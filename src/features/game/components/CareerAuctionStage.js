import React from 'react';
import StageShell from './StageShell';
import AppButton from '../../../components/ui/AppButton';
import CareerAuctionHistoryModal from './CareerAuctionHistoryModal';
import CareerAuctionRoom from './CareerAuctionRoom';
import PlayerNameWithType from './PlayerNameWithType';
import TeamNameWithLogo from './TeamNameWithLogo';
import {
  buildLiveBudgetRows,
  buildQuotaSummary,
  buildTeamMomentumRows,
} from './careerAuctionViewModel';

const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};
const DEFAULT_DOMESTIC_RANGE = [15, 20];
const DEFAULT_FOREIGN_RANGE = [5, 8];

function CareerAuctionStage({
  stageCommonProps,
  careerSeason,
  careerPlayerProfile,
  careerDomesticCountry,
  careerTeam,
  careerAuctionSummary,
  handleCareerContinueAfterAuction,
}) {
  const summary = careerAuctionSummary || EMPTY_OBJECT;
  const budgetRows = Array.isArray(summary.budgetTable) ? summary.budgetTable : EMPTY_ARRAY;
  const timeline = Array.isArray(summary.auctionTimeline) ? summary.auctionTimeline : EMPTY_ARRAY;
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isAutoPlay, setIsAutoPlay] = React.useState(true);
  const [playbackMs, setPlaybackMs] = React.useState(900);
  const [pausedForUserMoment, setPausedForUserMoment] = React.useState(false);
  const [revealedBidCount, setRevealedBidCount] = React.useState(0);
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);
  const profileName = careerPlayerProfile?.name || 'Career Player';
  const playerAuctionEvent = summary.careerPlayerEvent;
  const currentEvent = timeline[currentIndex] || null;
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
  const domesticRange = teamRules.domesticPerTeam || DEFAULT_DOMESTIC_RANGE;
  const foreignRange = teamRules.foreignPerTeam || DEFAULT_FOREIGN_RANGE;
  const minimumRoleLimits = teamRules.minimumRoleLimits || EMPTY_OBJECT;
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

  const liveBudgetRows = React.useMemo(
    () => buildLiveBudgetRows({ budgetRows, timeline, currentIndex, isAtFinalAuctionState }),
    [budgetRows, timeline, currentIndex, isAtFinalAuctionState]
  );
  const liveBudgetByTeam = new Map(liveBudgetRows.map((row) => [row.team, row]));
  const bidderRows = budgetRows.map((row) => liveBudgetByTeam.get(row.team) || row);
  const revealedBidsByTeam = Array.isArray(currentEvent?.bids)
    ? currentEvent.bids.slice(0, revealedBidCount).reduce((acc, bid) => {
        if (bid?.team) {
          acc[bid.team] = bid;
        }
        return acc;
      }, {})
    : EMPTY_OBJECT;
  const quotaSummary = React.useMemo(
    () => buildQuotaSummary({ rows: liveBudgetRows, minimumRoleLimits, domesticRange, foreignRange }),
    [liveBudgetRows, minimumRoleLimits, domesticRange, foreignRange]
  );
  const teamMomentumRows = React.useMemo(
    () => buildTeamMomentumRows({ budgetRows, timeline, currentIndex, isAtFinalAuctionState }),
    [budgetRows, timeline, currentIndex, isAtFinalAuctionState]
  );
  const historyTimeline = timeline.length
    ? timeline.slice(0, Math.max(0, currentIndex + 1))
    : Array.isArray(summary.marqueeBids)
      ? summary.marqueeBids
      : EMPTY_ARRAY;
  const purchasedEvents = historyTimeline
    .filter((event) => event?.isSold && event?.winnerTeam);
  const historyTeams = [...new Set([
    ...budgetRows.map((row) => row.team),
    ...purchasedEvents.map((event) => event.winnerTeam),
  ])]
    .filter(Boolean)
    .sort((left, right) => String(left).localeCompare(String(right)));
  const openAuctionHistory = React.useCallback(() => {
    setIsAutoPlay(false);
    setIsHistoryOpen(true);
  }, []);
  const closeAuctionHistory = React.useCallback(() => {
    setIsHistoryOpen(false);
  }, []);

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
      className="sim-stage-career-auction"
      title={`Season ${careerSeason || 1} Auction`}
      subtitle={
        <>
          <PlayerNameWithType player={careerPlayerProfile} name={profileName} />
          {' • '}
          {careerDomesticCountry || 'Domestic League'} · Career player auction
        </>
      }
    >
      <CareerAuctionRoom
        currentEvent={currentEvent}
        auctioneerLine={auctioneerLine}
        currentEventNarration={currentEventNarration}
        progressLabel={progressLabel}
        bidderRows={bidderRows}
        revealedBidsByTeam={revealedBidsByTeam}
        revealedBidCount={revealedBidCount}
        timeline={timeline}
        currentIndex={currentIndex}
        phaseLabel={phaseLabel}
        momentum={momentum}
        isAutoPlay={isAutoPlay}
        playbackMs={playbackMs}
        purchasedCount={purchasedEvents.length}
        onOpenPurchaseHistory={openAuctionHistory}
        onToggleAutoPlay={() => setIsAutoPlay((prev) => !prev)}
        onPlaybackChange={(value) => setPlaybackMs(Number(value))}
        onPrevious={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
        onNext={() => setCurrentIndex((prev) => Math.min(timeline.length - 1, prev + 1))}
        onJumpToFinal={() => setCurrentIndex(Math.max(0, timeline.length - 1))}
      />

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

      <AppButton text="Continue to Season Schedule" onClick={handleCareerContinueAfterAuction} fullWidth />
      {isHistoryOpen ? (
        <CareerAuctionHistoryModal
          events={purchasedEvents}
          teams={historyTeams}
          onClose={closeAuctionHistory}
        />
      ) : null}
    </StageShell>
  );
}

export default CareerAuctionStage;
