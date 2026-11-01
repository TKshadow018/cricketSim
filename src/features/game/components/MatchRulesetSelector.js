import React from 'react';
import '../styles/match-ruleset.css';

const choices = [
  { value: 'arcade', title: 'Arcade', description: 'Classic tactics and special deliveries.' },
  { value: 'realism', title: 'Realism', description: 'Two-sided plans and field restrictions, without arcade powers.' },
];

export default function MatchRulesetSelector({ value = 'arcade', onChange }) {
  return (
    <fieldset className="sim-ruleset">
      <legend>Match rules</legend>
      <div className="sim-ruleset-options">
        {choices.map((choice) => (
          <label key={choice.value} className={`sim-ruleset-option${value === choice.value ? ' is-selected' : ''}`}>
            <input
              type="radio"
              name="match-ruleset"
              value={choice.value}
              aria-label={choice.title}
              aria-describedby={`ruleset-${choice.value}-description`}
              checked={value === choice.value}
              onChange={() => onChange(choice.value)}
            />
            <span>
              <strong>{choice.title}</strong>
              <small id={`ruleset-${choice.value}-description`}>{choice.description}</small>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
