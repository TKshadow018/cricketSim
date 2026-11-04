import React from 'react';
import { fieldPositionImage, fieldPositionList } from '../../../gameData/fieldPositionList';
import { fieldSettingList } from '../../../gameData/fieldSettingList';

const FIELD_POSITION_BY_KEY = Object.fromEntries(
  fieldPositionList.map((position) => [position.key, position])
);

function BowlingFieldMap({ preset = 'balanced' }) {
  const setting = fieldSettingList.find(({ key }) => key === preset)
    || fieldSettingList.find(({ key }) => key === 'balanced');
  const positions = setting.positions.map((positionKey) => FIELD_POSITION_BY_KEY[positionKey]);

  return (
    <figure className="sim-bowling-field-figure">
      <svg
        className={`sim-bowling-field-map sim-bowling-field-map--${preset}`}
        viewBox={fieldPositionImage.viewBox}
        role="img"
        aria-label={`${setting.label} layout with approximate fielder positions`}
      >
        <image
          data-testid="cricket-field-artwork"
          href={fieldPositionImage.src}
          x="0"
          y="0"
          width={fieldPositionImage.width}
          height={fieldPositionImage.height}
          preserveAspectRatio="none"
        />
        <g data-testid="field-position-markers">
          {positions.map((position) => (
            <circle
              key={position.key}
              data-testid={`field-position-${position.key}`}
              cx={position.x}
              cy={position.y}
              r="6"
              fill="#d9f07d"
              stroke="#102117"
              strokeWidth="2"
            >
              <title>{position.name}</title>
            </circle>
          ))}
        </g>
      </svg>
      <figcaption>{setting.label} · approximate tactical coverage, not a legality check</figcaption>
    </figure>
  );
}

export default BowlingFieldMap;
