import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import InningsStage from './InningsStage';
import { battingAction } from '../../../gameData/actionType';

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
  battingTactics: undefined,
  battingContext: undefined,
  bowlingTactics: undefined,
  bowlingContext: undefined,
  onBattingIntent: jest.fn(),
  onBattingTacticsChange: jest.fn(),
  onBowlingIntent: jest.fn(),
  onBowlingTacticsChange: jest.fn(),
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
    const onCloseScoreboard = jest.fn();
    const previousInnings = inningsCard('Ravens');
    const props = makeProps({
      showScoreboard: true,
      onCloseScoreboard,
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
    expect(screen.getByRole('button', { name: 'Aggressive. No balls left' })).toBeDisabled();
    expect(screen.getByText('12.3')).toHaveClass('sim-ball-tag');
    expect(screen.getByText('The crowd applauds')).toBeInTheDocument();
    expect(screen.getByText('Full Scoreboard')).toBeInTheDocument();
    expect(screen.getByText('Ravens')).toBeInTheDocument();
    expect(screen.getAllByText('Bowling')).toHaveLength(2);
    const scoreboard = screen.getByRole('dialog', { name: 'Full Scoreboard' });
    fireEvent.click(within(scoreboard).getByRole('button', { name: 'Close Scoreboard' }));
    expect(onCloseScoreboard).toHaveBeenCalled();

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

  test('announces an empty commentary state before the first delivery', () => {
    render(<InningsStage {...makeProps({ commentary: [] })} />);

    const commentary = screen.getByRole('list', { name: 'Match commentary' });
    expect(commentary).toHaveAttribute('aria-live', 'polite');
    expect(
      within(commentary).getByText('Commentary will appear after the first delivery.')
    ).toBeInTheDocument();
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

  test('shows the batting cockpit in place of legacy intents when tactical state is present', () => {
    const props = makeProps({
      battingActions: [
        { key: battingAction.superShot, label: 'Super Shot', disabled: false, reason: '' },
        { key: battingAction.freeHit, label: 'Free Hit', disabled: true, reason: 'Available only after a no-ball' },
      ],
      battingTactics: {
        approach: 'balanced',
        shot: 'rotate',
        target: 'straight',
        retainShotAndTarget: false,
      },
      battingContext: {
        score: 30,
        wickets: 1,
        over: '5.0',
        currentOverNumber: 6,
        currentOverBall: 0,
        striker: { player: { name: 'Striker' }, runs: 18, balls: 13 },
        nonStriker: { player: { name: 'Partner' }, runs: 7, balls: 9 },
        bowler: { name: 'Bowler', paceAbility: 80, spinAbility: 20 },
        bowlerFigures: { overs: '2.0', runs: 12, wickets: 1, economy: '6.00' },
        freeHitArmed: false,
        currentOverEvents: [],
      },
      bowlingActions: [],
    });

    const { rerender } = render(<InningsStage {...props} />);

    expect(screen.getByRole('region', { name: 'Batting tactics' })).toBeInTheDocument();
    expect(document.querySelector('.sim-innings-layout--batting')).toBeInTheDocument();
    expect(screen.queryByText('Batting Intent')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Attack' }));
    fireEvent.click(screen.getByRole('button', { name: 'Drive' }));
    fireEvent.click(screen.getByRole('button', { name: 'Super Shot' }));

    expect(props.onBattingTacticsChange).toHaveBeenNthCalledWith(1, { approach: 'attack' });
    expect(props.onBattingTacticsChange).toHaveBeenNthCalledWith(2, { shot: 'drive' });
    expect(props.onBattingIntent).toHaveBeenCalledWith(battingAction.superShot);
    rerender(<InningsStage {...props} battingIntent={battingAction.superShot} />);
    expect(screen.getByRole('button', { name: 'Play Super Shot' })).toBeEnabled();
  });

  test('shows the bowling cockpit instead of legacy intents when tactical state is present', () => {
    const props = makeProps({
      isUserBatting: false,
      isUserBowling: true,
      battingActions: [],
      bowlingTactics: {
        overPlan: 'balanced',
        fieldPreset: 'balanced',
        line: 'stumps',
        length: 'good',
        variation: 'stock',
        specialDeliveryArmed: false,
      },
      bowlingContext: {
        score: 42,
        wickets: 1,
        over: '5.2',
        currentOverNumber: 6,
        currentOverBall: 3,
        bowler: { name: 'Current Bowler', paceAbility: 80, spinAbility: 25 },
        bowlerFigures: { overs: '2.0', runs: 16, wickets: 1, economy: '8.00', oversRemaining: '2.0' },
        striker: { player: { name: 'Striker' }, runs: 29, balls: 60 },
        nonStriker: { player: { name: 'Partner' }, runs: 10, balls: 11 },
        specialDelivery: { available: true, remaining: 2, usedThisOver: 0 },
        currentOverEvents: [],
        matchCondition: { pitch: 'sporting', weather: 'cloudy', outfield: 'lushGreen' },
      },
    });

    render(<InningsStage {...props} />);

    expect(screen.getByRole('region', { name: 'Bowling tactics' })).toBeInTheDocument();
    expect(document.querySelector('.sim-innings-layout--bowling')).toBeInTheDocument();
    expect(screen.queryByText('Bowling Intent')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Attack' }));
    expect(props.onBowlingTacticsChange).toHaveBeenCalledWith({ overPlan: 'attack' });
  });

  test('labels the primary action when a special delivery is armed', () => {
    render(<InningsStage {...makeProps({
      isUserBatting: false,
      isUserBowling: true,
      battingActions: [],
      bowlingTactics: {
        overPlan: 'balanced',
        fieldPreset: 'balanced',
        line: 'stumps',
        length: 'good',
        variation: 'stock',
        specialDeliveryArmed: true,
      },
      bowlingContext: {
        bowler: { name: 'Bowler', paceAbility: 80, spinAbility: 20 },
        bowlerFigures: {},
        striker: {},
        nonStriker: {},
        specialDelivery: { available: true, remaining: 2, usedThisOver: 0 },
        currentOverEvents: [],
      },
    })} />);

    expect(screen.getByRole('button', { name: 'Play Special Delivery' })).toBeEnabled();
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
