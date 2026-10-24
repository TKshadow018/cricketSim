import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import InningsStage from './InningsStage';

jest.mock('../../../components/ui/AppButton', () => ({
  __esModule: true,
  default: ({ text, onClick, disabled }) => <button onClick={onClick} disabled={disabled}>{text}</button>,
}));

const inningsCard = (title) => ({
  title,
  line: '120/4',
  overs: '20.0',
  battingRows: [
    { name: 'Batter', playerType: 'batsman', runs: 55, balls: 40, strikeRate: 137.5, dismissal: 'not out', isNotOut: true },
  ],
  bowlingRows: [
    { name: 'Bowler', playerType: 'pacer', overs: '4.0', runsConceded: 24, economy: 6, avgPerWicket: 12, wickets: 2, isCurrent: true },
  ],
});

const makeProps = (overrides = {}) => ({
  title: 'Falcons Batting',
  subtitle: 'Over 5.0 / 20',
  score: 30,
  wickets: 1,
  lastEvent: 'Four runs',
  isUserBatting: true,
  isUserBowling: false,
  strikerName: 'Striker',
  nonStrikerName: 'Partner',
  currentBowlerName: 'Bowler',
  strikerPlayer: { playerType: 'batsman' },
  nonStrikerPlayer: { playerType: 'batsman' },
  currentBowlerPlayer: { playerType: 'pacer' },
  needsOpeners: false,
  openerSelections: [],
  openerCandidates: [],
  onSelectOpener: jest.fn(),
  waitingForNextBatter: false,
  nextBatterCandidates: [],
  onSelectNextBatter: jest.fn(),
  waitingForNextBowler: false,
  bowlerCandidates: [],
  onSelectBowler: jest.fn(),
  battingActions: [
    { key: 'normal', label: 'Normal', disabled: false },
    { key: 'aggressive', label: 'Aggressive', disabled: true, reason: 'No balls left' },
  ],
  bowlingActions: [
    { key: 'pace', label: 'Pace', disabled: false },
    { key: 'spin', label: 'Spin', disabled: true, reason: 'Bowler unavailable' },
  ],
  battingIntent: 'normal',
  bowlingIntent: 'pace',
  onBattingIntent: jest.fn(),
  onBowlingIntent: jest.fn(),
  onBowlBall: jest.fn(),
  onSaveGame: jest.fn(),
  isSavingGame: false,
  saveMessage: 'Saved',
  canPlayNextBall: true,
  showSimulationActions: true,
  onSimulateOver: jest.fn(),
  onSimulateMatch: jest.fn(),
  isAutoSimulating: false,
  showScoreboard: false,
  scorecard: { currentInnings: inningsCard('Falcons'), previousInnings: inningsCard('Ravens') },
  commentary: ['12.3 A crisp drive to the boundary', 'The crowd applauds'],
  ...overrides,
});

