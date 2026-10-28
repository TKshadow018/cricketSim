import React from 'react';
import { BATTING_TARGETS } from '../utils/battingTactics';

const targetPositions = {
  off: { x: 54, y: 44 },
  straight: { x: 110, y: 29 },
  leg: { x: 166, y: 44 },
};

function BattingTargetMap({ target }) {
  const activeTarget = BATTING_TARGETS.find(({ key }) => key === target) || BATTING_TARGETS[1];
  const marker = targetPositions[activeTarget.key];

  return (
    <svg
      className="sim-batting-target-map"
      viewBox="0 0 220 132"
      role="img"
      aria-label={`${activeTarget.label} target sector`}
    >
      <ellipse cx="110" cy="68" rx="103" ry="60" fill="rgba(90, 133, 87, 0.18)" stroke="rgba(177, 208, 155, 0.44)" />
      <path d="M110 72 16 53 73 15Z" fill={activeTarget.key === 'off' ? 'rgba(199, 243, 107, 0.28)' : 'rgba(255,255,255,0.035)'} stroke="rgba(205, 222, 194, 0.18)" />
      <path d="M110 72 73 15 147 15Z" fill={activeTarget.key === 'straight' ? 'rgba(199, 243, 107, 0.28)' : 'rgba(255,255,255,0.035)'} stroke="rgba(205, 222, 194, 0.18)" />
      <path d="M110 72 147 15 204 53Z" fill={activeTarget.key === 'leg' ? 'rgba(199, 243, 107, 0.28)' : 'rgba(255,255,255,0.035)'} stroke="rgba(205, 222, 194, 0.18)" />
      <path d="M87 71h46v25H87z" fill="rgba(158, 125, 75, 0.76)" stroke="rgba(244, 216, 159, 0.55)" />
      <path d="M110 72v24" stroke="rgba(245, 234, 196, 0.6)" strokeDasharray="2 3" />
      <circle cx={marker.x} cy={marker.y} r="5" fill="#c7f36b" stroke="#10180f" strokeWidth="2" />
      <text x="21" y="115" fill="rgba(222, 233, 214, 0.7)" fontSize="8">OFF</text>
      <text x="100" y="115" fill="rgba(222, 233, 214, 0.7)" fontSize="8">STRAIGHT</text>
      <text x="177" y="115" fill="rgba(222, 233, 214, 0.7)" fontSize="8">LEG</text>
    </svg>
  );
}

export default BattingTargetMap;
