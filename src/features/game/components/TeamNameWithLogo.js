import React from 'react';

const hashText = (value = '') => {
  let hash = 0;
  const text = String(value || '');
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const paletteFromTeam = (teamName = '') => {
  const hash = hashText(teamName);
  const hueA = hash % 360;
  const hueB = (hueA + 70 + (hash % 40)) % 360;
  return {
    primary: `hsl(${hueA} 72% 52%)`,
    secondary: `hsl(${hueB} 74% 46%)`,
  };
};

const initialsFromTeam = (teamName = '') => {
  const words = String(teamName || '')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
  if (!words.length) {
    return 'TM';
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return `${words[0][0] || ''}${words[1][0] || ''}`.toUpperCase();
};

function TeamNameWithLogo({ teamName, size = 22, className = '' }) {
  const safeName = teamName || 'Team';
  const initials = initialsFromTeam(safeName);
  const palette = paletteFromTeam(safeName);

  return (
    <span className={`sim-team-logo-name ${className}`.trim()}>
      <span
        className="sim-team-logo-mark"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          background: `linear-gradient(145deg, ${palette.primary}, ${palette.secondary})`,
          fontSize: `${Math.max(9, Math.round(size * 0.42))}px`,
        }}
        aria-hidden="true"
        title={`${safeName} logo`}
      >
        {initials}
      </span>
      <span>{safeName}</span>
    </span>
  );
}

export default TeamNameWithLogo;
