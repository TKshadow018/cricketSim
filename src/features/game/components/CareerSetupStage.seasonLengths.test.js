import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import CareerSetupStage from './CareerSetupStage';

jest.mock('../../../components/ui/AppButton', () => ({
  __esModule: true,
  default: ({ text, onClick, disabled }) => <button onClick={onClick} disabled={disabled}>{text}</button>,
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
  createDomesticTeamsForAllCountries: jest.fn(),
  createGlobalCareerPlayerPool: jest.fn(),
}));

test('uses a single season cycle without offering a season length choice', () => {
  render(
    <CareerSetupStage
      stageCommonProps={{}}
      countryList={[]}
      beginCareer={jest.fn()}
      careerPlayerProfile={{ name: 'Player', age: 20, nationality: 'India', playerType: 'batsman' }}
      careerDomesticCountry="India"
      careerDomesticTeams={[{ name: 'India Club' }]}
      careerGlobalPlayerPool={[{ id: 'player' }]}
    />
  );

  fireEvent.click(screen.getByRole('button', { name: 'Continue to Playing Style' }));
  fireEvent.click(screen.getByRole('button', { name: 'Continue to Domestic League' }));
  fireEvent.click(screen.getByRole('button', { name: 'Continue to Career Review' }));

  expect(screen.getByRole('heading', { name: 'Review & Start' })).toBeInTheDocument();
  expect(screen.getByText('Season').parentElement).toHaveTextContent('1 cycle');
  expect(screen.queryByRole('button', { name: /Short|Standard|Full/ })).not.toBeInTheDocument();
});
