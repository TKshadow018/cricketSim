import React from 'react';

const navigationItems = [
  {
    id: 'panel',
    label: 'Panel',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M8 8h8M8 12h8M8 16h4" />
      </svg>
    ),
  },
  {
    id: 'play',
    label: 'Play',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m8 5 11 7-11 7V5Z" />
      </svg>
    ),
  },
  {
    id: 'notes',
    label: 'Notes',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 4h10a2 2 0 0 1 2 2v14l-7-3-7 3V6a2 2 0 0 1 2-2Z" />
        <path d="M9 8h6M9 12h6" />
      </svg>
    ),
  },
];

function DashboardMobileNav({ activeView, onChange }) {
  return (
    <nav className="dashboard-mobile-nav" aria-label="Dashboard views">
      {navigationItems.map(({ id, label, icon }) => {
        const isActive = activeView === id;

        return (
          <button
            key={id}
            type="button"
            className={`dashboard-mobile-nav-item ${isActive ? 'active' : ''}`}
            aria-pressed={isActive}
            onClick={() => onChange(id)}
          >
            {icon}
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default DashboardMobileNav;
