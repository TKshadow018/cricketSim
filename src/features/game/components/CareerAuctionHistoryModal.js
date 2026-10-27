import React from 'react';
import ScoreboardModal from './ScoreboardModal';
import TeamNameWithLogo from './TeamNameWithLogo';
import '../styles/career-auction-history.css';

const formatAmount = (amount) => `$${Number(amount || 0).toLocaleString('en-US')}`;

function CareerAuctionHistoryModal({ events = [], teams = [], onClose }) {
  const [selectedTeam, setSelectedTeam] = React.useState('');
  const purchases = events
    .filter((event) => event?.isSold && event?.winnerTeam)
    .filter((event) => !selectedTeam || event.winnerTeam === selectedTeam)
    .slice()
    .reverse();

  return (
    <ScoreboardModal
      title="Purchased players"
      kicker="AUCTION HISTORY"
      closeLabel="Close auction history"
      scrollHint="Filter completed purchases by team."
      onClose={onClose}
    >
      <div className="sim-auction-history-toolbar">
        <label htmlFor="career-auction-history-team">Filter by team</label>
        <select
          id="career-auction-history-team"
          className="sim-career-input"
          value={selectedTeam}
          onChange={(event) => setSelectedTeam(event.target.value)}
        >
          <option value="">All teams</option>
          {teams.map((team) => (
            <option key={team} value={team}>{team}</option>
          ))}
        </select>
        <span>{purchases.length} purchase{purchases.length === 1 ? '' : 's'}</span>
      </div>

      {purchases.length ? (
        <div className="sim-table-scroll-shell">
          <table className="sim-scoreboard-table sim-auction-history-table" aria-label="Purchased players">
            <thead>
              <tr>
                <th>Player</th>
                <th>Country</th>
                <th>Club</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((event, index) => (
                <tr key={`${event.playerId || event.index || 'purchase'}-${index}`}>
                  <td className="sim-auction-history-player">{event.playerName || 'Unnamed player'}</td>
                  <td>{event.playerCountry || '—'}</td>
                  <td><TeamNameWithLogo teamName={event.winnerTeam} size={20} /></td>
                  <td className="sim-auction-history-price">{event.amountLabel || formatAmount(event.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="sim-auction-history-empty" role="status">
          {selectedTeam ? `No purchases by ${selectedTeam} yet.` : 'No purchased players yet.'}
        </p>
      )}
    </ScoreboardModal>
  );
}

export default CareerAuctionHistoryModal;