describe('InningsStage', () => {
  test('renders batting controls, simulation actions, commentary, and scoreboard rows', () => {
    const previousInnings = inningsCard('Ravens');
    const props = makeProps({
      showScoreboard: true,
      scorecard: {
        currentInnings: inningsCard('Falcons'),
        previousInnings: {
          ...previousInnings,
          battingRows: previousInnings.battingRows.map((row) => ({ ...row, isNotOut: false })),
          bowlingRows: previousInnings.bowlingRows.map((row) => ({ ...row, isCurrent: false })),
        },
      },
      commentary: ['12.3 A crisp drive to the boundary', 'The crowd applauds', undefined],
    });
    render(<InningsStage {...props} />);
    expect(screen.getByText('Falcons Batting')).toBeInTheDocument();
    expect(screen.getByText('Striker')).toBeInTheDocument();
    expect(screen.getByText('Non-Striker:')).toBeInTheDocument();
    expect(screen.getByText('Bowler:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Normal' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Aggressive/ })).toBeDisabled();
    expect(screen.getByText('12.3')).toHaveClass('sim-ball-tag');
    expect(screen.getByText('The crowd applauds')).toBeInTheDocument();
    expect(screen.getByText('Full Scoreboard')).toBeInTheDocument();
    expect(screen.getByText('Ravens')).toBeInTheDocument();
    expect(screen.getAllByText('Bowling')).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'Normal' }));
    fireEvent.click(screen.getByRole('button', { name: 'Play Next Ball' }));
    fireEvent.click(screen.getByRole('button', { name: 'Simulate Over' }));
    fireEvent.click(screen.getByRole('button', { name: 'Simulate Full Match' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save Game' }));
    expect(props.onBattingIntent).toHaveBeenCalledWith('normal');
    expect(props.onBowlBall).toHaveBeenCalled();
    expect(props.onSimulateOver).toHaveBeenCalled();
    expect(props.onSimulateMatch).toHaveBeenCalled();
    expect(props.onSaveGame).toHaveBeenCalled();
  });

  test('shows opener, next batter, and next bowler choices with disabled candidates', () => {
    const props = makeProps({
      isUserBowling: true,
      needsOpeners: true,
      strikerName: '',
      nonStrikerName: 'Partner',
      currentBowlerName: '',
      openerSelections: [0],
      openerCandidates: [
        { index: 0, name: 'Opener One', player: { playerType: 'batsman' } },
        { index: 1, name: 'Opener Two', player: { playerType: 'batsman' } },
      ],
      waitingForNextBatter: true,
      nextBatterCandidates: [
        { index: 2, name: 'Ready Batter', player: {}, disabled: false },
        { index: 3, name: 'Unavailable Batter', player: {}, disabled: true, reason: 'Injured' },
      ],
      waitingForNextBowler: true,
      bowlerCandidates: [
        { index: 4, name: 'Ready Bowler', player: {}, disabled: false },
        { index: 5, name: 'Resting Bowler', player: {}, disabled: true, reason: 'Already bowled' },
      ],
      showSimulationActions: false,
      isAutoSimulating: true,
      canPlayNextBall: false,
      isSavingGame: true,
      showScoreboard: true,
      scorecard: { currentInnings: null, previousInnings: null },
    });
    render(<InningsStage {...props} />);
    expect(screen.getByText('Choose Openers')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Opener One/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Choose Next Batsman')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Unavailable Batter/ })).toBeDisabled();
    expect(screen.getByText('Choose Next Bowler')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Resting Bowler/ })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Simulate Over' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Simulating...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /Opener Two/ }));
    fireEvent.click(screen.getByRole('button', { name: /Ready Batter/ }));
    fireEvent.click(screen.getByRole('button', { name: /Ready Bowler/ }));
    expect(props.onSelectOpener).toHaveBeenCalledWith(1);
    expect(props.onSelectNextBatter).toHaveBeenCalledWith(2);
    expect(props.onSelectBowler).toHaveBeenCalledWith(4);
  });

  test('renders bowling intents and safely handles missing intent callbacks', () => {
    const props = makeProps({
      isUserBatting: false,
      isUserBowling: true,
      onBattingIntent: undefined,
      onBowlingIntent: undefined,
      battingActions: [],
      bowlingIntent: 'defensive',
      bowlingActions: [
        { key: 'defensive', label: 'Defensive', disabled: false, reason: 'Protect the total' },
        { key: 'alternate', label: 'Alternate', disabled: true },
      ],
      showSimulationActions: false,
      strikerName: 'Striker',
      nonStrikerName: '',
      currentBowlerName: '',
      commentary: [],
    });
    const { rerender } = render(<InningsStage {...props} />);
    expect(screen.getByText('Bowling Intent')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Defensive/ })).toHaveAttribute('title', 'Protect the total');
    expect(screen.getByRole('button', { name: /Defensive/ })).toHaveClass('active');
    expect(screen.getByRole('button', { name: /Alternate/ })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /Defensive/ }));
    expect(screen.getByText('Striker:')).toBeInTheDocument();
    expect(screen.queryByText('Batting Intent')).not.toBeInTheDocument();
    rerender(<InningsStage {...props} strikerName="" nonStrikerName="" currentBowlerName="" />);
    expect(document.querySelector('.sim-player-strip')).not.toBeInTheDocument();
  });

  test('renders a partial player strip and safely ignores missing batting intent callbacks', () => {
    const props = makeProps({
      isUserBatting: true,
      isUserBowling: false,
      strikerName: '',
      nonStrikerName: 'Partner',
      currentBowlerName: '',
      battingActions: [{ key: 'normal', label: 'Normal', disabled: false }],
      onBattingIntent: undefined,
      saveMessage: '',
      commentary: [undefined],
    });
    render(<InningsStage {...props} />);

    expect(screen.getByText('Partner')).toBeInTheDocument();
    expect(screen.queryByText('Striker:')).not.toBeInTheDocument();
    expect(screen.queryByText('Bowler:')).not.toBeInTheDocument();
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Normal' }));
  });
});
