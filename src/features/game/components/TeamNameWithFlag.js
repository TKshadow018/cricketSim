import React from 'react';
import { countries } from '../../../gameData/countries';
import TeamNameWithLogo from './TeamNameWithLogo';

const normalize = (value = '') => String(value).toLowerCase().replace(/[^a-z0-9]/g, '');
const toPublicPath = (value = '') => String(value).replace('./', '/');

const countryByNormalizedName = Object.values(countries || {}).reduce((accumulator, country) => {
  const key = normalize(country?.name);
  if (key) {
    accumulator[key] = country;
  }
  return accumulator;
}, {});

export const getTeamFlagPath = (teamName = '') => {
  const direct = countryByNormalizedName[normalize(teamName)];
  if (direct?.image) {
    return toPublicPath(direct.image);
  }

  return '';
};

function TeamNameWithFlag({ teamName, className = '', showDashForEmpty = false }) {
  if (!teamName) {
    return showDashForEmpty ? <span className={className}>-</span> : null;
  }

  return <TeamNameWithLogo teamName={teamName} className={className} />;
}

export default TeamNameWithFlag;