import React from 'react';
import BowlingFieldMap from './BowlingFieldMap';
import { fieldPositionList } from '../../../gameData/fieldPositionList';
import { fieldSettingList } from '../../../gameData/fieldSettingList';
import { getFieldCoverage } from '../utils/opponentField';
import { getBattingTarget } from '../utils/battingTactics';
import '../styles/opponent-field.css';

const namesByKey = Object.fromEntries(fieldPositionList.map(({ key, name }) => [key, name]));

function OpponentFieldPanel({ preset, target }) {
  const setting = fieldSettingList.find(({ key }) => key === preset);
  if (!setting) return null;
  const coverage = getFieldCoverage(preset, target);
  const names = (positions) => positions.map((key) => namesByKey[key]).join(', ') || 'None';

  return (
    <section className="sim-opponent-field" aria-label="Opposition field">
      <div>
        <p className="sim-batting-card-kicker">OPPOSITION FIELD</p>
        <h4>{setting.label}</h4>
        <p>{setting.description}</p>
      </div>
      <BowlingFieldMap preset={preset} flipVertical />
      <div className="sim-opponent-coverage" aria-live="polite">
        <strong>{getBattingTarget(target).label} lane</strong>
        <p>Infield coverage: {names(coverage.inner)}</p>
        <p>Deep coverage: {names(coverage.deep)}</p>
        <small>Coverage makes singles or boundaries harder; aerial shots can be caught.</small>
      </div>
    </section>
  );
}

export default OpponentFieldPanel;
