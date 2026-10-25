import React from 'react';
import { render, screen } from '@testing-library/react';
import CareerSetupStage from './CareerSetupStage';

jest.mock('../../../components/ui/AppButton', () => ({
  __esModule: true,
  default: ({ text, disabled }) => <button disabled={disabled}>{text}</button>,
}));

jest.mock('./StageShell', () => ({
  __esModule: true,
  default: ({ title, children }) => <section><h2>{title}</h2>{children}</section>,
}));

jest.mock('./FlagTeamGrid', () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock('../utils/controllerCareerScheduleUtils', () => ({
  CAREER_SEASON_LENGTHS: { short: 1, standard: 1, full: 1 },
  createDomesticTeamsForAllCountries: jest.fn(),
  createGlobalCareerPlayerPool: jest.fn(),
}));

test('uses singular match labels for one-match season lengths', () => {
  render(
    <CareerSetupStage
      stageCommonProps={{}}
      countryList={[]}
      game={{}}
      beginCareer={jest.fn()}
      careerPlayerProfile={{}}
      careerDomesticCountry=""
      careerDomesticTeams={[]}
      careerGlobalPlayerPool={[]}
    />
  );

  expect(screen.getAllByText('1 format')).toHaveLength(3);
});
