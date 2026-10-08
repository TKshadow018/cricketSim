import React from 'react';
import AppButton from '../../../components/ui/AppButton';
import PlayerNameWithType from './PlayerNameWithType';

const clampPercent = (value) => {
  const numeric = Number(value || 0);
  return Math.max(0, Math.min(100, numeric));
};

const abilityRows = [
  { key: 'abilityToPlayPaceBall', label: 'Bat vs Pace' },
  { key: 'abilityToPlaySpinBall', label: 'Bat vs Spin' },
  { key: 'paceAbility', label: 'Pace Ability' },
  { key: 'spinAbility', label: 'Spin Ability' },
  { key: 'battingAggresion', label: 'Aggression' },
];

function CareerPlayerProfileModal({ isOpen, title, player, onClose }) {
  if (!isOpen || !player) {
    return null;
  }

  return (
    <div className="sim-confirm-overlay" role="dialog" aria-modal="true" aria-label="Career player profile">
      <div className="sim-confirm-modal sim-career-stats-modal sim-career-player-modal">
        <button
          type="button"
          className="sim-modal-top-close"
          aria-label="Close"
          onClick={onClose}
        >
          x
        </button>
        <div className="sim-career-player-header">
          <div>
            <h4>{title || 'Player Season Stats and Ability'}</h4>
            <p className="sim-career-player-subtitle">
              <strong><PlayerNameWithType player={player} /></strong>
              {' '}• {player.team || 'Free Agent'}
            </p>
          </div>
          <span className="sim-career-player-type-pill">{player.playerType || 'batsman'}</span>
        </div>

        <div className="sim-career-player-grid">
          <div className="sim-career-player-card">
            <h5>Batting</h5>
            <p>Matches: {player.matches}</p>
            <p>Runs: {player.runs}</p>
            <p>Balls: {player.balls}</p>
            <p>Average: {player.battingAverage}</p>
            <p>Strike Rate: {player.strikeRate}</p>
          </div>

          <div className="sim-career-player-card">
            <h5>Bowling</h5>
            <p>Wickets: {player.wickets}</p>
            <p>Overs: {player.overs}</p>
            <p>Runs Conceded: {player.runsConceded}</p>
            <p>Economy: {player.economy}</p>
            <p>Average: {player.bowlingAverage}</p>
          </div>

          <div className="sim-career-player-card">
            <h5>Player State</h5>
            <p>Fitness: {player.fitness ?? 100}</p>
            <p>Morale: {player.morale ?? 50}</p>
            <p>Batting Order Coeff: {player.battingOrderCoeff ?? 0}</p>
          </div>

          <div className="sim-career-player-card">
            <h5>Profile</h5>
            <p>Age: {player.age ?? 'N/A'}</p>
            <p>Country: {player.country || 'Unknown'}</p>
            <p>City: {player.city || 'Unknown'}</p>
            <p>Job: {player.job || 'Unknown'}</p>
            <p>Email: {player.email || 'N/A'}</p>
            <p>Phone: {player.phone || 'N/A'}</p>
          </div>

          <div className="sim-career-player-card">
            <h5>Abilities</h5>
            <div className="sim-ability-list">
              {abilityRows.map((entry) => {
                const value = Number(player[entry.key] || 0);
                const widthPercent = clampPercent(value);
                return (
                  <div key={entry.key} className="sim-ability-row">
                    <div className="sim-ability-meta">
                      <span>{entry.label}</span>
                      <strong>{value}</strong>
                    </div>
                    <div className="sim-ability-track" aria-hidden="true">
                      <div className="sim-ability-fill" style={{ width: `${widthPercent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="sim-save-row-actions">
          <AppButton text="Close" variant="secondary" fullWidth={false} onClick={onClose} />
        </div>
      </div>
    </div>
  );
}

export default CareerPlayerProfileModal;
