import React from 'react';
import { fieldPositionImage, fieldPositionList } from '../../../gameData/fieldPositionList';
import { fieldSettingList } from '../../../gameData/fieldSettingList';

const FIELD_POSITION_BY_KEY = Object.fromEntries(
  fieldPositionList.map((position) => [position.key, position])
);

function BowlingFieldMap({ preset = 'balanced', fieldPositions, flipVertical = false }) {
  const setting = fieldSettingList.find(({ key }) => key === preset)
    || fieldSettingList.find(({ key }) => key === 'balanced');
  const custom = preset === 'custom' && Array.isArray(fieldPositions);
  const label = custom ? 'Custom field' : setting.label;
  const positions = (custom ? fieldPositions : setting.positions)
    .map((positionKey) => FIELD_POSITION_BY_KEY[positionKey])
    .filter(Boolean);

  return (
    <figure className="sim-bowling-field-figure">
      <svg
        className={`sim-bowling-field-map sim-bowling-field-map--${preset}`}
        viewBox={fieldPositionImage.viewBox}
        role="img"
        aria-label={`${label} layout with approximate fielder positions`}
      >
        <image
          data-testid="cricket-field-artwork"
          href={fieldPositionImage.src}
          x="0"
          y="0"
          width={fieldPositionImage.width}
          height={fieldPositionImage.height}
          preserveAspectRatio="none"
          transform={flipVertical ? `translate(0 ${fieldPositionImage.height}) scale(1 -1)` : undefined}
        />
        <g data-testid="field-position-markers" transform={flipVertical ? `translate(0 ${fieldPositionImage.height}) scale(1 -1)` : undefined}>
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
        <g aria-hidden="true" pointerEvents="none">
          {positions.slice(1).map((position, index) => (
            <text key={position.key} x={position.x} y={(flipVertical ? fieldPositionImage.height - position.y : position.y) + 2.5} textAnchor="middle" fontSize="7" fontWeight="bold" fill="#102117">
              {index + 1}
            </text>
          ))}
        </g>
      </svg>
      <figcaption>{label} · approximate tactical coverage, not a legality check</figcaption>
    </figure>
  );
}

export default BowlingFieldMap;
