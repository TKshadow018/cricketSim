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
  const makeProps = (overrides = {}) => ({
    stageCommonProps: {},
    countryList: countries,
    beginCareer: jest.fn(),
    careerPlayerProfile: { name: '', age: 18, playerType: 'batsman' },
    careerDomesticCountry: '',
    careerDomesticTeams: [],
    careerGlobalPlayerPool: [],
    ...overrides,
  });

  const renderSetup = (overrides = {}) =>
    render(
      <div className="sim-shell">
        <CareerSetupStage {...makeProps(overrides)} />
      </div>
    );

  const fillPlayerDetails = ({
    name = 'Alex Player',
    age = '20',
    nationality = 'India',
  } = {}) => {
    fireEvent.change(screen.getByLabelText('Player Name'), { target: { value: name } });
    fireEvent.change(screen.getByLabelText('Age'), { target: { value: age } });
    fireEvent.change(screen.getByLabelText('Nationality'), { target: { value: nationality } });
  };

  beforeEach(() => {
    const helpers = jest.requireMock('../utils/controllerCareerScheduleUtils');
    helpers.createDomesticTeamsForAllCountries.mockImplementation(() => [
      { name: 'India Club', country: 'India', players: [] },
      { name: 'Australia Club', country: 'Australia', players: [] },
    ]);
    helpers.createGlobalCareerPlayerPool.mockImplementation(() => [{ id: 'pool-player', name: 'Pool Player' }]);
  });

  test('splits player creation into four guided steps and starts with the reviewed career setup', () => {
    const { createDomesticTeamsForAllCountries, createGlobalCareerPlayerPool } = jest.requireMock('../utils/controllerCareerScheduleUtils');
    const beginCareer = jest.fn();
    renderSetup({ beginCareer });

    expect(screen.getByRole('heading', { name: 'Player Details' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Career setup progress' })).toHaveAttribute('aria-valuenow', '1');
    expect(screen.queryByRole('radiogroup', { name: 'Player type' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue to Playing Style' })).toBeDisabled();

    fillPlayerDetails({ name: '  Alex Player  ', age: '15' });
    expect(screen.getByRole('button', { name: 'Continue to Playing Style' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Age'), { target: { value: '16' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue to Playing Style' }));

    expect(screen.getByRole('heading', { name: 'Playing Style' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Career setup progress' })).toHaveAttribute('aria-valuenow', '2');
    fireEvent.click(screen.getByRole('radio', { name: /Wicketkeeper/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Back to Player Details' }));
    expect(screen.getByLabelText('Player Name')).toHaveValue('  Alex Player  ');
    expect(screen.getByLabelText('Nationality')).toHaveValue('India');
    fireEvent.click(screen.getByRole('button', { name: 'Continue to Playing Style' }));
    expect(screen.getByRole('radio', { name: /Wicketkeeper/ })).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Continue to Domestic League' }));

    expect(screen.getByRole('heading', { name: 'Domestic League' })).toBeInTheDocument();
    expect(screen.queryByText('Season Length')).not.toBeInTheDocument();
    const generate = screen.getByRole('button', { name: 'Generate Clubs & Player Pool' });
    expect(generate).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Continue to Career Review' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('League Country'), { target: { value: 'India' } });
    expect(generate).toBeEnabled();
    fireEvent.click(generate);
    expect(createDomesticTeamsForAllCountries).toHaveBeenCalledWith(countries);
    expect(createGlobalCareerPlayerPool).toHaveBeenCalledWith(countries);
    expect(screen.getByText('2 clubs and 1 player are ready.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Continue to Career Review' }));

    expect(screen.getByRole('heading', { name: 'Review & Start' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Career setup progress' })).toHaveAttribute('aria-valuemax', '4');
    expect(screen.getByRole('progressbar', { name: 'Career setup progress' })).toHaveAttribute('aria-valuenow', '4');
    expect(screen.queryByRole('region', { name: 'Choose season length' })).not.toBeInTheDocument();
    expect(screen.getByText('Alex Player')).toBeInTheDocument();
    expect(document.querySelectorAll('.sim-career-setup-review dl > div')).toHaveLength(5);
    expect(screen.getByText('League').parentElement).toHaveTextContent('India');
    expect(screen.getByText('Role').parentElement).toHaveTextContent('Wicketkeeper');
    expect(screen.getByText('Season').parentElement).toHaveTextContent('1 cycle');
    const begin = screen.getByRole('button', { name: 'Begin Career and Run Auction' });
    expect(begin).toBeEnabled();
    fireEvent.click(begin);
    expect(beginCareer).toHaveBeenCalledWith(expect.objectContaining({
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
    expect(beginCareer.mock.calls[0][0]).not.toHaveProperty('seasonLength');
  });

  test('returns the long-form scroll area to the top when a wizard step changes', () => {
    const { container } = renderSetup();
    fillPlayerDetails();
    const shell = container.querySelector('.sim-shell');
    shell.scrollTop = 225;

    fireEvent.click(screen.getByRole('button', { name: 'Continue to Playing Style' }));

    expect(shell.scrollTop).toBe(0);
  });

  test('preserves prefilled details, enforces age bounds, and regenerates clubs after changing league', () => {
    const beginCareer = jest.fn();
    renderSetup({
      beginCareer,
      careerPlayerProfile: { name: 'Existing Player', age: 40, nationality: 'Australia', playerType: 'spiner' },
      careerDomesticCountry: 'India',
      careerDomesticTeams: [{ name: 'Existing Club' }],
      careerGlobalPlayerPool: [{ id: 1 }],
    });

    expect(screen.getByLabelText('Player Name')).toHaveValue('Existing Player');
    fireEvent.change(screen.getByLabelText('Nationality'), { target: { value: 'Australia' } });
    fireEvent.change(screen.getByLabelText('Age'), { target: { value: '41' } });
    expect(screen.getByRole('button', { name: 'Continue to Playing Style' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Age'), { target: { value: '40' } });

    fireEvent.click(screen.getByRole('button', { name: 'Continue to Playing Style' }));
    expect(screen.getByRole('radio', { name: /Spiner/ })).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Continue to Domestic League' }));
    expect(screen.getByRole('button', { name: 'Continue to Career Review' })).toBeEnabled();
    fireEvent.change(screen.getByLabelText('League Country'), { target: { value: 'Australia' } });
    expect(screen.getByRole('button', { name: 'Continue to Career Review' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Generate Clubs & Player Pool' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue to Career Review' }));
    expect(screen.getByRole('heading', { name: 'Review & Start' })).toBeInTheDocument();
    const begin = screen.getByRole('button', { name: 'Begin Career and Run Auction' });
    expect(begin).toBeEnabled();
    fireEvent.click(begin);
    expect(beginCareer).toHaveBeenCalledWith(expect.objectContaining({
      playerProfile: expect.objectContaining({ age: 40, nationality: 'Australia' }),
    }));
    expect(beginCareer.mock.calls[0][0]).not.toHaveProperty('seasonLength');
  });

  test('applies empty profile defaults and falls back to the default role for unknown values', () => {
    const beginCareer = jest.fn();
    const { unmount } = render(
      <CareerSetupStage
        stageCommonProps={{}}
        countryList={countries}
        beginCareer={beginCareer}
        careerPlayerProfile={{ name: '', age: 0, nationality: '', playerType: '' }}
        careerDomesticCountry=""
        careerDomesticTeams={null}
        careerGlobalPlayerPool={null}
      />
    );

    expect(screen.getByLabelText('Player Name')).toHaveValue('');
    expect(screen.getByLabelText('Age')).toHaveValue(18);
    expect(screen.getByRole('button', { name: 'Continue to Playing Style' })).toBeDisabled();

    unmount();
    render(
      <CareerSetupStage
        stageCommonProps={{}}
        countryList={countries}
        beginCareer={jest.fn()}
        careerPlayerProfile={{ name: 'Unknown Role', age: 'not-a-number', nationality: 'India', playerType: 'unknown' }}
        careerDomesticCountry="India"
        careerDomesticTeams={[{ name: 'India Club' }]}
        careerGlobalPlayerPool={[{ id: 1 }]}
      />
    );

    expect(screen.getByRole('button', { name: 'Continue to Playing Style' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Age'), { target: { value: '18' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue to Playing Style' }));
    expect(screen.getByRole('heading', { name: 'Playing Style' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Batsman/ })).toHaveAttribute('aria-checked', 'true');
    expect(document.querySelector('.sim-career-player-preview')).toHaveClass('sim-career-player-preview--batsman');
  });
});
