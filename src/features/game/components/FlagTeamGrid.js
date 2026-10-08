import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const toPublicPath = (value = '') => value.replace('./', '/');

function FlagTeamGrid({ teams, selectedName, onSelect, disabledName }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="sim-flag-grid">
      {teams.map((team) => {
        const disabled = disabledName === team.name;
        return (
          <motion.button
            key={team.id}
            type="button"
            className={`sim-flag-card ${selectedName === team.name ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
            aria-pressed={selectedName === team.name}
            onClick={() => !disabled && onSelect(team)}
            whileHover={disabled || prefersReducedMotion ? undefined : { opacity: 0.96 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.12 }}
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
