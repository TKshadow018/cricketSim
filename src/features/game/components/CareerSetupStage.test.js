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
  default: ({ teams, selectedName, onSelect }) => (
    <div>
      {teams.map((team) => (
        <button
          key={team.id}
          aria-pressed={selectedName === team.name}
          onClick={() => onSelect(team)}
        >
          {team.name}
        </button>
      ))}
    </div>
  ),
}));

jest.mock('../utils/controllerCareerScheduleUtils', () => ({
  CAREER_SEASON_LENGTHS: { short: 4, standard: 10, full: 20 },
  createDomesticTeamsForAllCountries: jest.fn(() => [
    { name: 'India Club', country: 'India', players: [] },
    { name: 'Australia Club', country: 'Australia', players: [] },
  ]),
  createGlobalCareerPlayerPool: jest.fn(() => [{ id: 'pool-player', name: 'Pool Player' }]),
}));

const countries = [
  { id: 'in', name: 'India', current_ranking: 1 },
  { id: 'au', name: 'Australia', current_ranking: 2 },
];

describe('CareerSetupStage', () => {
  beforeEach(() => {
    const helpers = jest.requireMock('../utils/controllerCareerScheduleUtils');
    helpers.createDomesticTeamsForAllCountries.mockImplementation(() => [
      { name: 'India Club', country: 'India', players: [] },
      { name: 'Australia Club', country: 'Australia', players: [] },
    ]);
    helpers.createGlobalCareerPlayerPool.mockImplementation(() => [{ id: 'pool-player', name: 'Pool Player' }]);
  });

  test('generates setup data, validates player details, and begins a career with selected options', () => {
    const { createDomesticTeamsForAllCountries, createGlobalCareerPlayerPool } = jest.requireMock('../utils/controllerCareerScheduleUtils');
    const beginCareer = jest.fn();
    render(
      <CareerSetupStage
        stageCommonProps={{}}
        countryList={countries}
        game={{ careerSeasonLength: 'standard' }}
        beginCareer={beginCareer}
        careerPlayerProfile={{ name: '', age: 18, playerType: 'batsman' }}
        careerDomesticCountry=""
        careerDomesticTeams={[]}
        careerGlobalPlayerPool={[]}
      />
    );
    expect(screen.getByText('Unnamed Prospect')).toBeInTheDocument();
    const generate = screen.getByRole('button', { name: 'Generate Global Clubs & Player Pool' });
    const begin = screen.getByRole('button', { name: 'Begin Career and Run Auction' });
    expect(generate).toBeDisabled();
    expect(begin).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'India' }));
    expect(generate).toBeEnabled();
    fireEvent.click(generate);
    expect(createDomesticTeamsForAllCountries).toHaveBeenCalledWith(countries);
    expect(createGlobalCareerPlayerPool).toHaveBeenCalledWith(countries);

    fireEvent.change(screen.getByLabelText('Player Name'), { target: { value: '  Alex Player  ' } });
    fireEvent.change(screen.getByLabelText('Age'), { target: { value: '15' } });
    expect(screen.getByText('Complete all required fields to start career.')).toBeInTheDocument();
    expect(begin).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Age'), { target: { value: '16' } });
    fireEvent.click(screen.getByRole('radio', { name: /Wicketkeeper/ }));
    fireEvent.click(screen.getByRole('button', { name: /Short/ }));
    expect(screen.getByText('Ready to begin career.')).toBeInTheDocument();
    expect(screen.getByText('Style Tag: WK')).toBeInTheDocument();
    expect(begin).toBeEnabled();
    fireEvent.click(begin);
    expect(beginCareer).toHaveBeenCalledWith(expect.objectContaining({
      seasonLength: 'short',
      domesticCountry: 'India',
      domesticTeams: expect.arrayContaining([expect.objectContaining({ name: 'India Club' })]),
      globalPlayerPool: [{ id: 'pool-player', name: 'Pool Player' }],
      playerProfile: {
        name: 'Alex Player',
        age: 16,
        nationality: 'India',
        playerType: 'wicketkeeper',
      },
      offers: [],
    }));

    fireEvent.click(screen.getByRole('button', { name: 'Australia' }));
    expect(screen.getByText('Complete all required fields to start career.')).toBeInTheDocument();
  });

  test('uses prefilled state and supports explicit nationality, empty country selection, and age bounds', () => {
    const beginCareer = jest.fn();
    render(
      <CareerSetupStage
        stageCommonProps={{}}
        countryList={countries}
        game={{ careerSeasonLength: 'full' }}
        beginCareer={beginCareer}
        careerPlayerProfile={{ name: 'Existing Player', age: 40, nationality: 'Australia', playerType: 'spiner' }}
        careerDomesticCountry="India"
        careerDomesticTeams={[{ name: 'Existing Club' }]}
        careerGlobalPlayerPool={[{ id: 1 }]}
      />
    );
    expect(screen.getByText('Existing Player')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Spiner/ })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Nationality'), { target: { value: 'Australia' } });
    fireEvent.change(screen.getByLabelText('Age'), { target: { value: '41' } });
    expect(screen.getByRole('button', { name: 'Begin Career and Run Auction' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Age'), { target: { value: '40' } });
    const begin = screen.getByRole('button', { name: 'Begin Career and Run Auction' });
    expect(begin).toBeEnabled();
    fireEvent.click(begin);
    expect(beginCareer).toHaveBeenCalledWith(expect.objectContaining({
      seasonLength: 'full',
      playerProfile: expect.objectContaining({ age: 40, nationality: 'Australia' }),
    }));
  });

  test('applies empty profile defaults and falls back to the default role for unknown values', () => {
    const beginCareer = jest.fn();
    const { unmount } = render(
      <CareerSetupStage
        stageCommonProps={{}}
        countryList={countries}
        game={{ careerSeasonLength: '' }}
        beginCareer={beginCareer}
        careerPlayerProfile={{ name: '', age: 0, nationality: '', playerType: '' }}
        careerDomesticCountry=""
        careerDomesticTeams={null}
        careerGlobalPlayerPool={null}
      />
    );

    expect(screen.getByText('Unnamed Prospect')).toBeInTheDocument();
    expect(screen.getByText('Age: 18')).toBeInTheDocument();
    expect(screen.getByText('Nationality: Choose nationality')).toBeInTheDocument();
    expect(screen.getByText('Role: Batsman')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Standard/ })).toHaveClass('active');
    expect(screen.getByRole('button', { name: /Short/ })).toHaveTextContent('4 formats');
    expect(screen.getByRole('button', { name: 'Generate Global Clubs & Player Pool' })).toBeDisabled();

    unmount();
    render(
      <CareerSetupStage
        stageCommonProps={{}}
        countryList={countries}
        game={{ careerSeasonLength: 'standard' }}
        beginCareer={beginCareer}
        careerPlayerProfile={{ name: 'Unknown Role', age: 'not-a-number', nationality: 'India', playerType: 'unknown' }}
        careerDomesticCountry="India"
        careerDomesticTeams={[{ name: 'India Club' }]}
        careerGlobalPlayerPool={[{ id: 1 }]}
      />
    );

    expect(screen.getByText('Role: Batsman')).toBeInTheDocument();
    expect(screen.getByText('Age: N/A')).toBeInTheDocument();
    expect(document.querySelector('.sim-career-player-preview')).toHaveClass('sim-career-player-preview--batsman');
  });

});
