import React from 'react';
import { BATTING_TARGETS, getBattingTarget } from '../utils/battingTactics';

const fieldCenter = { x: 110, y: 88 };
const fieldRadius = { x: 101, y: 73 };
const sectorAngles = {
  straight: -90,
  midOn: -50,
  midWicket: -10,
  squareLeg: 30,
  fineLeg: 70,
  thirdMan: 110,
  point: 150,
  cover: 190,
  midOff: 230,
};

const getBoundaryPoint = (angle) => {
  const radians = (angle * Math.PI) / 180;
  return {
    x: Number((fieldCenter.x + fieldRadius.x * Math.cos(radians)).toFixed(2)),
    y: Number((fieldCenter.y + fieldRadius.y * Math.sin(radians)).toFixed(2)),
  };
};

const getSectorPath = (centerAngle) => {
  const start = getBoundaryPoint(centerAngle - 20);
  const end = getBoundaryPoint(centerAngle + 20);
  return `M ${fieldCenter.x} ${fieldCenter.y} L ${start.x} ${start.y} A ${fieldRadius.x} ${fieldRadius.y} 0 0 1 ${end.x} ${end.y} Z`;
};

const getMarkerPosition = (angle) => {
  const radians = (angle * Math.PI) / 180;
  return {
    x: fieldCenter.x + fieldRadius.x * 0.62 * Math.cos(radians),
    y: fieldCenter.y + fieldRadius.y * 0.62 * Math.sin(radians),
  };
};

function BattingTargetMap({ target, onTargetChange }) {
  const activeTarget = getBattingTarget(target);
  const marker = getMarkerPosition(sectorAngles[activeTarget.key]);
  const isInteractive = typeof onTargetChange === 'function';

  const handleSectorKeyDown = (event, sectorKey) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onTargetChange(sectorKey);
    }
  };

  return (
    <svg
      className="sim-batting-target-map"
      viewBox="0 0 220 176"
      role={isInteractive ? 'group' : 'img'}
      aria-label={isInteractive
        ? 'Choose a scoring sector on the batting target map'
        : `${activeTarget.label} target sector highlighted on map`}
    >
      <g data-testid="batting-target-map-artwork" transform="matrix(1 0 0 -1 0 176)">
        <ellipse
          cx={fieldCenter.x}
          cy={fieldCenter.y}
          rx={fieldRadius.x}
          ry={fieldRadius.y}
          fill="rgba(90, 133, 87, 0.18)"
          stroke="rgba(177, 208, 155, 0.44)"
        />
        {BATTING_TARGETS.map((sector) => (
          <path
            key={sector.key}
            className={`sim-batting-target-sector${sector.key === activeTarget.key ? ' active' : ''}`}
            data-testid={`batting-target-sector-${sector.key}`}
            role={isInteractive ? 'button' : undefined}
            tabIndex={isInteractive ? 0 : undefined}
            aria-label={isInteractive ? `Select ${sector.label} scoring lane` : undefined}
            aria-pressed={isInteractive ? sector.key === activeTarget.key : undefined}
            d={getSectorPath(sectorAngles[sector.key])}
            onClick={isInteractive ? () => onTargetChange(sector.key) : undefined}
            onKeyDown={isInteractive
              ? (event) => handleSectorKeyDown(event, sector.key)
              : undefined}
          />
        ))}
        <path
          d="M98 68h24v40H98z"
          fill="rgba(158, 125, 75, 0.82)"
          stroke="rgba(244, 216, 159, 0.62)"
          pointerEvents="none"
        />
        <path
          d="M98 84h24M98 101h24"
          stroke="rgba(245, 234, 196, 0.6)"
          strokeDasharray="2 3"
          pointerEvents="none"
        />
        <circle
          cx={marker.x}
          cy={marker.y}
          r="5"
          fill="#c7f36b"
          stroke="#10180f"
          strokeWidth="2"
          pointerEvents="none"
        />
      </g>
    </svg>
  );
}

export default BattingTargetMap;
