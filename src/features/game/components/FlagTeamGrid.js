import React from 'react';
import { motion } from 'framer-motion';

const toPublicPath = (value = '') => value.replace('./', '/');

function FlagTeamGrid({ teams, selectedName, onSelect, disabledName }) {
  return (
    <div className="sim-flag-grid">
      {teams.map((team, idx) => {
        const disabled = disabledName === team.name;
        return (
          <motion.button
            key={team.id}
            className={`sim-flag-card ${selectedName === team.name ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
            onClick={() => !disabled && onSelect(team)}
            whileHover={disabled ? {} : { scale: 1.03 }}
            transition={{ duration: 0.15 }}
            style={{ animationDelay: `${idx * 25}ms` }}
          >
            <div className="sim-flag-holder">
              <img src={toPublicPath(team.image)} alt={team.name} />
            </div>
            <h4>{team.name}</h4>
            <p>Rank #{team.current_ranking}</p>
          </motion.button>
        );
      })}
    </div>
  );
}

export default FlagTeamGrid;
