import React from 'react';
import { fieldPositionList } from '../../../gameData/fieldPositionList';
import { fieldSettingList } from '../../../gameData/fieldSettingList';
import { getClosestFieldPreset, getFieldPositions } from '../utils/bowlingField';

const selectablePositions = fieldPositionList.filter(
  ({ key }) => key !== 'wicketkeeper' && key !== 'bowler'
);

function BowlingFieldEditor({ tactics, onChange, ruleset }) {
  const positions = getFieldPositions(tactics);
  const closestPreset = fieldSettingList.find(({ key }) => key === getClosestFieldPreset(positions));

  const moveFielder = (index, position) => {
    const nextPositions = [...positions];
    nextPositions[index] = position;
    onChange({ fieldPreset: 'custom', fieldPositions: nextPositions });
  };

  return (
    <details className="sim-field-editor">
      <summary>Customize field positions</summary>
      <p>Wicketkeeper and bowler stay in place. Choose nine different positions for the numbered fielders.</p>
      <div className="sim-field-editor-grid">
        {positions.slice(1).map((position, index) => (
          <label key={index}>
            <span>Fielder {index + 1}</span>
            <select
              aria-label={`Fielder ${index + 1} position`}
              value={position}
              onChange={(event) => moveFielder(index + 1, event.target.value)}
            >
              {selectablePositions.map((option) => (
                <option key={option.key} value={option.key} disabled={option.key !== position && positions.includes(option.key)}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <p>
        Closest preset: {closestPreset.label}. {ruleset === 'realism'
          ? 'Coverage uses the chosen positions, subject to the fielding restrictions above.'
          : 'Custom fields use its outcome effects; ball trajectories and fielding legality are not modeled.'}
      </p>
    </details>
  );
}

export default BowlingFieldEditor;
