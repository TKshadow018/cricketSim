import React from 'react';

const FIELD_POSITIONS = {
  attacking: [
    { name: 'Slip', x: 157, y: 58 },
    { name: 'Gully', x: 112, y: 77 },
    { name: 'Point', x: 70, y: 111 },
    { name: 'Cover', x: 132, y: 38 },
    { name: 'Mid-off', x: 180, y: 20 },
    { name: 'Mid-on', x: 220, y: 20 },
    { name: 'Short leg', x: 243, y: 82 },
    { name: 'Square leg', x: 310, y: 116 },
    { name: 'Fine leg', x: 324, y: 168 },
  ],
  balanced: [
    { name: 'Slip', x: 151, y: 48 },
    { name: 'Point', x: 72, y: 105 },
    { name: 'Cover', x: 127, y: 37 },
    { name: 'Mid-off', x: 180, y: 19 },
    { name: 'Mid-on', x: 220, y: 19 },
    { name: 'Midwicket', x: 274, y: 47 },
    { name: 'Square leg', x: 314, y: 111 },
    { name: 'Fine leg', x: 322, y: 170 },
    { name: 'Long-on', x: 257, y: 198 },
  ],
  boundary: [
    { name: 'Deep point', x: 70, y: 102 },
    { name: 'Deep cover', x: 115, y: 45 },
    { name: 'Long-off', x: 173, y: 19 },
    { name: 'Long-on', x: 227, y: 19 },
    { name: 'Deep midwicket', x: 286, y: 51 },
    { name: 'Deep square leg', x: 324, y: 111 },
    { name: 'Fine leg', x: 321, y: 176 },
    { name: 'Third', x: 79, y: 176 },
    { name: 'Midwicket', x: 272, y: 83 },
  ],
};

function BowlingFieldMap({ preset = 'balanced' }) {
  const positions = FIELD_POSITIONS[preset] || FIELD_POSITIONS.balanced;
  const label = preset === 'boundary'
    ? 'Boundary field'
    : preset === 'attacking'
      ? 'Attacking field'
      : 'Balanced field';

  return (
    <figure className="sim-bowling-field-figure">
      <svg
        className={`sim-bowling-field-map sim-bowling-field-map--${preset}`}
        viewBox="0 0 400 220"
        role="img"
        aria-label={`${label} layout with approximate fielder positions`}
      >
        <defs>
          <linearGradient id="bowling-field-grass" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#284936" />
            <stop offset="1" stopColor="#142c20" />
          </linearGradient>
          <pattern id="bowling-field-stripes" width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M0 0h8v16H0z" fill="#ffffff" opacity=".025" />
          </pattern>
        </defs>
        <ellipse cx="200" cy="110" rx="178" ry="97" fill="url(#bowling-field-grass)" stroke="#80a66e" strokeWidth="2" />
        <ellipse cx="200" cy="110" rx="112" ry="61" fill="url(#bowling-field-stripes)" stroke="#b8d2a8" strokeOpacity=".44" strokeDasharray="5 5" />
        <path d="M22 110h356M200 13v194" stroke="#d7e4c9" strokeOpacity=".15" strokeWidth="1" />
        <rect x="188" y="77" width="24" height="66" rx="3" fill="#b9a36e" stroke="#dfcf9e" strokeWidth="1.5" />
        <path d="M188 110h24M200 77v66" stroke="#715e3d" strokeOpacity=".8" />
        <path d="M192 83v5m8-5v5m-8 49v5m8-5v5" stroke="#f0e0b2" strokeWidth="1.5" />
        {positions.map((position) => (
          <g key={position.name}>
            <circle cx={position.x} cy={position.y} r="6" fill="#d9f07d" stroke="#102117" strokeWidth="2" />
            <title>{position.name}</title>
          </g>
        ))}
        <circle cx="200" cy="109" r="4" fill="#f3d37a" stroke="#19241d" strokeWidth="1.5" />
      </svg>
      <figcaption>{label} · approximate tactical coverage, not a legality check</figcaption>
    </figure>
  );
}

export default BowlingFieldMap;
