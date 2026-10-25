import React from 'react';
import PlayerNameWithType from './PlayerNameWithType';
import TeamNameWithLogo from './TeamNameWithLogo';
import '../styles/career-auction-room.css';

const EMPTY_OBJECT = {};

function CareerAuctionRoom({
  currentEvent,
  auctioneerLine,
  progressLabel,
  bidderRows = [],
  revealedBidsByTeam = EMPTY_OBJECT,
}) {
  const winningTeam = currentEvent?.isSold ? currentEvent.winnerTeam : '';

  return (
    <section className="sim-auction-room" aria-label="Live auction room">
      <header className="sim-auction-room-header">
        <div>
          <p className="sim-auction-room-kicker">Career auction · {currentEvent?.playerCountry || 'domestic league'}</p>
          <h3>Live auction floor</h3>
        </div>
        <div className="sim-auction-room-progress" aria-label={`Auction progress ${progressLabel}`}>
          <span>LOT</span>
          <strong>{progressLabel}</strong>
        </div>
      </header>

      <div className="sim-auction-floor">
        <div className="sim-auction-front-row">
          <aside className="sim-auction-host" aria-label="Auctioneer">
            <div className="sim-auction-host-portrait" aria-hidden="true">
              <svg viewBox="0 0 120 150" className="sim-auction-host-figure" focusable="false">
                <circle cx="47" cy="22" r="14" />
                <path d="M32 42c5-6 25-6 31 0l8 25-5 31H28l-5-31z" />
                <path d="M31 49 14 66l11 9 18-16M64 49l17-17 9 9-17 23" />
                <path d="m80 31 13-14 7 7-13 14zM94 36l12 13" className="sim-auction-host-mic" />
                <path d="m38 96-7 38M58 96l12 38" className="sim-auction-host-leg" />
              </svg>
            </div>
            <div className="sim-auction-host-desk">
              <span className="sim-auction-host-label">At the podium</span>
              <strong>Auctioneer</strong>
              <p>{auctioneerLine}</p>
            </div>
          </aside>

          <article className="sim-auction-current-lot" aria-label="Current nomination">
            <div className="sim-auction-lot-topline">
              <span className="sim-auction-lot-number">
                {currentEvent?.index ? `LOT ${String(currentEvent.index).padStart(2, '0')}` : 'UP NEXT'}
              </span>
              <span className={`sim-auction-lot-status ${currentEvent?.isSold ? 'sim-auction-lot-status--awarded' : ''}`}>
                {currentEvent?.isSold ? 'Awarded' : currentEvent ? 'On the block' : 'Room open'}
              </span>
            </div>

            {currentEvent ? (
              <>
                <h4>
                  <PlayerNameWithType
                    player={currentEvent}
                    name={currentEvent.playerName || 'Unnamed player'}
                    className="sim-auction-lot-player"
                  />
                </h4>
                <p className="sim-auction-lot-meta">
                  {currentEvent.playerCountry || 'Country not listed'}
                  <span aria-hidden="true">·</span>
                  Rating {Number.isFinite(Number(currentEvent.abilityScore)) ? currentEvent.abilityScore : '—'}
                </p>
                <div className="sim-auction-opening-bid">
                  <span>Opening bid</span>
                  <strong>{currentEvent.basePriceLabel || '—'}</strong>
                </div>
                {winningTeam ? (
                  <div className="sim-auction-winner">
                    <span>Winning club</span>
                    <TeamNameWithLogo teamName={winningTeam} size={22} />
                    {currentEvent.amountLabel ? <strong>{currentEvent.amountLabel}</strong> : null}
                  </div>
                ) : null}
              </>
            ) : (
              <p className="sim-auction-lot-empty">Waiting for the first nomination.</p>
            )}
          </article>
        </div>

        <div className="sim-auction-seating-heading">
          <div>
            <span className="sim-auction-room-kicker">The bidder tables</span>
            <h4>Clubs in the room</h4>
          </div>
          <small>Boards rise as bids come in</small>
        </div>

        <ul className="sim-auction-seating" aria-label="Bidding teams">
          {bidderRows.map((row, index) => {
            const hasBid = Boolean(revealedBidsByTeam[row.team]);
            const hasRecordedBids = Array.isArray(currentEvent?.bids) && currentEvent.bids.length > 0;
            const isWinner = Boolean(
              winningTeam &&
              winningTeam === row.team &&
              (hasBid || !hasRecordedBids)
            );
            const isRaised = hasBid || isWinner;
            const seatNumber = String(index + 1).padStart(2, '0');

            return (
              <li
                key={row.team}
                className={`sim-auction-seat${isRaised ? ' sim-auction-seat--raised' : ''}${isWinner ? ' sim-auction-seat--winner' : ''}`}
              >
                <div className="sim-auction-chair" aria-hidden="true">
                  <span className="sim-auction-chair-back" />
                  <span className="sim-auction-chair-person">
                    <span className="sim-auction-chair-head" />
                    <span className="sim-auction-chair-body" />
                  </span>
                  <span className="sim-auction-chair-seat" />
                </div>
                <div className="sim-auction-seat-details">
                  <TeamNameWithLogo
                    teamName={row.team}
                    size={26}
                    className="sim-auction-seat-team"
                  />
                  <small className="sim-auction-seat-caption">
                    Seat {seatNumber} · {row.country || 'Club'}
                  </small>
                  <small className="sim-auction-seat-wallet">
                    Budget left <strong>{row.budgetLeftLabel || '—'}</strong>
                  </small>
                </div>
                <div
                  className={`sim-auction-bid-board${isRaised ? ' sim-auction-bid-board--raised' : ''}${isWinner ? ' sim-auction-bid-board--winner' : ''}`}
                  role="img"
                  aria-label={`${row.team} bid board, ${isRaised ? 'raised' : 'lowered'}`}
                >
                  <span className="sim-auction-bid-board-face">
                    <small>{isRaised ? 'BID' : 'READY'}</small>
                    <strong>{seatNumber}</strong>
                  </span>
                  <span className="sim-auction-bid-board-handle" />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export default CareerAuctionRoom;
